const fs = require('fs');

const DAYS_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAME = 'Oktober';

// Specific items for 16 Oktober (from wireframe)
const OCT_16_ITEMS = [
  { waktu: '07:30', keterangan: 'Restok Minyak & Bumbu Dapur', jumlah: 5, satuan: 'liter', total: 450000 },
  { waktu: '08:00', keterangan: 'Cabe Rawit & Jeletot Segar', jumlah: 8, satuan: 'kg', total: 474500 },
  { waktu: '09:15', keterangan: 'Kerupuk Mawar Kuning', jumlah: 2, satuan: 'kg', total: 32000 },
  { waktu: '09:42', keterangan: 'Sosis Sapi Cocktail', jumlah: 1.5, satuan: 'kg', total: 31500 },
  { waktu: '10:05', keterangan: 'Bakso Sapi Urat', jumlah: 1, satuan: 'kg', total: 21000 },
  { waktu: '10:28', keterangan: 'Ceker Ayam Bersih', jumlah: 2, satuan: 'kg', total: 10000 },
  { waktu: '11:12', keterangan: 'Tahu Putih Sutra', jumlah: 1, satuan: 'kg', total: 22000 },
  { waktu: '11:45', keterangan: 'Sosis Ayam Mini', jumlah: 1.5, satuan: 'kg', total: 31500 },
  { waktu: '12:20', keterangan: 'Kerupuk Kulit & Bawang', jumlah: 2, satuan: 'kg', total: 45500 },
  { waktu: '13:05', keterangan: 'Sosis Sapi Panggang', jumlah: 2, satuan: 'kg', total: 42000 },
  { waktu: '15:20', keterangan: 'Dumpling Keju Mozzarella', jumlah: 2, satuan: 'kg', total: 50000 },
  { waktu: '17:00', keterangan: 'Sayur Sawi Hijau & Kol', jumlah: 3, satuan: 'kg', total: 35000 }
]; // Sum = 1.245.000!

// Specific items for Week 13-19 Oct
const WEEK_ITEMS = {
  13: [
    { waktu: '08:00', keterangan: 'Kerupuk Mawar & Kulit', jumlah: 8, satuan: 'kg', total: 126000 },
    { waktu: '10:30', keterangan: 'Makaroni Spiral Mentah', jumlah: 10, satuan: 'kg', total: 100000 },
    { waktu: '14:00', keterangan: 'Telur Ayam Negeri', jumlah: 15, satuan: 'kg', total: 300000 },
    { waktu: '16:30', keterangan: 'Cabe Rawit & Kencur', jumlah: 6, satuan: 'kg', total: 274000 },
  ], // Total 800.000
  14: [
    { waktu: '08:30', keterangan: 'Sosis Sapi Cocktail', jumlah: 6, satuan: 'kg', total: 126000 },
    { waktu: '11:00', keterangan: 'Bakso Urat Sapi', jumlah: 7, satuan: 'kg', total: 147000 },
    { waktu: '15:15', keterangan: 'Cuanki Lidah Garut', jumlah: 200, satuan: 'pcs', total: 287000 },
  ], // Total 560.000
  15: [
    { waktu: '08:15', keterangan: 'Bakso Daging Sapi Super', jumlah: 12, satuan: 'kg', total: 450000 },
    { waktu: '10:45', keterangan: 'Ceker Ayam Segar', jumlah: 14, satuan: 'kg', total: 350000 },
    { waktu: '13:30', keterangan: 'Daging Tetelan Sapi', jumlah: 10, satuan: 'kg', total: 700000 },
  ], // Total 1.500.000
  17: [
    { waktu: '08:30', keterangan: 'Tahu Putih Sutra', jumlah: 4, satuan: 'kg', total: 88000 },
    { waktu: '11:00', keterangan: 'Kerupuk Bawang Pedas', jumlah: 10, satuan: 'kg', total: 160000 },
    { waktu: '15:00', keterangan: 'Mie Kuning Kering', jumlah: 15, satuan: 'pack', total: 272000 },
  ], // Total 520.000
  18: [
    { waktu: '08:15', keterangan: 'Sosis Sapi Bakar', jumlah: 6, satuan: 'kg', total: 125000 },
    { waktu: '10:00', keterangan: 'Bakso Sapi Telur', jumlah: 8, satuan: 'kg', total: 168000 },
    { waktu: '14:30', keterangan: 'Dumpling Ayam Keju', jumlah: 12, satuan: 'pack', total: 357000 },
  ], // Total 650.000
  19: [
    { waktu: '09:00', keterangan: 'Kerupuk Aneka Warna', jumlah: 7, satuan: 'kg', total: 112000 },
    { waktu: '11:30', keterangan: 'Tahu Pong Goreng', jumlah: 7, satuan: 'kg', total: 154000 },
    { waktu: '16:00', keterangan: 'Bumbu Kencur & Bawang', jumlah: 5, satuan: 'kg', total: 214000 },
  ], // Total 480.000
};

