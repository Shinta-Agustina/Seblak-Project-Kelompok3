// =====================================================================
// Edge Function: manage-cashier
// Lokasi : supabase/functions/manage-cashier/index.ts
// Deploy : supabase functions deploy manage-cashier
//
// Mengikuti cara panggil src/services/kasirService.js:
//
//   action: "create"          { nama, username, email, no_telepon?, password, status? }
//                             => { ok, cashier }
//   action: "update"          { cashierId, nama?, no_telepon?, email?, status?, is_utama? }
//                             => { ok, cashier }
//   action: "update_password" { cashierId, password }
//                             => { ok, success: true }
//   action: "delete"          { cashierId }   (hanya kasir tanpa riwayat apa pun)
//                             => { ok, success: true }
//
// Hanya OWNER aktif yang boleh memanggil. Service role dipakai di sisi
// server (env SUPABASE_SERVICE_ROLE_KEY tersedia otomatis); jangan pernah
// menaruhnya di aplikasi. Belum diuji di proyek asli; coba dengan akun uji.
//
// Aturan username/email mengikuti Authservice.toEmail():
//   login = username@kedaiseblak.com, atau email lengkap bila username
//   sudah memuat "@".
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_DOMAIN = "kedaiseblak.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9._@+-]{3,60}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KOLOM_KASIR =
  "id, kode_kasir, nama, username, no_telepon, status, is_utama, created_at, updated_at";

type Admin = ReturnType<typeof createClient>;
// deno-lint-ignore no-explicit-any
type Body = Record<string, any>;

const teks = (v: unknown) => String(v ?? "").trim();
const atauNull = (v: unknown) => (teks(v) === "" ? null : teks(v));

// kebalikan toEmail(): "budi@kedaiseblak.com" -> "budi"; email lain tetap utuh
const usernameDariEmail = (email: string) =>
  email.endsWith(`@${EMAIL_DOMAIN}`) ? email.split("@")[0] : email;

const statusValid = (v: unknown): v is "aktif" | "nonaktif" =>
  v === "aktif" || v === "nonaktif";

async function aturLogin(admin: Admin, id: string, status: "aktif" | "nonaktif") {
  return await admin.auth.admin.updateUserById(id, {
    ban_duration: status === "nonaktif" ? "876000h" : "none",
  });
}

async function ambilKasir(admin: Admin, id: string) {
  const { data } = await admin.from("kasir").select(KOLOM_KASIR).eq("id", id).maybeSingle();
  return data;
}

