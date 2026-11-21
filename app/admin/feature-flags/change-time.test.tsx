/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChangeTime } from "./change-time";

// Radix positions the tooltip with ResizeObserver, which jsdom lacks.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ChangeTime — exact time behind a relative label", () => {
  it("should show the exact date, time and timezone when the time gets keyboard focus", async () => {
    render(
      <TooltipProvider>
        <ChangeTime dateTime="2026-11-20T10:00:00.000Z" timeZone="UTC">
          Just now
        </ChangeTime>
      </TooltipProvider>
    );

    await userEvent.tab();

    expect(screen.getByText("Just now")).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Nov 20, 2026, 10:00 AM UTC");
  });
});
