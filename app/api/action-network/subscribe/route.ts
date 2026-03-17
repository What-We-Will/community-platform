import { NextResponse } from "next/server";
import { subscribeEmailToNewsletter } from "@/lib/actionNetwork";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      firstName?: string;
      lastName?: string;
      zipCode?: string;
    };

    const result = await subscribeEmailToNewsletter({
      email: body.email ?? "",
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      zipCode: body.zipCode?.trim() || undefined,
    });

    if (!result.ok) {
      const status = result.status || 500;
      return NextResponse.json(
        { ok: false, error: result.error ?? "Failed to subscribe" },
        { status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/action-network/subscribe] unexpected error", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 },
    );
  }
}