// Variety toppings/expenses templates
const TEMPLATES = [
  { ket: 'Kerupuk Mawar Kuning', satuan: 'kg', qtyRange: [3, 8], pricePerUnit: 16000 },
  { ket: 'Sosis Sapi Cocktail', satuan: 'kg', qtyRange: [3, 6], pricePerUnit: 25000 },
  { ket: 'Bakso Urat Sapi', satuan: 'kg', qtyRange: [3, 7], pricePerUnit: 24000 },
  { ket: 'Ceker Ayam Bersih', satuan: 'kg', qtyRange: [4, 8], pricePerUnit: 18000 },
  { ket: 'Tahu Putih Sutra', satuan: 'kg', qtyRange: [3, 5], pricePerUnit: 15000 },
  { ket: 'Makaroni Spiral', satuan: 'kg', qtyRange: [4, 10], pricePerUnit: 12000 },
  { ket: 'Cabe Rawit Jeletot', satuan: 'kg', qtyRange: [3, 7], pricePerUnit: 35000 },
  { ket: 'Telur Ayam Negeri', satuan: 'kg', qtyRange: [5, 12], pricePerUnit: 26000 },
  { ket: 'Dumpling Keju', satuan: 'pack', qtyRange: [4, 8], pricePerUnit: 28000 },
  { ket: 'Cuanki Lidah Garut', satuan: 'pcs', qtyRange: [100, 250], pricePerUnit: 1200 },
  { ket: 'Bumbu Kencur & Bawang', satuan: 'kg', qtyRange: [2, 5], pricePerUnit: 30000 },
  { ket: 'Minyak Goreng Sawit', satuan: 'liter', qtyRange: [4, 10], pricePerUnit: 18000 }
];

const allExpenses = [];
let idCounter = 1;

for (let day = 1; day <= 31; day++) {
  const dayStr = day < 10 ? '0' + day : '' + day;
  const isoDate = '2026-10-' + dayStr;
  const d = new Date(2026, 9, day);
  const dayName = DAYS_NAMES[d.getDay()];
  const formattedDate = day + ' ' + MONTH_NAME + ' 2026';
  const dayWithDate = dayName + ', ' + day + ' ' + MONTH_NAME;

  if (day === 16) {
    OCT_16_ITEMS.forEach(item => {
      allExpenses.push({
        id: 'EXP-' + (idCounter++),
        tanggal: isoDate,
        tanggalStr: formattedDate,
        hari: dayWithDate,
        waktu: item.waktu,
        keterangan: item.keterangan,
        jumlah: item.jumlah,
        satuan: item.satuan,
        total: item.total
      });
    });
  } else if (WEEK_ITEMS[day]) {
    WEEK_ITEMS[day].forEach(item => {
      allExpenses.push({
        id: 'EXP-' + (idCounter++),
        tanggal: isoDate,
        tanggalStr: formattedDate,
        hari: dayWithDate,
        waktu: item.waktu,
        keterangan: item.keterangan,
        jumlah: item.jumlah,
        satuan: item.satuan,
        total: item.total
      });
    });
  } else {
    // Generate 2 to 3 realistic items
    const count = 2 + (day % 2);
    const times = ['08:15', '10:30', '13:45', '16:00'];
    for (let i = 0; i < count; i++) {
      const tpl = TEMPLATES[(day * 3 + i) % TEMPLATES.length];
      const qty = tpl.qtyRange[0] + ((day + i) % (tpl.qtyRange[1] - tpl.qtyRange[0] + 1));
      const total = qty * tpl.pricePerUnit;
      allExpenses.push({
        id: 'EXP-' + (idCounter++),
        tanggal: isoDate,
        tanggalStr: formattedDate,
        hari: dayWithDate,
        waktu: times[i % times.length],
        keterangan: tpl.ket,
        jumlah: qty,
        satuan: tpl.satuan,
        total: total
      });
    }
  }
}

const fileContent = '// Master Mock Data Pengeluaran Bahan Kedai Seblak (Oktober 2026)\n' +
  '// Mencakup seluruh tanggal 1 Oktober 2026 s.d. 31 Oktober 2026 secara lengkap\n\n' +
  'export const MASTER_EXPENSES = ' + JSON.stringify(allExpenses, null, 2) + ';\n';

fs.writeFileSync('./src/data/mockExpenses.js', fileContent);
console.log('SUCCESS: Generated ' + allExpenses.length + ' expenses for 31 days in October 2026.');
