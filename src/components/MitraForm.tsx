"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileStatus = "menunggu" | "aktif" | "ditangguhkan" | "ditolak";
type TrustLabel = "Baru" | "Terpercaya" | "Pilihan Utama";

interface MitraFormValues {
  name: string;
  phone: string;
  category: string;
  city: string;
  bio: string;
  yearsExperience: number;
  priceFrom: number;
  status: ProfileStatus;
  badgeIdentitas: boolean;
  badgeAlamat: boolean;
  badgeKeahlian: boolean;
  trustLabel: TrustLabel;
  skorKepercayaan: number;
}

const DEFAULTS: MitraFormValues = {
  name: "",
  phone: "",
  category: "",
  city: "",
  bio: "",
  yearsExperience: 1,
  priceFrom: 100000,
  status: "menunggu",
  badgeIdentitas: false,
  badgeAlamat: false,
  badgeKeahlian: false,
  trustLabel: "Baru",
  skorKepercayaan: 20,
};

export default function MitraForm({
  mode,
  profileId,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  profileId?: string;
  categories: string[];
  initial?: Partial<MitraFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<MitraFormValues>({
    ...DEFAULTS,
    ...initial,
    category: initial?.category ?? categories[0] ?? "",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof MitraFormValues>(key: K, value: MitraFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = mode === "create" ? { ...values, email, password } : values;
      const url = mode === "create" ? "/api/admin/profiles" : `/api/admin/profiles/${profileId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan");
      router.push("/admin/mitra");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
      <div>
        <label className="block text-xs text-inkfaint mb-1.5 font-medium">Nama lengkap</label>
        <input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
        />
      </div>

      {mode === "create" && (
        <>
          <div>
            <label className="block text-xs text-inkfaint mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-inkfaint mb-1.5 font-medium">Kata sandi awal</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs text-inkfaint mb-1.5 font-medium">Nomor HP</label>
        <input
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
          placeholder="0812xxxxxxxx"
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-inkfaint mb-1.5 font-medium">Kategori jasa</label>
        <select
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-inkfaint mb-1.5 font-medium">Kota / domisili</label>
        <input
          value={values.city}
          onChange={(e) => set("city", e.target.value)}
          required
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-inkfaint mb-1.5 font-medium">Lama pengalaman (tahun)</label>
          <input
            type="number"
            min={0}
            max={60}
            value={values.yearsExperience}
            onChange={(e) => set("yearsExperience", Number(e.target.value))}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-inkfaint mb-1.5 font-medium">Tarif mulai dari (Rp)</label>
          <input
            type="number"
            min={0}
            value={values.priceFrom}
            onChange={(e) => set("priceFrom", Number(e.target.value))}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-inkfaint mb-1.5 font-medium">Bio / pengalaman</label>
        <textarea
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          required
          rows={3}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-inkfaint mb-1.5 font-medium">Status profil</label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as ProfileStatus)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
        >
          <option value="menunggu">Menunggu</option>
          <option value="aktif">Aktif (tayang di pencarian publik)</option>
          <option value="ditangguhkan">Ditangguhkan</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-inkfaint mb-2 font-medium">Lencana verifikasi</label>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.badgeIdentitas}
              onChange={(e) => set("badgeIdentitas", e.target.checked)}
              className="accent-accent"
            />
            Identitas
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.badgeAlamat}
              onChange={(e) => set("badgeAlamat", e.target.checked)}
              className="accent-accent"
            />
            Alamat
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.badgeKeahlian}
              onChange={(e) => set("badgeKeahlian", e.target.checked)}
              className="accent-accent"
            />
            Keahlian
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-inkfaint mb-1.5 font-medium">Label kepercayaan</label>
          <select
            value={values.trustLabel}
            onChange={(e) => set("trustLabel", e.target.value as TrustLabel)}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
          >
            <option value="Baru">Baru</option>
            <option value="Terpercaya">Terpercaya</option>
            <option value="Pilihan Utama">Pilihan Utama</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-inkfaint mb-1.5 font-medium">Skor kepercayaan (0-100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={values.skorKepercayaan}
            onChange={(e) => set("skorKepercayaan", Number(e.target.value))}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <button disabled={loading} className="bg-accent text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-60">
        {loading ? "Menyimpan…" : mode === "create" ? "Buat Mitra" : "Simpan Perubahan"}
      </button>
    </form>
  );
}
