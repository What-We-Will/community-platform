import { render, screen } from "@testing-library/react";
import { MessageBubble } from "../MessageBubble";
import { buildMessageWithSender } from "@/lib/__tests__/factories";

// getSignedUrl wraps the Supabase Storage client — a network boundary, and the
// only reason this file mocks anything. File-attachment bubbles request one on
// mount; nothing here asserts on the URL.
vi.mock("@/lib/storage", () => ({
  getSignedUrl: vi.fn().mockResolvedValue(null),
}));

/**
 * Which messages offer an edit control, and which are marked as edited.
 *
 * A member may edit only their own plain-text messages, and only where the
 * conversation supplies an edit handler — a read-only view (a group the member
 * has not joined) passes none. System messages, video invites, and file
 * attachments carry meaning outside their text and are never editable.
 */
describe("MessageBubble edit affordance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should offer an edit control when the message belongs to the current member", () => {
    const message = buildMessageWithSender();

    render(<MessageBubble message={message} isOwn showSenderInfo onEdit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Edit message" })).toBeInTheDocument();
  });

  it("should not offer an edit control when the message belongs to another member", () => {
    const message = buildMessageWithSender({ sender_id: "someone-else" });

    render(
      <MessageBubble message={message} isOwn={false} showSenderInfo onEdit={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: "Edit message" })).toBeNull();
  });

  it("should not offer an edit control when the conversation is read-only", () => {
    const message = buildMessageWithSender();

    render(<MessageBubble message={message} isOwn showSenderInfo />);

    expect(screen.queryByRole("button", { name: "Edit message" })).toBeNull();
  });

  it("should not offer an edit control on a system message", () => {
    const message = buildMessageWithSender({
      message_type: "system",
      content: "Video call ended",
    });

    render(<MessageBubble message={message} isOwn showSenderInfo onEdit={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Edit message" })).toBeNull();
  });

  it("should not offer an edit control on a file message", () => {
    const message = buildMessageWithSender({
      message_type: "file",
      content: "",
      metadata: { file_name: "resume.pdf", storage_path: "path/resume.pdf" },
    });

    render(<MessageBubble message={message} isOwn showSenderInfo onEdit={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Edit message" })).toBeNull();
  });

  it("should mark a message as edited when edited_at is set", () => {
    const message = buildMessageWithSender({ edited_at: "2026-01-01T00:05:00Z" });

    render(<MessageBubble message={message} isOwn showSenderInfo />);

    expect(screen.getByText(/edited/)).toBeInTheDocument();
  });

  it("should not mark a message as edited when edited_at is null", () => {
    const message = buildMessageWithSender({ edited_at: null });

    render(<MessageBubble message={message} isOwn showSenderInfo />);

    expect(screen.queryByText(/edited/)).toBeNull();
  });
});
