import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";
import AdminSidebar from "@/components/AdminSidebar";
import MitraForm from "@/components/MitraForm";

export const dynamic = "force-dynamic";

export default async function AdminMitraEditPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/masuk?next=/admin/mitra");
  if (session.role !== "admin") redirect("/");

  const profile = await store.getProfile(params.id);
  if (!profile) return notFound();
  const user = await store.getUserById(profile.userId);
  const [categories, queue] = await Promise.all([store.listCategories(), store.listPendingVerifications()]);

  // Kategori profil mitra ini mungkin sudah dihapus dari daftar aktif —
  // tetap tampilkan sebagai opsi supaya tidak diam-diam berubah saat disimpan.
  const categoryNames = categories.map((c) => c.name);
  if (!categoryNames.includes(profile.category)) categoryNames.unshift(profile.category);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="mitra" badgeCount={queue.length} />

      <div className="flex-1">
        <div className="px-8 py-6 border-b border-border bg-surface">
          <h1 className="font-display font-bold text-xl">Edit Profil Mitra</h1>
          <p className="text-sm text-inksoft mt-1">{user?.name ?? "(pengguna tidak ditemukan)"}</p>
        </div>

        <div className="p-8 max-w-xl">
          <MitraForm
            mode="edit"
            profileId={profile.id}
            categories={categoryNames}
            initial={{
              name: user?.name ?? "",
              phone: user?.phone ?? "",
              category: profile.category,
              city: profile.city,
              bio: profile.bio,
              yearsExperience: profile.yearsExperience,
              priceFrom: profile.priceFrom,
              status: profile.status,
              badgeIdentitas: profile.badges.identitas,
              badgeAlamat: profile.badges.alamat,
              badgeKeahlian: profile.badges.keahlian,
              trustLabel: profile.trustLabel,
              skorKepercayaan: profile.skorKepercayaan,
            }}
          />
        </div>
      </div>
    </div>
  );
}
