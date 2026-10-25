import { TOPPING_ITEMS } from './mockData';

// Data dummy komprehensif khas Kedai Seblak Prasmanan untuk Owner Portal

export const WARNA_SEBLAK = {
  merahCabe: '#C62828',
  merahTua: '#52141D',
  merahPedas: '#D32F2F',
  merahMuda: '#FBEAEC',
  oranyeRempah: '#EA580C',
  oranyeMuda: '#FFEDD5',
  kuningKencur: '#F59E0B',
  kuningMuda: '#FEF3C7',
  hijauAman: '#168653',
  hijauMuda: '#DCFCE7',
  latar: '#F8F5F2',
  kartu: '#FFFFFF',
  teksUtama: '#2C1810',
  teksSekunder: '#78665E',
  garis: '#EFE7E2',
  abuMuda: '#F4EFEB',
};

export const DASHBOARD_METRICS = {
  omzetHariIni: {
    nilai: 2450000,
    persenKemarin: 14.2,
    naik: true,
    kemarin: 2145000,
  },
  jumlahTransaksi: {
    nilai: 86,
    persenKemarin: 8.8,
    naik: true,
    kemarin: 79,
  },
  rataRataTransaksi: {
    nilai: 28488,
    persenKemarin: 4.9,
    naik: true,
    kemarin: 27150,
  },
  pesananAktif: {
    nilai: 4,
    detail: '2 proses masak, 2 siap saji',
  },
};

export const WEEKLY_SALES_DATA = [
  { hari: 'Min 18', omzet: 1550000, porsi: 54, persenMax: 63 },
  { hari: 'Sen 19', omzet: 1680000, porsi: 59, persenMax: 69 },
  { hari: 'Sel 20', omzet: 1620000, porsi: 57, persenMax: 66 },
  { hari: 'Rab 21', omzet: 1800000, porsi: 63, persenMax: 73 },
  { hari: 'Kam 22', omzet: 1950000, porsi: 68, persenMax: 80 },
  { hari: 'Jum 23', omzet: 2145000, porsi: 75, persenMax: 88 },
  { hari: 'Sab 24', omzet: 2450000, porsi: 86, persenMax: 100, peak: true },
];

export const HOURLY_SALES_DATA = [
  { jam: '10.00–12.00', jumlah: 24, porsi: 48, peak: false, label: 'Siang Awal' },
  { jam: '12.00–14.00', jumlah: 58, porsi: 120, peak: true, label: 'Makan Siang' },
  { jam: '14.00–16.00', jumlah: 32, porsi: 65, peak: false, label: 'Sore Santai' },
  { jam: '16.00–18.00', jumlah: 45, porsi: 92, peak: false, label: 'Pulang Kerja' },
  { jam: '18.00–20.00', jumlah: 64, porsi: 135, peak: true, label: 'Makan Malam' },
  { jam: '20.00–22.00', jumlah: 28, porsi: 56, peak: false, label: 'Nongkrong' },
];

export const PERIOD_SUMMARY = {
  'Hari ini': {
    omzet: 2450000,
    porsi: 198,
    transaksi: 86,
    rataRata: 28488,
    labelPeriode: '24 Oktober 2026',
  },
  '7 Hari': {
    omzet: 13195000,
    porsi: 1240,
    transaksi: 540,
    rataRata: 24435,
    labelPeriode: '18 – 24 Oktober 2026',
  },
  'Bulan ini': {
    omzet: 64800000,
    porsi: 5120,
    transaksi: 2280,
    rataRata: 28421,
    labelPeriode: '1 – 24 Oktober 2026',
  },
};

