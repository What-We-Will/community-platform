import { getSiteUrl } from "./get-site-url";

describe("getSiteUrl", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("Should return current window origin if window exists", () => {
    window = Object.create(window);
    const origin = "example.com";

    Object.defineProperty(window, "location", {
      value: { origin },
      writable: true,
    });
    expect(getSiteUrl()).toBe(origin);
  });

  it("Should return public site url if no window", () => {
    const { window } = global;
    delete (global as Partial<typeof globalThis>).window;
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.wwwrise.org/";
    expect(getSiteUrl()).toBe("https://example.wwwrise.org");
    global.window = window;
  });

  it("Should return vercel url with https if no window or public url", () => {
    const { window } = global;
    delete (global as Partial<typeof globalThis>).window;
    process.env.VERCEL_URL = "example2.wwwrise.org";
    expect(getSiteUrl()).toBe("https://example2.wwwrise.org");
    global.window = window;
  });

  it("Should return production url otherwise", () => {
    const { window } = global;
    delete (global as Partial<typeof globalThis>).window;
    expect(getSiteUrl()).toBe("https://members.wwwrise.org");
    global.window = window;
  });
});
