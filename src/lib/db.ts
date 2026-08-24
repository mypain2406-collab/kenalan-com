import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Collection } from "mongodb";
import { getDb } from "./mongo";

/**
 * Lapisan data untuk Kenalan.com, didukung MongoDB.
 *
 * Skema di sini mengikuti rancangan pada dokumen spesifikasi produk (bagian
 * "Skema basis data") — di sana digambarkan untuk PostgreSQL relasional,
 * di sini diadaptasi ke koleksi MongoDB karena lebih mudah disambungkan tanpa
 * server database terkelola terpisah saat prototipe di-deploy ke platform
 * serverless (Netlify Functions tidak punya disk yang persisten, sehingga
 * penyimpanan berkas JSON lokal dari versi sebelumnya tidak bisa dipakai).
 *
 * Setiap dokumen memakai id string kustom (mis. "u_ab12cd") sebagai kunci
 * utama logis (bukan _id ObjectId bawaan Mongo) supaya konsisten dengan id
 * yang dipakai di seluruh kode aplikasi & URL (/mitra/p_ridwan, dst).
 */

export { CATEGORIES } from "./categories";

export type Role = "pencari" | "mitra" | "admin";
export type VerificationLevel = 0 | 1 | 2 | 3;
export type ProfileStatus = "menunggu" | "aktif" | "ditangguhkan" | "ditolak";
export type VerificationJenis = "identitas" | "alamat" | "keahlian" | "latar_belakang";
export type VerificationStatus = "diajukan" | "diproses" | "disetujui" | "ditolak";

export interface UserRecord {
   id: string;
   name: string;
   email: string;
   phone: string;
   passwordHash: string;
   role: Role;
   verificationLevel: VerificationLevel;
   createdAt: string;
}

export interface ProfessionalProfileRecord {
   id: string;
   userId: string;
   category: string;
   bio: string;
   city: string;
   addressFull: string;
   yearsExperience: number;
   priceFrom: number;
   skills: string[];
   certificate?: string;
   status: ProfileStatus;
   badges: { identitas: boolean; alamat: boolean; keahlian: boolean };
   skorKepercayaan: number;
   trustLabel: "Baru" | "Terpercaya" | "Pilihan Utama";
   ratingAvg: number;
   ratingCount: number;
   portfolio: { caption: string; colorFrom: string; colorTo: string }[];
}

export interface VerificationDocumentRecord {
   type: "ktp" | "selfie" | "portfolio" | "sertifikat";
   filename: string;
   /** Isi berkas disimpan sebagai base64 langsung di dokumen Mongo — lihat
    * catatan di README soal batas ukuran & rekomendasi object storage untuk
    * produksi sungguhan. */
  dataBase64: string;
   mimeType: string;
   sizeBytes: number;
}

export interface VerificationRecord {
   id: string;
   userId: string;
   jenis: VerificationJenis;
   status: VerificationStatus;
   faceMatchScore?: number;
   documentAuthentic?: boolean;
   riskFlag?: string;
   reviewerNote?: string;
   createdAt: string;
   decidedAt?: string;
   documents: VerificationDocumentRecord[];
}

export interface ReviewRecord {
   id: string;
   profileId: string;
   reviewerName: string;
   rating: number;
   comment: string;
   jobCategory: string;
   createdAt: string;
}

export interface ContactUnlockRecord {
   id: string;
   userId: string;
   profileId: string;
   unlockedAt: string;
}

export interface ReportRecord {
   id: string;
   reporterId: string;
   targetProfileId: string;
   category: string;
   description: string;
   status: "baru" | "ditinjau" | "ditutup";
   createdAt: string;
}

function newId(prefix: string): string {
   return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

async function col<T extends { id: string }>(name: string) {
   const db = await getDb();
   return db.collection<T>(name);
}

// ---------------------------------------------------------------------------
// Seed data — dibuat sekali saat koleksi `users` masih kosong.
// ---------------------------------------------------------------------------

let seedPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
   if (!seedPromise) seedPromise = doSeed();
   return seedPromise;
}

/**
 * Hapus dokumen duplikat pada field `id` logis (bisa terjadi kalau beberapa
 * cold start serverless menjalankan seeding bersamaan sebelum unique index
 * terpasang) — hanya menyisakan satu salinan per id, sisanya (dokumen yang
 * lebih baru berdasarkan _id) dihapus.
 */
