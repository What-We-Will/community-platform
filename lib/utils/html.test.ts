import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("escapes all five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#x27;y&#x27;&gt;&amp;"
    );
  });

  it("escapes & first to avoid double-encoding", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves safe strings untouched", () => {
    expect(escapeHtml("https://github.com/user")).toBe(
      "https://github.com/user"
    );
  });
});
