import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { BugReportInsert } from "@/lib/types";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? GMAIL_USER;

// Reporter-supplied text is interpolated into the admin email's HTML body.
// Escape it so a report can't inject markup into the admin's inbox (phishing
// surface, not browser XSS).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      description?: string;
      steps?: string;
    };

    const description = body.description?.trim();
    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }
    if (description.length > 5000) {
      return NextResponse.json({ error: "Description is too long." }, { status: 400 });
    }

    const steps = body.steps?.trim();
    if (steps && steps.length > 5000) {
      return NextResponse.json({ error: "Steps are too long." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let reporterId: string | null = null;
    let reporterEmail: string | null = null;
    let reporter: string;

    if (user) {
      reporterId = user.id;
      reporterEmail = null;
      reporter = user.email ?? "";
    } else {
      const email = body.email?.trim();
      if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }
      // Reject malformed addresses. The regex also excludes the CR/LF that
      // could otherwise inject extra headers into the admin email's replyTo
      // or subject (this value is unverified reporter input).
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
      }
      reporterId = null;
      reporterEmail = email;
      reporter = email;
    }

    const pageUrl = request.headers.get("referer") ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    let insertOk = false;
    try {
      const service = createServiceClient();
      const insertPayload: BugReportInsert = {
        reporter_id: reporterId,
        reporter_email: reporterEmail,
        description,
        steps: steps || null,
        page_url: pageUrl,
        user_agent: userAgent,
      };
      const { error } = await service.from("bug_reports").insert(insertPayload);
      if (error) {
        console.error("[bug-report] insert failed", error);
        insertOk = false;
      } else {
        insertOk = true;
      }
    } catch (e) {
      console.error("[bug-report] insert failed", e);
      insertOk = false;
    }

    let emailOk = false;
    if (GMAIL_USER && GMAIL_APP_PASSWORD && ADMIN_EMAIL) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `Bug Reports <${GMAIL_USER}>`,
          to: ADMIN_EMAIL,
          replyTo: reporter,
          subject: `[Bug Report] from ${reporter}`,
          html: `
        <h2>Bug Report</h2>
        <p><strong>Reporter:</strong> ${escapeHtml(reporter)}</p>
        <p><strong>Page:</strong> ${escapeHtml(pageUrl ?? "unknown")}</p>
        <hr />
        <h3>Description</h3>
        <p style="white-space:pre-wrap">${escapeHtml(description)}</p>
        ${steps ? `<h3>Steps to Reproduce</h3><p style="white-space:pre-wrap">${escapeHtml(steps)}</p>` : ""}
      `,
        });
        emailOk = true;
      } catch (e) {
        console.error("[bug-report] email failed", e);
        emailOk = false;
      }
    }

    if (insertOk || emailOk) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  } catch (e) {
    console.error("[bug-report] Error:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
