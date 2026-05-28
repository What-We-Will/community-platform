import { canonicalPath, serializeJsonLd } from "./seo";

describe("serializeJsonLd", () => {
  it("escapes script-breaking angle brackets", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).toBe(
      '{"name":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}'
    );
  });
});

describe("canonicalPath", () => {
  it("returns a site-relative canonical path", () => {
    expect(canonicalPath("news")).toEqual({ canonical: "/news" });
    expect(canonicalPath("/news")).toEqual({ canonical: "/news" });
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(() => canonicalPath("//evil.com")).toThrow(
      "canonicalPath only accepts site-relative paths"
    );
    expect(() => canonicalPath("https://evil.com")).toThrow(
      "canonicalPath only accepts site-relative paths"
    );
  });
});
