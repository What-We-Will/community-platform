import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import { FEATURE_DESCRIPTIONS } from "@/lib/feature-preferences";
import { FeaturePreferences } from "./FeaturePreferences";

describe("FeaturePreferences — the member's platform feature selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render one labelled checkbox with its description for every supported feature", () => {
    render(<FeaturePreferences value={[]} onChange={vi.fn()} />);

    for (const key of FEATURE_KEYS) {
      const { label, description } = FEATURE_DESCRIPTIONS[key];
      expect(screen.getByRole("checkbox", { name: label })).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
  });

  it("should check every box when the value holds the full set", () => {
    render(<FeaturePreferences value={[...FEATURE_KEYS]} onChange={vi.fn()} />);

    for (const key of FEATURE_KEYS) {
      expect(
        screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS[key].label })
      ).toBeChecked();
    }
  });

  it("should leave a box unchecked when its key is absent from the value", () => {
    render(<FeaturePreferences value={["events"]} onChange={vi.fn()} />);

    expect(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.resource_hub.label,
      })
    ).not.toBeChecked();
  });

  // The emitted array is canonical so the stored value never depends on the
  // order the member happened to click in.
  it("should emit the selection in vocabulary order when a later key is checked first", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FeaturePreferences value={["resource_hub"]} onChange={onChange} />);

    await user.click(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    );

    expect(onChange).toHaveBeenCalledWith(["events", "resource_hub"]);
  });

  it("should emit the remaining keys when a checked box is unchecked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FeaturePreferences
        value={["events", "discussions"]}
        onChange={onChange}
      />
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: FEATURE_DESCRIPTIONS.discussions.label,
      })
    );

    expect(onChange).toHaveBeenCalledWith(["events"]);
  });

  it("should emit an empty selection when the last checked box is unchecked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FeaturePreferences value={["events"]} onChange={onChange} />);

    await user.click(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    );

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("should namespace the control ids when an idPrefix is given", () => {
    render(
      <FeaturePreferences value={[]} onChange={vi.fn()} idPrefix="onboarding" />
    );

    expect(
      screen.getByRole("checkbox", { name: FEATURE_DESCRIPTIONS.events.label })
    ).toHaveAttribute("id", "onboarding-events");
  });
});
