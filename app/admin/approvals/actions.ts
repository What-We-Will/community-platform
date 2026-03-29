"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import nodemailer from "nodemailer";

async function ensureAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user: callerUser },
  } = await supabase.auth.getUser();

  if (!callerUser) {
    console.error("[approvals] Not authenticated.");
    return false;
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", callerUser.id)
    .single();

  if (callerProfile?.role !== "admin") {
    console.error("[approvals] Not authorized.");
    return false;
  }

  return true;
}

export async function approveUser(userId: string, _formData?: FormData): Promise<void> {
  if (!(await ensureAdmin())) return;

  // Use service role to bypass RLS — admins updating other users' rows
  const serviceClient = createServiceClient();

  // Run profile update and email lookup in parallel — they're independent
  const [{ error }, { data: { user: targetUser } }] = await Promise.all([
    serviceClient.from("profiles").update({ approval_status: "approved" }).eq("id", userId),
    serviceClient.auth.admin.getUserById(userId),
  ]);

  if (error) {
    console.error("[approvals] Failed to approve user:", error.message);
    return;
  }

  if (targetUser?.email) {
    await sendApprovalEmail(targetUser.email);
  }

  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}

export async function rejectUser(userId: string, _formData?: FormData): Promise<void> {
  if (!(await ensureAdmin())) return;

  const serviceClient = createServiceClient();

  // Delete profile first, then auth user (order matters for FK constraints)
  const { error: profileError } = await serviceClient
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    console.error("[approvals] Failed to delete profile:", profileError.message);
    return;
  }

  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("[approvals] Failed to delete auth user:", authError.message);
    return;
  }

  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}

async function sendApprovalEmail(toEmail: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) return;

  const { getSiteUrl } = await import("@/lib/utils/get-site-url");
  const siteUrl = getSiteUrl();

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
