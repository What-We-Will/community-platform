/**
 * @vitest-environment node
 */
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  ROUTE_FILE_RE,
  extractGetHandlerClosure,
  findRouteFiles,
  violatesGetReadOnly,
} from "./__tests__/get-route-scanner";

// The whole app tree — GET routes exist outside app/api (e.g. auth/callback).
const APP_ROOT = join(__dirname, "..");

const WRITE = 'await supabase.from("profiles").update({ headline: "x" })';

const HANDLER_STYLES: Array<[string, string]> = [
  ["plain function", `export function GET() { ${WRITE}; }`],
  ["async function", `export async function GET() { ${WRITE}; }`],
  ["const arrow", `export const GET = async () => { ${WRITE}; };`],
  [
    "typed return",
    `export async function GET(): Promise<{ ok: boolean }> { ${WRITE}; return { ok: true }; }`,
  ],
  [
    "comma-separated declarators",
    `export const GET = async () => { ${WRITE}; }, POST = async () => {};`,
  ],
  ["concise arrow body", `export const GET = async () => ${WRITE};`],
  [
    "same-file helper indirection",
    `async function doWrite() { ${WRITE}; }\nexport async function GET() { await doWrite(); }`,
  ],
  [
    "aliased export",
    `async function handler() { ${WRITE}; }\nexport { handler as GET };`,
  ],
];

const UNRESOLVABLE_EXPORT_FORMS: Array<[string, string]> = [
  [
    "destructured export",
    `const handlers = { GET: async () => {} };\nexport const { GET } = handlers;`,
  ],
  ["uninitialized let binding", `export let GET;\nGET = async () => {};`],
  ["re-export from another module", `export { GET } from "./handlers";`],
];

const WRITE_OPERATIONS = ["insert", "upsert", "update", "delete", "rpc"];

describe("GET API route handlers", () => {
  it("should contain no database write calls when a route exports GET", () => {
    const violations = findRouteFiles(APP_ROOT).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return violatesGetReadOnly(source) ? [relative(APP_ROOT, file)] : [];
    });

    expect(violations).toEqual([]);
  });

  it("should find at least one GET route when scanning the app tree", () => {
    const getRoutes = findRouteFiles(APP_ROOT).filter(
      (file) => extractGetHandlerClosure(readFileSync(file, "utf8")) !== null
    );

    expect(getRoutes.length).toBeGreaterThan(0);
  });

  it.each(HANDLER_STYLES)(
    "should reject a GET handler that writes when declared as a %s",
    (_style, source) => {
      expect(violatesGetReadOnly(source)).toBe(true);
    }
  );

  it.each(WRITE_OPERATIONS)(
    "should reject a GET handler when it calls the %s operation",
    (operation) => {
      const source = `export async function GET() { await supabase.from("t").${operation}({}); }`;

      expect(violatesGetReadOnly(source)).toBe(true);
    }
  );

  it.each(UNRESOLVABLE_EXPORT_FORMS)(
    "should fail loudly when GET is exported as a %s",
    (_form, source) => {
      expect(() => violatesGetReadOnly(source)).toThrow(/GET/);
    }
  );

  it("should accept a GET handler that only reads when a sibling POST writes", () => {
    const source = `export async function GET() { await supabase.from("t").select("*"); }
export async function POST() { ${WRITE}; }`;

    expect(violatesGetReadOnly(source)).toBe(false);
  });

  it("should match route files in every extension Next.js accepts", () => {
    const accepted = ["route.ts", "route.tsx", "route.js", "route.jsx"];
    const rejected = ["route.test.ts", "route.d.ts", "not-route.ts"];

    expect(accepted.every((name) => ROUTE_FILE_RE.test(name))).toBe(true);
    expect(rejected.some((name) => ROUTE_FILE_RE.test(name))).toBe(false);
  });
});
