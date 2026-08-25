import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

const createMitraSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  email: z.string().trim().email("Format email tidak valid"),
  phone: z
    .string()
    .trim()
    .regex(/^0[0-9]{9,13}$/, "Nomor HP harus diawali 0 dan berisi 10-14 digit"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  category: z.string().trim().min(1, "Pilih kategori jasa"),
  city: z.string().trim().min(2, "Kota wajib diisi"),
  bio: z.string().trim().min(10, "Ceritakan sedikit tentang pengalaman mitra").max(1000),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  priceFrom: z.coerce.number().int().min(0),
  status: z.enum(["menunggu", "aktif", "ditangguhkan", "ditolak"]).default("menunggu"),
  badgeIdentitas: z.boolean().default(false),
  badgeAlamat: z.boolean().default(false),
  badgeKeahlian: z.boolean().default(false),
  trustLabel: z.enum(["Baru", "Terpercaya", "Pilihan Utama"]).default("Baru"),
  skorKepercayaan: z.coerce.number().int().min(0).max(100).default(20),
});

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola data mitra." }, { status: 403 });
  }
  const profiles = await store.adminListProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola data mitra." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createMitraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const d = parsed.data;

  if (await store.getUserByEmail(d.email)) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await hashPassword(d.password);
  const verificationLevel = [d.badgeIdentitas, d.badgeAlamat, d.badgeKeahlian].filter(Boolean).length as 0 | 1 | 2 | 3;

  // Catatan: dibuat lewat store.createUser langsung (bukan lewat
  // /api/auth/register-mitra) supaya TIDAK ikut menimpa cookie sesi admin
  // yang sedang login — endpoint ini murni entri data oleh admin, bukan
  // pendaftaran mandiri oleh mitra itu sendiri.
  const user = await store.createUser({
    name: d.name,
    email: d.email,
    phone: d.phone,
    passwordHash,
    role: "mitra",
    verificationLevel,
  });

  const profile = await store.createProfile({
    userId: user.id,
    category: d.category,
    bio: d.bio,
    city: d.city,
    addressFull: d.city,
    yearsExperience: d.yearsExperience,
    priceFrom: d.priceFrom,
    skills: [],
    status: d.status,
    badges: { identitas: d.badgeIdentitas, alamat: d.badgeAlamat, keahlian: d.badgeKeahlian },
    skorKepercayaan: d.skorKepercayaan,
    trustLabel: d.trustLabel,
    ratingAvg: 0,
    ratingCount: 0,
    portfolio: [],
  });

  return NextResponse.json({ ok: true, userId: user.id, profileId: profile.id });
}