export const TOP_PRODUCTS = {
  Semua: [
    { rank: 1, nama: 'Kerupuk Mawar Pedas', kategori: 'Topping', porsi: 142, omzet: 284000, proporsi: 100, unit: 'porsi' },
    { rank: 2, nama: 'Kuah Jeletot Daun Jeruk', kategori: 'Kuah', porsi: 112, omzet: 336000, proporsi: 79, unit: 'porsi' },
    { rank: 3, nama: 'Dumpling Keju Mozzarella', kategori: 'Topping', porsi: 98, omzet: 245000, proporsi: 69, unit: 'pcs' },
    { rank: 4, nama: 'Es Teh Manis Jumbo', kategori: 'Minuman', porsi: 94, omzet: 470000, proporsi: 66, unit: 'gelas' },
    { rank: 5, nama: 'Ceker Jeletot Mercon', kategori: 'Topping', porsi: 85, omzet: 170000, proporsi: 60, unit: 'porsi' },
    { rank: 6, nama: 'Sosis Sapi Panggang', kategori: 'Topping', porsi: 78, omzet: 156000, proporsi: 55, unit: 'porsi' },
    { rank: 7, nama: 'Bakso Urat Sapi Asli', kategori: 'Topping', porsi: 72, omzet: 144000, proporsi: 51, unit: 'porsi' },
  ],
  Topping: [
    { rank: 1, nama: 'Kerupuk Mawar Pedas', kategori: 'Topping', porsi: 142, omzet: 284000, proporsi: 100, unit: 'porsi' },
    { rank: 2, nama: 'Dumpling Keju Mozzarella', kategori: 'Topping', porsi: 98, omzet: 245000, proporsi: 69, unit: 'pcs' },
    { rank: 3, nama: 'Ceker Jeletot Mercon', kategori: 'Topping', porsi: 85, omzet: 170000, proporsi: 60, unit: 'porsi' },
    { rank: 4, nama: 'Sosis Sapi Panggang', kategori: 'Topping', porsi: 78, omzet: 156000, proporsi: 55, unit: 'porsi' },
    { rank: 5, nama: 'Bakso Urat Sapi Asli', kategori: 'Topping', porsi: 72, omzet: 144000, proporsi: 51, unit: 'porsi' },
    { rank: 6, nama: 'Cuanki Lidah Garut', kategori: 'Topping', porsi: 64, omzet: 128000, proporsi: 45, unit: 'pcs' },
    { rank: 7, nama: 'Jamur Enoki Crispy', kategori: 'Topping', porsi: 52, omzet: 130000, proporsi: 37, unit: 'pack' },
  ],
  Kuah: [
    { rank: 1, nama: 'Kuah Jeletot Daun Jeruk', kategori: 'Kuah', porsi: 112, omzet: 336000, proporsi: 100, unit: 'mangkok' },
    { rank: 2, nama: 'Kuah Original Kencur Gurih', kategori: 'Kuah', porsi: 68, omzet: 204000, proporsi: 61, unit: 'mangkok' },
    { rank: 3, nama: 'Kuah Tom Yam Seblak Segar', kategori: 'Kuah', porsi: 38, omzet: 114000, proporsi: 34, unit: 'mangkok' },
    { rank: 4, nama: 'Kuah Suki Kaldu Bening', kategori: 'Kuah', porsi: 24, omzet: 72000, proporsi: 21, unit: 'mangkok' },
  ],
  Minuman: [
    { rank: 1, nama: 'Es Teh Manis Jumbo', kategori: 'Minuman', porsi: 94, omzet: 470000, proporsi: 100, unit: 'gelas' },
    { rank: 2, nama: 'Es Jeruk Peras Murni', kategori: 'Minuman', porsi: 46, omzet: 322000, proporsi: 49, unit: 'gelas' },
    { rank: 3, nama: 'Es Susu Soda Gembira', kategori: 'Minuman', porsi: 32, omzet: 320000, proporsi: 34, unit: 'gelas' },
    { rank: 4, nama: 'Air Mineral Prima 600ml', kategori: 'Minuman', porsi: 28, omzet: 112000, proporsi: 30, unit: 'botol' },
  ],
};

export const PAYMENT_METHODS_DATA = [
  { nama: 'QRIS (Gopay/Shopee/BCA)', jumlah: 43, nominal: 1225000, persen: 50, icon: 'qr-code-outline', warna: '#168653' },
  { nama: 'Tunai (Cash)', jumlah: 31, nominal: 875000, persen: 36, icon: 'cash-outline', warna: '#C62828' },
  { nama: 'E-Wallet (OVO/DANA)', jumlah: 12, nominal: 350000, persen: 14, icon: 'phone-portrait-outline', warna: '#0284C7' },
];

export const ORDER_TYPES_DATA = [
  { nama: 'Makan di Tempat (Dine-in)', jumlah: 62, porsi: 142, persen: 72, icon: 'restaurant-outline', warna: '#C62828' },
  { nama: 'Bungkus Pulang (Takeaway)', jumlah: 24, porsi: 56, persen: 28, icon: 'bag-handle-outline', warna: '#D97706' },
];

