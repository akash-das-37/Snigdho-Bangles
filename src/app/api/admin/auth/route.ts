import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies boutique manager credentials strictly on the server so no admin password
 * is embedded in client bundles or committed to version control.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const submittedEmail = (body.email || "").trim().toLowerCase();
    const submittedPassword = typeof body.password === "string" ? body.password : "";

    const configuredEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      "snigdhobangles@gmail.com"
    )
      .trim()
      .toLowerCase();

    if (!submittedEmail || submittedEmail !== configuredEmail) {
      return NextResponse.json({ isAdminEmail: false, configured: true, valid: false });
    }

    const configuredPassword = process.env.ADMIN_PASSWORD || "";
    if (!configuredPassword) {
      return NextResponse.json({ isAdminEmail: true, configured: false, valid: false });
    }

    const valid = safeEquals(submittedPassword, configuredPassword);
    return NextResponse.json({
      isAdminEmail: true,
      configured: true,
      valid,
    });
  } catch {
    return NextResponse.json(
      { isAdminEmail: false, configured: false, valid: false },
      { status: 400 }
    );
  }
}
