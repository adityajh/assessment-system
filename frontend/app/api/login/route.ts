import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, sha256Hex, verifyPassphrase } from "@/lib/auth";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  let passphrase = "";

  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      passphrase = typeof body?.passphrase === "string" ? body.passphrase : "";
    } else {
      const form = await request.formData();
      const value = form.get("passphrase");
      passphrase = typeof value === "string" ? value : "";
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  if (!process.env.ARCHIVE_PASSPHRASE_SHA256) {
    return NextResponse.json(
      { ok: false, error: "Server is not configured (ARCHIVE_PASSPHRASE_SHA256 missing)." },
      { status: 500 }
    );
  }

  if (!passphrase || !verifyPassphrase(passphrase)) {
    return NextResponse.json({ ok: false, error: "Incorrect passphrase." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, sha256Hex(passphrase), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
  return response;
}
