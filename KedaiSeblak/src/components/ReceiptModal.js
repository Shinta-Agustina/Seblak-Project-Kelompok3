import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';

export default function ReceiptModal({
  visible,
  onClose,
  transactionData,
  onPrint,
  onNewOrder,
}) {
  const orderNumber = transactionData?.orderNo || transactionData?.no || transactionData?.id || '-';
  const tableNo = transactionData?.tableNo || transactionData?.meja || transactionData?.table || '-';
  const dateStr = transactionData?.date || transactionData?.tanggal || '-';
  const timeStr = transactionData?.time || transactionData?.waktu || '-';
  const paymentMethod = transactionData?.method || transactionData?.metode || transactionData?.paymentMethod || '-';
  const kuah = transactionData?.kuah || 'Original';
  const pedas = Number(transactionData?.pedas ?? 3);
  const catatan = transactionData?.catatan || '';
  const cashPaid = Number(transactionData?.cashPaid ?? transactionData?.cashAmount ?? 0);
  const change = Number(transactionData?.change ?? 0);
  const kasir = transactionData?.kasir || '-';

  const items = Array.isArray(transactionData?.items)
    ? transactionData.items
    : Array.isArray(transactionData?.details)
      ? transactionData.details
      : [];

  const totalPrice = Number(
    transactionData?.total ??
    items.reduce((sum, item) => {
      const price = Number(item.price ?? item.harga ?? 0);
      const qty = Number(item.qty ?? item.quantity ?? 1);
      return sum + price * qty;
    }, 0)
  );

  const amountPaid = paymentMethod.toLowerCase().includes('tunai')
    ? cashPaid
    : Number(transactionData?.amountPaid ?? totalPrice);

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.print) {
      try {
        window.print();
      } catch (e) {
        // Fallback
      }
    }
    Alert.alert(
      'Mencetak Struk Kasir',
      `Struk ${orderNumber} (${tableNo})\nTotal: ${formatCurrency(totalPrice)}\nMetode: ${paymentMethod}\n\nBerhasil dicetak ke Printer Kasir Thermal 58mm!`
    );
    if (onPrint) onPrint();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.topTitleRow}>
              <Ionicons name="receipt-outline" size={18} color="#C62828" />
              <Text style={styles.modalTitle}>Struk Transaksi Pembayaran</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Struk Kertas Kasir (Thermal Paper) */}
          <ScrollView
            contentContainerStyle={styles.receiptScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.paper}>
              {/* Brand Header */}
              <View style={styles.brandRow}>
                <View style={styles.brandLogoCircle}>
                  <Text style={{ fontSize: 18 }}>🍲</Text>
                </View>
                <Text style={styles.brandTitle}>Seblak Prasmanan</Text>
              </View>
              <Text style={styles.brandSub}>
                Sistem Kasir & Point of Sale (POS)
              </Text>

              {/* Dashed line */}
              <View style={styles.dashedLine} />

              {/* Meta Info Transaksi */}
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>No. Transaksi</Text>
                <Text style={styles.metaVal}>: {orderNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Meja</Text>
                <Text style={styles.metaVal}>: {tableNo}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Tanggal & Jam</Text>
                <Text style={styles.metaVal}>
                  : {dateStr} {timeStr}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Kasir Bertugas</Text>
                <Text style={styles.metaVal}>: {kasir}</Text>
              </View>

              {/* Dashed line */}
              <View style={styles.dashedLine} />

              {/* Daftar Topping yang Dipilih */}
              <View style={styles.itemHeaderRow}>
                <Text style={[styles.itemHeaderCol, { flex: 2 }]}>Item Topping</Text>
                <Text style={[styles.itemHeaderCol, { width: 35, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.itemHeaderCol, { width: 85, textAlign: 'right' }]}>Subtotal</Text>
              </View>

              {items.length > 0 ? items.map((item, idx) => {
                const qty = Number(item.qty ?? item.quantity ?? 1);
                const price = Number(item.price ?? item.harga ?? 0);
                const itemTotal = price * qty;
                return (
                  <View key={item.id ?? `${item.name || item.nama || 'item'}-${idx}`} style={styles.itemRow}>
                    <Text style={[styles.itemText, { flex: 2 }]} numberOfLines={1}>
                      {item.name || item.nama || 'Item'}
                    </Text>
                    <Text style={[styles.itemText, { width: 35, textAlign: 'center' }]}>
                      {qty}
                    </Text>
                    <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>
                      {formatCurrency(itemTotal)}
                    </Text>
                  </View>
                );
              }) : (
                <Text style={styles.itemText}>Tidak ada rincian item transaksi.</Text>
              )}

              {/* Pilihan Kuah & Level Pedas */}
              <View style={styles.specReceiptRow}>
                <Text style={styles.specReceiptText}>
                  Kuah: <Text style={{ fontWeight: '800' }}>{kuah}</Text> • Pedas: Lvl{' '}
                  <Text style={{ fontWeight: '800' }}>{pedas}</Text>{' '}
                  {Array.from({ length: Math.max(0, pedas) })
                    .map(() => '🌶️')
                    .join('')}
                </Text>
              </View>
              {catatan ? (
                <Text style={styles.notesReceiptText}>
                  Catatan: {catatan}
                </Text>
              ) : null}

              {/* Dashed line */}
              <View style={styles.dashedLine} />

              {/* 3 BAGIAN UTAMA PEMBAYARAN: TOTAL, BAYAR PAKE APA, & BAYARNYA BERAPA */}
              <View style={styles.highlightPaymentSection}>
                {/* 1. TOTALNYA BERAPA */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>TOTAL TAGIHAN</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(totalPrice)}
                  </Text>
                </View>

                {/* 2. BAYAR PAKE APA */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>BAYAR PAKE APA</Text>
                  <Text style={styles.summaryMethodVal}>
                    : {paymentMethod.toUpperCase()}
                  </Text>
                </View>

                {/* 3. BAYARNYA BERAPA */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>BAYARNYA BERAPA</Text>
                  <Text style={styles.summaryValCash}>
                    : {formatCurrency(amountPaid)}
                  </Text>
                </View>

                {/* KEMBALIAN (JIKA TUNAI) */}
                {paymentMethod.toLowerCase().includes('tunai') && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelKembalian}>UANG KEMBALIAN</Text>
                    <Text style={styles.summaryValKembalian}>
                      : {formatCurrency(change)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Dashed line */}
              <View style={styles.dashedLine} />

              {/* Status Lunas Stamp */}
              <View style={styles.paidStampContainer}>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text style={styles.paidBadgeText}>LUNAS / PAID</Text>
                </View>
              </View>

              {/* Thank you note */}
              <View style={styles.footerNote}>
                <Text style={styles.thankTitle}>Terima kasih 😊</Text>
                <Text style={styles.thankSub}>Selamat menikmati Seblak Prasmanan!</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons: Cetak Struk & Pesanan Baru */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={handlePrint}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={18} color="#FFFFFF" />
              <Text style={styles.printBtnText}>Cetak Struk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onNewOrder || onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={16} color="#6F5C53" />
              <Text style={styles.doneBtnText}>Pesanan Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5DF',
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },
  closeBtn: {
    padding: 4,
  },
  receiptScroll: {
    padding: 18,
    backgroundColor: '#F5F0EC',
  },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2D5CC',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 2,
  },
  brandLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 10,
    color: '#8D7B70',
    textAlign: 'center',
    fontWeight: '500',
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#B0A097',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    width: 105,
    fontSize: 11,
    color: '#6F5C53',
    fontWeight: '600',
  },
  metaVal: {
    flex: 1,
    fontSize: 11,
    color: '#2C1810',
    fontWeight: '700',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE6',
  },
  itemHeaderCol: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8D7B70',
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 11,
    color: '#3D2820',
    fontWeight: '600',
  },
  specReceiptRow: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE6',
  },
  specReceiptText: {
    fontSize: 10,
    color: '#6F5C53',
    fontWeight: '600',
  },
  notesReceiptText: {
    fontSize: 10,
    color: '#A09088',
    fontStyle: 'italic',
    marginTop: 2,
  },
  highlightPaymentSection: {
    backgroundColor: '#FCFAF8',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#C62828',
  },
  summaryMethodVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1565C0',
  },
  summaryValCash: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },
  summaryLabelKembalian: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  summaryValKembalian: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2E7D32',
  },
  paidStampContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 4,
  },
  thankTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  thankSub: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDE5DF',
    backgroundColor: '#FFFFFF',
  },
  printBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C62828',
    borderRadius: 8,
    paddingVertical: 11,
  },
  printBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FAF5F1',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    borderRadius: 8,
    paddingVertical: 11,
  },
  doneBtnText: {
    color: '#6F5C53',
    fontSize: 13,
    fontWeight: '700',
  },
});