// src/data/mockDataOwner.js

// Data Referensi Kategori dan Satuan
export const KATEGORI_BAHAN = [
  'Kerupuk & Makaroni',
  'Seafood & Olahan',
  'Telur & Tahu',
  'Sayur & Jamur',
  'Daging & Jeroan',
  'Bumbu & Kuah',
  'Operasional'
];

// Data Master Stok Awal (Dianggap Sisa Kemarin)
// Properti 'nama' HARUS sama persis dengan 'keterangan' di expense.
export const INITIAL_STOCK_ITEMS = [
  { id: 'STK001', nama: 'Kerupuk Bawang (Mawar)', kategori: 'Kerupuk & Makaroni', sisa: 10, satuan: 'kg', minimum: 2, hargaSatuanTerakhir: 16000, modalTertanam: 160000, foto: null },
  { id: 'STK002', nama: 'Makaroni Kondang / Spiral', kategori: 'Kerupuk & Makaroni', sisa: 5, satuan: 'kg', minimum: 1, hargaSatuanTerakhir: 15000, modalTertanam: 75000, foto: null },
  { id: 'STK003', nama: 'Sosis Sapi Jumbo', kategori: 'Seafood & Olahan', sisa: 3, satuan: 'pack', minimum: 2, hargaSatuanTerakhir: 28000, modalTertanam: 84000, foto: null },
  { id: 'STK004', nama: 'Bakso Sapi Polos', kategori: 'Seafood & Olahan', sisa: 8, satuan: 'pack', minimum: 3, hargaSatuanTerakhir: 32000, modalTertanam: 256000, foto: null },
  { id: 'STK005', nama: 'Telur Ayam Negeri', kategori: 'Telur & Tahu', sisa: 10, satuan: 'kg', minimum: 5, hargaSatuanTerakhir: 26000, modalTertanam: 260000, foto: null },
  { id: 'STK006', nama: 'Ceker Ayam Empuk', kategori: 'Daging & Jeroan', sisa: 5, satuan: 'kg', minimum: 2, hargaSatuanTerakhir: 22000, modalTertanam: 110000, foto: null },
  { id: 'STK007', nama: 'Jamur Enoki Putih', kategori: 'Sayur & Jamur', sisa: 4, satuan: 'pack', minimum: 2, hargaSatuanTerakhir: 30000, modalTertanam: 120000, foto: null },
  { id: 'STK008', nama: 'Dumpling Keju', kategori: 'Seafood & Olahan', sisa: 2, satuan: 'pack', minimum: 1, hargaSatuanTerakhir: 35000, modalTertanam: 70000, foto: null },
];

// Data Riwayat Pengeluaran (Modal Bahan & Operasional)
export const INITIAL_EXPENSES = [
  { id: 'EXP-1001', tanggal: '2026-10-15', waktu: '14:00', keterangan: 'Bayar Listrik & Air', kategori: 'Operasional', jumlah: 1, satuan: 'bln', total: 500000, pic: 'Admin' },
  // Contoh belanja untuk tanggal 16 (mengosongkan stok dummy di atas sebagai simulasi)
  { id: 'EXP-1002', tanggal: '2026-10-16', waktu: '08:10', keterangan: 'Kerupuk Bawang (Mawar)', kategori: 'Kerupuk & Makaroni', jumlah: 3, satuan: 'kg', total: 48000, pic: 'Owner' },
  { id: 'EXP-1003', tanggal: '2026-10-16', waktu: '08:50', keterangan: 'Makaroni Kondang / Spiral', kategori: 'Kerupuk & Makaroni', jumlah: 2, satuan: 'kg', total: 30000, pic: 'Owner' },
  { id: 'EXP-1004', tanggal: '2026-10-16', waktu: '09:30', keterangan: 'Sosis Sapi Jumbo', kategori: 'Seafood & Olahan', jumlah: 4, satuan: 'pack', total: 112000, pic: 'Owner' },
  { id: 'EXP-1005', tanggal: '2026-10-16', waktu: '10:15', keterangan: 'Bakso Sapi Polos', kategori: 'Seafood & Olahan', jumlah: 5, satuan: 'pack', total: 160000, pic: 'Owner' },
  { id: 'EXP-1006', tanggal: '2026-10-16', waktu: '11:00', keterangan: 'Ceker Ayam Empuk', kategori: 'Daging & Jeroan', jumlah: 3, satuan: 'kg', total: 66000, pic: 'Owner' },
  { id: 'EXP-1007', tanggal: '2026-10-16', waktu: '12:30', keterangan: 'Telur Ayam Negeri', kategori: 'Telur & Tahu', jumlah: 5, satuan: 'kg', total: 130000, pic: 'Owner' },
  { id: 'EXP-1008', tanggal: '2026-10-16', waktu: '15:00', keterangan: 'Jamur Enoki Putih', kategori: 'Sayur & Jamur', jumlah: 4, satuan: 'pack', total: 120000, pic: 'Owner' },
  { id: 'EXP-1009', tanggal: '2026-10-16', waktu: '16:15', keterangan: 'Dumpling Keju', kategori: 'Seafood & Olahan', jumlah: 5, satuan: 'pack', total: 175000, pic: 'Owner' },
];

// --- DATA DUMMY KASIR (Untuk Simulasi Laba Rugi) ---
export const DUMMY_MENU = [
    { id: 'M01', nama: 'Seblak Komplit Jeletot', kategori: 'Menu Utama', harga: 25000, hpp_rata2: 15000 },
    { id: 'M02', nama: 'Es Teh Jumbo', kategori: 'Minuman', harga: 5000, hpp_rata2: 1500 },
];

// Simulasi Penjualan Tanggal 16 Oktober 2026
export const DUMMY_SALES_16OKT = [
    { id: 'TRX001', tanggal: '2026-10-16', total: 2500000, itemTerjual: 100 }, // Omset Kotor
    { id: 'TRX002', tanggal: '2026-10-16', total: 920000, itemTerjual: 42 },
    // Total Omset 16 Okt = 3.420.000
    // Total HPP Penjualan 16 Okt (asumsi sistem hitung otomatis) = 2.052.000 (60% omset)
];