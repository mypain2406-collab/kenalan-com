"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MasukPage() {
  const router = useRouter();
    const params = useSearchParams();
      const next = params.get("next") || "/";

        const [email, setEmail] = useState("ridwan@kenalan.com");
          const [password, setPassword] = useState("");
            const [error, setError] = useState<string | null>(null);
              const [loading, setLoading] = useState(false);

                async function handleSubmit(e: React.FormEvent) {
                    e.preventDefault();
                        setLoading(true);
                            setError(null);
                                try {
                                      const res = await fetch("/api/auth/login", {
                                              method: "POST",
                                                      headers: { "Content-Type": "application/json" },
                                                              body: JSON.stringify({ email, password }),
                                                                    });
                                                                          const body = await res.json();
                                                                                if (!res.ok) throw new Error(body.error ?? "Gagal masuk");
                                                                                      router.push(body.role === "admin" ? "/admin/verifikasi" : next);
                                                                                            router.refresh();
                                                                                                } catch (err) {
                                                                                                      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
                                                                                                          } finally {
                                                                                                                setLoading(false);
                                                                                                                    }
                                                                                                                      }
                                                                                                                      
                                                                                                                        return (
                                                                                                                            <main>
                                                                                                                                  <div className="max-w-md mx-auto px-6 py-16">
                                                                                                                                          <h1 className="font-display font-bold text-2xl mb-1">Masuk ke Kenalan.com</h1>
                                                                                                                                                  <p className="text-inksoft text-sm mb-7">Belum punya akun? <Link href="/daftar/pencari" className="text-accent font-semibold">Daftar sebagai pencari jasa</Link> atau <Link href="/daftar/mitra" className="text-accent font-semibold">jadi mitra</Link>.</p>
                                                                                                                                                  
                                                                                                                                                          <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
                                                                                                                                                                    <div>
                                                                                                                                                                                <label className="block text-xs text-inkfaint mb-1.5 font-medium">Email</label>
                                                                                                                                                                                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm" />
                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                <div>
                                                                                                                                                                                                                            <label className="block text-xs text-inkfaint mb-1.5 font-medium">Kata sandi</label>
                                                                                                                                                                                                                                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm" />
                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                            {error && <div className="text-sm text-danger">{error}</div>}
                                                                                                                                                                                                                                                                      <button disabled={loading} className="bg-accent text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-60">
                                                                                                                                                                                                                                                                                  {loading ? "Memproses…" : "Masuk"}
                                                                                                                                                                                                                                                                                            </button>
                                                                                                                                                                                                                                                                                                      <div className="text-xs text-inkfaint bg-surface2 rounded-lg p-3 leading-relaxed">
                                                                                                                                                                                                                                                                                                                  <b>Akun demo</b> (kata sandi: <span className="font-mono">Kenalan123!</span>)<br />
                                                                                                                                                                                                                                                                                                                              Admin: admin@kenalan.com · Mitra terverifikasi: ridwan@kenalan.com · Mitra baru: yusuf@kenalan.com
                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                </form>
                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                          </main>
                                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                            
