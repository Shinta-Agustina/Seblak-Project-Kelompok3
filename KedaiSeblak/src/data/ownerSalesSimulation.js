import { TOPPING_ITEMS, INITIAL_MENU_ITEMS } from './mockData';

const normalizeText = (value) =>
  String(value ?? '').trim().toLocaleLowerCase('id-ID').replace(/\s+/g, ' ');

const parseTanggalKasir = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (!value) return null;

  const raw = String(value).trim();
  let match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const parsed = new Date(year, month, day);

    return parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
      ? parsed
      : null;
  }

  match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const parsed = new Date(year, month, day);

    return parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
      ? parsed
      : null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    );
};

const toppingIds = new Set([
  ...TOPPING_ITEMS.map((item) => String(item.id)),
  ...INITIAL_MENU_ITEMS.map((item) => String(item.id)),
]);

const toppingNames = new Set([
  ...TOPPING_ITEMS.map((item) => normalizeText(item.nama)),
  ...INITIAL_MENU_ITEMS.map((item) => normalizeText(item.nama)),
]);

const isCanceled = (status) =>
  ['batal', 'cancel', 'canceled', 'dibatalkan', 'void'].includes(
    normalizeText(status)
  );

export function isTransaksiLunas(trx) {
  const status = normalizeText(trx?.status);

  return (
    !isCanceled(status) &&
    ['lunas', 'selesai', 'paid', 'success', 'berhasil'].includes(status)
  );
}

export function normalisasiTransaksiKasir(rawTransactions = []) {
  if (!Array.isArray(rawTransactions)) return [];

  return rawTransactions
    .filter((trx) => {
      const details = Array.isArray(trx?.items)
        ? trx.items
        : trx?.details;

      const tanggal = parseTanggalKasir(
        trx?.tanggal || trx?.date
      );

      return (
        Array.isArray(details) &&
        details.length > 0 &&
        tanggal instanceof Date
      );
    })
    .map((trx, index) => {
      const sourceItems = Array.isArray(trx.items)
        ? trx.items
        : trx.details;

      const items = sourceItems.map((item) => {
        const nama = item?.nama || item?.name || 'Item';
        const id = item?.id;

        const categoryRaw = normalizeText(
          item?.kategori || item?.category
        );

        const topping =
          (id != null && toppingIds.has(String(id))) ||
          toppingNames.has(normalizeText(nama)) ||
          categoryRaw === 'topping';

        const qtyValue = Number(item?.qty ?? 1);
        const qty =
          Number.isFinite(qtyValue) && qtyValue > 0
            ? qtyValue
            : 1;

        const hargaValue = Number(
          item?.harga ?? item?.price ?? 0
        );

        const harga = Number.isFinite(hargaValue)
          ? hargaValue
          : 0;

        const subtotalValue = Number(item?.subtotal);

        const subtotal = Number.isFinite(subtotalValue)
          ? subtotalValue
          : harga * qty;

        return {
          ...item,
          id,
          nama,
          name: nama,
          kategori: topping
            ? 'Topping'
            : item?.kategori || item?.category || 'Lainnya',
          qty,
          harga,
          subtotal,
        };
      });

      const totalValue = Number(trx?.total ?? 0);
      const tanggal = parseTanggalKasir(
        trx?.tanggal || trx?.date
      );

      const waktuRaw = String(
        trx?.waktu || trx?.time || '00:00'
      );

      const waktuMatch = waktuRaw.match(/(\d{1,2})[:.](\d{2})/);

      return {
        ...trx,
        id:
          trx?.id ||
          trx?.no ||
          trx?.orderNo ||
          `TRX-${index + 1}`,
        tanggal,
        waktu: waktuMatch
          ? `${String(Number(waktuMatch[1])).padStart(2, '0')}:${waktuMatch[2]}`
          : '00:00',
        status: isTransaksiLunas(trx)
          ? 'Lunas'
          : isCanceled(trx?.status)
            ? 'Batal'
            : String(trx?.status || 'Belum Lunas'),
        items,
        total: Number.isFinite(totalValue) ? totalValue : 0,
        metode: trx?.metode || trx?.method || 'Tunai',
        kasir: trx?.kasir || trx?.namaKasir || 'Kasir',
      };
    });
}

export function hitungToppingTerjual(transactions = []) {
  const hasil = {};

  transactions.forEach((trx) => {
    if (!isTransaksiLunas(trx)) return;

    (trx.items || []).forEach((item) => {
      if (item.kategori !== 'Topping') return;

      const nama = item.nama || item.name || 'Item';

      hasil[nama] =
        (hasil[nama] || 0) + Number(item.qty || 0);
    });
  });

  return Object.entries(hasil)
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

export function formatTanggalLokal(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}