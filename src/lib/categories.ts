/**
 * Modul terpisah tanpa dependensi Node.js (fs/path/crypto) supaya bisa
 * di-import dengan aman dari Client Component (mis. form wizard pendaftaran
 * mitra), sementara src/lib/db.ts (yang memakai modul Node) tetap hanya
 * jalan di sisi server.
   */
export const CATEGORIES = [
  "Tukang Bangunan",
  "Instalasi Listrik",
  "Ledeng & Pipa",
  "Kebersihan Rumah",
  "Tukang Cat",
  "Servis AC",
  "Tukang Kayu",
  "Tukang Taman",
] as const;
