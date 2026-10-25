import React, { useState, useMemo } from 'react';
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
import ComboBarLineChart from '../../components/owner/ComboBarLineChart';
import { FINANCIAL_REPORT_DATA } from '../../data/mockFinancialReport';
import { MASTER_EXPENSES } from '../../data/mockExpenses';
import { getCategoryBadge } from './MenuHargaScreen';

// Palet Warna Konsisten Khas Proyek Seblak Prasmanan
const WARNA = {
  merahTua: '#52141D',     // Brand Deep Maroon Identity
  merahCabe: '#C62828',    // Crimson Accent (Warna Tombol Login)
  merahJreng: '#DC2626',   // Merah Pengeluaran / Warning
  hijauLaba: '#168653',    // Hijau Success Laba Bersih
  kuningGold: '#F59E0B',   // Kuning Gold Accent
  goldTua: '#B45309',      // Gold Tua
  latar: '#F8F5F2',        // Background netral hangat
  kartu: '#FFFFFF',
  teks: '#2C1810',
  abu: '#78665E',
  garis: '#EDE5E0',
};

export default function LaporanKeuanganScreen({ isEmbedded = false, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // 1. Tab Periode: HANYA 3 PERIODE (Harian | Bulanan | Tahunan)
  // Default awal masuk fitur Laporan Keuangan: HARIAN
  const [activeTab, setActiveTab] = useState('harian');

  // 2. State Nilai Selector Periode
  const [harianValue, setHarianValue] = useState('16 Oktober 2026');
  const [bulananValue, setBulananValue] = useState('Oktober 2026');
  const [tahunanValue, setTahunanValue] = useState('2026');

  // State Modal
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // State Standalone Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Data Pengeluaran Hari Ini (Sesuai dengan Data Proyek di MASTER_EXPENSES)
  const selectedHarianExpenses = useMemo(() => {
    const matched = MASTER_EXPENSES.filter(
      (item) => item.tanggalStr === harianValue || item.tanggal === harianValue
    );
    if (matched && matched.length > 0) {
      return matched.map((item, idx) => ({
        id: item.id || `EXP-${idx}`,
        no: idx + 1,
        waktu: item.waktu || '08:00',
        keterangan: item.keterangan || 'Topping',
        kategori: item.kategori,
        jumlah: item.jumlah || 1,
        satuan: item.satuan || 'kg',
        total: item.total || 0,
      }));
    }
    const defaultData = FINANCIAL_REPORT_DATA.harian.rekapPengeluaranHarian || [];
    return defaultData;
  }, [harianValue]);

  const totalPengeluaranHarianTabel = useMemo(() => {
    return selectedHarianExpenses.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [selectedHarianExpenses]);

  // Ambil Data Laporan Berdasarkan Periode Terpilih
  const currentReport = useMemo(() => {
    const raw = FINANCIAL_REPORT_DATA[activeTab] || FINANCIAL_REPORT_DATA.harian;
    let label = harianValue;
    if (activeTab === 'bulanan') label = bulananValue;
    else if (activeTab === 'tahunan') label = tahunanValue;

    return {
      ...raw,
      periodeLabel: label,
      rekapPengeluaranHarian: selectedHarianExpenses,
    };
  }, [activeTab, harianValue, bulananValue, tahunanValue, selectedHarianExpenses]);

  const currentSelectorText = useMemo(() => {
    if (activeTab === 'harian') return harianValue;
    if (activeTab === 'bulanan') return bulananValue;
    return tahunanValue;
  }, [activeTab, harianValue, bulananValue, tahunanValue]);

  const handleSelectDate = (newVal) => {
    if (activeTab === 'harian') setHarianValue(newVal);
    else if (activeTab === 'bulanan') setBulananValue(newVal);
    else setTahunanValue(newVal);
  };

  // Header Title Sesuai Tab (Detail Harian, Detail Bulanan, Detail Tahunan)
  const headerDetailTitle = useMemo(() => {
    if (activeTab === 'harian') return 'Detail Harian';
    if (activeTab === 'bulanan') return 'Detail Bulanan';
    return 'Detail Tahunan';
  }, [activeTab]);

  // Emoji Topping
  const getToppingEmoji = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('sosis')) return '🥩';
    if (lower.includes('bakso')) return '🥟';
    if (lower.includes('ceker')) return '🍗';
    if (lower.includes('kerupuk')) return '🍘';
    if (lower.includes('makaroni')) return '🍝';
    return '🍲';
  };

  // ==========================================================================
  // KONTEN UTAMA HALAMAN LAPORAN KEUANGAN
  // ==========================================================================
  const content = (
    <View style={styles.mainContainer}>
      {/* STICKY HEADER SECTION: Detail Title, Printer, Tab Periode, & Tanggal (Tetap di posisinya saat di-scroll) */}
      <View style={styles.stickyHeaderSection}>
        {/* 1. TOP BAR SESUAI WIREFRAME GAMBAR: BACK ARROW, TITLE, & IKON PRINTER PREVIEW */}
        <View style={styles.subTopHeader}>
          <View style={styles.subTopLeft}>
            <Text style={styles.subTopTitle}>{headerDetailTitle}</Text>
          </View>

          {/* IKON PRINTER (AKSES PREVIEW LAPORAN) */}
          <TouchableOpacity
            style={styles.printIconBtn}
            onPress={() => setPreviewModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Buka Preview Laporan"
          >
            <Ionicons name="print-outline" size={20} color={WARNA.teks} />
          </TouchableOpacity>
        </View>

        {/* 2. TAB PERIODE (HANYA HARIAN | BULANAN | TAHUNAN) */}
        <View style={styles.tabPeriodWrapper}>
          <View style={styles.tabPeriodContainer}>
            <TouchableOpacity
              style={[
                styles.tabPeriodBtn,
                activeTab === 'harian' && styles.tabPeriodBtnActive,
              ]}
              onPress={() => setActiveTab('harian')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabPeriodText,
                  activeTab === 'harian' && styles.tabPeriodTextActive,
                ]}
              >
                Harian
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPeriodBtn,
                activeTab === 'bulanan' && styles.tabPeriodBtnActive,
              ]}
              onPress={() => setActiveTab('bulanan')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabPeriodText,
                  activeTab === 'bulanan' && styles.tabPeriodTextActive,
                ]}
              >
                Bulanan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPeriodBtn,
                activeTab === 'tahunan' && styles.tabPeriodBtnActive,
              ]}
              onPress={() => setActiveTab('tahunan')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabPeriodText,
                  activeTab === 'tahunan' && styles.tabPeriodTextActive,
                ]}
              >
                Tahunan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. SELECTOR PERIODE CARD */}
        <TouchableOpacity
          style={styles.dateFilterCard}
          onPress={() => setDatePickerVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Pilih periode laporan"
        >
          <View style={styles.dateFilterLeft}>
            <Ionicons name="calendar-outline" size={18} color="#55433B" />
            <Text style={styles.dateFilterText}>{currentSelectorText}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={WARNA.abu} />
        </TouchableOpacity>
      </View>

      {/* AREA SCROLLABLE: KEUANGAN, GRAFIK, DAN REKAP TABEL */}
      <ScrollView
        style={styles.bodyScrollArea}
        contentContainerStyle={styles.bodyScrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 4. SECTION 1: RINGKASAN KEUANGAN */}
        <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Ringkasan Keuangan</Text>

        {/* Banner Omzet Pelengkap */}
        <View style={styles.omzetBannerCard}>
          <View style={styles.omzetBannerLeft}>
            <View style={styles.omzetIconCircle}>
              <Ionicons name="cash-outline" size={18} color={WARNA.merahCabe} />
            </View>
            <View>
              <Text style={styles.omzetBannerLabel}>TOTAL OMZET</Text>
              <Text style={styles.omzetBannerAmount}>
                {formatCurrency(currentReport.summary.omzet)}
              </Text>
            </View>
          </View>
          <View style={styles.omzetBadgePill}>
            <Text style={styles.omzetBadgeText}>Pemasukan Kotor</Text>
          </View>
        </View>

        {/* Dua Card Berdampingan (Total Pengeluaran & Laba Bersih Sesuai Gambar) */}
        <View style={styles.dualCardRow}>
          {/* Card Kiri: Total Pengeluaran */}
          <View style={[styles.dualCard, styles.dualCardPengeluaran]}>
            <View style={styles.dualCardHeader}>
              <View style={[styles.dualCardIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="receipt-outline" size={16} color={WARNA.merahJreng} />
              </View>
              <Text style={styles.dualCardLabelPengeluaran}>Total Pengeluaran</Text>
            </View>
            <Text style={[styles.dualCardAmount, { color: WARNA.merahJreng }]}>
              {formatCurrency(currentReport.summary.pengeluaran)}
            </Text>
            <View style={styles.trendRow}>
              <Ionicons name="arrow-up" size={13} color={WARNA.merahJreng} />
              <Text style={[styles.trendText, { color: WARNA.merahJreng }]}>
                {activeTab === 'harian'
                  ? '12% vs kemarin'
                  : activeTab === 'bulanan'
                  ? '10% vs bulan lalu'
                  : '12% vs tahun lalu'}
              </Text>
            </View>
          </View>

          {/* Card Kanan: Laba Bersih */}
          <View style={[styles.dualCard, styles.dualCardLaba]}>
            <View style={styles.dualCardHeader}>
              <View style={[styles.dualCardIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="trending-up-outline" size={16} color={WARNA.hijauLaba} />
              </View>
              <Text style={styles.dualCardLabelLaba}>Laba Bersih</Text>
            </View>
            <Text style={[styles.dualCardAmount, { color: WARNA.hijauLaba }]}>
              {formatCurrency(currentReport.summary.labaBersih)}
            </Text>
            <View style={styles.trendRow}>
              <Ionicons name="arrow-up" size={13} color={WARNA.hijauLaba} />
              <Text style={[styles.trendText, { color: WARNA.hijauLaba }]}>
                {activeTab === 'harian'
                  ? '20% vs kemarin'
                  : activeTab === 'bulanan'
                  ? '18% vs bulan lalu'
                  : '18% vs tahun lalu'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 5. SECTION 2: GRAFIK KEUANGAN */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Grafik Keuangan</Text>

        <View style={styles.chartWrapperCard}>
          <ComboBarLineChart
            data={currentReport.chart}
            height={195}
            showLegend={true}
          />
        </View>
      </View>

      {/* 6. SECTION 3: PENGELUARAN TERBESAR (TOP 3) */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Pengeluaran Terbesar (Top 3)</Text>

        <View style={styles.topExpenseCardContainer}>
          {currentReport.topPengeluaran.slice(0, 3).map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.topExpenseRowItem,
                idx === 2 && styles.topExpenseRowItemLast,
              ]}
            >
              {/* Ranking Number */}
              <Text style={styles.expenseRankNum}>{item.rank.replace(/^0/, '')}</Text>

              {/* Emoji Icon Circle */}
              <View style={styles.foodEmojiBadge}>
                <Text style={styles.foodEmojiText}>{getToppingEmoji(item.nama)}</Text>
              </View>

              {/* Nama Topping */}
              <View style={styles.expenseNameCol}>
                <Text style={styles.expenseNameText} numberOfLines={1}>
                  {item.nama}
                </Text>
              </View>

              {/* Nominal & Persentase */}
              <Text style={styles.expenseNominalAndPct}>
                {formatCurrency(item.nominal)}{' '}
                <Text style={styles.expensePctText}>({item.persen}%)</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 7. SECTION 4: REKAP PERIODE & RINGKASAN */}
      <View style={styles.sectionBlock}>
        {activeTab === 'harian' ? (
          /* ========================================================== */
          /* KONDISI A: TAB HARIAN (RINGKASAN AKTIVITAS + REKAP HARIAN) */
          /* ========================================================== */
          <>
            {/* 1. Ringkasan Aktivitas Harian */}
            <Text style={styles.sectionHeading}>Ringkasan Aktivitas</Text>
            <View style={styles.activityGrid}>
              {currentReport.ringkasanAktivitas.map((act, idx) => {
                const iconNames = ['receipt-outline', 'cart-outline', 'cube-outline'];
                const iconColors = [WARNA.merahCabe, WARNA.goldTua, WARNA.hijauLaba];
                const bgColors = ['#FEE2E2', '#FEF3C7', '#DCFCE7'];
                return (
                  <View key={idx} style={styles.activityCard}>
                    <View style={[styles.activityIconCircle, { backgroundColor: bgColors[idx] }]}>
                      <Ionicons name={iconNames[idx]} size={16} color={iconColors[idx]} />
                    </View>
                    <Text style={styles.activityLabel}>{act.label}</Text>
                    <Text style={styles.activityValue}>{act.value}</Text>
                    <Text style={styles.activityUnit}>{act.unit}</Text>
                  </View>
                );
              })}
            </View>

            {/* 2. Rekap Harian (Tabel Pengeluaran Hari Ini Sesuai Data Proyek) */}
            <View style={{ marginTop: 18 }}>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionHeading}>Rekap Harian</Text>
                <Text style={styles.sectionHeadingSub}>
                  {harianValue} • {selectedHarianExpenses.length} Pembelian Topping
                </Text>
              </View>
              <View style={styles.tableCardContainer}>
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.tableHorizontalScroll}
                >
                  <View style={styles.tableInnerWrapper}>
                    {/* Header Kolom Tabel Pengeluaran */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.headerCellText, styles.colNo]}>No</Text>
                      <Text style={[styles.headerCellText, styles.colWaktu]}>Waktu</Text>
                      <Text style={[styles.headerCellText, styles.colTopping]}>List Topping</Text>
                      <Text style={[styles.headerCellText, styles.colJumlah]}>Jumlah</Text>
                      <Text style={[styles.headerCellText, styles.colTotal]}>Total Biaya</Text>
                    </View>

                    {/* Baris Data Pengeluaran Hari Ini */}
                    {selectedHarianExpenses.map((row, idx) => {
                      const catBadge = getCategoryBadge(row.kategori, row.keterangan);
                      return (
                        <View
                          key={row.id || idx}
                          style={[
                            styles.tableDataRow,
                            idx % 2 === 1 && styles.tableDataRowAlt,
                            idx === selectedHarianExpenses.length - 1 && styles.tableDataRowLast,
                          ]}
                        >
                          <Text style={[styles.dataCellText, styles.colNo, { color: WARNA.abu }]}>
                            {row.no || idx + 1}
                          </Text>
                          <Text style={[styles.dataCellText, styles.colWaktu, { color: WARNA.abu }]}>
                            {row.waktu}
                          </Text>
                          <View style={styles.colToppingWrapper}>
                            <Text
                              style={[styles.dataCellText, styles.boldCellText, styles.colToppingText]}
                            >
                              {row.keterangan}
                            </Text>
                            <View style={[styles.categoryBadge, { backgroundColor: catBadge.bg }]}>
                              <Text style={[styles.categoryBadgeText, { color: catBadge.color }]}>
                                {catBadge.label}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.dataCellText, styles.colJumlah, { color: '#55453E' }]}>
                            {row.jumlah} {row.satuan || 'kg'}
                          </Text>
                          <Text
                            style={[
                              styles.dataCellText,
                              styles.boldCellText,
                              styles.colTotal,
                              { color: WARNA.merahJreng },
                            ]}
                          >
                            {formatCurrency(row.total)}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Footer Total Pengeluaran Hari Ini */}
                    <View style={styles.tableFooterRow}>
                      <Text style={styles.tableFooterLabel}>
                        Total Pengeluaran ({selectedHarianExpenses.length} Pembelian)
                      </Text>
                      <Text style={styles.tableFooterValue}>
                        {formatCurrency(totalPengeluaranHarianTabel)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </>
        ) : activeTab === 'bulanan' ? (
          /* ========================================================== */
          /* KONDISI B: TAB BULANAN (REKAP MINGGUAN + RINGKASAN BULANAN) */
          /* ========================================================== */
          <>
            {/* 1. Rekap Mingguan Table */}
            <Text style={styles.sectionHeading}>Rekap Mingguan</Text>
            <View style={styles.tableCardContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerCellText, { flex: 1.4 }]}>Minggu</Text>
                <Text style={[styles.headerCellText, { flex: 1.3, textAlign: 'right' }]}>
                  Pengeluaran
                </Text>
                <Text style={[styles.headerCellText, { flex: 1.3, textAlign: 'right' }]}>
                  Laba Bersih
                </Text>
              </View>

              {currentReport.rekapTabel.map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableDataRow,
                    idx % 2 === 1 && styles.tableDataRowAlt,
                    idx === currentReport.rekapTabel.length - 1 && styles.tableDataRowLast,
                  ]}
                >
                  <Text style={[styles.dataCellText, styles.boldCellText, { flex: 1.4 }]}>
                    {row.periode.replace(/\s*\(.*?\)/, '')}
                  </Text>
                  <Text style={[styles.dataCellText, { flex: 1.3, textAlign: 'right', color: WARNA.merahJreng, fontWeight: '700' }]}>
                    {formatCurrency(row.pengeluaran)}
                  </Text>
                  <Text style={[styles.dataCellText, styles.boldCellText, { flex: 1.3, textAlign: 'right', color: WARNA.hijauLaba }]}>
                    {formatCurrency(row.labaBersih)}
                  </Text>
                </View>
              ))}
            </View>

            {/* 2. Ringkasan Bulanan */}
            <View style={{ marginTop: 18 }}>
              <Text style={styles.sectionHeading}>Ringkasan Bulanan</Text>
              <View style={styles.activityGrid}>
                {currentReport.ringkasanBulanan.map((act, idx) => {
                  const iconNames = ['receipt-outline', 'cube-outline', 'trophy-outline'];
                  const iconColors = [WARNA.merahCabe, WARNA.hijauLaba, WARNA.goldTua];
                  const bgColors = ['#FEE2E2', '#DCFCE7', '#FEF3C7'];
                  return (
                    <View key={idx} style={styles.activityCard}>
                      <View style={[styles.activityIconCircle, { backgroundColor: bgColors[idx] }]}>
                        <Ionicons name={iconNames[idx]} size={16} color={iconColors[idx]} />
                      </View>
                      <Text style={styles.activityLabel}>{act.label}</Text>
                      <Text style={styles.activityValue}>{act.value}</Text>
                      <Text style={styles.activityUnit}>{act.unit}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          /* ========================================================== */
          /* KONDISI C: TAB TAHUNAN (REKAP BULANAN + RINGKASAN TAHUN INI) */
          /* ========================================================== */
          <>
            <Text style={styles.sectionHeading}>Rekap Bulanan</Text>
            <View style={styles.tableCardContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerCellText, { flex: 1.4 }]}>Bulan</Text>
                <Text style={[styles.headerCellText, { flex: 1.3, textAlign: 'right' }]}>
                  Pengeluaran
                </Text>
                <Text style={[styles.headerCellText, { flex: 1.3, textAlign: 'right' }]}>
                  Laba Bersih
                </Text>
              </View>

              {currentReport.rekapTabel.map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableDataRow,
                    idx % 2 === 1 && styles.tableDataRowAlt,
                    idx === currentReport.rekapTabel.length - 1 && styles.tableDataRowLast,
                  ]}
                >
                  <Text style={[styles.dataCellText, styles.boldCellText, { flex: 1.4 }]}>
                    {row.periode.replace(/\s*2026/, '')}
                  </Text>
                  <Text style={[styles.dataCellText, { flex: 1.3, textAlign: 'right', color: WARNA.merahJreng, fontWeight: '700' }]}>
                    {formatCurrency(row.pengeluaran)}
                  </Text>
                  <Text style={[styles.dataCellText, styles.boldCellText, { flex: 1.3, textAlign: 'right', color: WARNA.hijauLaba }]}>
                    {formatCurrency(row.labaBersih)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Ringkasan Tahun Ini */}
            <View style={{ marginTop: 18 }}>
              <Text style={styles.sectionHeading}>Ringkasan Tahun Ini</Text>
              <View style={styles.dualCardRow}>
                <View style={[styles.dualCard, { backgroundColor: '#FFFFFF', borderColor: '#EDE5E0' }]}>
                  <View style={styles.dualCardHeader}>
                    <View style={[styles.dualCardIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="trophy-outline" size={16} color={WARNA.goldTua} />
                    </View>
                    <Text style={[styles.dualCardLabelPengeluaran, { color: WARNA.goldTua }]}>
                      Bulan Terbaik
                    </Text>
                  </View>
                  <Text style={[styles.dualCardAmount, { fontSize: 15, color: '#2C1810' }]}>
                    Okt 2026
                  </Text>
                  <Text style={[styles.trendText, { color: WARNA.hijauLaba, marginTop: 2 }]}>
                    Omzet Rp 25.460.000
                  </Text>
                </View>

                <View style={[styles.dualCard, { backgroundColor: '#FFFFFF', borderColor: '#EDE5E0' }]}>
                  <View style={styles.dualCardHeader}>
                    <View style={[styles.dualCardIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="flame-outline" size={16} color={WARNA.merahJreng} />
                    </View>
                    <Text style={styles.dualCardLabelPengeluaran}>Pengeluaran Terbesar</Text>
                  </View>
                  <Text style={[styles.dualCardAmount, { fontSize: 15, color: '#2C1810' }]}>
                    Sep 2026
                  </Text>
                  <Text style={[styles.trendText, { color: WARNA.merahJreng, marginTop: 2 }]}>
                    Rp 8.150.000
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
        </View>
      </ScrollView>

      {/* MODAL DATE PICKER */}
      <LaporanDatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        mode={activeTab}
        currentValue={currentSelectorText}
        onSelectDate={handleSelectDate}
      />

      {/* MODAL PREVIEW DOKUMEN LAPORAN & CETAK PDF */}
      <PreviewLaporanModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        reportData={currentReport}
      />
    </View>
  );

  // Jika di-embed ke dalam DashboardOwnerScreen
  if (isEmbedded) {
    return content;
  }

  // Jika dibuka sebagai Halaman Standalone
  return (
    <View style={styles.standaloneRoot}>
      {!isMobile && sidebarOpen && (
        <Sidebar
          role="owner"
          activeTab="laporan_keuangan"
          setActiveTab={(tab) => {
            if (navigation) navigation.navigate(tab);
          }}
          isMobile={false}
        />
      )}

      {isMobile && sidebarOpen && (
        <View style={styles.mobileBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
          />
          <Sidebar
            role="owner"
            activeTab="laporan_keuangan"
            setActiveTab={(tab) => {
              setSidebarOpen(false);
              if (navigation) navigation.navigate(tab);
            }}
            isMobile={true}
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}

      <View style={styles.standaloneWrapper}>
        <TopHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
          title="Owner Portal · Laporan Keuangan"
          role="Owner"
        />
        <View style={styles.standaloneMainArea}>
          {content}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  standaloneRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: WARNA.latar,
  },
  standaloneWrapper: {
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  standaloneMainArea: {
    flex: 1,
    backgroundColor: WARNA.latar,
  },
  embeddedContainer: {
    flex: 1,
    backgroundColor: WARNA.latar,
  },
  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    flexDirection: 'row',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: WARNA.latar,
  },
  stickyHeaderSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: WARNA.latar,
    zIndex: 10,
  },
  bodyScrollArea: {
    flex: 1,
  },
  bodyScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Sub Top Header
  subTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subTopTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.2,
  },
  printIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 2. Tab Periode Segmented Control (Hanya Harian | Bulanan | Tahunan)
  tabPeriodWrapper: {
    marginBottom: 10,
  },
  tabPeriodContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    gap: 4,
  },
  tabPeriodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabPeriodBtnActive: {
    backgroundColor: WARNA.merahCabe,
    shadowColor: WARNA.merahCabe,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  tabPeriodText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.abu,
  },
  tabPeriodTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 3. Date Filter Card
  dateFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  dateFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },

  // Section Blocks
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 8,
  },
  sectionHeadingRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  grafikBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FBEAEC',
  },
  grafikBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: WARNA.merahCabe,
  },

  // Banner Omzet
  omzetBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  omzetBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  omzetIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FBEAEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  omzetBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78665E',
    letterSpacing: 0.3,
  },
  omzetBannerAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: WARNA.merahTua,
  },
  omzetBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FAF5F3',
  },
  omzetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78665E',
  },

  // Dual Cards (Total Pengeluaran & Laba Bersih)
  dualCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dualCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dualCardPengeluaran: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FEE2E2',
  },
  dualCardLaba: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  dualCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dualCardIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dualCardLabelPengeluaran: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
  },
  dualCardLabelLaba: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
  },
  dualCardAmount: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Chart Wrapper
  chartWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Pengeluaran Terbesar (Top 3)
  topExpenseCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    overflow: 'hidden',
  },
  topExpenseRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE7',
    gap: 10,
  },
  topExpenseRowItemLast: {
    borderBottomWidth: 0,
  },
  expenseRankNum: {
    width: 14,
    fontSize: 12,
    fontWeight: '800',
    color: '#78665E',
    textAlign: 'center',
  },
  foodEmojiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmojiText: {
    fontSize: 14,
  },
  expenseNameCol: {
    flex: 1,
  },
  expenseNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  expenseNominalAndPct: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.merahJreng,
  },
  expensePctText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78665E',
  },

  // Ringkasan Aktivitas / Bulanan
  activityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    padding: 10,
    alignItems: 'center',
  },
  activityIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78665E',
    textAlign: 'center',
    marginBottom: 2,
  },
  activityValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2C1810',
  },
  activityUnit: {
    fontSize: 9,
    color: '#A69A90',
  },

  // Table Card Container
  tableCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8DCD4',
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE7',
  },
  tableDataRowAlt: {
    backgroundColor: '#FAF7F5',
  },
  tableDataRowHighlight: {
    backgroundColor: '#FDF2F4',
  },
  tableDataRowLast: {
    borderBottomWidth: 0,
  },
  dataCellText: {
    fontSize: 12,
    color: '#2C1810',
  },
  boldCellText: {
    fontWeight: '700',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeadingSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78665E',
  },
  tableHorizontalScroll: {
    minWidth: 540,
    flexGrow: 1,
  },
  tableInnerWrapper: {
    minWidth: 540,
    flex: 1,
  },
  colNo: {
    width: 28,
    textAlign: 'center',
  },
  colWaktu: {
    width: 50,
    textAlign: 'center',
  },
  colTopping: {
    flex: 1,
    minWidth: 240,
    paddingHorizontal: 6,
    textAlign: 'left',
  },
  colToppingWrapper: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  colToppingText: {
    fontSize: 12,
    color: '#2C1810',
    flexShrink: 0,
  },
  colJumlah: {
    width: 75,
    textAlign: 'center',
  },
  colTotal: {
    width: 90,
    textAlign: 'right',
    paddingRight: 4,
  },
  tableFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F4F0',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#E8DCD4',
    minWidth: 540,
  },
  tableFooterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },
  tableFooterValue: {
    fontSize: 12,
    fontWeight: '900',
    color: WARNA.merahTua,
  },

  // Top 3 Topping Card List
  topToppingCardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    overflow: 'hidden',
  },
  toppingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE7',
    gap: 10,
  },
  toppingItemRowLast: {
    borderBottomWidth: 0,
  },
  toppingRankIndex: {
    width: 14,
    fontSize: 12,
    fontWeight: '800',
    color: '#78665E',
    textAlign: 'center',
  },
  toppingEmojiBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FDF7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toppingNameText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  toppingPorsiText: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.hijauLaba,
  },
});
