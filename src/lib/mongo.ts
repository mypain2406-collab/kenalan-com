import { MongoClient, type Db } from "mongodb";

/**
 * Koneksi MongoDB dengan pola caching yang direkomendasikan untuk lingkungan
  * serverless (Netlify Functions / Vercel): koneksi dibuat sekali dan disimpan
   * di variabel global supaya dipakai ulang antar-invocation dalam proses yang
    * sama, alih-alih membuka koneksi baru di setiap request.
     */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "kenalan";

if (!uri) {
  // Sengaja tidak throw di top-level import supaya build tidak gagal ketika
  // env var belum diset (mis. saat `next build` di CI sebelum secret
  // dikonfigurasi). Error baru muncul saat benar-benar mencoba konek.
  console.warn(
    "[kenalan] MONGODB_URI belum diset. Set env var ini (lihat .env.example) supaya aplikasi bisa terhubung ke database."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _kenalanMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(
      new Error("MONGODB_URI belum diset. Tambahkan environment variable ini sebelum menjalankan aplikasi.")
    );
  }
  const client = new MongoClient(uri);
  return client.connect();
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._kenalanMongoClientPromise) {
    global._kenalanMongoClientPromise = createClientPromise();
  }
  clientPromise = global._kenalanMongoClientPromise;
} else {
  clientPromise = createClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
