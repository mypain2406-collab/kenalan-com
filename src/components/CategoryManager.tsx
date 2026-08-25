"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Gagal menambahkan kategori");
      setCategories((c) => [...c, body.category].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Gagal menghapus kategori");
      }
      setCategories((c) => c.filter((cat) => cat.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleAdd} className="card p-4 flex gap-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kategori baru, mis. Tukang Las"
          className="flex-1 border border-border rounded-lg px-3.5 py-2.5 text-sm"
          required
          minLength={2}
          maxLength={60}
        />
        <button disabled={loading} className="bg-accent text-white font-semibold text-sm px-5 rounded-lg disabled:opacity-60">
          {loading ? "Menambahkan…" : "Tambah"}
        </button>
      </form>

      {error && <div className="text-sm text-danger">{error}</div>}

      <div className="card divide-y divide-bordersoft">
        {categories.length === 0 && <div className="p-4 text-sm text-inksoft">Belum ada kategori.</div>}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{c.name}</span>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deletingId === c.id}
              className="text-xs text-danger font-semibold disabled:opacity-60"
            >
              {deletingId === c.id ? "Menghapus…" : "Hapus"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
