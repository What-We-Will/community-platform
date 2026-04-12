/**
 * @jest-environment node
 */

const WINDOWS_FILE_URL =
  "file:///C:/community-platform/scripts/export-survey.ts";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("export-survey output directory", () => {
  it("should confirm that .pathname includes a leading slash before the Windows drive letter", () => {
    // Arrange
    const url = new URL(WINDOWS_FILE_URL);

    // Act
    const pathname = url.pathname;

    // Assert — this leading slash is the root cause: on Windows path.resolve
    // treats it as "current drive root" and prepends the drive letter, doubling it
    expect(pathname).toBe("/C:/community-platform/scripts/export-survey.ts");
    expect(pathname.startsWith("/C:")).toBe(true);
  });
});
