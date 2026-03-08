"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import nodemailer from "nodemailer";

export async function approveUser(userId: string, _formData?: FormData): Promise<void> {
  const supabase = await createClient();

  // Verify the caller is an admin
  const {
    data: { user: callerUser },
  } = await supabase.auth.getUser();

  if (!callerUser) {
    console.error("[approvals] Not authenticated.");
    return;
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", callerUser.id)
    .single();

  if (callerProfile?.role !== "admin") {
    console.error("[approvals] Not authorized.");
    return;
  }

  // Approve the user
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: "approved" })
    .eq("id", userId);

  if (error) {
    console.error("[approvals] Failed to approve user:", error.message);
    return;
  }

  // Look up the user's email via service role (bypasses RLS on auth.users)
  const serviceClient = createServiceClient();
  const {
    data: { user: targetUser },
  } = await serviceClient.auth.admin.getUserById(userId);

  if (targetUser?.email) {
    await sendApprovalEmail(targetUser.email);
  }

  revalidatePath("/admin/approvals");
}

async function sendApprovalEmail(toEmail: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) return;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://community-platform-x74m.vercel.app";

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `What We Will <${gmailUser}>`,
      to: toEmail,
      subject: "Your What We Will membership has been approved!",
      html: `
        <h2>Welcome to What We Will!</h2>
        <p>Great news — your membership application has been approved.</p>
        <p>You can now sign in and access the platform.</p>
        <br />
        <a href="${siteUrl}/login" style="background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Sign in now
        </a>
        <br /><br />
        <p style="color:#888;font-size:13px;">
          If you have any questions, reply to this email or reach out at info@wwwrise.org.
        </p>
      `,
    });
  } catch (err) {
    console.error("[approvals] Failed to send approval email:", err);
  }
}
