import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decisionSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = getSession();
    if (!session || session.role !== "admin") {
          return NextResponse.json({ error: "Akses ditolak. Hanya tim Trust & Safety yang dapat memutuskan verifikasi." }, { status: 403 });
        }

    const body = await req.json().catch(() => null);
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
          return NextResponse.json({ error: "Data keputusan tidak valid" }, { status: 400 });
        }

    const verification = await store.getVerification(params.id);
    if (!verification) {
          return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
        }

    await store.decideVerification(verification.id, parsed.data.decision, parsed.data.note);

    if (parsed.data.decision === "disetujui") {
          const profile = await store.getProfileByUser(verification.userId);
          const applicant = await store.getUserById(verification.userId);
          if (profile) {
                  const badges = { ...profile.badges };
                  if (verification.jenis === "identitas") badges.identitas = true;
                  if (verification.jenis === "alamat") badges.alamat = true;
                  if (verification.jenis === "keahlian") badges.keahlian = true;

                  const anyVerified = badges.identitas || badges.alamat || badges.keahlian;
                  await store.updateProfile(profile.id, {
                            badges,
                            status: badges.identitas ? "aktif" : profile.status,
                            skorKepercayaan: Math.min(100, profile.skorKepercayaan + 25),
                            trustLabel: anyVerified ? "Terpercaya" : profile.trustLabel,
                          });
                }
          if (applicant) {
                  const nextLevel = Math.min(3, applicant.verificationLevel + 1) as 0 | 1 | 2 | 3;
                  await store.updateUser(applicant.id, { verificationLevel: nextLevel });
                }
        } else if (parsed.data.decision === "ditolak") {
          const profile = await store.getProfileByUser(verification.userId);
          if (profile && verification.jenis === "identitas") {
                  await store.updateProfile(profile.id, { status: "ditolak" });
                }
        }

    return NextResponse.json({ ok: true });
  }
