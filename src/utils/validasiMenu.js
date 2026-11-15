// Validator bersama (prinsip DRY) untuk form Tambah & Ubah menu.
// Setiap fungsi murni: terima nilai, kembalikan '' bila valid atau pesan error.

export const validasiNama = (nilai) => {
  const v = String(nilai ?? '').trim();
  if (!v) return 'Nama menu wajib diisi.';
  if (v.length < 2) return 'Nama minimal 2 karakter.';
  return '';
};

export const validasiHarga = (nilai) => {
  const v = String(nilai ?? '').trim();
  if (!v) return 'Harga wajib diisi.';
  const n = Number(v);
  if (Number.isNaN(n)) return 'Harga harus berupa angka.';
  if (n <= 0) return 'Harga harus lebih dari 0.';
  return '';
};

export const validasiStok = (nilai) => {
  const v = String(nilai ?? '').trim();
  if (!v) return 'Stok wajib diisi.';
  const n = Number(v);
  if (!Number.isInteger(n)) return 'Stok harus bilangan bulat.';
  if (n < 0) return 'Stok tidak boleh negatif.';
  return '';
};

export const validasiFoto = (foto, wajib = true) => {
  if (wajib && !String(foto ?? '').trim()) return 'Foto menu wajib dipilih.';
  return '';
};

export const validasiStatus = (status) =>
  ['Aktif', 'Nonaktif'].includes(status || 'Aktif') ? '' : 'Status tidak valid.';

// Menghitung semua error sekaligus. Hasil: { nama, harga, stok, image, status } ('' = valid).
export function hitungError(values, { requirePhoto = true } = {}) {
  return {
    nama: validasiNama(values.nama),
    harga: validasiHarga(values.harga),
    stok: validasiStok(values.stok),
    image: validasiFoto(values.image, requirePhoto),
    status: validasiStatus(values.status),
  };
}

// Dipertahankan agar kompatibel: hanya mengembalikan field yang bermasalah.
export function validateMenu(values, options = {}) {
  const semua = hitungError(values, options);
  return Object.fromEntries(Object.entries(semua).filter(([, pesan]) => pesan));
}
