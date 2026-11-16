// Format tampilan nomor transaksi agar ringkas dan seragam:
//   TRX-YYMMDD-HHMMSS   contoh: TRX-261116-194312
// Nilai asli di database tidak diubah, hanya tampilannya.

const pad = (n) => String(n).padStart(2, '0');

const dariTanggal = (d) =>
  `TRX-${pad(d.getUTCFullYear() % 100)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
  `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;

export function formatNomorTransaksi(value) {
  const raw = String(value ?? '').trim();

  if (!raw || raw === '-') return '-';

  const teks = raw.replace(/^#/, '');

  // Format baru/lama: TRX-YYYYMMDD-HHMMSS-XXX
  let m = /^TRX-(\d{2})(\d{2})(\d{2})(\d{2})-(\d{6})(?:-[A-Z0-9]+)?$/i.exec(teks);
  if (m) return `TRX-${m[2]}${m[3]}${m[4]}-${m[5]}`;

  // Format lama: TRX-<milidetik> (13 digit)
  m = /^TRX-(\d{13})$/i.exec(teks);
  if (m) {
    const wib = new Date(Number(m[1]) + 7 * 60 * 60 * 1000);
    return dariTanggal(wib);
  }

  // UUID mentah dari database
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(teks)) {
    return `TRX-${teks.slice(0, 6).toUpperCase()}`;
  }

  return raw.startsWith('#') ? raw : teks;
}

export default formatNomorTransaksi;