export const SEBLAK_PREFERENCES = {
  kuah: [
    { nama: 'Kuah Jeletot Daun Jeruk', persen: 46, warna: '#C62828', catatan: 'Sensasi pedas gurih aroma jeruk nipis' },
    { nama: 'Kuah Original Kencur', persen: 29, warna: '#EA580C', catatan: 'Rempah kencur tradisional khas Sunda' },
    { nama: 'Kuah Tom Yam Seblak', persen: 15, warna: '#D97706', catatan: 'Asam manis pedas segar' },
    { nama: 'Kuah Suki Kaldu Bening', persen: 10, warna: '#168653', catatan: 'Kaldu ayam gurih tidak pedas' },
  ],
  pedas: [
    { level: 0, label: 'Lvl 0 (Tidak Pedas)', persen: 4, chilis: 0, warna: '#8D7B70' },
    { level: 1, label: 'Lvl 1 (Sedikit Pedas)', persen: 11, chilis: 1, warna: '#F59E0B' },
    { level: 2, label: 'Lvl 2 (Pedas Sedang)', persen: 24, chilis: 2, warna: '#EA580C' },
    { level: 3, label: 'Lvl 3 (Jeletot Favorit)', persen: 41, chilis: 3, warna: '#C62828', favorite: true },
    { level: 4, label: 'Lvl 4 (Extra Pedas)', persen: 14, chilis: 4, warna: '#991B1B' },
    { level: 5, label: 'Lvl 5 (Jebred Nuklir)', persen: 6, chilis: 5, warna: '#52141D' },
  ],
};

export const RECENT_TRANSACTIONS_PREVIEW = [
  { id: 'TRX-086', waktu: '18:42 WIB', meja: 'Meja 4', menu: 'Seblak Jeletot (Ceker + Dumpling + Telur)', total: 38000, metode: 'QRIS', status: 'Lunas' },
  { id: 'TRX-085', waktu: '18:31 WIB', meja: 'Bungkus', menu: 'Seblak Prasmanan Jumbo 2 Porsi', total: 46000, metode: 'Tunai', status: 'Lunas' },
  { id: 'TRX-084', waktu: '18:15 WIB', meja: 'Meja 2', menu: 'Seblak Original Kencur (Sosis + Bakso)', total: 26000, metode: 'E-Wallet', status: 'Lunas' },
];

// ======================================================
// DATA STOK
// ======================================================

// Tentukan satuan berdasarkan jenis bahan.
// Ini merupakan nilai awal yang dapat disesuaikan dengan cara pembelian.
const tentukanSatuanStok = (nama = '', kategori = '') => {
  const teks = `${nama} ${kategori}`.toLowerCase();

  if (/telur/.test(teks)) return 'butir';

  if (/enoki|pack|kemasan/.test(teks)) return 'pack';

  if (
    /kerupuk|makaroni|cabai|cabe|kencur|bawang|sawi|sayur|jamur/.test(teks)
  ) {
    return 'kg';
  }

  if (
    /dumpling|chikuwa|crabstick|sosis|bakso|cuanki|fish roll|otak-otak|ceker/.test(teks)
  ) {
    return 'pcs';
  }

  return 'pcs';
};

// Data stok topping mengikuti sumber data halaman kasir.
const STOCK_TOPPING_ITEMS = TOPPING_ITEMS.map((topping) => ({
  id: `STK-${topping.id}`,
  toppingId: topping.id,
  nama: topping.nama,
  kategori: topping.kategori,
  sisa: 0,
  minimum: 1,
  satuan: tentukanSatuanStok(topping.nama, topping.kategori),
  stokAwal: 0,
  terpakaiHariIni: 0,
  estimasiHabisHari: 0,
  supplier: '',
  hargaBeli: 0,

  // Ambil foto dari mockData.js.
  foto: topping.image || null,

  riwayatRestok: [],
}));

// Foto bahan dasar
const FOTO_BAHAN_DASAR = {
  'Penyedap': require('../../assets/bahan-dasar/penyedap.png'),
  'Cabai Rawit': require('../../assets/bahan-dasar/cabai-rawit.png'),
  'Kencur': require('../../assets/bahan-dasar/kencur.png'),
  'Bawang Putih': require('../../assets/bahan-dasar/bawang-putih.png'),
  'Bawang Daun': require('../../assets/bahan-dasar/daun-bawang.png'),
};


