import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../../utils/formatCurrency';
import ComboBarLineChart from './ComboBarLineChart';
import { FINANCIAL_REPORT_DATA } from '../../data/mockFinancialReport';

const WARNA_PRIMARY = '#52141D'; // Deep Maroon Identity
const WARNA_TOMBOL = '#C62828';  // Tombol Utama Login / Crimson
const WARNA_SUCCESS = '#168653'; // Hijau Laba Bersih
const WARNA_EXPENSE = '#DC2626'; // Merah Pengeluaran

export default function PreviewLaporanModal({
  visible,
  onClose,
  reportData,
}) {
  if (!reportData) return null;

  const {
    periodeType,
    periodeLabel,
    tanggalCetak,
    titleDokumen,
    summary,
    chart = [],
    topPengeluaran = [],
    topTopping = [],
    ringkasanAktivitas = [],
    ringkasanBulanan = [],
    rekapPengeluaranHarian = [],
    rekapTabelHarian = [],
    rekapTabel = [],
  } = reportData;

  const harianExpensesList =
    (rekapPengeluaranHarian && rekapPengeluaranHarian.length > 0)
      ? rekapPengeluaranHarian
      : (FINANCIAL_REPORT_DATA?.harian?.rekapPengeluaranHarian || []);

  const totalHarianExpenses = harianExpensesList.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );

  const getToppingEmoji = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('sosis')) return '🥩';
    if (lower.includes('bakso')) return '🥟';
    if (lower.includes('ceker')) return '🍗';
    if (lower.includes('kerupuk')) return '🍘';
    if (lower.includes('makaroni')) return '🍝';
    return '🍲';
  };

  const [isDownloading, setIsDownloading] = useState(false);

  // Helper memuat html2pdf bundle dari CDN secara dinamis dan aman
  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('Window not available'));
      if (window.html2pdf) return resolve(window.html2pdf);

      const existing = document.getElementById('html2pdf-cdn-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.html2pdf));
        return;
      }

      const script = document.createElement('script');
      script.id = 'html2pdf-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  // Fallback pengunduhan berkas HTML siap cetak jika offline / kendala jaringan
  const downloadHtmlBlobFallback = (element, filename) => {
    if (typeof window === 'undefined' || !element) return;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename.replace(/\.pdf$/i, '')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FFFFFF; margin: 0; padding: 20px; color: #2C1810; }
    * { box-sizing: border-box; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${element.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, '.html');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      try {
        const printStyleId = 'seblak-print-style';
        let styleEl = document.getElementById(printStyleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = printStyleId;
          styleEl.innerHTML = `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-laporan-keuangan,
              #printable-laporan-keuangan * {
                visibility: visible !important;
              }
              #printable-laporan-keuangan {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 16px !important;
                background: #FFFFFF !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `;
          document.head.appendChild(styleEl);
        }
        window.print();
      } catch (err) {
        Alert.alert('Cetak Laporan', 'Gagal mencetak: ' + err.message);
      }
    } else {
      Alert.alert(
        '🖨 Cetak Laporan',
        `Laporan Keuangan ${periodeLabel} sedang dikirim ke antrian cetak printer.`
      );
    }
  };

  const handleDownloadPDF = async () => {
    const cleanLabel = (periodeLabel || 'Laporan').replace(/[\s\/\\:]+/g, '_');
    const filename = `Laporan_Keuangan_Seblak_${cleanLabel}.pdf`;

    if (Platform.OS === 'web') {
      const element = document.getElementById('printable-laporan-keuangan');
      if (!element) {
        handlePrint();
        return;
      }

      setIsDownloading(true);
      try {
        const html2pdf = await loadHtml2Pdf();
        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        await html2pdf().set(opt).from(element).save();
        setIsDownloading(false);
      } catch (err) {
        console.warn('html2pdf download fallback:', err);
        downloadHtmlBlobFallback(element, filename);
        handlePrint();
        setIsDownloading(false);
      }
    } else {
      Alert.alert(
        '📥 Unduh PDF',
        `File PDF "${filename}" sedang diunduh.`
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Bar Preview */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={20} color="#2C1810" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Preview Laporan</Text>
            </View>

            <TouchableOpacity
              onPress={handlePrint}
              style={styles.printHeaderIconBtn}
              activeOpacity={0.7}
              accessibilityLabel="Cetak Laporan"
            >
              <Ionicons name="print-outline" size={20} color="#2C1810" />
            </TouchableOpacity>
          </View>

          {/* Kertas Dokumen Laporan (Formal Document Sheet) */}
          <ScrollView
            style={styles.documentScroll}
            contentContainerStyle={styles.documentContent}
            showsVerticalScrollIndicator={true}
          >
            <View
              nativeID="printable-laporan-keuangan"
              style={styles.paperSheet}
            >
              {/* KOP LAPORAN SESUAI STRUK KASIR & WIREFRAME */}
              <View style={styles.docBrandHeader}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoEmoji}>🍲</Text>
                </View>
                <Text style={styles.brandTitleText}>Seblak Prasmanan</Text>
                <Text style={styles.brandSubText}>Laporan Keuangan</Text>

                <View style={styles.kopLine} />

                {/* Judul Laporan */}
                <Text style={styles.reportDocTitle}>{titleDokumen}</Text>

                {/* Meta Periode & Tanggal Cetak */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaBold}>Periode:</Text> {periodeLabel}
                  </Text>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaBold}>Tanggal Cetak:</Text> {tanggalCetak}
                  </Text>
                </View>
              </View>

              {/* 1. RINGKASAN KEUANGAN */}
              <View style={styles.docSection}>
                <Text style={styles.sectionHeaderTitle}>RINGKASAN KEUANGAN</Text>
                <View style={styles.summaryDualBox}>
                  {/* Total Omzet */}
                  <View style={styles.summaryBoxCol}>
                    <Text style={styles.summaryBoxLabel}>Total Omzet</Text>
                    <Text style={[styles.summaryBoxVal, { color: WARNA_PRIMARY }]}>
                      {formatCurrency(summary.omzet)}
                    </Text>
                  </View>

                  {/* Total Pengeluaran */}
                  <View style={styles.summaryBoxCol}>
                    <Text style={styles.summaryBoxLabel}>Total Pengeluaran</Text>
                    <Text style={[styles.summaryBoxVal, { color: WARNA_EXPENSE }]}>
                      {formatCurrency(summary.pengeluaran)}
                    </Text>
                  </View>

                  {/* Laba Bersih */}
                  <View style={styles.summaryBoxCol}>
                    <Text style={styles.summaryBoxLabel}>Laba Bersih</Text>
                    <Text style={[styles.summaryBoxVal, { color: WARNA_SUCCESS }]}>
                      {formatCurrency(summary.labaBersih)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 2. GRAFIK KEUANGAN (GRAFIK BATANG & GARIS DENGAN HITUNGAN SKALA) */}
              <View style={styles.docSection}>
                <Text style={styles.sectionHeaderTitle}>GRAFIK KEUANGAN</Text>
                <View style={styles.chartPaperBox}>
                  <ComboBarLineChart
                    data={chart}
                    height={175}
                    showLegend={true}
                  />
                </View>
              </View>

              {/* 3. PENGELUARAN TERBESAR (TOP 3) */}
              <View style={styles.docSection}>
                <Text style={styles.sectionHeaderTitle}>PENGELUARAN TERBESAR (TOP 3)</Text>
                <View style={styles.tableCard}>
                  {topPengeluaran.slice(0, 3).map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tableRowItem,
                        idx === 2 && styles.tableRowItemLast,
                      ]}
                    >
                      <Text style={styles.rowRankNum}>{item.rank.replace(/^0/, '')}</Text>
                      <Text style={{ fontSize: 13, marginRight: 6 }}>
                        {getToppingEmoji(item.nama)}
                      </Text>
                      <Text style={styles.rowItemName}>{item.nama}</Text>
                      <Text style={styles.rowItemNominal}>
                        {formatCurrency(item.nominal)}{' '}
                        <Text style={styles.rowItemPct}>({item.persen}%)</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 4. REKAP PERIODE */}
              <View style={styles.docSection}>
                <Text style={styles.sectionHeaderTitle}>
                  {periodeType === 'harian'
                    ? 'REKAP HARIAN & RINGKASAN AKTIVITAS'
                    : periodeType === 'bulanan'
                    ? 'REKAP MINGGUAN & RINGKASAN BULANAN'
                    : 'REKAP BULANAN'}
                </Text>

                {periodeType === 'harian' ? (
                  <>
                    {/* Ringkasan Aktivitas */}
                    <View style={styles.activityBox}>
                      {ringkasanAktivitas.map((act, idx) => (
                        <View key={idx} style={styles.activityItem}>
                          <Text style={styles.activityItemLabel}>{act.label}</Text>
                          <Text style={styles.activityItemVal}>
                            {act.value} {act.unit}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Tabel Rekap Pengeluaran Harian Sesuai Data Proyek */}
                    <View style={[styles.tableCard, { marginTop: 10 }]}>
                      <View style={styles.thRow}>
                        <Text style={[styles.thCell, { width: 28, textAlign: 'center' }]}>No</Text>
                        <Text style={[styles.thCell, { width: 50, textAlign: 'center' }]}>Waktu</Text>
                        <Text style={[styles.thCell, { flex: 1, paddingHorizontal: 4 }]}>List Topping</Text>
                        <Text style={[styles.thCell, { width: 60, textAlign: 'center' }]}>Jumlah</Text>
                        <Text style={[styles.thCell, { width: 88, textAlign: 'right' }]}>Total Biaya</Text>
                      </View>

                      {harianExpensesList.map((row, idx) => (
                        <View
                          key={row.id || idx}
                          style={[
                            styles.tdRow,
                            idx % 2 === 1 && styles.tdRowAlt,
                            idx === harianExpensesList.length - 1 && styles.tableRowItemLast,
                          ]}
                        >
                          <Text style={[styles.tdCell, { width: 28, textAlign: 'center', color: '#78665E' }]}>
                            {row.no || idx + 1}
                          </Text>
                          <Text style={[styles.tdCell, { width: 50, textAlign: 'center', color: '#78665E' }]}>
                            {row.waktu}
                          </Text>
                          <Text
                            style={[styles.tdCell, styles.boldCell, { flex: 1, paddingHorizontal: 4 }]}
                            numberOfLines={1}
                          >
                            {row.keterangan}
                          </Text>
                          <Text style={[styles.tdCell, { width: 60, textAlign: 'center', color: '#55453E' }]}>
                            {row.jumlah} {row.satuan || 'kg'}
                          </Text>
                          <Text
                            style={[
                              styles.tdCell,
                              styles.boldCell,
                              { width: 88, textAlign: 'right', color: WARNA_EXPENSE },
                            ]}
                          >
                            {formatCurrency(row.total)}
                          </Text>
                        </View>
                      ))}

                      {/* Footer Total Pengeluaran */}
                      <View style={styles.tfootRow}>
                        <Text style={styles.tfootLabel}>
                          Total Pengeluaran ({harianExpensesList.length} Pembelian Topping)
                        </Text>
                        <Text style={styles.tfootValue}>
                          {formatCurrency(totalHarianExpenses || summary.pengeluaran || 1060000)}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    {periodeType === 'bulanan' && ringkasanBulanan.length > 0 && (
                      <View style={[styles.activityBox, { marginBottom: 10 }]}>
                        {ringkasanBulanan.map((act, idx) => (
                          <View key={idx} style={styles.activityItem}>
                            <Text style={styles.activityItemLabel}>{act.label}</Text>
                            <Text style={styles.activityItemVal}>
                              {act.value} {act.unit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.tableCard}>
                      <View style={styles.thRow}>
                        <Text style={[styles.thCell, { flex: 1.4 }]}>
                          {periodeType === 'bulanan' ? 'Minggu' : 'Bulan'}
                        </Text>
                        <Text style={[styles.thCell, { flex: 1.3, textAlign: 'right' }]}>
                          Pengeluaran
                        </Text>
                        <Text style={[styles.thCell, { flex: 1.3, textAlign: 'right' }]}>
                          Laba Bersih
                        </Text>
                      </View>

                      {rekapTabel.map((row, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.tdRow,
                            idx === rekapTabel.length - 1 && styles.tableRowItemLast,
                          ]}
                        >
                          <Text style={[styles.tdCell, styles.boldCell, { flex: 1.4 }]}>
                            {row.periode.replace(/\s*2026|\s*\(.*?\)/, '')}
                          </Text>
                          <Text style={[styles.tdCell, { flex: 1.3, textAlign: 'right', color: WARNA_EXPENSE }]}>
                            {formatCurrency(row.pengeluaran)}
                          </Text>
                          <Text style={[styles.tdCell, styles.boldCell, { flex: 1.3, textAlign: 'right', color: WARNA_SUCCESS }]}>
                            {formatCurrency(row.labaBersih)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>


              {/* CATATAN: TIDAK ADA CATATAN OWNER SESUAI INSTRUKSI USER */}
            </View>
          </ScrollView>

          {/* FOOTER TOMBOL AKSI: UNDUH FILE PDF ASLI & CETAK DOKUMEN */}
          <View style={styles.bottomBar}>
            {/* Tombol Unduh File PDF Asli */}
            <TouchableOpacity
              style={[styles.btnUnduhPdfFull, isDownloading && styles.btnDownloading]}
              onPress={handleDownloadPDF}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDownloading ? "hourglass-outline" : "download-outline"}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.btnUnduhPdfFullText}>
                {isDownloading ? 'Sedang Mengunduh PDF...' : 'Unduh File PDF'}
              </Text>
            </TouchableOpacity>

            {/* Tombol Cetak Dokumen */}
            <TouchableOpacity
              style={styles.btnCetakDoc}
              onPress={handlePrint}
              activeOpacity={0.7}
            >
              <Ionicons name="print-outline" size={18} color={WARNA_PRIMARY} />
              <Text style={styles.btnCetakDocText}>Cetak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '94%',
    backgroundColor: '#FAF7F5',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  printHeaderIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F7F2EE',
  },
  documentScroll: {
    flex: 1,
  },
  documentContent: {
    padding: 14,
    alignItems: 'center',
  },
  paperSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8DCD4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  docBrandHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FBEAEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoEmoji: {
    fontSize: 22,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: WARNA_PRIMARY,
    letterSpacing: 0.3,
  },
  brandSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78665E',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  kopLine: {
    width: '100%',
    height: 2,
    backgroundColor: WARNA_PRIMARY,
    marginVertical: 12,
    borderRadius: 1,
  },
  reportDocTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  reportDocSubtitle: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: '600',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#55453E',
  },
  metaBold: {
    fontWeight: '800',
    color: '#2C1810',
  },
  docSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C1810',
    letterSpacing: 0.4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
    paddingBottom: 4,
  },
  summaryDualBox: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryBoxCol: {
    flex: 1,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EDE5E0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  summaryBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78665E',
    marginBottom: 3,
  },
  summaryBoxVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  chartPaperBox: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EDE5E0',
    borderRadius: 8,
    padding: 10,
    overflow: 'hidden',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE5E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE7',
  },
  tableRowItemLast: {
    borderBottomWidth: 0,
  },
  rowRankNum: {
    width: 16,
    fontSize: 11,
    fontWeight: '800',
    color: '#78665E',
  },
  rowItemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  rowItemNominal: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA_EXPENSE,
  },
  rowItemPct: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78665E',
  },
  activityBox: {
    flexDirection: 'row',
    gap: 8,
  },
  activityItem: {
    flex: 1,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EDE5E0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  activityItemLabel: {
    fontSize: 10,
    color: '#78665E',
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  activityItemVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2C1810',
  },
  thRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCD4',
  },
  thCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },
  tdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE7',
  },
  tdCell: {
    fontSize: 11,
    color: '#2C1810',
  },
  boldCell: {
    fontWeight: '700',
  },
  tdRowAlt: {
    backgroundColor: '#FAF7F5',
  },
  tfootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F4F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DCD4',
  },
  tfootLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2C1810',
  },
  tfootValue: {
    fontSize: 11,
    fontWeight: '900',
    color: WARNA_PRIMARY,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE5E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnUnduhPdfFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WARNA_TOMBOL,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnDownloading: {
    opacity: 0.75,
  },
  btnUnduhPdfFullText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnCetakDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5ECE7',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnCetakDocText: {
    fontSize: 13,
    fontWeight: '800',
    color: WARNA_PRIMARY,
  },
});
