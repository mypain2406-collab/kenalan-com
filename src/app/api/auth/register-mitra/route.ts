import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { registerMitraSchema } from "@/lib/validation";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    const limitKey = clientKeyFromRequest(req, "register-mitra");
    const limit = rateLimit(limitKey, 5, 60);
    if (!limit.allowed) {
          return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." }, { status: 429 });
        }

    const body = await req.json().catch(() => null);
    const parsed = registerMitraSchema.safeParse(body);
    if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
        }

    const { name, email, phone, password, category, city, bio, yearsExperience, priceFrom } = parsed.data;

    if (await store.getUserByEmail(email)) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }

    const passwordHash = await hashPassword(password);
    const user = await store.createUser({ name, email, phone, passwordHash, role: "mitra", verificationLevel: 0 });

    const profile = await store.createProfile({
          userId: user.id,
          category,
          bio,
          city,
          addressFull: city,
          yearsExperience,
          priceFrom,
          skills: [],
          status: "menunggu",
          badges: { identitas: false, alamat: false, keahlian: false },
          skorKepercayaan: 20,
          trustLabel: "Baru",
          ratingAvg: 0,
          ratingCount: 0,
          portfolio: [],
        });

    const token = createSessionToken({ userId: user.id, role: user.role, name: user.name, verificationLevel: user.verificationLevel });
    const res = NextResponse.json({ ok: true, userId: user.id, profileId: profile.id });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_MAX_AGE,
          path: "/",
        });
    return res;
  }
