// src/data/mockDataGlobal.js

// --- A. DATA MASTER KASIR (User) ---
export const MOCK_KASIR = [
    { id: 'KSR01', nama: 'Andi Saputra', username: 'andi_seblak', status: 'aktif', pin: '1234' }, // PIN untuk simulasi login kasir
    { id: 'KSR02', nama: 'Bella Pertiwi', username: 'bella_jutek', status: 'aktif', pin: '5678' },
    { id: 'KSR03', nama: 'Citra Dewi', username: 'citra_ceria', status: 'nonaktif', pin: '0000' },
];

// --- B. DATA MONITORING SHIFT (Real-time di Kasir) ---
// Data ini biasanya diupdate oleh Aplikasi Kasir (POS)
export const MOCK_SHIFT_MONITORING = [
    {
        kasirId: 'KSR01',
        namaKasir: 'Andi Saputra',
        statusShift: 'BUKA', // BUKA / TUTUP
        waktuMulai: '2026-10-16T08:00:00',
        modalAwal: 500000,
        omsetKotorSementara: 3420000, // Total penjualan dari kasir Andi hari ini
        totalTransaksi: 45,
        estimasiUangFisik: 500000 + 3420000 // Modal + Omset
    },
    {
        kasirId: 'KSR02',
        namaKasir: 'Bella Pertiwi',
        statusShift: 'TUTUP',
        waktuMulai: '2026-10-15T13:00:00',
        waktuSelesai: '2026-10-15T22:00:00',
        modalAwal: 300000,
        omsetKotorSementara: 2150000,
        totalTransaksi: 30,
        estimasiUangFisik: 300000 + 2150000,
        selisihFisik: -10000, // Kasir tekor 10rb saat tutup shift
    }
];

// --- C. REUTILISASI DATA STOK & EXPENSE (Dari modul sebelumnya) ---
// Pastikan Anda mengimpor data stok dan pengeluaran yang sudah disinkronisasi
// (Lihat kode pada jawaban sebelumnya untuk struktur INITIAL_STOCK_ITEMS dan INITIAL_EXPENSES)
export { INITIAL_STOCK_ITEMS, INITIAL_EXPENSES, DUMMY_SALES_ALL_OCT_2026 } from './mockDataOwner';