
const DUMMY_MENU = [
  { name: 'Seblak Original', kategori: 'Menu Utama', price: 12000 },
  { name: 'Seblak Seafood', kategori: 'Menu Utama', price: 18000 },
  { name: 'Seblak Komplit', kategori: 'Menu Utama', price: 20000 },
  { name: 'Kerupuk', kategori: 'Topping', price: 2000 },
  { name: 'Makaroni', kategori: 'Topping', price: 2000 },
  { name: 'Bakso', kategori: 'Topping', price: 3000 },
  { name: 'Sosis', kategori: 'Topping', price: 3000 },
  { name: 'Seafood', kategori: 'Topping', price: 5000 },
];

const DUMMY_PAYMENT_METHODS = ['Tunai', 'QRIS', 'E-Wallet'];
const DUMMY_SOUPS = ['Kuah Original', 'Kuah Seblak', 'Kuah Jeletot'];

export function buatDataPenjualanDummy() {
  const hasil = [];
  const sekarang = new Date();

  for (let hariKe = 30; hariKe >= 0; hariKe--) {
    const tanggal = new Date(sekarang);
    tanggal.setDate(sekarang.getDate() - hariKe);
    tanggal.setHours(0, 0, 0, 0);

    const jumlahTransaksiHari =
      5 + ((tanggal.getDate() + tanggal.getMonth()) % 7);

    for (let i = 0; i < jumlahTransaksiHari; i++) {
      const seed =
        tanggal.getDate() * 13 + tanggal.getMonth() * 7 + i * 11;

      const itemUtama = DUMMY_MENU[seed % 3];
      const itemTopping = DUMMY_MENU[3 + (seed % 5)];
      const itemTambahan = DUMMY_MENU[3 + ((seed + 2) % 5)];

      const items = [
        { ...itemUtama, qty: 1 + (seed % 2) },
        { ...itemTopping, qty: 1 + (i % 3) },
      ];

      if (i % 2 === 0) {
        items.push({ ...itemTambahan, qty: 1 });
      }

      if (i % 3 === 0) {
        items.push({
          name: DUMMY_SOUPS[seed % DUMMY_SOUPS.length],
          kategori: 'Kuah',
          price: 3000,
          qty: 1,
        });
      }

      const total = items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );

      const jam = 10 + ((i * 2 + tanggal.getDate()) % 13);
      const menit = [0, 10, 15, 20, 30, 40, 45, 50][(i + seed) % 8];

      hasil.push({
        id: `SIM-${tanggal.getFullYear()}${String(
          tanggal.getMonth() + 1
        ).padStart(2, '0')}${String(tanggal.getDate()).padStart(
          2,
          '0'
        )}-${i + 1}`,
        date: tanggal.toLocaleDateString('id-ID'),
        time: `${String(jam).padStart(2, '0')}:${String(menit).padStart(
          2,
          '0'
        )}`,
        status: 'Lunas',
        items: items.map((item) => ({
          name: item.name,
          nama: item.name,
          kategori: item.kategori,
          category: item.kategori,
          price: item.price,
          harga: item.price,
          qty: item.qty,
          subtotal: item.price * item.qty,
        })),
        total,
        metode: DUMMY_PAYMENT_METHODS[seed % DUMMY_PAYMENT_METHODS.length],
        method: DUMMY_PAYMENT_METHODS[seed % DUMMY_PAYMENT_METHODS.length],
        tableNo:
          (i + seed) % 4 === 0
            ? 'Bungkus'
            : `Meja ${((i + seed) % 8) + 1}`,
        kuah: DUMMY_SOUPS[seed % DUMMY_SOUPS.length],
        pedas: String(seed % 5),
        sumber: 'SIMULASI',
      });
    }
  }

  return hasil;
}
