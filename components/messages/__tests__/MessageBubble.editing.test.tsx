import { render, screen, fireEvent, act } from "@testing-library/react";
import { MessageBubble } from "../MessageBubble";
import { buildMessageWithSender } from "@/lib/__tests__/factories";

/**
 * The inline editor: what reaches the edit handler, and what the member sees
 * when it refuses.
 *
 * This component owns the editor and its client-side validation; it does not
 * own the write. Saving is delegated upward, and the handler answers with an
 * error string to display or null for success.
 */
describe("MessageBubble inline editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function openEditor(
    content: string,
    onEdit: (messageId: string, content: string) => Promise<string | null>
  ) {
    const message = buildMessageWithSender({ id: "message-7", content });
    render(<MessageBubble message={message} isOwn showSenderInfo onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    return screen.getByRole("textbox", { name: "Edit message" });
  }

  it("should send the trimmed new content to the edit handler when saved", async () => {
    const onEdit = vi.fn().mockResolvedValue(null);

    const editor = openEditor("before", onEdit);
    fireEvent.change(editor, { target: { value: "  after  " } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    expect(onEdit).toHaveBeenCalledWith("message-7", "after");
  });

  it("should reject an empty edit without calling the edit handler", async () => {
    const onEdit = vi.fn().mockResolvedValue(null);

    const editor = openEditor("before", onEdit);
    fireEvent.change(editor, { target: { value: "   " } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText("Message cannot be empty")).toBeInTheDocument();
  });

  it("should close the editor without calling the handler when nothing changed", async () => {
    const onEdit = vi.fn().mockResolvedValue(null);

    const editor = openEditor("before", onEdit);
    fireEvent.change(editor, { target: { value: "before" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Edit message" })).toBeNull();
  });

  it("should restore the original content and close the editor when cancelled", () => {
    const onEdit = vi.fn();

    const editor = openEditor("before", onEdit);
    fireEvent.change(editor, { target: { value: "discarded" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText("before")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Edit message" })).toBeNull();
  });

  it("should surface the failure and keep the editor open when the edit is rejected", async () => {
    const onEdit = vi.fn().mockResolvedValue("That change can't be saved to this message.");

    const editor = openEditor("before", onEdit);
    fireEvent.change(editor, { target: { value: "after" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    expect(
      screen.getByText("That change can't be saved to this message.")
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Edit message" })).toBeInTheDocument();
  });
});
