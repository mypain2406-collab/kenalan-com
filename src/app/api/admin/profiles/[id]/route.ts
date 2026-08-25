import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

const updateMitraSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^0[0-9]{9,13}$/, "Nomor HP harus diawali 0 dan berisi 10-14 digit"),
  category: z.string().trim().min(1, "Pilih kategori jasa"),
  city: z.string().trim().min(2, "Kota wajib diisi"),
  bio: z.string().trim().min(10, "Ceritakan sedikit tentang pengalaman mitra").max(1000),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  priceFrom: z.coerce.number().int().min(0),
  status: z.enum(["menunggu", "aktif", "ditangguhkan", "ditolak"]),
  badgeIdentitas: z.boolean(),
  badgeAlamat: z.boolean(),
  badgeKeahlian: z.boolean(),
  trustLabel: z.enum(["Baru", "Terpercaya", "Pilihan Utama"]),
  skorKepercayaan: z.coerce.number().int().min(0).max(100),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola data mitra." }, { status: 403 });
  }
  const profile = await store.getProfile(params.id);
  if (!profile) return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
  const user = await store.getUserById(profile.userId);
  return NextResponse.json({ profile, user });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola data mitra." }, { status: 403 });
  }

  const profile = await store.getProfile(params.id);
  if (!profile) {
    return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateMitraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const d = parsed.data;

  await store.updateUser(profile.userId, { name: d.name, phone: d.phone });
  await store.updateProfile(profile.id, {
    category: d.category,
    city: d.city,
    addressFull: d.city,
    bio: d.bio,
    yearsExperience: d.yearsExperience,
    priceFrom: d.priceFrom,
    status: d.status,
    badges: { identitas: d.badgeIdentitas, alamat: d.badgeAlamat, keahlian: d.badgeKeahlian },
    trustLabel: d.trustLabel,
    skorKepercayaan: d.skorKepercayaan,
  });

  return NextResponse.json({ ok: true });
}
