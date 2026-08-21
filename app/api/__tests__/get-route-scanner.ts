import { readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// GET handlers are reachable via top-level navigation, prefetch, and cross-site
// requests without a CSRF token, so they must never reach a database write.
export const WRITE_CALL = /\.(insert|upsert|update|delete|rpc)\(/;

// Next.js accepts route handlers in any of these extensions.
export const ROUTE_FILE_RE = /^route\.(?:js|jsx|ts|tsx)$/;

export function findRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return findRouteFiles(full);
    return ROUTE_FILE_RE.test(entry.name) ? [full] : [];
  });
}

function isExported(node: ts.FunctionDeclaration | ts.VariableStatement): boolean {
  return (
    ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
  );
}

function bindsName(name: ts.BindingName, target: string): boolean {
  if (ts.isIdentifier(name)) return name.text === target;
  return name.elements.some(
    (element) => ts.isBindingElement(element) && bindsName(element.name, target)
  );
}

/**
 * The source text of the exported GET handler plus every same-file declaration
 * it references (transitively), located via the TypeScript AST so declaration
 * style cannot mis-scope the extraction and same-file helper indirection cannot
 * hide a write. Returns null when the file exports no GET handler. Throws when
 * GET is exported in a form this scanner cannot resolve (re-export,
 * destructuring, uninitialized binding) — an unsupported form must fail the
 * suite, never silently certify the route. Writes behind imports from other
 * modules are outside this guard's reach by design.
 */
export function extractGetHandlerClosure(source: string): string | null {
  const file = ts.createSourceFile("route.ts", source, ts.ScriptTarget.Latest, true);

  const declarations = new Map<string, ts.Node>();
  let getNode: ts.Node | null = null;

  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(statement.name.text, statement);
      if (statement.name.text === "GET" && isExported(statement)) getNode = statement;
    } else if (ts.isVariableStatement(statement)) {
      for (const declarator of statement.declarationList.declarations) {
        if (ts.isIdentifier(declarator.name) && declarator.initializer) {
          declarations.set(declarator.name.text, declarator.initializer);
          if (declarator.name.text === "GET" && isExported(statement)) {
            getNode = declarator.initializer;
          }
        } else if (isExported(statement) && bindsName(declarator.name, "GET")) {
          throw new Error(
            "GET is exported through a destructuring or uninitialized binding, " +
              "which this scanner cannot resolve. Declare it as " +
              "`export function GET` or `export const GET = …`."
          );
        }
      }
    }
  }

  for (const statement of file.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const specifier of statement.exportClause.elements) {
        if (specifier.name.text !== "GET") continue;
        if (statement.moduleSpecifier) {
          throw new Error(
            "GET is re-exported from another module, which this scanner cannot " +
              "resolve. Declare the handler in the route file."
          );
        }
        const localName = (specifier.propertyName ?? specifier.name).text;
        const local = declarations.get(localName);
        if (!local) {
          throw new Error(
            `GET is exported as an alias of \`${localName}\`, which this scanner ` +
              "cannot resolve to a top-level declaration in the file."
          );
        }
        getNode = local;
      }
    }
  }
  if (!getNode) return null;

  const included = new Set<ts.Node>();
  const queue: ts.Node[] = [getNode];
  const texts: string[] = [];

  while (queue.length > 0) {
    const node = queue.pop();
    if (!node || included.has(node)) continue;
    included.add(node);
    texts.push(node.getText(file));

    const collectReferences = (child: ts.Node): void => {
      if (ts.isIdentifier(child)) {
        const declaration = declarations.get(child.text);
        if (declaration && !included.has(declaration)) queue.push(declaration);
      }
      ts.forEachChild(child, collectReferences);
    };
    collectReferences(node);
  }

  return texts.join("\n");
}

/** True when the file exports a GET handler whose same-file closure reaches a write. */
export function violatesGetReadOnly(source: string): boolean {
  const closure = extractGetHandlerClosure(source);
  return closure !== null && WRITE_CALL.test(closure);
}