async function dedupeById<T extends { id: string }>(collection: Collection<T>): Promise<void> {
   const dups = await collection
     .aggregate<{ _id: string; docIds: unknown[]; count: number }>([
    { $group: { _id: "$id", docIds: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
        ])
     .toArray();
   for (const d of dups) {
        const idsToRemove = d.docIds.slice(1);
        if (idsToRemove.length > 0) {
               await collection.deleteMany({ _id: { $in: idsToRemove } } as never);
        }
   }
}

async function doSeed(): Promise<void> {
   const users = await col<UserRecord>("users");
   const profiles = await col<ProfessionalProfileRecord>("profiles");
   const verifications = await col<VerificationRecord>("verifications");
   const reviews = await col<ReviewRecord>("reviews");

  // Bersihkan duplikat dari percobaan seeding sebelumnya (race condition
  // antar-invocation serverless), lalu pasang unique index LEBIH DULU
  // sebelum insert supaya percobaan seeding berikutnya yang berjalan
  // bersamaan gagal dengan aman (ditangkap di bawah) alih-alih
  // menghasilkan dokumen duplikat baru.
  await dedupeById(users);
   await dedupeById(profiles);
   await dedupeById(verifications);

  await users.createIndex({ id: 1 }, { unique: true });
   await users.createIndex({ email: 1 }, { unique: true });
   await profiles.createIndex({ id: 1 }, { unique: true });
   await profiles.createIndex({ userId: 1 });
   await verifications.createIndex({ id: 1 }, { unique: true });

  const existing = await users.countDocuments();
   if (existing > 0) return;

  const now = new Date().toISOString();
   const demoHash = await bcrypt.hash("Kenalan123!", 10);

  const userDocs: UserRecord[] = [
   { id: "u_admin", name: "Tim Trust & Safety", email: "admin@kenalan.com", phone: "081200000000", passwordHash: demoHash, role: "admin", verificationLevel: 3, createdAt: now },
   { id: "u_ridwan", name: "Ridwan Hidayat", email: "ridwan@kenalan.com", phone: "081200000012", passwordHash: demoHash, role: "mitra", verificationLevel: 2, createdAt: now },
   { id: "u_siti", name: "Siti Wulandari", email: "siti@kenalan.com", phone: "081200000034", passwordHash: demoHash, role: "mitra", verificationLevel: 1, createdAt: now },
   { id: "u_bambang", name: "Bambang Santoso", email: "bambang@kenalan.com", phone: "081200000056", passwordHash: demoHash, role: "mitra", verificationLevel: 2, createdAt: now },
   { id: "u_agus", name: "Agus Firmansyah", email: "agus@kenalan.com", phone: "081200000078", passwordHash: demoHash, role: "mitra", verificationLevel: 1, createdAt: now },
   { id: "u_dedi", name: "Dedi Purnomo", email: "dedi@kenalan.com", phone: "081200000090", passwordHash: demoHash, role: "mitra", verificationLevel: 1, createdAt: now },
   { id: "u_yusuf", name: "Yusuf Kurniawan", email: "yusuf@kenalan.com", phone: "081200000111", passwordHash: demoHash, role: "mitra", verificationLevel: 0, createdAt: now },
   { id: "u_maya", name: "Maya Anggraini", email: "maya@kenalan.com", phone: "081200000222", passwordHash: demoHash, role: "pencari", verificationLevel: 1, createdAt: now },
     ];

  const profileDocs: ProfessionalProfileRecord[] = [
   {
          id: "p_ridwan", userId: "u_ridwan", category: "Instalasi Listrik",
          bio: "Melayani instalasi & perbaikan kelistrikan rumah tangga di area Bandung Timur sejak 2017. Fokus pada instalasi panel baru, penggantian kabel usang, dan pemasangan titik lampu tambahan.",
          city: "Antapani, Bandung", addressFull: "Jl. Cihampelas No. 12, Antapani, Bandung, Jawa Barat",
          yearsExperience: 9, priceFrom: 150000,
          skills: ["Instalasi rumah tangga", "Panel & MCB", "Instalasi ringan industri", "Genset rumah"],
          certificate: "Sertifikat Kompetensi Instalatir Listrik — Kemnaker No. 00219/LST/2023",
          status: "aktif", badges: { identitas: true, alamat: true, keahlian: true },
          skorKepercayaan: 92, trustLabel: "Pilihan Utama", ratingAvg: 4.9, ratingCount: 128,
          portfolio: [
           { caption: "Instalasi ulang panel — Antapani, 2025", colorFrom: "#DCE4F5", colorTo: "#B9C7E8" },
           { caption: "Titik lampu tambahan — Cibiru, 2024", colorFrom: "#EAD3A3", colorTo: "#F0E0BF" },
           { caption: "Genset cadangan — Ujungberung, 2024", colorFrom: "#BFE4D0", colorTo: "#DCEFE3" },
                 ],
   },
   {
          id: "p_siti", userId: "u_siti", category: "Kebersihan Rumah",
          bio: "Tim kebersihan rumah beranggotakan 3 orang, melayani area Jakarta Utara. Spesialisasi general cleaning dan deep cleaning dapur.",
          city: "Kelapa Gading, Jakarta", addressFull: "Jl. Boulevard Raya No. 8, Kelapa Gading, Jakarta Utara",
          yearsExperience: 5, priceFrom: 120000,
          skills: ["General cleaning", "Deep cleaning dapur", "Cuci sofa & karpet"],
          status: "aktif", badges: { identitas: true, alamat: true, keahlian: false },
          skorKepercayaan: 88, trustLabel: "Terpercaya", ratingAvg: 5.0, ratingCount: 94,
          portfolio: [
           { caption: "Deep cleaning apartemen — Kelapa Gading, 2025", colorFrom: "#C9D6F2", colorTo: "#E8EDFA" },
           { caption: "General cleaning rumah — Sunter, 2025", colorFrom: "#DFE3EC", colorTo: "#F0F2F6" },
                 ],
   },
   {
          id: "p_bambang", userId: "u_bambang", category: "Tukang Bangunan",
          bio: "Spesialis renovasi rumah tinggal dan ruko di area Surabaya Timur. Pernah menangani lebih dari 200 proyek renovasi.",
          city: "Rungkut, Surabaya", addressFull: "Jl. Kali Rungkut No. 21, Rungkut, Surabaya, Jawa Timur",
          yearsExperience: 14, priceFrom: 200000,
          skills: ["Renovasi rumah", "Bongkar pasang keramik", "Pengecoran"],
          certificate: "Sertifikat Kompetensi Tukang Batu — BNSP No. 00871/TB/2022",
          status: "aktif", badges: { identitas: true, alamat: true, keahlian: true },
          skorKepercayaan: 90, trustLabel: "Pilihan Utama", ratingAvg: 4.8, ratingCount: 211,
          portfolio: [
           { caption: "Renovasi ruko 2 lantai — Rungkut, 2025", colorFrom: "#F0C3BF", colorTo: "#FCE8E6" },
           { caption: "Bongkar pasang keramik — Gubeng, 2024", colorFrom: "#EAD3A3", colorTo: "#F0E0BF" },
                 ],
   },
   {
          id: "p_agus", userId: "u_agus", category: "Ledeng & Pipa",
          bio: "Panggilan servis ledeng & pipa 24 jam di area Jakarta Selatan. Menangani kebocoran pipa, saluran mampet, dan instalasi baru.",
          city: "Tebet, Jakarta", addressFull: "Jl. Tebet Barat Dalam No. 5, Tebet, Jakarta Selatan",
          yearsExperience: 7, priceFrom: 100000,
          skills: ["Perbaikan kebocoran", "Saluran mampet", "Instalasi pipa baru"],
          status: "aktif", badges: { identitas: true, alamat: true, keahlian: false },
          skorKepercayaan: 84, trustLabel: "Terpercaya", ratingAvg: 4.7, ratingCount: 67,
          portfolio: [{ caption: "Perbaikan pipa bocor — Tebet, 2025", colorFrom: "#DCE4F5", colorTo: "#B9C7E8" }],
   },
   {
          id: "p_dedi", userId: "u_dedi", category: "Instalasi Listrik",
          bio: "Melayani instalasi panel dan genset rumah di area Jakarta Selatan.",
          city: "Kemang, Jakarta", addressFull: "Jl. Kemang Raya No. 44, Kemang, Jakarta Selatan",
          yearsExperience: 6, priceFrom: 120000,
          skills: ["Panel & genset rumah"],
          status: "aktif", badges: { identitas: true, alamat: true, keahlian: false },
          skorKepercayaan: 79, trustLabel: "Terpercaya", ratingAvg: 4.7, ratingCount: 52,
          portfolio: [{ caption: "Instalasi genset — Kemang, 2025", colorFrom: "#BFE4D0", colorTo: "#DCEFE3" }],
   },
   {
          id: "p_yusuf", userId: "u_yusuf", category: "Instalasi Listrik",
          bio: "Baru bergabung di Kenalan.com, sedang menyelesaikan proses verifikasi identitas.",
          city: "Mampang, Jakarta", addressFull: "Jl. Mampang Prapatan No. 9, Mampang, Jakarta Selatan",
          yearsExperience: 3, priceFrom: 100000,
          skills: ["Instalasi rumah tangga"],
          status: "menunggu", badges: { identitas: false, alamat: false, keahlian: false },
          skorKepercayaan: 40, trustLabel: "Baru", ratingAvg: 0, ratingCount: 0,
          portfolio: [],
   },
     ];

  const verificationDocs: VerificationRecord[] = [
   {
          id: "v_yusuf_identitas", userId: "u_yusuf", jenis: "identitas", status: "diproses",
          faceMatchScore: 97.8, documentAuthentic: true,
          riskFlag: "Foto KTP terdeteksi kemungkinan hasil foto ulang dari layar (bukan dokumen fisik langsung). Periksa manual sebelum menyetujui.",
          reviewerNote: "Sudah hubungi via chat, mitra mengonfirmasi foto diambil ulang karena hasil pertama buram. Menunggu unggah ulang.",
          createdAt: now, documents: [],
   },
     ];

  const reviewDocs: ReviewRecord[] = [
   { id: newId("rv"), profileId: "p_ridwan", reviewerName: "Maya Anggraini", rating: 5, jobCategory: "Instalasi Listrik", comment: "Datang tepat waktu, menjelaskan estimasi biaya sebelum mulai kerja, dan hasil rapi.", createdAt: now },
   { id: newId("rv"), profileId: "p_ridwan", reviewerName: "Hendra Tanaka", rating: 4, jobCategory: "Perbaikan Panel", comment: "Kerjanya bagus, cuma datang agak telat 30 menit dari jadwal. Tapi dikabari duluan jadi tidak masalah.", createdAt: now },
   { id: newId("rv"), profileId: "p_siti", reviewerName: "Rina Kusuma", rating: 5, jobCategory: "Deep Cleaning", comment: "Bersih banget, tim-nya ramah dan teliti sampai ke sela-sela.", createdAt: now },
     ];

  try {
       await users.insertMany(userDocs, { ordered: false });
       await profiles.insertMany(profileDocs, { ordered: false });
       await verifications.insertMany(verificationDocs, { ordered: false });
       await reviews.insertMany(reviewDocs, { ordered: false });
  } catch (err) {
       // code 11000 = duplicate key: kemungkinan invocation lain (cold start
     // serverless lain) sudah selesai seeding lebih dulu — aman diabaikan.
     const code = (err as { code?: number } | undefined)?.code;
       if (code !== 11000) throw err;
  }
}

// ---------------------------------------------------------------------------
// API publik — semua async karena membaca/menulis ke MongoDB.
// ---------------------------------------------------------------------------

export const store = {
   newId,

   async getUserByEmail(email: string): Promise<UserRecord | undefined> {
        await ensureSeeded();
        const users = await col<UserRecord>("users");
        const doc = await users.findOne({ email: email.toLowerCase() });
        if (doc) return doc;
        // Simpan email dengan huruf apa adanya di DB tapi cari case-insensitive:
     return (await users.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } })) ?? undefined;
   },
   async getUserById(userId: string): Promise<UserRecord | undefined> {
        await ensureSeeded();
        const users = await col<UserRecord>("users");
        return (await users.findOne({ id: userId })) ?? undefined;
   },
   async createUser(user: Omit<UserRecord, "id" | "createdAt">): Promise<UserRecord> {
        await ensureSeeded();
        const users = await col<UserRecord>("users");
        const record: UserRecord = { ...user, id: newId("u"), createdAt: new Date().toISOString() };
        await users.insertOne(record);
        return record;
   },
   async updateUser(userId: string, patch: Partial<UserRecord>): Promise<void> {
        const users = await col<UserRecord>("users");
        await users.updateOne({ id: userId }, { $set: patch });
   },

   async listProfiles(filter?: { category?: string; minRating?: number }): Promise<ProfessionalProfileRecord[]> {
        await ensureSeeded();
        const profiles = await col<ProfessionalProfileRecord>("profiles");
        const query: Record<string, unknown> = { status: { $in: ["aktif", "menunggu"] } };
        if (filter?.category) query.category = filter.category;
        if (filter?.minRating) query.ratingAvg = { $gte: filter.minRating };
        const docs = await profiles.find(query).sort({ skorKepercayaan: -1 }).toArray();
        return docs;
   },
   async getProfile(profileId: string): Promise<ProfessionalProfileRecord | undefined> {
        await ensureSeeded();
        const profiles = await col<ProfessionalProfileRecord>("profiles");
        return (await profiles.findOne({ id: profileId })) ?? undefined;
   },
   async getProfileByUser(userId: string): Promise<ProfessionalProfileRecord | undefined> {
        await ensureSeeded();
        const profiles = await col<ProfessionalProfileRecord>("profiles");
        return (await profiles.findOne({ userId })) ?? undefined;
   },
   async createProfile(profile: Omit<ProfessionalProfileRecord, "id">): Promise<ProfessionalProfileRecord> {
        const profiles = await col<ProfessionalProfileRecord>("profiles");
        const record: ProfessionalProfileRecord = { ...profile, id: newId("p") };
        await profiles.insertOne(record);
        return record;
   },
   async updateProfile(profileId: string, patch: Partial<ProfessionalProfileRecord>): Promise<void> {
        const profiles = await col<ProfessionalProfileRecord>("profiles");
        await profiles.updateOne({ id: profileId }, { $set: patch });
   },

   async listReviews(profileId: string): Promise<ReviewRecord[]> {
        const reviews = await col<ReviewRecord>("reviews");
        return reviews.find({ profileId }).toArray();
   },

   async createVerification(v: Omit<VerificationRecord, "id" | "createdAt">): Promise<VerificationRecord> {
        const verifications = await col<VerificationRecord>("verifications");
        const record: VerificationRecord = { ...v, id: newId("v"), createdAt: new Date().toISOString() };
        await verifications.insertOne(record);
        return record;
   },
   async listPendingVerifications(): Promise<VerificationRecord[]> {
        await ensureSeeded();
        const verifications = await col<VerificationRecord>("verifications");
        return verifications.find({ status: { $in: ["diajukan", "diproses"] } }).toArray();
   },
   async getVerification(verificationId: string): Promise<VerificationRecord | undefined> {
        await ensureSeeded();
        const verifications = await col<VerificationRecord>("verifications");
        return (await verifications.findOne({ id: verificationId })) ?? undefined;
   },
   async decideVerification(verificationId: string, decision: "disetujui" | "ditolak", note?: string): Promise<void> {
        const verifications = await col<VerificationRecord>("verifications");
        const patch: Partial<VerificationRecord> = { status: decision, decidedAt: new Date().toISOString() };
        if (note) patch.reviewerNote = note;
        await verifications.updateOne({ id: verificationId }, { $set: patch });
   },
   async updateVerification(verificationId: string, patch: Partial<VerificationRecord>): Promise<void> {
        const verifications = await col<VerificationRecord>("verifications");
        await verifications.updateOne({ id: verificationId }, { $set: patch });
   },

   async unlockContact(userId: string, profileId: string): Promise<ContactUnlockRecord> {
        const unlocks = await col<ContactUnlockRecord>("contactUnlocks");
        const existing = await unlocks.findOne({ userId, profileId });
        if (existing) return existing;
        const record: ContactUnlockRecord = { id: newId("cu"), userId, profileId, unlockedAt: new Date().toISOString() };
        await unlocks.insertOne(record);
        return record;
   },
   async hasUnlockedContact(userId: string, profileId: string): Promise<boolean> {
        const unlocks = await col<ContactUnlockRecord>("contactUnlocks");
        return (await unlocks.countDocuments({ userId, profileId })) > 0;
   },

   async createReport(r: Omit<ReportRecord, "id" | "createdAt" | "status">): Promise<ReportRecord> {
        const reports = await col<ReportRecord>("reports");
        const record: ReportRecord = { ...r, id: newId("rp"), status: "baru", createdAt: new Date().toISOString() };
        await reports.insertOne(record);
        return record;
   },
};
