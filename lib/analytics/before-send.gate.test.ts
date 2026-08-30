/**
 * @vitest-environment node
 */
import { makeCaptureEvent } from "@/lib/__tests__/factories";
import { buildBeforeSend } from "./before-send";

const ORIGIN = "https://community.example.org";

describe("before_send route gate — only authenticated app surfaces may emit", () => {
  const beforeSend = buildBeforeSend({ origin: ORIGIN });

  it("should pass the event through when the page is an allowlisted app route", () => {
    const event = makeCaptureEvent({
      properties: {
        $current_url: `${ORIGIN}/dashboard`,
        $pathname: "/dashboard",
      },
    });

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it.each([
    ["/login"],
    ["/signup"],
    ["/forgot-password"],
    ["/update-password"],
    ["/onboarding"],
    ["/pending-approval"],
  ])("should drop the event when the page is the auth surface %s", (path) => {
    const event = makeCaptureEvent({
      properties: { $current_url: `${ORIGIN}${path}`, $pathname: path },
    });

    expect(beforeSend(event)).toBeNull();
  });

  it.each([
    ["/"],
    ["/about-us"],
    ["/news/some-story"],
    ["/programs"],
    ["/resources"],
    ["/share-your-story"],
  ])("should drop the event when the page is the public route %s", (path) => {
    const event = makeCaptureEvent({
      properties: { $current_url: `${ORIGIN}${path}`, $pathname: path },
    });

    expect(beforeSend(event)).toBeNull();
  });

  it("should drop the event when a path merely shares an allowlisted prefix", () => {
    const event = makeCaptureEvent({
      properties: {
        $current_url: `${ORIGIN}/eventsphere`,
        $pathname: "/eventsphere",
      },
    });

    expect(beforeSend(event)).toBeNull();
  });

  it("should gate on the pathname when only $pathname is present", () => {
    const event = makeCaptureEvent({
      properties: { $current_url: undefined, $pathname: "/members" },
    });

    expect(beforeSend(event)).not.toBeNull();
  });

  it("should gate on the current URL when only $current_url is present", () => {
    const event = makeCaptureEvent({
      properties: { $current_url: `${ORIGIN}/groups`, $pathname: undefined },
    });

    expect(beforeSend(event)).not.toBeNull();
  });

  it("should fail closed and drop the event when no property identifies the page", () => {
    const event = makeCaptureEvent({
      properties: { $current_url: undefined, $pathname: undefined },
    });

    expect(beforeSend(event)).toBeNull();
  });
});
