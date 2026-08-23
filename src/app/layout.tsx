import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenalan.com — Jasa profesional terverifikasi",
    description: "Temukan tukang dan tenaga profesional yang identitasnya sudah diverifikasi berlapis.",
    };

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
          <html lang="id">
                <head>
                        {/*
                                  Font dimuat lewat tag <link> biasa (bukan next/font) supaya build
                                            tidak bergantung pada akses jaringan saat proses build — next/font
                                                      mengunduh berkas font pada waktu build, yang gagal di lingkungan
                                                                tanpa akses ke fonts.googleapis.com. Saat dijalankan sungguhan,
                                                                          browser pengguna yang akan mengambil font ini secara normal.
                                                                                  */}
                                                                                          <link rel="preconnect" href="https://fonts.googleapis.com" />
                                                                                                  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                                                                                                          <link
                                                                                                                    href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
                                                                                                                              rel="stylesheet"
                                                                                                                                      />
                                                                                                                                            </head>
                                                                                                                                                  <body className="font-sans bg-bg text-ink">{children}</body>
                                                                                                                                                      </html>
                                                                                                                                                        );
                                                                                                                                                        }