// Bahan dasar yang tidak terdaftar sebagai topping kasir.
const STOCK_BAHAN_DASAR = [
  {
    id: 'STK-BAHAN-KUAH',
    nama: 'Penyedap',
    kategori: 'Bumbu',
    sisa: 0,
    minimum: 1,
    satuan: 'gr',
    stokAwal: 0,
    terpakaiHariIni: 0,
    estimasiHabisHari: 0,
    supplier: '',
    hargaBeli: 0,
    foto: FOTO_BAHAN_DASAR['Penyedap'],
    riwayatRestok: [],
  },
  {
    id: 'STK-BAHAN-CABAI',
    nama: 'Cabai Rawit',
    kategori: 'Bumbu',
    sisa: 0,
    minimum: 0.5,
    satuan: 'kg',
    stokAwal: 0,
    terpakaiHariIni: 0,
    estimasiHabisHari: 0,
    supplier: '',
    hargaBeli: 0,
    foto: FOTO_BAHAN_DASAR['Cabai Rawit'],
    riwayatRestok: [],
  },
  {
    id: 'STK-BAHAN-KENCUR',
    nama: 'Kencur',
    kategori: 'Bumbu',
    sisa: 0,
    minimum: 0.25,
    satuan: 'kg',
    stokAwal: 0,
    terpakaiHariIni: 0,
    estimasiHabisHari: 0,
    supplier: '',
    hargaBeli: 0,
    foto: FOTO_BAHAN_DASAR['Kencur'],
    riwayatRestok: [],
  },
  {
    id: 'STK-BAHAN-BAWANG',
    nama: 'Bawang Putih',
    kategori: 'Bumbu',
    sisa: 0,
    minimum: 0.25,
    satuan: 'kg',
    stokAwal: 0,
    terpakaiHariIni: 0,
    estimasiHabisHari: 0,
    supplier: '',
    hargaBeli: 0,
    foto: FOTO_BAHAN_DASAR['Bawang Putih'],
    riwayatRestok: [],
  },
  {
    id: 'STK-BAHAN-DAUN',
    nama: 'Bawang Daun',
    kategori: 'Sayur & Jamur',
    sisa: 0,
    minimum: 1,
    satuan: 'ikat',
    stokAwal: 0,
    terpakaiHariIni: 0,
    estimasiHabisHari: 0,
    supplier: '',
    hargaBeli: 0,
    foto: FOTO_BAHAN_DASAR['Bawang Daun'],
    riwayatRestok: [],
  },
];

export const INITIAL_STOCK_ITEMS = [
  ...STOCK_TOPPING_ITEMS,
  ...STOCK_BAHAN_DASAR,
];

export const INITIAL_EXPENSES = [
  {
    id: 'MODAL-001',
    tanggal: '24 Okt 2026',
    waktu: '14:15 WIB',
    keterangan: 'Belanja Kerupuk Mawar Kuning (15 kg)',
    kategori: 'Kerupuk & Makaroni',
    nominal: 330000,
    supplier: 'Juragan Kerupuk Barokah',
    metode: 'Tunai',
    pic: 'Dewi (Owner)',
  },
  {
    id: 'MODAL-002',
    tanggal: '24 Okt 2026',
    waktu: '11:30 WIB',
    keterangan: 'Belanja Cabe Rawit Merah (Jeletot) & Bumbu Kencur',
    kategori: 'Bumbu & Cabe',
    nominal: 195000,
    supplier: 'Pasar Induk Kramat Jati',
    metode: 'Tunai',
    pic: 'Dewi (Owner)',
  },
  {
    id: 'MODAL-003',
    tanggal: '24 Okt 2026',
    waktu: '09:00 WIB',
    keterangan: 'Restok Telur Ayam Negeri (60 butir)',
    kategori: 'Telur',
    nominal: 132000,
    supplier: 'Peternakan Ayam Subur',
    metode: 'Tunai',
    pic: 'Dewi (Owner)',
  },
  {
    id: 'MODAL-004',
    tanggal: '23 Okt 2026',
    waktu: '16:00 WIB',
    keterangan: 'Restok Ceker Ayam Bersih (8 kg) & Dumpling Keju',
    kategori: 'Frozen & Daging',
    nominal: 384000,
    supplier: 'Rumah Potong Berkah',
    metode: 'Transfer',
    pic: 'Dewi (Owner)',
  },
  {
    id: 'MODAL-005',
    tanggal: '23 Okt 2026',
    waktu: '10:15 WIB',
    keterangan: 'Belanja Sosis Sapi Cocktail & Bakso Sapi Urat',
    kategori: 'Frozen & Daging',
    nominal: 290000,
    supplier: 'Sumber Rezeki Frozen',
    metode: 'QRIS',
    pic: 'Dewi (Owner)',
  },
  {
    id: 'MODAL-006',
    tanggal: '22 Okt 2026',
    waktu: '13:00 WIB',
    keterangan: 'Restok Cuanki Lidah Garut (200 pcs)',
    kategori: 'Kerupuk & Makaroni',
    nominal: 200000,
    supplier: 'Sentra Cuanki Garut',
    metode: 'Transfer',
    pic: 'Dewi (Owner)',
  },
];