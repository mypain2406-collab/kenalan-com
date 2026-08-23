import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    const limitKey = clientKeyFromRequest(req, "login");
    const limit = rateLimit(limitKey, 8, 60);
    if (!limit.allowed) {
          return NextResponse.json({ error: "Terlalu banyak percobaan masuk. Coba lagi sebentar lagi." }, { status: 429 });
        }

    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
          return NextResponse.json({ error: "Email atau kata sandi tidak valid" }, { status: 400 });
        }

    const { email, password } = parsed.data;
    const user = await store.getUserByEmail(email);

    // Pesan error disengaja dibuat generik (bukan "email tidak ditemukan" vs
                                               // "password salah") supaya tidak membocorkan apakah suatu email terdaftar.
    const genericError = NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });

    if (!user) return genericError;
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return genericError;

    const token = createSessionToken({ userId: user.id, role: user.role, name: user.name, verificationLevel: user.verificationLevel });
    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_MAX_AGE,
          path: "/",
        });
    return res;
  }
