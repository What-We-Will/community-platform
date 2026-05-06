import { normalizePulsarBaseUrl } from "./client";

describe("normalizePulsarBaseUrl", () => {
  it("strips trailing slashes", () => {
    expect(normalizePulsarBaseUrl("https://pulsar.example.com/")).toBe(
      "https://pulsar.example.com"
    );
    expect(normalizePulsarBaseUrl("https://pulsar.example.com///")).toBe(
      "https://pulsar.example.com"
    );
  });

  it("does not strip path segments", () => {
    expect(normalizePulsarBaseUrl("https://pulsar.example.com/api/v1")).toBe(
      "https://pulsar.example.com/api/v1"
    );
  });
});
