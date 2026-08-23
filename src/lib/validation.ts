import { z } from "zod";

export const registerPencariSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  email: z.string().trim().email("Format email tidak valid"),
    phone: z
  .string()
  .trim()
  .regex(/^0[0-9]{9,13}$/, "Nomor HP harus diawali 0 dan berisi 10-14 digit"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export const registerMitraSchema = registerPencariSchema.extend({
  category: z.string().trim().min(1, "Pilih kategori jasa"),
  city: z.string().trim().min(2, "Kota wajib diisi"),
  bio: z.string().trim().min(10, "Ceritakan sedikit tentang pengalaman Anda").max(1000),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  priceFrom: z.coerce.number().int().min(0),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const decisionSchema = z.object({
  decision: z.enum(["disetujui", "ditolak"]),
  note: z.string().trim().max(2000).optional(),
});

export const reportSchema = z.object({
  targetProfileId: z.string().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(10).max(2000),
});

export const ALLOWED_UPLOAD_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
