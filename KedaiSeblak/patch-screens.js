const fs = require('fs');

function patch(file, edits) {
  let text = fs.readFileSync(file, 'utf8');
  const crlf = text.includes('\r\n');
  text = text.replace(/\r\n/g, '\n');
  for (const [label, oldStr, newStr] of edits) {
    const n = text.split(oldStr).length - 1;
    if (n !== 1) { console.error(`GAGAL [${file}] "${label}": ditemukan ${n}x (harus 1x). Tidak ada yang diubah.`); process.exit(1); }
    text = text.replace(oldStr, () => newStr);
  }
  if (crlf) text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, text, 'utf8');
  console.log(`OK ${file} (${edits.length} perubahan)`);
}

const LAPORAN = process.argv[2] || 'src/screens/owner/LaporanKeuanganScreen.js';
const KASIR = process.argv[3] || 'src/screens/owner/KelolaKasirScreen.js';
const kasirAsli = fs.readFileSync(KASIR, 'utf8').replace(/\r\n/g, '\n');

if (!fs.readFileSync(LAPORAN, 'utf8').includes('sortedTop')) patch(LAPORAN, [
  ['tab awal bulanan', "useState('harian');\n\n  // Selector value state", "useState('bulanan');\n\n  // Selector value state"],
  ['waktu pemasukan',
   "waktu: new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })",
   "waktu: new Date(r.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })"],
  ['mapping pengeluaran',
   "const pengeluaran = data.pengeluaran.map((r, i) => ({ no: i + 1, tanggal: r.tanggal, nama: r.nama, keterangan: r.nama, kategori: r.kategori, total: Number(r.nominal), nominal: Number(r.nominal) }));",
   "const pengeluaran = data.pengeluaran.map((r, i) => ({ no: i + 1, tanggal: r.tanggal, waktu: `${String(r.tanggal || '').slice(8, 10)}/${String(r.tanggal || '').slice(5, 7)} ${String(r.waktu || '').slice(0, 5)}`.trim(), nama: r.nama, keterangan: r.nama, supplier: r.supplier || '-', jumlah: r.jumlah, satuan: r.satuan, kategori: r.kategori, total: Number(r.nominal), nominal: Number(r.nominal) }));"],
  ['grup top pengeluaran', "byCategory[r.kategori] = (byCategory[r.kategori] || 0) + r.total;", "byCategory[r.nama] = (byCategory[r.nama] || 0) + r.total;"],
  ['top 3',
   "const topPengeluaran = Object.entries(byCategory).map(([nama, total]) => ({ nama, total })).sort((a, b) => b.total - a.total).slice(0, 5);",
   "const sortedTop = Object.entries(byCategory).map(([nama, nominal]) => ({ nama, nominal })).sort((a, b) => b.nominal - a.nominal).slice(0, 3);\n      const maxTop = sortedTop[0]?.nominal || 1;\n      const topPengeluaran = sortedTop.map((x, i) => ({ ...x, rank: i + 1, proporsi: Math.round((x.nominal / maxTop) * 100) }));"],
  ['judul header', 'title="Owner Portal ΓÇó Laporan Keuangan"', 'title="Owner Portal • Laporan Keuangan"'],
]);

patch(KASIR, [
  ['import shiftService',
   "import { useKasir } from '../../context/KasirContext';",
   "import { useKasir } from '../../context/KasirContext';\nimport { getShifts } from '../../services/shiftService';"],
  ['hapus mock',
   /\/\/ Data dummy pendukung untuk monitoring shift\nconst MOCK_SHIFT_MONITORING = \[[\s\S]*?\n\];\n/.exec(kasirAsli)[0],
   "const formatTanggalJam = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');\n"],
  ['state shift',
   "  const [password, setPassword] = useState('');\n",
   "  const [password, setPassword] = useState('');\n\n  // Monitoring shift dibaca dari tabel shift_kasir (Supabase)\n  const [shifts, setShifts] = useState([]);\n  const [shiftLoading, setShiftLoading] = useState(false);\n  const [shiftError, setShiftError] = useState('');\n  useEffect(() => {\n    if (activeTab !== 'shift') return undefined;\n    let aktif = true;\n    setShiftLoading(true);\n    setShiftError('');\n    getShifts({ limit: 50 })\n      .then((rows) => { if (aktif) setShifts(rows); })\n      .catch((e) => { if (aktif) setShiftError(e.message || 'Gagal memuat shift.'); })\n      .finally(() => { if (aktif) setShiftLoading(false); });\n    return () => { aktif = false; };\n  }, [activeTab]);\n"],
  ['tab shift',
   /\{\/\* Konten Tab Shift \*\/\}[\s\S]*?\n        \)\}\n      <\/ScrollView>/.exec(kasirAsli)[0],
   `{/* Konten Tab Shift (data dari tabel shift_kasir) */}
        {activeTab === 'shift' && (
          <View>
            <Text style={styles.sectionTitle}>Monitoring Shift Laci Kasir</Text>
            {shiftLoading ? <Text style={styles.cashierDetail}>Memuat data shift...</Text> : null}
            {shiftError ? <Text style={[styles.cashierDetail, { color: '#D32F2F' }]}>{shiftError}</Text> : null}
            {!shiftLoading && !shiftError && shifts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Belum ada data shift.</Text>
              </View>
            ) : null}
            {shifts.map((s) => {
              const nama = cashiers.find((c) => c.id === s.kasir_id)?.name || 'Kasir';
              const buka = String(s.status || '').toLowerCase() === 'buka';
              const selisih = Number(s.selisih || 0);
              return (
                <View key={s.id} style={styles.shiftCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cashierName}>{nama}</Text>
                    <View style={[styles.statusBadge, buka ? styles.badgeActive : styles.badgeOffline]}>
                      <Text style={[styles.statusText, buka ? styles.textActive : styles.textOffline]}>{buka ? 'Shift Buka' : 'Shift Tutup'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cashierDetail}>{formatTanggalJam(s.waktu_mulai)} - {s.waktu_selesai ? formatTanggalJam(s.waktu_selesai) : 'berjalan'}</Text>
                  <Text style={styles.cashierDetail}>Modal Awal: {formatRupiah(s.modal_awal)}</Text>
                  <Text style={styles.cashierDetail}>Omzet Sistem: {formatRupiah(s.omzet_sistem)} ({Number(s.total_transaksi || 0)} transaksi)</Text>
                  {s.uang_akhir_fisik != null ? <Text style={styles.cashierDetail}>Uang Fisik Akhir: {formatRupiah(s.uang_akhir_fisik)}</Text> : null}
                  {s.uang_akhir_fisik != null ? (
                    <Text style={[styles.cashierDetail, { fontWeight: '700', color: selisih === 0 ? '#168653' : '#D32F2F' }]}>
                      Selisih: {selisih === 0 ? 'Sesuai' : formatRupiah(selisih)}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>`],
]);

