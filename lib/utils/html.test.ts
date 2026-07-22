import { escapeHtml } from "./html";

// The expected outputs below are the de-facto standard shared by escape-html,
// html-escaper, and lodash.escape (single quote → &#39;). Asserting the exact
// strings pins this helper to the reference behavior of those libraries.

describe("escapeHtml", () => {
  describe("the five HTML-significant characters", () => {
    it("escapes &", () => {
      expect(escapeHtml("&")).toBe("&amp;");
    });
    it("escapes <", () => {
      expect(escapeHtml("<")).toBe("&lt;");
    });
    it("escapes >", () => {
      expect(escapeHtml(">")).toBe("&gt;");
    });
    it("escapes the double quote (double-quoted attribute context)", () => {
      expect(escapeHtml('"')).toBe("&quot;");
    });
    it("escapes the single quote as &#39; not &apos; (single-quoted attribute context)", () => {
      expect(escapeHtml("'")).toBe("&#39;");
    });
  });

  describe("ordering — & is escaped first, no double-encoding", () => {
    it("escapes a literal ampersand in entity-looking text", () => {
      // A single pass: only the & is HTML-significant here.
      expect(escapeHtml("&lt;")).toBe("&amp;lt;");
    });
    it("escapes a run of ampersands without cascading", () => {
      expect(escapeHtml("a & b & c")).toBe("a &amp; b &amp; c");
    });
    it("escapes an ampersand adjacent to a real angle bracket", () => {
      expect(escapeHtml("Tom & <Jerry>")).toBe("Tom &amp; &lt;Jerry&gt;");
    });
    it("is NOT idempotent — re-escaping double-encodes (escape each raw value once)", () => {
      // Pins the double-encoding so a contributor who wraps an already-escaped
      // string gets a failing test rather than silently garbled email copy.
      expect(escapeHtml("a &amp; b")).toBe("a &amp;amp; b");
    });
  });

  describe("real-world injection payloads are neutralized", () => {
    it("script tag", () => {
      expect(escapeHtml("<script>alert(1)</script>")).toBe(
        "&lt;script&gt;alert(1)&lt;/script&gt;",
      );
    });
    it("img/onerror with double-quoted handler", () => {
      expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
      );
    });
    it("attribute breakout via quotes (double and single)", () => {
      expect(escapeHtml(`" onmouseover='alert(1)'`)).toBe(
        "&quot; onmouseover=&#39;alert(1)&#39;",
      );
    });
    it("neutralizes the HTML comment terminator (regression lock on > escaping)", () => {
      // The `>` escape is the only thing preventing comment-context injection;
      // lock it so a future contributor can't drop it unnoticed.
      expect(escapeHtml("-->")).toBe("--&gt;");
      expect(escapeHtml("--!>")).toBe("--!&gt;");
    });
  });

  describe("passthrough and non-string handling", () => {
    it("leaves a safe string untouched", () => {
      expect(escapeHtml("https://github.com/octocat")).toBe(
        "https://github.com/octocat",
      );
    });
    it("passes backtick through unchanged — deliberate; UNSAFE in unquoted attributes", () => {
      // Backtick is not HTML-significant in standards-compliant renderers. Pinned
      // so nobody adds a backtick escape without revisiting the unquoted-attr rule.
      expect(escapeHtml("`")).toBe("`");
    });
    it("returns empty string for empty input", () => {
      expect(escapeHtml("")).toBe("");
    });
    it("returns empty string for null and undefined — fails closed, does not coerce", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
    });
    it("returns empty string for numbers, objects, and arrays (never String()-coerced)", () => {
      expect(escapeHtml(42)).toBe("");
      expect(escapeHtml({})).toBe("");
      expect(escapeHtml(["<b>"])).toBe("");
    });
  });
});
