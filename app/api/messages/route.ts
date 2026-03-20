import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createGmailTransport, getMailFromHeader } from "@/lib/email";

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
    console.error("[api/messages] insert error:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Await notifications so they complete before Vercel terminates the function
  await sendNotifications({
    conversationId: conversation_id,
    senderId: user.id,
    messageType: message_type ?? "text",
    content: content ?? "",
  });

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
  const transporter = createGmailTransport();
  const fromHeader = getMailFromHeader();
  if (!transporter || !fromHeader) {
    console.warn("[messages/notify] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email");
    return;
  }

  const service = createServiceClient();

  // Get sender's display name
  const { data: senderProfile } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", senderId)
    .single();
  const senderName = senderProfile?.display_name ?? "A member";

  // Get participants in this conversation, excluding the sender
  const { data: participants, error: partError } = await service
    .from("conversation_participants")
    .select("user_id, muted")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId);

  if (partError) {
    console.error("[messages/notify] participants query error:", partError.message);
    return;
  }
  if (!participants || participants.length === 0) return;

  // Fetch last_seen_at for each participant from profiles separately
  const recipientIds = participants.map((p) => p.user_id);
  const { data: profileRows, error: profilesError } = await service
    .from("profiles")
    .select("id, last_seen_at")
    .in("id", recipientIds);

  if (profilesError) {
    console.error("[messages/notify] profiles query error:", profilesError.message);
    return;
  }

  const lastSeenMap: Record<string, string | null> = {};
  for (const p of profileRows ?? []) {
    lastSeenMap[p.id] = p.last_seen_at ?? null;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://members.wwwrise.org";

  for (const participant of participants) {
    if (participant.muted) continue;

    const lastSeen = lastSeenMap[participant.user_id] ?? null;
    if (!notSeenToday(lastSeen)) {
      continue; // They've been on the platform today — skip
    }

    // Get the recipient's email via the admin auth API
    const {
      data: { user: recipientAuth },
      error: authErr,
    } = await service.auth.admin.getUserById(participant.user_id);

    if (authErr || !recipientAuth?.email) {
      console.warn("[messages/notify] could not get email for user:", participant.user_id);
      continue;
    }

    const previewText =
      messageType === "file"
        ? "sent you a file"
        : content.length > 200
        ? content.slice(0, 200) + "…"
        : content;

    const conversationUrl = `${siteUrl}/messages/${conversationId}`;

    try {
      await transporter.sendMail({
        from: fromHeader,
        to: recipientAuth.email,
        subject: `New message from ${senderName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:4px;">New message from ${senderName}</h2>
            <p style="color:#555;margin-top:0;">You have a new message on What We Will.</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;font-size:15px;color:#333;white-space:pre-wrap;">
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
      console.log(`[messages/notify] emailed ${recipientAuth.email}`);
    } catch (err) {
      console.error(`[messages/notify] failed to email ${recipientAuth.email}:`, err);
    }
  }
}
