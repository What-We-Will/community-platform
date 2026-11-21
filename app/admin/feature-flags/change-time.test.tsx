/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangeTime } from "./change-time";

// Radix positions the popover with ResizeObserver, which jsdom lacks.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ChangeTime — exact time behind a relative label", () => {
  it.each([
    ["taps it on a touchscreen", async () => {
      const time = screen.getByRole("button", { name: /^Just now/ });
      await userEvent.pointer([
        { keys: "[TouchA>]", target: time },
        { keys: "[/TouchA]", target: time },
      ]);
    }],
    ["presses Enter on it from the keyboard", async () => {
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
    }],
  ])("should show the exact date, time and timezone when the admin %s", async (_case, open) => {
    render(
      <ChangeTime dateTime="2026-11-20T10:00:00.000Z" timeZone="UTC">
        Just now
      </ChangeTime>
    );

    await open();

    expect(await screen.findByRole("dialog")).toHaveTextContent("Nov 20, 2026, 10:00 AM UTC");
  });
});
