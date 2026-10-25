// Master Data Laporan Keuangan Seblak Prasmanan
// Menyediakan data konsisten antara Laporan Keuangan, Preview Dokumen, dan Cetak PDF
// Rumus: Laba Bersih = Total Omzet - Total Pengeluaran

export const FINANCIAL_REPORT_DATA = {
  harian: {
    periodeType: 'harian',
    periodeLabel: '16 Oktober 2026',
    tanggalCetak: '16 Oktober 2026',
    titleDokumen: 'LAPORAN KEUANGAN HARIAN',
    summary: {
      omzet: 3420000,
      pengeluaran: 1060000, // Tepat 11 pembelian topping di mockExpenses pada 16 Okt
      labaBersih: 2360000,  // 3.420.000 - 1.060.000
      totalPorsi: 142,
      totalTransaksi: 48,
    },
    // Grafik Keuangan 7 Hari Terakhir (Nilai Sumbu Y: 4 jt, 3 jt, 2 jt, 1 jt, 0)
    chart: [
      { label: '10 Okt', omzet: 2800000, pengeluaran: 850000, laba: 1950000 },
      { label: '11 Okt', omzet: 3100000, pengeluaran: 920000, laba: 2180000 },
      { label: '12 Okt', omzet: 2950000, pengeluaran: 800000, laba: 2150000 },
      { label: '13 Okt', omzet: 3200000, pengeluaran: 1100000, laba: 2100000 },
      { label: '14 Okt', omzet: 3350000, pengeluaran: 950000, laba: 2400000 },
      { label: '15 Okt', omzet: 3500000, pengeluaran: 1050000, laba: 2450000 },
      { label: '16 Okt', omzet: 3420000, pengeluaran: 1060000, laba: 2360000, isCurrent: true },
    ],
    // Pengeluaran Terbesar Top 3
    topPengeluaran: [
      { rank: '01', nama: 'Ceker Ayam', nominal: 280000, persen: 26.4 },
      { rank: '02', nama: 'Bakso Sapi', nominal: 240000, persen: 22.6 },
      { rank: '03', nama: 'Sosis Sapi', nominal: 200000, persen: 18.9 },
    ],
    // Topping Terlaris (Top 3)
    topTopping: [
      { rank: 1, nama: 'Bakso Aci', porsi: 85, nominal: 255000 },
      { rank: 2, nama: 'Sosis', porsi: 72, nominal: 216000 },
      { rank: 3, nama: 'Ceker Ayam', porsi: 64, nominal: 192000 },
    ],
    // Ringkasan Aktivitas Harian
    ringkasanAktivitas: [
      { label: 'Penjualan Tercatat', value: '48', unit: 'transaksi' },
      { label: 'Pengeluaran Tercatat', value: '11', unit: 'pembelian' },
      { label: 'Total Item Terjual', value: '142', unit: 'porsi' },
    ],
    // Rekap Pengeluaran Harian (Daftar Pengeluaran Topping pada Hari Tersebut Sesuai Data Proyek)
    rekapPengeluaranHarian: [
      { id: 'EXP-61', no: 1, waktu: '08:10', keterangan: 'Kerupuk', jumlah: 3, satuan: 'kg', total: 48000 },
      { id: 'EXP-62', no: 2, waktu: '08:50', keterangan: 'Makaroni', jumlah: 2, satuan: 'kg', total: 30000 },
      { id: 'EXP-63', no: 3, waktu: '09:30', keterangan: 'Sosis', jumlah: 4, satuan: 'kg', total: 112000 },
      { id: 'EXP-64', no: 4, waktu: '10:15', keterangan: 'Bakso', jumlah: 5, satuan: 'kg', total: 160000 },
      { id: 'EXP-65', no: 5, waktu: '11:00', keterangan: 'Ceker', jumlah: 3, satuan: 'kg', total: 66000 },
      { id: 'EXP-66', no: 6, waktu: '11:45', keterangan: 'Tahu', jumlah: 4, satuan: 'kg', total: 60000 },
      { id: 'EXP-67', no: 7, waktu: '12:30', keterangan: 'Telur', jumlah: 5, satuan: 'kg', total: 130000 },
      { id: 'EXP-68', no: 8, waktu: '13:20', keterangan: 'Fish roll', jumlah: 3, satuan: 'kg', total: 84000 },
      { id: 'EXP-69', no: 9, waktu: '14:05', keterangan: 'Chikuwa', jumlah: 3, satuan: 'kg', total: 75000 },
      { id: 'EXP-70', no: 10, waktu: '15:00', keterangan: 'Jamur enoki', jumlah: 4, satuan: 'kg', total: 120000 },
      { id: 'EXP-71', no: 11, waktu: '16:15', keterangan: 'Dumpling keju', jumlah: 5, satuan: 'kg', total: 175000 },
    ],
    // Rekap Harian (Tabel Hari dalam Minggu Berjalan Sesuai Wireframe)
    rekapTabelHarian: [
      { periode: 'Senin, 12 Okt', omzet: 2950000, pengeluaran: 800000, labaBersih: 2150000 },
      { periode: 'Selasa, 13 Okt', omzet: 3200000, pengeluaran: 1100000, labaBersih: 2100000 },
      { periode: 'Rabu, 14 Okt', omzet: 3350000, pengeluaran: 950000, labaBersih: 2400000 },
      { periode: 'Kamis, 15 Okt', omzet: 3500000, pengeluaran: 1050000, labaBersih: 2450000 },
      { periode: 'Jumat, 16 Okt', omzet: 3420000, pengeluaran: 1060000, labaBersih: 2360000, isCurrent: true },
    ],
  },

  bulanan: {
    periodeType: 'bulanan',
    periodeLabel: 'Oktober 2026',
    tanggalCetak: '16 Oktober 2026',
    titleDokumen: 'LAPORAN KEUANGAN BULANAN',
    summary: {
      omzet: 25460000,       // Sesuai instruksi prompt
      pengeluaran: 8250000,  // Sesuai instruksi prompt
      labaBersih: 17210000,  // 25.460.000 - 8.250.000 = 17.210.000
      totalPorsi: 4240,
      totalTransaksi: 1120,
    },
    // Grafik Keuangan 4 Minggu
    chart: [
      { label: 'Minggu 1', omzet: 5800000, pengeluaran: 1950000, laba: 3850000 },
      { label: 'Minggu 2', omzet: 6420000, pengeluaran: 2100000, laba: 4320000 },
      { label: 'Minggu 3', omzet: 6840000, pengeluaran: 2250000, laba: 4590000, isCurrent: true },
      { label: 'Minggu 4', omzet: 6400000, pengeluaran: 1950000, laba: 4450000 },
    ],
    // Pengeluaran Terbesar Top 3
    topPengeluaran: [
      { rank: '01', nama: 'Sosis Sapi', nominal: 2850000, persen: 34.5 },
      { rank: '02', nama: 'Bakso Aci', nominal: 2400000, persen: 29.1 },
      { rank: '03', nama: 'Ceker Ayam', nominal: 1550000, persen: 18.8 },
    ],
    // Topping Terlaris (Top 3)
    topTopping: [
      { rank: 1, nama: 'Bakso Aci', porsi: 1250, nominal: 3750000 },
      { rank: 2, nama: 'Sosis', porsi: 980, nominal: 2940000 },
      { rank: 3, nama: 'Ceker Ayam', porsi: 850, nominal: 2550000 },
    ],
    // Ringkasan Bulanan
    ringkasanBulanan: [
      { label: 'Penjualan Tercatat', value: '1.120', unit: 'transaksi' },
      { label: 'Total Item Terjual', value: '4.240', unit: 'porsi' },
      { label: 'Minggu Terbaik', value: 'Minggu 3', unit: 'Rp 6,84 jt' },
    ],
    // Rekap Mingguan (Tabel)
    rekapTabel: [
      { periode: 'Minggu 1 (1–7 Okt)', omzet: 5800000, pengeluaran: 1950000, labaBersih: 3850000 },
      { periode: 'Minggu 2 (8–14 Okt)', omzet: 6420000, pengeluaran: 2100000, labaBersih: 4320000 },
      { periode: 'Minggu 3 (15–21 Okt)', omzet: 6840000, pengeluaran: 2250000, labaBersih: 4590000 },
      { periode: 'Minggu 4 (22–31 Okt)', omzet: 6400000, pengeluaran: 1950000, labaBersih: 4450000 },
    ],
  },

  tahunan: {
    periodeType: 'tahunan',
    periodeLabel: '2026',
    tanggalCetak: '16 Oktober 2026',
    titleDokumen: 'LAPORAN KEUANGAN TAHUNAN',
    summary: {
      omzet: 285500000,
      pengeluaran: 94200000,
      labaBersih: 191300000, // 285.500.000 - 94.200.000 = 191.300.000
      totalPorsi: 48600,
      totalTransaksi: 12840,
    },
    // Grafik Keuangan 12 Bulan
    chart: [
      { label: 'Jan', omzet: 21500000, pengeluaran: 7200000, laba: 14300000 },
      { label: 'Feb', omzet: 20800000, pengeluaran: 6900000, laba: 13900000 },
      { label: 'Mar', omzet: 22400000, pengeluaran: 7500000, laba: 14900000 },
      { label: 'Apr', omzet: 24100000, pengeluaran: 8000000, laba: 16100000 },
      { label: 'Mei', omzet: 23500000, pengeluaran: 7800000, laba: 15700000 },
      { label: 'Jun', omzet: 24800000, pengeluaran: 8100000, laba: 16700000 },
      { label: 'Jul', omzet: 25200000, pengeluaran: 8300000, laba: 16900000 },
      { label: 'Agu', omzet: 24900000, pengeluaran: 8200000, laba: 16700000 },
      { label: 'Sep', omzet: 25100000, pengeluaran: 8150000, laba: 16950000 },
      { label: 'Okt', omzet: 25460000, pengeluaran: 8250000, laba: 17210000, isCurrent: true },
      { label: 'Nov', omzet: 23800000, pengeluaran: 7900000, laba: 15900000 },
      { label: 'Des', omzet: 23940000, pengeluaran: 7900000, laba: 16040000 },
    ],
    // Pengeluaran Terbesar Top 3
    topPengeluaran: [
      { rank: '01', nama: 'Sosis Sapi', nominal: 32500000, persen: 34.5 },
      { rank: '02', nama: 'Bakso Sapi', nominal: 27800000, persen: 29.5 },
      { rank: '03', nama: 'Ceker Ayam', nominal: 17600000, persen: 18.7 },
    ],
    // Topping Terlaris (Top 3)
    topTopping: [
      { rank: 1, nama: 'Bakso Aci', porsi: 14500, nominal: 43500000 },
      { rank: 2, nama: 'Sosis', porsi: 11800, nominal: 35400000 },
      { rank: 3, nama: 'Ceker Ayam', porsi: 9900, nominal: 29700000 },
    ],
    // Ringkasan Tahunan
    ringkasanTahunan: [
      { label: 'Bulan Terbaik', value: 'Okt 2026', unit: 'Rp 25,46 jt' },
      { label: 'Pengeluaran Terbesar', value: 'Sep 2026', unit: 'Rp 8,15 jt' },
      { label: 'Top Topping Terlaris', value: 'Bakso Aci', unit: '14.500 porsi' },
    ],
    // Rekap Bulanan (Tabel 12 Bulan)
    rekapTabel: [
      { periode: 'Januari 2026', omzet: 21500000, pengeluaran: 7200000, labaBersih: 14300000 },
      { periode: 'Februari 2026', omzet: 20800000, pengeluaran: 6900000, labaBersih: 13900000 },
      { periode: 'Maret 2026', omzet: 22400000, pengeluaran: 7500000, labaBersih: 14900000 },
      { periode: 'April 2026', omzet: 24100000, pengeluaran: 8000000, labaBersih: 16100000 },
      { periode: 'Mei 2026', omzet: 23500000, pengeluaran: 7800000, labaBersih: 15700000 },
      { periode: 'Juni 2026', omzet: 24800000, pengeluaran: 8100000, labaBersih: 16700000 },
      { periode: 'Juli 2026', omzet: 25200000, pengeluaran: 8300000, labaBersih: 16900000 },
      { periode: 'Agustus 2026', omzet: 24900000, pengeluaran: 8200000, labaBersih: 16700000 },
      { periode: 'September 2026', omzet: 25100000, pengeluaran: 8150000, labaBersih: 16950000 },
      { periode: 'Oktober 2026', omzet: 25460000, pengeluaran: 8250000, labaBersih: 17210000 },
      { periode: 'November 2026', omzet: 23800000, pengeluaran: 7900000, labaBersih: 15900000 },
      { periode: 'Desember 2026', omzet: 23940000, pengeluaran: 7900000, labaBersih: 16040000 },
    ],
  },
};
