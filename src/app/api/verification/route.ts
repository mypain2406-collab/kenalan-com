import { NextRequest, NextResponse } from "next/server";
import { store, type VerificationDocumentRecord } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from "@/lib/validation";
import { rateLimit, clientKeyFromRequest } from "@/lib/rateLimit";

/**
 * Menerima unggahan dokumen verifikasi (KTP, selfie liveness, portofolio) dan
 * mensimulasikan pemeriksaan otomatis (face-match, deteksi dokumen) yang di
 * produksi dilakukan oleh penyedia KYC pihak ketiga (lihat dokumen spesifikasi
                                                       * bagian 04 "Verifikasi berlapis").
 *
 * Berkas disimpan sebagai base64 di dalam dokumen MongoDB (bukan disk lokal)
 * karena platform serverless (Netlify Functions) tidak punya filesystem yang
 * persisten antar-invocation. Untuk produksi sungguhan, ganti dengan object
 * storage terenkripsi terpisah (lihat dokumen spesifikasi bagian "Keamanan &
 * privasi data") — endpoint ini tidak pernah mengekspos dokumen lewat URL
 * publik; hanya diambil lewat rute yang memeriksa sesi admin.
 */

function mockFaceMatch(): { score: number; flagged: boolean } {
    const score = Math.round((90 + Math.random() * 9.5) * 10) / 10;
    const flagged = Math.random() < 0.15;
    return { score, flagged };
  }

export async function POST(req: NextRequest) {
    const session = getSession();
    if (!session) {
          return NextResponse.json({ error: "Anda perlu masuk sebagai mitra untuk mengunggah dokumen." }, { status: 401 });
        }

    const limit = rateLimit(clientKeyFromRequest(req, `verif:${session.userId}`), 15, 60);
    if (!limit.allowed) {
          return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 });
        }

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Data unggahan tidak valid" }, { status: 400 });

    const stage = String(form.get("stage") ?? "");
    const verificationId = form.get("verificationId") ? String(form.get("verificationId")) : undefined;
    const file = form.get("file");

    if (!["ktp", "selfie", "alamat", "portofolio"].includes(stage)) {
          return NextResponse.json({ error: "Tahap verifikasi tidak dikenali" }, { status: 400 });
        }

    let document: VerificationDocumentRecord | undefined;

    if (stage !== "alamat") {
          if (!(file instanceof File)) {
                  return NextResponse.json({ error: "Berkas wajib diunggah untuk tahap ini" }, { status: 400 });
                }
          if (!ALLOWED_UPLOAD_MIME.has(file.type)) {
                  return NextResponse.json({ error: "Format berkas harus JPG, PNG, atau WEBP" }, { status: 400 });
                }
          if (file.size > MAX_UPLOAD_BYTES) {
                  return NextResponse.json({ error: "Ukuran berkas maksimal 5 MB" }, { status: 400 });
                }

          const bytes = Buffer.from(await file.arrayBuffer());

          document = {
                  type: stage === "ktp" ? "ktp" : stage === "selfie" ? "selfie" : "portfolio",
                  filename: file.name,
                  dataBase64: bytes.toString("base64"),
                  mimeType: file.type,
                  sizeBytes: file.size,
                };
        }

    let record = verificationId ? await store.getVerification(verificationId) : undefined;

    if (stage === "ktp") {
          record = await store.createVerification({
                  userId: session.userId,
                  jenis: "identitas",
                  status: "diajukan",
                  documents: document ? [document] : [],
                });
          return NextResponse.json({
                  ok: true,
                  verificationId: record.id,
                  extracted: {
                            nama: session.name.toUpperCase(),
                            nik: `32${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} •• •••• •• ${String(Math.floor(Math.random() * 90) + 10)}`,
                          },
                });
        }

    if (stage === "selfie") {
          if (!record) {
                  return NextResponse.json({ error: "Unggah KTP terlebih dahulu sebelum verifikasi wajah" }, { status: 400 });
                }
          const { score, flagged } = mockFaceMatch();
          const documents = [...record.documents, document!];
          await store.updateVerification(record.id, {
                  documents,
                  faceMatchScore: score,
                  documentAuthentic: !flagged,
                  status: "diproses",
                  riskFlag: flagged
                    ? "Foto KTP terdeteksi kemungkinan hasil foto ulang dari layar (bukan dokumen fisik langsung). Akan diperiksa manual oleh tim kami."
                    : undefined,
                });
          return NextResponse.json({ ok: true, verificationId: record.id, faceMatchScore: score, flagged });
        }

    if (stage === "alamat") {
          const addressVerification = await store.createVerification({
                  userId: session.userId,
                  jenis: "alamat",
                  status: "diajukan",
                  documents: [],
                });
          return NextResponse.json({ ok: true, verificationId: addressVerification.id });
        }

    if (stage === "portofolio") {
          const profile = await store.getProfileByUser(session.userId);
          if (profile && document) {
                  const portfolio = [...profile.portfolio, { caption: document.filename, colorFrom: "#DCE4F5", colorTo: "#B9C7E8" }];
                  await store.updateProfile(profile.id, { portfolio });
                }
          return NextResponse.json({ ok: true });
        }

    return NextResponse.json({ error: "Tahap tidak dikenali" }, { status: 400 });
  }