// Kode kasir berikutnya, mis. KSR-004
async function kodeBerikutnya(admin: Admin) {
  const { data } = await admin.from("kasir").select("kode_kasir").like("kode_kasir", "KSR-%");
  const maks = (data ?? []).reduce((m: number, r: { kode_kasir: string | null }) => {
    const n = parseInt((r.kode_kasir ?? "").replace("KSR-", ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `KSR-${String(maks + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------
// create
// ---------------------------------------------------------------------
async function buat(admin: Admin, b: Body) {
  const nama = teks(b.nama);
  const username = teks(b.username).toLowerCase();
  const email = (teks(b.email) || `${username}@${EMAIL_DOMAIN}`).toLowerCase();
  const password = String(b.password ?? "");
  const status = statusValid(b.status) ? b.status : "aktif";

  if (nama === "") return json({ error: "Nama kasir wajib diisi" }, 400);
  if (!USERNAME_RE.test(username)) {
    return json({ error: "Username 3-60 karakter (huruf kecil, angka, . _ - @ +)" }, 400);
  }
  if (!EMAIL_RE.test(email)) return json({ error: "Email tidak valid" }, 400);
  if (password.length < 6) return json({ error: "Password minimal 6 karakter" }, 400);

  const { data: dipakai } = await admin
    .from("kasir").select("id").eq("username", username).maybeSingle();
  if (dipakai) return json({ error: "Username sudah dipakai" }, 409);

  const { data: dibuat, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama },
  });
  if (errAuth || !dibuat?.user) {
    const sudahAda = /already|registered|exists/i.test(errAuth?.message ?? "");
    return json(
      { error: sudahAda ? "Email sudah terdaftar" : `Gagal membuat akun: ${errAuth?.message}` },
      sudahAda ? 409 : 400,
    );
  }

  const id = dibuat.user.id;
  let galat: { code?: string; message: string } | null = null;

  // Ulangi bila kode kasir bentrok karena dua owner menambah bersamaan
  for (let percobaan = 0; percobaan < 3; percobaan++) {
    const { error } = await admin.from("kasir").insert({
      id,
      kode_kasir: await kodeBerikutnya(admin),
      nama,
      username,
      no_telepon: atauNull(b.no_telepon),
      is_utama: b.is_utama === true,
      status,
    });
    galat = error;
    if (!error || error.code !== "23505" || !/kode_kasir/.test(error.message)) break;
  }

  if (galat) {
    await admin.auth.admin.deleteUser(id); // jangan tinggalkan akun yatim
    return json(
      {
        error: galat.code === "23505"
          ? "Username atau kode kasir sudah dipakai"
          : `Gagal menyimpan data kasir: ${galat.message}`,
      },
      galat.code === "23505" ? 409 : 400,
    );
  }

  if (status === "nonaktif") await aturLogin(admin, id, status);

  // Baris profiles dibuat otomatis oleh trigger sync_kasir_ke_profiles
  return json({ ok: true, cashier: await ambilKasir(admin, id) });
}

// ---------------------------------------------------------------------
// update
// ---------------------------------------------------------------------
async function ubah(admin: Admin, b: Body) {
  const id = teks(b.cashierId);
  if (!UUID_RE.test(id)) return json({ error: "ID kasir tidak valid" }, 400);

  const ada = await ambilKasir(admin, id);
  if (!ada) return json({ error: "Kasir tidak ditemukan" }, 404);

  // deno-lint-ignore no-explicit-any
  const patch: Record<string, any> = {};

  if (b.nama !== undefined) {
    const nama = teks(b.nama);
    if (nama === "") return json({ error: "Nama kasir wajib diisi" }, 400);
    patch.nama = nama;
  }
  if (b.no_telepon !== undefined) patch.no_telepon = atauNull(b.no_telepon);
  if (b.is_utama !== undefined) patch.is_utama = b.is_utama === true;

  if (b.status !== undefined) {
    if (!statusValid(b.status)) {
      return json({ error: "Status harus 'aktif' atau 'nonaktif'" }, 400);
    }
    patch.status = b.status;
  }

  if (b.email !== undefined) {
    const email = teks(b.email).toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ error: "Email tidak valid" }, 400);

    const username = usernameDariEmail(email);
    const { data: bentrok } = await admin
      .from("kasir").select("id").eq("username", username).neq("id", id).maybeSingle();
    if (bentrok) return json({ error: "Username/email sudah dipakai kasir lain" }, 409);

    const { error } = await admin.auth.admin.updateUserById(id, {
      email,
      email_confirm: true,
    });
    if (error) return json({ error: `Gagal mengubah email: ${error.message}` }, 400);
    patch.username = username;
  }

  if (Object.keys(patch).length === 0) {
    return json({ error: "Tidak ada perubahan data" }, 400);
  }

  const { error: errUpdate } = await admin.from("kasir").update(patch).eq("id", id);
  if (errUpdate) {
    return json(
      {
        error: errUpdate.code === "23505"
          ? "Username atau kode kasir sudah dipakai"
          : `Gagal menyimpan perubahan: ${errUpdate.message}`,
      },
      errUpdate.code === "23505" ? 409 : 400,
    );
  }

  if (patch.status) {
    const { error } = await aturLogin(admin, id, patch.status);
    if (error) {
      return json(
        { error: `Status data sudah diubah, tetapi pengaturan login gagal: ${error.message}` },
        500,
      );
    }
  }

  return json({ ok: true, cashier: await ambilKasir(admin, id) });
}

// ---------------------------------------------------------------------
// update_password
// ---------------------------------------------------------------------
async function ubahSandi(admin: Admin, b: Body) {
  const id = teks(b.cashierId);
  const password = String(b.password ?? "");

  if (!UUID_RE.test(id)) return json({ error: "ID kasir tidak valid" }, 400);
  if (password.length < 6) return json({ error: "Password minimal 6 karakter" }, 400);
  if (!(await ambilKasir(admin, id))) return json({ error: "Kasir tidak ditemukan" }, 404);

  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return json({ error: `Gagal mengganti password: ${error.message}` }, 400);
  return json({ ok: true, success: true });
}

// ---------------------------------------------------------------------
// delete: hanya untuk kasir yang belum punya riwayat apa pun.
// Untuk kasir yang sudah berhenti, gunakan status "nonaktif".
// ---------------------------------------------------------------------
async function hapus(admin: Admin, b: Body) {
  const id = teks(b.cashierId);
  if (!UUID_RE.test(id)) return json({ error: "ID kasir tidak valid" }, 400);
  if (!(await ambilKasir(admin, id))) return json({ error: "Kasir tidak ditemukan" }, 404);

  // deno-lint-ignore no-explicit-any
  const hitung = (tabel: string, filter: (q: any) => any) =>
    filter(admin.from(tabel).select("id", { count: "exact", head: true }));

  const [shift, mutasi, pengeluaran, permintaan] = await Promise.all([
    hitung("shift_kasir", (q) => q.eq("kasir_id", id)),
    hitung("mutasi_stok", (q) => q.eq("dibuat_oleh", id)),
    hitung("pengeluaran", (q) => q.eq("dibuat_oleh", id)),
    hitung("permintaan_stok", (q) =>
      q.or(`diajukan_oleh.eq.${id},diproses_oleh.eq.${id}`)),
  ]);

  if ([shift, mutasi, pengeluaran, permintaan].some((r) => (r.count ?? 0) > 0)) {
    return json(
      { error: "Kasir ini sudah punya riwayat shift/transaksi. Nonaktifkan saja, jangan dihapus." },
      409,
    );
  }

  const { error: e1 } = await admin.from("kasir").delete().eq("id", id);
  if (e1) return json({ error: `Gagal menghapus data kasir: ${e1.message}` }, 409);

  const { error: e2 } = await admin
    .from("profiles").delete().eq("id", id).eq("role", "kasir");
  if (e2) return json({ error: `Gagal menghapus profil: ${e2.message}` }, 409);

  await admin.from("users").delete().eq("id", id); // tabel lama; abaikan bila kosong

  const { error: e3 } = await admin.auth.admin.deleteUser(id);
  if (e3) return json({ error: `Gagal menghapus akun login: ${e3.message}` }, 500);

  return json({ ok: true, success: true });
}

// ---------------------------------------------------------------------
// Pintu masuk + pengecekan owner
// ---------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Gunakan metode POST" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Konfigurasi server belum lengkap" }, 500);

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Belum login" }, 401);

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: sesi, error: errSesi } = await admin.auth.getUser(token);
    if (errSesi || !sesi?.user) return json({ error: "Sesi tidak valid" }, 401);

    const { data: profil } = await admin
      .from("profiles").select("role,status").eq("id", sesi.user.id).maybeSingle();
    if (!profil || profil.role !== "owner" || profil.status !== "aktif") {
      return json({ error: "Hanya owner yang dapat mengelola kasir" }, 403);
    }

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body harus berupa JSON" }, 400);
    }

    switch (body.action) {
      case "create":          return await buat(admin, body);
      case "update":          return await ubah(admin, body);
      case "update_password": return await ubahSandi(admin, body);
      case "delete":          return await hapus(admin, body);
      default:                return json({ error: "action tidak dikenal" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Terjadi kesalahan pada server" }, 500);
  }
});
