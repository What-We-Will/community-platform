import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? GMAIL_USER;

export async function POST(request: Request) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !ADMIN_EMAIL) {
    console.error("[bug-report] Missing GMAIL_USER, GMAIL_APP_PASSWORD, or ADMIN_EMAIL");
    return NextResponse.json(
      { error: "Bug reporting is not configured on this server." },
      { status: 503 }
    );
  }

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

    const reporter = body.email?.trim();
    if (!reporter) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const steps = body.steps?.trim();
    const url = request.headers.get("referer") ?? "unknown";

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
        <p><strong>Reporter:</strong> ${reporter}</p>
        <p><strong>Page:</strong> ${url}</p>
        <hr />
        <h3>Description</h3>
        <p style="white-space:pre-wrap">${description}</p>
        ${steps ? `<h3>Steps to Reproduce</h3><p style="white-space:pre-wrap">${steps}</p>` : ""}
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[bug-report] Error:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
