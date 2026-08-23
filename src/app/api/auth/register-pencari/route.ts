import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { registerPencariSchema } from "@/lib/validation";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    const limitKey = clientKeyFromRequest(req, "register");
    const limit = rateLimit(limitKey, 5, 60);
    if (!limit.allowed) {
          return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." }, { status: 429 });
        }

    const body = await req.json().catch(() => null);
    const parsed = registerPencariSchema.safeParse(body);
    if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
        }

    const { name, email, phone, password } = parsed.data;

    if (await store.getUserByEmail(email)) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }

    const passwordHash = await hashPassword(password);
    const user = await store.createUser({ name, email, phone, passwordHash, role: "pencari", verificationLevel: 1 });

    const token = createSessionToken({ userId: user.id, role: user.role, name: user.name, verificationLevel: user.verificationLevel });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_MAX_AGE,
          path: "/",
        });
    return res;
  }
