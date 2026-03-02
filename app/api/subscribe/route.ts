import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Community <onboarding@resend.dev>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Our Community";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim() ?? "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = typeof body?.email === "string" ? body.email.trim() : "";
    if (!raw || !isValidEmail(raw)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    const email = raw.toLowerCase();

    const supabase = createAdminClient();
    const { error: insertError } = await supabase.from("mailing_list").upsert(
      { email, source: "landing_join" },
      { onConflict: "email" }
    );

    if (insertError) {
      console.error("[subscribe] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    if (process.env.RESEND_API_KEY) {
      const { error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: `Thanks for joining ${APP_NAME}`,
        html: `
          <p>Thanks for signing up! You're on our list and we'll keep you updated.</p>
          <p>— The ${APP_NAME} team</p>
        `,
      });
      if (sendError) {
        console.error("[subscribe] Resend send error:", sendError);
        // Don't fail the request; they're already on the list.
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[subscribe] Error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
