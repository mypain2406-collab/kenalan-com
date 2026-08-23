import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = getSession();
    if (!session) {
          return NextResponse.json({ error: "Anda perlu masuk untuk membuka kontak." }, { status: 401 });
        }

    // Cegah scraping massal nomor kontak: batasi jumlah pembukaan kontak per akun.
    const limit = rateLimit(clientKeyFromRequest(req, `unlock:${session.userId}`), 20, 60);
    if (!limit.allowed) {
          return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 });
        }

    const profile = await store.getProfile(params.id);
    if (!profile) {
          return NextResponse.json({ error: "Mitra tidak ditemukan." }, { status: 404 });
        }

    // Setiap pembukaan kontak tercatat di jejak audit (siapa membuka kontak siapa, kapan).
    await store.unlockContact(session.userId, profile.id);

    return NextResponse.json({ ok: true });
  }
