import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import LaporanDatePickerModal from '../../components/owner/LaporanDatePickerModal';
import PreviewLaporanModal from '../../components/owner/PreviewLaporanModal';
import { getFinancialReport } from '../../services/laporanService';

// Palet Warna Elegan Khas Proyek Seblak Prasmanan
const WARNA = {
  merahTua: '#52141D',     // Brand Deep Maroon
  merahCabe: '#C62828',    // Crimson Accent (Tombol Aktif / Cetak)
  merahJreng: '#DC2626',   // Merah Pengeluaran
  hijauLaba: '#168653',    // Hijau Sukses Laba & Omzet
  kuningGold: '#F59E0B',   // Kuning Gold Bintang & Ranking
  latar: '#F8F5F2',        // Background netral hangat
  kartu: '#FFFFFF',        // Background putih kartu
  teks: '#2C1810',         // Teks utama
  abu: '#78665E',          // Teks sekunder
  garis: '#EDE5E0',        // Garis batas
};

export default function LaporanKeuanganScreen({ isEmbedded = false, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // View state: 'main' | 'detail_pemasukan' | 'detail_pengeluaran'
  const [viewMode, setViewMode] = useState('main');

  // Tab Periode: 'harian' | 'bulanan' | 'tahunan'
  const [activeTab, setActiveTab] = useState('harian');

  // Selector value state
  const [harianDate, setHarianDate] = useState(() => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [bulananDate, setBulananDate] = useState('Oktober 2026');
  const [tahunanDate, setTahunanDate] = useState('2026');

  // State Modal
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // State Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Ambil label selector saat ini
  const currentSelectorText = useMemo(() => {
    if (activeTab === 'harian') return harianDate;
    if (activeTab === 'bulanan') return bulananDate;
    return tahunanDate;
  }, [activeTab, harianDate, bulananDate, tahunanDate]);

  // Laporan dihitung dari transaksi dan pengeluaran Supabase, bukan data simulasi.
  const [reportData, setReportData] = useState({ summary: { omzet: 0, pengeluaran: 0, labaBersih: 0 }, pemasukan: [], pengeluaran: [], topPengeluaran: [] });
  const [reportLoading, setReportLoading] = useState(false);
  useEffect(() => {
    let active = true;
    const monthMap = { januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06', juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12' };
    const parsePeriod = () => {
      if (activeTab === 'harian') {
        const m = currentSelectorText.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (!m) return {};
        const mm = monthMap[m[2].toLowerCase()];
        const day = `${m[3]}-${mm}-${m[1].padStart(2, '0')}`;
        return { from: day, to: day };
      }
      if (activeTab === 'bulanan') {
        const m = currentSelectorText.match(/([A-Za-z]+)\s+(\d{4})/);
        if (!m) return {};
        const mm = monthMap[m[1].toLowerCase()];
        const last = new Date(Number(m[2]), Number(mm), 0).getDate();
        return { from: `${m[2]}-${mm}-01`, to: `${m[2]}-${mm}-${last}` };
      }
      const year = String(currentSelectorText).match(/\d{4}/)?.[0];
      return year ? { from: `${year}-01-01`, to: `${year}-12-31` } : {};
    };
    setReportLoading(true);
    getFinancialReport(parsePeriod()).then((data) => {
      if (!active) return;
      const pemasukan = data.transaksi.map((r, i) => ({ no: i + 1, waktu: new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), kasir: r.nama_kasir, totalTransaksi: Number(r.total), metodePembayaran: r.metode_pembayaran, nomor: r.nomor_transaksi }));
      const pengeluaran = data.pengeluaran.map((r, i) => ({ no: i + 1, tanggal: r.tanggal, nama: r.nama, keterangan: r.nama, kategori: r.kategori, total: Number(r.nominal), nominal: Number(r.nominal) }));
      const byCategory = {};
      pengeluaran.forEach((r) => { byCategory[r.kategori] = (byCategory[r.kategori] || 0) + r.total; });
      const topPengeluaran = Object.entries(byCategory).map(([nama, total]) => ({ nama, total })).sort((a, b) => b.total - a.total).slice(0, 5);
      setReportData({ summary: { omzet: data.totalOmzet, pengeluaran: data.totalPengeluaran, labaBersih: data.labaBersih }, pemasukan, pengeluaran, topPengeluaran });
    }).catch((error) => console.error('Gagal memuat laporan Supabase:', error.message)).finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [activeTab, currentSelectorText]);

  const handleSelectDate = (newVal) => {
    if (activeTab === 'harian') setHarianDate(newVal);
    else if (activeTab === 'bulanan') setBulananDate(newVal);
    else setTahunanDate(newVal);
  };

  // =========================================================================
  // 1. TAMPILAN UTAMA (RINGKASAN KEUANGAN)
  // =========================================================================
  const renderMainView = () => (
    <View style={styles.viewContainer}>
      {/* 1. HEADER JUDUL & TOMBOL CETAK LAPORAN BERDAMPINGAN TANPA IKON KIRI */}
      <View style={styles.titleRow}>
        <View style={styles.titleWithBtnGroup}>
          <Text style={styles.mainTitleText}>Laporan Keuangan</Text>

          <TouchableOpacity
            style={styles.cetakLaporanBtn}
            onPress={() => setPreviewModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="print-outline" size={17} color={WARNA.merahCabe} style={{ marginRight: 6 }} />
            <Text style={styles.cetakLaporanBtnText}>Cetak Laporan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. TABS PERIODE: HARIAN | BULANAN | TAHUNAN */}
      <View style={styles.tabPeriodWrapper}>
        <TouchableOpacity
          style={[styles.tabPeriodBtn, activeTab === 'harian' && styles.tabPeriodBtnActive]}
          onPress={() => setActiveTab('harian')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={activeTab === 'harian' ? '#FFFFFF' : '#55433B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabPeriodText, activeTab === 'harian' && styles.tabPeriodTextActive]}>
            Harian
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPeriodBtn, activeTab === 'bulanan' && styles.tabPeriodBtnActive]}
          onPress={() => setActiveTab('bulanan')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'bulanan' ? '#FFFFFF' : '#55433B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabPeriodText, activeTab === 'bulanan' && styles.tabPeriodTextActive]}>
            Bulanan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPeriodBtn, activeTab === 'tahunan' && styles.tabPeriodBtnActive]}
          onPress={() => setActiveTab('tahunan')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'tahunan' ? '#FFFFFF' : '#55433B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabPeriodText, activeTab === 'tahunan' && styles.tabPeriodTextActive]}>
            Tahunan
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. SELECTOR PERIODE CARD */}
      <TouchableOpacity
        style={styles.dateSelectorCard}
        onPress={() => setDatePickerVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dateSelectorLeft}>
          <Ionicons name="calendar-outline" size={18} color="#55433B" style={{ marginRight: 8 }} />
          <Text style={styles.dateSelectorText}>{currentSelectorText}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={WARNA.abu} />
      </TouchableOpacity>

      {/* 4. SECTION: RINGKASAN KEUANGAN (3 STAT CARDS) */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="newspaper-outline" size={17} color={WARNA.abu} style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitleText}>Ringkasan Keuangan</Text>
      </View>

      <View style={styles.statCardsRow}>
        {/* Card 1: Total Omzet */}
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="layers" size={18} color={WARNA.hijauLaba} />
            </View>
            <Text style={styles.statCardLabel}>Total Omzet</Text>
          </View>
          <Text style={[styles.statCardValue, { color: WARNA.hijauLaba }]}>
            {formatCurrency(reportData.summary.omzet)}
          </Text>
        </View>

        {/* Card 2: Total Pengeluaran */}
        <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="wallet" size={18} color={WARNA.merahJreng} />
            </View>
            <Text style={styles.statCardLabel}>Total Pengeluaran</Text>
          </View>
          <Text style={[styles.statCardValue, { color: WARNA.merahJreng }]}>
            {formatCurrency(reportData.summary.pengeluaran)}
          </Text>
        </View>

        {/* Card 3: Laba Bersih */}
        <View style={[styles.statCard, { backgroundColor: '#52141D', borderColor: '#52141D' }]}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
              <Ionicons name="trophy" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.statCardLabel, { color: '#FBEAEC' }]}>Laba Bersih</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#FFFFFF' }]}>
            {formatCurrency(reportData.summary.labaBersih)}
          </Text>
        </View>
      </View>

      {/* 5. DUA ACTION BUTTONS: DETAIL PEMASUKAN & DETAIL PENGELUARAN */}
      <View style={styles.detailActionsRow}>
        <TouchableOpacity
          style={styles.detailPemasukanBtn}
          onPress={() => setViewMode('detail_pemasukan')}
          activeOpacity={0.8}
        >
          <View style={styles.detailBtnLeft}>
            <Ionicons name="bar-chart" size={18} color={WARNA.merahTua} style={{ marginRight: 8 }} />
            <Text style={styles.detailPemasukanBtnText}>Detail Pemasukan</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailPengeluaranBtn}
          onPress={() => setViewMode('detail_pengeluaran')}
          activeOpacity={0.8}
        >
          <View style={styles.detailBtnLeft}>
            <Ionicons name="newspaper-outline" size={18} color={WARNA.merahTua} style={{ marginRight: 8 }} />
            <Text style={styles.detailPengeluaranBtnText}>Detail Pengeluaran</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 6. TOP 3 PENGELUARAN TERBESAR */}
      <View style={styles.topExpenseCard}>
        <View style={styles.topExpenseHeader}>
          <View style={styles.topExpenseTitleGroup}>
            <Ionicons name="star" size={18} color={WARNA.kuningGold} style={{ marginRight: 6 }} />
            <Text style={styles.topExpenseTitleText}>Top 3 Pengeluaran Terbesar</Text>
          </View>
        </View>

        <View style={styles.topExpenseList}>
          {reportData.topPengeluaran.map((item, idx) => (
            <View key={idx} style={styles.topExpenseRow}>
              <View style={[styles.rankCircle, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3]}>
                <Text style={styles.rankNumText}>{item.rank}</Text>
              </View>

              <Text style={styles.topExpenseNameText} numberOfLines={1}>
                {item.nama}
              </Text>

              <View style={styles.progressBarWrapper}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(10, Math.min(100, item.proporsi || 40))}%` },
                  ]}
                />
              </View>

              <Text style={styles.topExpenseNominalText}>
                {formatCurrency(item.nominal)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // =========================================================================
  // 2. TAMPILAN DETAIL PEMASUKAN
  // * Tabel membentang penuh 100% tanpa celah kosong di kanan
  // * Scroll pada isi tabel internal (bukan scroll seluruh layar ke bawah)
  // * Tombol Kembali diposisikan di bawah tabel sesuai instruksi user
  // =========================================================================
  const renderDetailPemasukanView = () => (
    <View style={styles.viewContainer}>
      {/* Subheader: Judul di kiri dan Badge Tanggal di kanan */}
      <View style={styles.detailSubheaderRow}>
        <Text style={styles.detailSubheaderTitle}>Detail Pemasukan</Text>

        <View style={styles.dateBadgePill}>
          <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.dateBadgeText}>{currentSelectorText}</Text>
        </View>
      </View>

      {/* Tabel Transaksi Kasir Full Width dengan Inner Scroll */}
      <View style={styles.detailTableCard}>
        <View style={styles.detailTableBanner}>
          <Ionicons name="bar-chart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.detailTableBannerTitle}>Detail Transaksi Kasir</Text>
        </View>

        <View style={styles.tableFullWidthWrapper}>
          {/* Header Kolom Fixed */}
          <View style={styles.thRow}>
            <Text style={[styles.thCell, { flex: 0.5, textAlign: 'center' }]}>No</Text>
            <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Waktu</Text>
            <Text style={[styles.thCell, { flex: 2.2, paddingLeft: 8 }]}>Kasir</Text>
            <Text style={[styles.thCell, { flex: 1.8, textAlign: 'right' }]}>Total Transaksi</Text>
            <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Metode Pembayaran</Text>
          </View>

          {/* Area Data yang discroll secara internal */}
          <ScrollView
            style={styles.innerTableScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {reportData.pemasukan.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tdRow,
                  idx % 2 === 1 && styles.tdRowAlt,
                ]}
              >
                <Text style={[styles.tdCell, { flex: 0.5, textAlign: 'center', color: WARNA.abu }]}>
                  {item.no || idx + 1}
                </Text>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: WARNA.abu }]}>
                  {item.waktu}
                </Text>
                <Text style={[styles.tdCell, { flex: 2.2, fontWeight: '600', paddingLeft: 8 }]}>
                  {item.kasir}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.8, textAlign: 'right', fontWeight: '700' }]}>
                  {formatCurrency(item.totalTransaksi)}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'center', color: '#55433B' }]}>
                  {item.metodePembayaran}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Footer Total Fixed */}
          <View style={styles.tfootRow}>
            <Text style={styles.tfootLabel}>Total Jumlah Transaksi</Text>
            <Text style={[styles.tfootValue, { color: WARNA.hijauLaba }]}>
              {formatCurrency(reportData.summary.omzet)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tombol Kembali di Bawah Tabel */}
      <View style={styles.bottomNavRow}>
        <TouchableOpacity
          style={styles.kembaliBtnBottom}
          onPress={() => setViewMode('main')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={17} color={WARNA.merahCabe} style={{ marginRight: 6 }} />
          <Text style={styles.kembaliBtnBottomText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =========================================================================
  // 3. TAMPILAN DETAIL PENGELUARAN
  // * Tabel membentang penuh 100% tanpa celah kosong di kanan
  // * Scroll pada isi tabel internal (bukan scroll seluruh layar ke bawah)
  // * Tombol Kembali diposisikan di bawah tabel
  // =========================================================================
  const renderDetailPengeluaranView = () => (
    <View style={styles.viewContainer}>
      {/* Subheader: Judul di kiri dan Badge Tanggal di kanan */}
      <View style={styles.detailSubheaderRow}>
        <Text style={styles.detailSubheaderTitle}>Detail Pengeluaran / Restok</Text>

        <View style={styles.dateBadgePill}>
          <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.dateBadgeText}>{currentSelectorText}</Text>
        </View>
      </View>

      {/* Tabel Pengeluaran Full Width dengan Inner Scroll */}
      <View style={styles.detailTableCard}>
        <View style={styles.detailTableBanner}>
          <Ionicons name="newspaper-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.detailTableBannerTitle}>Detail Pengeluaran</Text>
        </View>

        <View style={styles.tableFullWidthWrapper}>
          {/* Header Kolom Fixed */}
          <View style={styles.thRow}>
            <Text style={[styles.thCell, { flex: 0.5, textAlign: 'center' }]}>No</Text>
            <Text style={[styles.thCell, { flex: 1.1, textAlign: 'center' }]}>Waktu</Text>
            <Text style={[styles.thCell, { flex: 2.2, paddingLeft: 8 }]}>Keterangan</Text>
            <Text style={[styles.thCell, { flex: 1.7, textAlign: 'center' }]}>Supplier</Text>
            <Text style={[styles.thCell, { flex: 1.2, textAlign: 'center', paddingRight: 12 }]}>Jumlah</Text>
            <Text style={[styles.thCell, { flex: 1.8, textAlign: 'right', paddingRight: 8 }]}>Nominal</Text>
          </View>

          {/* Area Data yang discroll secara internal */}
          <ScrollView
            style={styles.innerTableScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {reportData.pengeluaran.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tdRow,
                  idx % 2 === 1 && styles.tdRowAlt,
                ]}
              >
                <Text style={[styles.tdCell, { flex: 0.5, textAlign: 'center', color: WARNA.abu }]}>
                  {item.no || idx + 1}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.1, textAlign: 'center', color: WARNA.abu }]}>
                  {item.waktu}
                </Text>
                <Text style={[styles.tdCell, { flex: 2.2, fontWeight: '600', paddingLeft: 8 }]}>
                  {item.keterangan}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.7, textAlign: 'center', color: '#55433B' }]}>
                  {item.supplier}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'center', color: '#55433B', paddingRight: 12 }]}>
                  {item.jumlah} {item.satuan || ''}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.8, textAlign: 'right', fontWeight: '700', paddingRight: 8 }]}>
                  {formatCurrency(item.nominal || item.total)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Footer Total Fixed */}
          <View style={styles.tfootRow}>
            <Text style={styles.tfootLabel}>Total Pengeluaran</Text>
            <Text style={[styles.tfootValue, { color: WARNA.merahJreng }]}>
              {formatCurrency(reportData.summary.pengeluaran)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tombol Kembali di Bawah Tabel */}
      <View style={styles.bottomNavRow}>
        <TouchableOpacity
          style={styles.kembaliBtnBottom}
          onPress={() => setViewMode('main')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={17} color={WARNA.merahCabe} style={{ marginRight: 6 }} />
          <Text style={styles.kembaliBtnBottomText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Konten Utama
  const content = (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={true}
      >
        {viewMode === 'main' && renderMainView()}
        {viewMode === 'detail_pemasukan' && renderDetailPemasukanView()}
        {viewMode === 'detail_pengeluaran' && renderDetailPengeluaranView()}
      </ScrollView>

      {/* Date Picker Modal */}
      <LaporanDatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        mode={activeTab}
        currentValue={currentSelectorText}
        onSelectDate={handleSelectDate}
      />

      {/* Preview Laporan Modal */}
      <PreviewLaporanModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        reportData={reportData}
      />
    </View>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <View style={styles.container}>
      {!isMobile && sidebarOpen && (
        <Sidebar
          role="owner"
          activeTab="laporan_keuangan"
          setActiveTab={(tab) => {
            if (tab === 'dashboard' && navigation) navigation.navigate('DashboardOwner');
          }}
          isMobile={false}
        />
      )}

      <View style={styles.mainWrapper}>
        <TopHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
          title="Owner Portal ΓÇó Laporan Keuangan"
          role="Owner"
        />
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARNA.latar,
    flexDirection: 'row',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  viewContainer: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },

  // Title Row & Cetak Button Berdampingan
  titleRow: {
    marginBottom: 16,
  },
  titleWithBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  mainTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: WARNA.teks,
  },
  cetakLaporanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D7D2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cetakLaporanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.teks,
  },

  // Tabs Periode
  tabPeriodWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tabPeriodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabPeriodBtnActive: {
    backgroundColor: WARNA.merahCabe,
    borderColor: WARNA.merahCabe,
  },
  tabPeriodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#55433B',
  },
  tabPeriodTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Date Selector
  dateSelectorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 18,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: WARNA.teks,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: WARNA.teks,
  },

  // Stat Cards (Ringkasan Keuangan)
  statCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardLabel: {
    fontSize: 12,
    color: WARNA.abu,
    fontWeight: '600',
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Detail Action Buttons Row
  detailActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailPemasukanBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: WARNA.merahTua,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
  },
  detailPengeluaranBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: WARNA.merahTua,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
  },
  detailBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailPemasukanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: WARNA.merahTua,
  },
  detailPengeluaranBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: WARNA.merahTua,
  },

  // Top 3 Pengeluaran Terbesar Card
  topExpenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    padding: 16,
  },
  topExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topExpenseTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topExpenseTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: WARNA.teks,
  },
  topExpenseList: {
    gap: 14,
  },
  topExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank1: {
    backgroundColor: '#F59E0B',
  },
  rank2: {
    backgroundColor: '#D1D5DB',
  },
  rank3: {
    backgroundColor: '#EA580C',
  },
  rankNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topExpenseNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.teks,
    width: 130,
  },
  progressBarWrapper: {
    flex: 1,
    height: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F87171',
    borderRadius: 5,
  },
  topExpenseNominalText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.merahJreng,
    width: 90,
    textAlign: 'right',
  },

  // Subheader Detail View
  detailSubheaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailSubheaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: WARNA.teks,
  },
  dateBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.merahTua,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Detail Table Card (Full Width & Inner Scroll)
  detailTableCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    overflow: 'hidden',
    marginBottom: 18,
  },
  detailTableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.merahTua,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  detailTableBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableFullWidthWrapper: {
    width: '100%',
  },
  innerTableScroll: {
    maxHeight: 380,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F5F2',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
  },
  thCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78665E',
  },
  tdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
  },
  tdRowAlt: {
    backgroundColor: '#FAF7F5',
  },
  tdCell: {
    fontSize: 12.5,
    color: '#2C1810',
  },
  tfootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#F8F5F2',
    borderTopWidth: 1,
    borderTopColor: '#EDE5E0',
  },
  tfootLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B3830',
  },
  tfootValue: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Bottom Navigation Row
  bottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 6,
    marginBottom: 20,
  },
  kembaliBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  kembaliBtnBottomText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.merahCabe,
  },
});