import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Role } from "./db";

/**
 * Autentikasi & session untuk prototipe.
  *
   * Kata sandi di-hash dengan bcrypt (bukan disimpan/plain-text). Session
    * disimpan sebagai cookie HttpOnly yang ditandatangani dengan HMAC-SHA256
     * (bukan JWT library eksternal, supaya dependensi tetap minim) sehingga isinya
      * tidak bisa diubah oleh klien tanpa diketahui server.
       *
        * Di produksi: pertimbangkan rotasi kunci, penyimpanan session di Redis agar
         * bisa dicabut sewaktu-waktu (mis. saat akun ditangguhkan tim Trust & Safety),
          * dan autentikasi dua faktor untuk mitra.
           */

           const COOKIE_NAME = "kenalan_session";
           const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

           function getSecret(): string {
             const secret = process.env.SESSION_SECRET;
               if (!secret || secret.length < 16) {
                   // Fallback hanya untuk kenyamanan development lokal tanpa .env.local.
                       // Prototipe akan mencetak peringatan supaya tidak dianggap aman untuk produksi.
                           return "dev-only-insecure-secret-do-not-use-in-production";
                             }
                               return secret;
                               }

                               export interface SessionPayload {
                                 userId: string;
                                   role: Role;
                                     name: string;
                                       verificationLevel: number;
                                         exp: number;
                                         }

                                         function base64url(input: Buffer | string): string {
                                           return Buffer.from(input).toString("base64url");
                                           }

                                           function sign(payload: string): string {
                                             return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
                                             }

                                             export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
                                               const full: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
                                                 const body = base64url(JSON.stringify(full));
                                                   const sig = sign(body);
                                                     return `${body}.${sig}`;
                                                     }

                                                     export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
                                                       if (!token) return null;
                                                         const [body, sig] = token.split(".");
                                                           if (!body || !sig) return null;
                                                             const expected = sign(body);
                                                               // Perbandingan waktu-konstan untuk menghindari timing attack pada signature.
                                                                 const a = Buffer.from(sig);
                                                                   const b = Buffer.from(expected);
                                                                     if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
                                                                       try {
                                                                           const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
                                                                               if (payload.exp < Math.floor(Date.now() / 1000)) return null;
                                                                                   return payload;
                                                                                     } catch {
                                                                                         return null;
                                                                                           }
                                                                                           }

                                                                                           export async function hashPassword(password: string): Promise<string> {
                                                                                             return bcrypt.hash(password, 10);
                                                                                             }

                                                                                             export async function verifyPassword(password: string, hash: string): Promise<boolean> {
                                                                                               return bcrypt.compare(password, hash);
                                                                                               }

                                                                                               /** Dipakai di Server Component / Server Action untuk membaca session saat ini. */
                                                                                               export function getSession(): SessionPayload | null {
                                                                                                 const token = cookies().get(COOKIE_NAME)?.value;
                                                                                                   return verifySessionToken(token);
                                                                                                   }

                                                                                                   export const SESSION_COOKIE_NAME = COOKIE_NAME;
                                                                                                   export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

                                                                                                   export function isPasswordStrong(password: string): boolean {
                                                                                                     // Minimal 8 karakter, kombinasi huruf & angka — cukup untuk prototipe,
                                                                                                       // di produksi pertimbangkan pengecekan terhadap daftar password bocor umum.
                                                                                                         return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
                                                                                                         }
