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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const WARNA_PRIMARY = '#52141D';
const WARNA_TOMBOL = '#C62828';
const WARNA_SUCCESS = '#168653';
const WARNA_EXPENSE = '#DC2626';

export default function PreviewLaporanModal({
  visible,
  onClose,
  reportData,
}) {
  if (!reportData) return null;

  const {
    periodeLabel = '16 Oktober 2026',
    tanggalCetak = '16 Oktober 2026',
    summary = { omzet: 3420000, pengeluaran: 1060000, labaBersih: 2360000 },
    pemasukan = [],
    pengeluaran = [],
  } = reportData;

  const [isDownloading, setIsDownloading] = useState(false);

  // Fungsi generate HTML string untuk cetak & unduh PDF
  // Catatan penting instruksi user:
  // - Kop Dokumen Seblak Prasmanan & Periode
  // - Ringkasan Keuangan WAJIB TAMPIL sebelum tabel pemasukan & pengeluaran
  // - Tabel Detail Pemasukan
  // - Tabel Detail Pengeluaran
  // - TANPA tulisan "Pratinjau Laporan", TANPA tombol "Kembali" dan "Cetak", TANPA Top 3 Pengeluaran
  const generateReportHtml = () => {
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rowsPemasukanHtml = pemasukan
      .map(
        (item, idx) => `
        <tr style="background-color: ${idx % 2 === 1 ? '#FAF7F5' : '#FFFFFF'};">
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; color: #55433B;">${item.tanggal || item.waktu || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; font-weight: 600; color: #2C1810;">${item.keterangan || (item.kasir ? `Penjualan (${item.kasir})` : 'Penjualan Kasir')}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; color: #55433B; text-align: center;">${item.metodePembayaran || 'Tunai'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; font-weight: 700; color: #168653; text-align: right;">${formatCurrency(item.totalTransaksi || item.jumlah || 0)}</td>
        </tr>`
      )
      .join('');

    const rowsPengeluaranHtml = pengeluaran
      .map(
        (item, idx) => `
        <tr style="background-color: ${idx % 2 === 1 ? '#FAF7F5' : '#FFFFFF'};">
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; color: #55433B;">${item.tanggal || item.waktu || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; font-weight: 600; color: #2C1810;">${item.keterangan || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; color: #55433B; text-align: center;">${item.kategori || item.supplier || 'Bahan Baku'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5E0; font-size: 12px; font-weight: 700; color: #DC2626; text-align: right;">${formatCurrency(item.nominal || item.total || 0)}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laporan Keuangan - Seblak Prasmanan</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #2C1810;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-center {
      text-align: center;
      margin-bottom: 16px;
    }
    .logo-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #52141D;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .logo-icon {
      font-size: 24px;
      color: #FFFFFF;
      line-height: 1;
    }
    .main-title {
      font-size: 20px;
      font-weight: 800;
      color: #2C1810;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .sub-title {
      font-size: 14px;
      font-weight: 600;
      color: #55433B;
      margin: 3px 0 0;
    }
    .periode-text {
      font-size: 12px;
      color: #78665E;
      margin: 3px 0 0;
    }
    .divider {
      border: 0;
      height: 1px;
      background: #EDE5E0;
      margin: 12px 0 16px 0;
    }
    .section-card {
      margin-bottom: 16px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #EDE5E0;
      page-break-inside: avoid;
    }
    .section-header {
      background-color: #52141D !important;
      color: #FFFFFF !important;
      padding: 7px 12px;
      font-size: 12.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      -webkit-print-color-adjust: exact;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background-color: #F8F5F2 !important;
      color: #78665E;
      font-size: 11px;
      font-weight: 700;
      padding: 7px 12px;
      border-bottom: 1px solid #EDE5E0;
      -webkit-print-color-adjust: exact;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      border-bottom: 1px solid #EDE5E0;
      font-size: 12.5px;
    }
    .summary-row:last-child {
      border-bottom: none;
      font-weight: 800;
      font-size: 13.5px;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #78665E;
      margin-top: 18px;
      border-top: 1px solid #EDE5E0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header-center">
    <div class="logo-circle">
      <span class="logo-icon">&#x1F374;</span>
    </div>
    <h1 class="main-title">Laporan Keuangan</h1>
    <h2 class="sub-title">Seblak Prasmanan</h2>
    <p class="periode-text">Periode: ${periodeLabel}</p>
  </div>

  <hr class="divider" />

  <!-- 1. Ringkasan Keuangan (Wajib Tampil Sebelum Tabel) -->
  <div class="section-card">
    <div class="section-header">&#x1F4CB; Ringkasan Keuangan</div>
    <div style="background-color: #FFFFFF;">
      <div class="summary-row">
        <span>Total Omzet</span>
        <span style="font-weight: 700; color: #168653;">${formatCurrency(summary.omzet)}</span>
      </div>
      <div class="summary-row" style="background-color: #FAF7F5;">
        <span>Total Pengeluaran</span>
        <span style="font-weight: 700; color: #DC2626;">${formatCurrency(summary.pengeluaran)}</span>
      </div>
      <div class="summary-row">
        <span>Laba Bersih</span>
        <span style="font-weight: 800; color: #168653;">${formatCurrency(summary.labaBersih)}</span>
      </div>
    </div>
  </div>

  <!-- 2. Detail Pemasukan -->
  <div class="section-card">
    <div class="section-header">&#x1F4B0; Detail Pemasukan</div>
    <table>
      <thead>
        <tr>
          <th>Tanggal / Waktu</th>
          <th>Keterangan</th>
          <th style="text-align: center;">Metode Pembayaran</th>
          <th style="text-align: right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${rowsPemasukanHtml}
      </tbody>
    </table>
  </div>

  <!-- 3. Detail Pengeluaran -->
  <div class="section-card">
    <div class="section-header">&#x2B07; Detail Pengeluaran</div>
    <table>
      <thead>
        <tr>
          <th>Tanggal / Waktu</th>
          <th>Keterangan</th>
          <th style="text-align: center;">Kategori / Supplier</th>
          <th style="text-align: right;">Nominal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsPengeluaranHtml}
      </tbody>
    </table>
  </div>

  <div class="footer-note">
    Dicetak pada: ${todayFormatted}
  </div>
</body>
</html>`;
  };

  const handlePrint = async () => {
    try {
      const html = generateReportHtml();
      if (Platform.OS === 'web') {
        // Gunakan iframe tersembunyi agar yang dicetak HANYA dokumen laporan bersih
        // Tanpa ada modal frame "Pratinjau Laporan", tombol kembali, atau cetak
        const existingIframe = document.getElementById('report-print-frame');
        if (existingIframe) {
          existingIframe.remove();
        }

        const iframe = document.createElement('iframe');
        iframe.id = 'report-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const frameDoc = iframe.contentWindow || iframe.contentDocument;
        const doc = frameDoc.document ? frameDoc.document : frameDoc;
        doc.open();
        doc.write(html);
        doc.close();

        // Tunggu rendering selesai lalu panggil cetak di iframe
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        }, 300);
      } else {
        await Print.printAsync({ html });
      }
    } catch (err) {
      console.error('Gagal mencetak:', err);
      Alert.alert('Gagal Cetak', 'Terjadi kesalahan saat memproses cetak laporan.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const html = generateReportHtml();
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_Keuangan_${periodeLabel.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      }
    } catch (err) {
      console.error('Gagal download PDF:', err);
      Alert.alert('Gagal Simpan', 'Gagal membuat file laporan PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* TOP BAR PRATINJAU */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <Ionicons name="document-text-outline" size={20} color="#2C1810" />
              <Text style={styles.topBarTitle}>Pratinjau Laporan</Text>
            </View>

            <TouchableOpacity
              style={styles.closeIconBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#78665E" />
            </TouchableOpacity>
          </View>

          {/* ISI PRATINJAU DOKUMEN */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Kop Dokumen */}
            <View style={styles.docHeader}>
              <View style={styles.chefBadge}>
                <Ionicons name="restaurant" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.docTitle}>Laporan Keuangan</Text>
              <Text style={styles.docSubtitle}>Seblak Prasmanan</Text>
              <Text style={styles.docPeriode}>Periode: {periodeLabel}</Text>
            </View>

            <View style={styles.docDivider} />

            {/* TABEL 1: RINGKASAN KEUANGAN */}
            <View style={styles.previewSectionCard}>
              <View style={styles.previewSectionHeader}>
                <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                <Text style={styles.previewSectionHeaderText}>Ringkasan Keuangan</Text>
              </View>
              <View style={styles.summaryTable}>
                <View style={styles.summaryTableRow}>
                  <Text style={styles.summaryLabel}>Total Omzet</Text>
                  <Text style={[styles.summaryVal, { color: WARNA_SUCCESS }]}>
                    {formatCurrency(summary.omzet)}
                  </Text>
                </View>
                <View style={[styles.summaryTableRow, styles.summaryTableRowAlt]}>
                  <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
                  <Text style={[styles.summaryVal, { color: WARNA_EXPENSE }]}>
                    {formatCurrency(summary.pengeluaran)}
                  </Text>
                </View>
                <View style={[styles.summaryTableRow, styles.summaryTableRowLast]}>
                  <Text style={[styles.summaryLabel, styles.boldText]}>Laba Bersih</Text>
                  <Text style={[styles.summaryVal, styles.boldText, { color: WARNA_SUCCESS }]}>
                    {formatCurrency(summary.labaBersih)}
                  </Text>
                </View>
              </View>
            </View>

            {/* TABEL 2: DETAIL PEMASUKAN */}
            <View style={styles.previewSectionCard}>
              <View style={styles.previewSectionHeader}>
                <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.previewSectionHeaderText}>Detail Pemasukan</Text>
              </View>
              <View style={styles.tableCard}>
                <View style={styles.tableThRow}>
                  <Text style={[styles.tableThCell, { flex: 1.2 }]}>Tanggal / Waktu</Text>
                  <Text style={[styles.tableThCell, { flex: 1.8 }]}>Keterangan</Text>
                  <Text style={[styles.tableThCell, { flex: 1.2, textAlign: 'center' }]}>
                    Metode
                  </Text>
                  <Text style={[styles.tableThCell, { flex: 1.4, textAlign: 'right' }]}>
                    Jumlah
                  </Text>
                </View>

                {pemasukan.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableTdRow,
                      idx % 2 === 1 && styles.tableTdRowAlt,
                      idx === pemasukan.length - 1 && styles.tableTdRowLast,
                    ]}
                  >
                    <Text style={[styles.tableTdCell, { flex: 1.2, color: '#78665E' }]}>
                      {item.tanggal || item.waktu}
                    </Text>
                    <Text style={[styles.tableTdCell, { flex: 1.8, fontWeight: '600' }]}>
                      {item.keterangan || (item.kasir ? `Penjualan (${item.kasir})` : 'Penjualan Kasir')}
                    </Text>
                    <Text style={[styles.tableTdCell, { flex: 1.2, textAlign: 'center', color: '#55433B' }]}>
                      {item.metodePembayaran || 'Tunai'}
                    </Text>
                    <Text
                      style={[
                        styles.tableTdCell,
                        { flex: 1.4, textAlign: 'right', fontWeight: '700', color: WARNA_SUCCESS },
                      ]}
                    >
                      {formatCurrency(item.totalTransaksi || item.jumlah || 0)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* TABEL 3: DETAIL PENGELUARAN (LENGKAP DI DALAM DOKUMEN CETAK) */}
            <View style={styles.previewSectionCard}>
              <View style={styles.previewSectionHeader}>
                <Ionicons name="arrow-down-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.previewSectionHeaderText}>Detail Pengeluaran</Text>
              </View>
              <View style={styles.tableCard}>
                <View style={styles.tableThRow}>
                  <Text style={[styles.tableThCell, { flex: 1.2 }]}>Tanggal / Waktu</Text>
                  <Text style={[styles.tableThCell, { flex: 1.8 }]}>Keterangan</Text>
                  <Text style={[styles.tableThCell, { flex: 1.2, textAlign: 'center' }]}>
                    Kategori
                  </Text>
                  <Text style={[styles.tableThCell, { flex: 1.4, textAlign: 'right' }]}>
                    Nominal
                  </Text>
                </View>

                {pengeluaran.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableTdRow,
                      idx % 2 === 1 && styles.tableTdRowAlt,
                      idx === pengeluaran.length - 1 && styles.tableTdRowLast,
                    ]}
                  >
                    <Text style={[styles.tableTdCell, { flex: 1.2, color: '#78665E' }]}>
                      {item.tanggal || item.waktu}
                    </Text>
                    <Text style={[styles.tableTdCell, { flex: 1.8, fontWeight: '600' }]}>
                      {item.keterangan}
                    </Text>
                    <Text style={[styles.tableTdCell, { flex: 1.2, textAlign: 'center', color: '#55433B' }]}>
                      {item.kategori || item.supplier || 'Bahan'}
                    </Text>
                    <Text
                      style={[
                        styles.tableTdCell,
                        { flex: 1.4, textAlign: 'right', fontWeight: '700', color: WARNA_EXPENSE },
                      ]}
                    >
                      {formatCurrency(item.nominal || item.total || 0)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Catatan Cetak Tanggal */}
            <View style={styles.footerPrintRow}>
              <Text style={styles.footerPrintText}>
                Dicetak pada: {todayFormatted}
              </Text>
            </View>
          </ScrollView>

          {/* FOOTER BAR: TOMBOL KEMBALI & CETAK DI BAGIAN BAWAH */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.btnKembaliBottom}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={17} color="#4B3830" style={{ marginRight: 6 }} />
              <Text style={styles.btnKembaliBottomText}>Kembali</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCetakBottom}
              onPress={handlePrint}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnCetakBottomText}>Cetak</Text>
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
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
    maxHeight: '94%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
    backgroundColor: '#FFFFFF',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
  },
  closeIconBtn: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 24,
  },
  docHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chefBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WARNA_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C1810',
    letterSpacing: -0.3,
  },
  docSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#55433B',
    marginTop: 2,
  },
  docPeriode: {
    fontSize: 13,
    color: '#78665E',
    marginTop: 4,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#E6D7D2',
    marginVertical: 16,
  },
  previewSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6D7D2',
    overflow: 'hidden',
    marginBottom: 18,
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA_PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  previewSectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryTable: {
    backgroundColor: '#FFFFFF',
  },
  summaryTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
  },
  summaryTableRowAlt: {
    backgroundColor: '#FAF7F5',
  },
  summaryTableRowLast: {
    borderBottomWidth: 0,
    paddingVertical: 13,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#2C1810',
  },
  boldText: {
    fontWeight: '800',
    fontSize: 14,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
  },
  tableThRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F5F2',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
  },
  tableThCell: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#78665E',
  },
  tableTdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
  },
  tableTdRowAlt: {
    backgroundColor: '#FAF7F5',
  },
  tableTdRowLast: {
    borderBottomWidth: 0,
  },
  tableTdCell: {
    fontSize: 12,
    color: '#2C1810',
  },
  footerPrintRow: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E6D7D2',
  },
  footerPrintText: {
    fontSize: 11.5,
    color: '#78665E',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E4',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  btnKembaliBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnKembaliBottomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B3830',
  },
  btnCetakBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA_TOMBOL,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: WARNA_TOMBOL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  btnCetakBottomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
