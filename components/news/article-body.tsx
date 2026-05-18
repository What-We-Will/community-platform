import Image from "next/image";
import Link from "next/link";
import type { ArticleInline, ArticleSection, ListItem } from "@/lib/news";

function RichText({ parts }: { parts: ArticleInline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") {
          return <span key={i}>{part}</span>;
        }
        if ("link" in part) {
          return (
            <Link
              key={i}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-orange underline underline-offset-2 hover:text-primary-orange-hover"
            >
              {part.link}
            </Link>
          );
        }
        if ("bold" in part) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.bold}
            </strong>
          );
        }
        return null;
      })}
    </>
  );
}

function ListItemContent({ item }: { item: ListItem }) {
  if (typeof item === "string") {
    return item;
  }
  return <RichText parts={item} />;
}

export function ArticleBody({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        if (section.type === "paragraph") {
          return (
            <p key={i} className="text-base leading-relaxed text-foreground">
              {"parts" in section ? (
                <RichText parts={section.parts} />
              ) : (
                section.text
              )}
            </p>
          );
        }

        if (section.type === "heading") {
          return (
            <h2
              key={i}
              className="pt-4 font-bebas text-2xl text-dark-blue sm:text-3xl"
            >
              {section.text}
            </h2>
          );
        }

        if (section.type === "pullquote") {
          return (
            <blockquote
              key={i}
              className="rounded-r-xl border-l-4 border-primary-orange bg-warm-beige px-6 py-5"
            >
              <p className="text-base font-medium italic leading-relaxed text-dark-blue">
                {section.text}
              </p>
              {section.attribution && (
                <footer className="mt-2 text-sm text-muted-foreground">
                  {section.attribution}
                </footer>
              )}
            </blockquote>
          );
        }

        if (section.type === "list") {
          return (
            <ul key={i} className="space-y-2 pl-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-base leading-relaxed text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-orange" />
                  <span className="min-w-0 flex-1">
                    <ListItemContent item={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (section.type === "sublist") {
          return (
            <ul key={i} className="ml-6 space-y-2 border-l border-border pl-4">
              {section.items.map((item, j) => (
                <li key={j} className="text-base text-foreground">
                  <ListItemContent item={item} />
                </li>
              ))}
            </ul>
          );
        }

        if (section.type === "button") {
          return (
            <div key={i} className="flex justify-center py-2">
              <Link
                href={section.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-primary-orange px-8 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-orange-hover hover:shadow-lg"
              >
                {section.label}
              </Link>
            </div>
          );
        }

        if (section.type === "image") {
          const isSmall = section.size === "small";
          return (
            <figure
              key={i}
              className={
                isSmall
                  ? "mx-auto max-w-xs overflow-hidden rounded-lg sm:max-w-sm"
                  : "overflow-hidden rounded-xl"
              }
            >
              <Image
                src={section.src}
                alt={section.alt}
                width={isSmall ? 400 : 1200}
                height={isSmall ? 225 : 675}
                className="h-auto w-full object-cover"
                sizes={
                  isSmall
                    ? "(max-width: 640px) 320px, 384px"
                    : "(max-width: 768px) 100vw, 672px"
                }
              />
              {section.caption && (
                <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                  {section.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}
