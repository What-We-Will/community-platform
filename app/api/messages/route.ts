import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import nodemailer from "nodemailer";

/** Returns true if the given ISO timestamp is from before today (UTC). */
function notSeenToday(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true;
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  return new Date(lastSeenAt) < todayUtc;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversation_id, content, message_type, metadata } = body as {
    conversation_id: string;
    content: string;
    message_type: "text" | "file";
    metadata?: Record<string, unknown>;
  };

  if (!conversation_id) {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }

  // Insert the message (RLS enforces sender_id = auth.uid())
  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      content: content ?? "",
      message_type: message_type ?? "text",
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fire notifications in the background — don't block the response
  sendNotifications({
    conversationId: conversation_id,
    senderId: user.id,
    messageType: message_type ?? "text",
    content: content ?? "",
  }).catch((err) => console.error("[messages/notify]", err));

  return NextResponse.json(message);
}

async function sendNotifications({
  conversationId,
  senderId,
  messageType,
  content,
}: {
  conversationId: string;
  senderId: string;
  messageType: string;
  content: string;
}) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return;

  const service = createServiceClient();

  // Get sender's display name
  const { data: senderProfile } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", senderId)
    .single();
  const senderName = senderProfile?.display_name ?? "A member";

  // Get all participants in the conversation, excluding the sender,
  // joined with their last_seen_at from profiles so we can check platform activity.
  const { data: participants } = await service
    .from("conversation_participants")
    .select("user_id, muted, profiles(last_seen_at)")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId);

  if (!participants || participants.length === 0) return;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://members.wwwrise.org";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  for (const participant of participants) {
    // Skip muted conversations
    if (participant.muted) continue;

    // Skip if the recipient has been on the platform today
    const profile = Array.isArray(participant.profiles)
      ? participant.profiles[0]
      : participant.profiles;
    const lastSeen = (profile as { last_seen_at: string | null } | null)?.last_seen_at ?? null;
    if (!notSeenToday(lastSeen)) continue;

    // Get the recipient's email via the admin auth API
    const {
      data: { user: recipientAuth },
    } = await service.auth.admin.getUserById(participant.user_id);
    if (!recipientAuth?.email) continue;

    const previewText =
      messageType === "file"
        ? "sent you a file"
        : content.length > 200
        ? content.slice(0, 200) + "…"
        : content;

    const conversationUrl = `${siteUrl}/messages/${conversationId}`;

    try {
      await transporter.sendMail({
        from: `What We Will <${gmailUser}>`,
        to: recipientAuth.email,
        subject: `New message from ${senderName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:4px;">New message from ${senderName}</h2>
            <p style="color:#555;margin-top:0;">You have a new message on What We Will.</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;font-size:15px;color:#333;">
              ${previewText}
            </div>
            <a href="${conversationUrl}"
               style="display:inline-block;background:#f97316;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;">
              View message
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:24px;">
              You're receiving this because you're a member of What We Will.
              You can mute this conversation to stop notifications.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error(`[messages/notify] Failed to email ${recipientAuth.email}:`, err);
    }
  }
}
