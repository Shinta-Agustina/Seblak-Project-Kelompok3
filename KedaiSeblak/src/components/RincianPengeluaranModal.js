import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';
import { getCategoryBadge } from '../screens/owner/MenuHargaScreen';

export default function RincianPengeluaranModal({
  visible,
  onClose,
  dateTitle = '',
  items = [],
  totalNominal = 0,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Header Rincian */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityLabel="Kembali"
                >
                  <Ionicons name="arrow-back" size={20} color="#2C1810" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Rincian Pengeluaran</Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {dateTitle || 'Periode Terpilih'}
                  </Text>
                </View>

                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyBadgeText}>Read Only</Text>
                </View>
              </View>

              {/* Tabel Detail Rincian (Read-Only) */}
              <View style={styles.tableCard}>
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.tableHorizontalScroll}
                >
                  <View style={styles.tableInnerWrapper}>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.headerCell, styles.colNo]}>No</Text>
                      <Text style={[styles.headerCell, styles.colWaktu]}>Waktu</Text>
                      <Text style={[styles.headerCell, styles.colKet]}>List Topping</Text>
                      <Text style={[styles.headerCell, styles.colJumlah]}>Jumlah</Text>
                      <Text style={[styles.headerCell, styles.colTotal]}>Total</Text>
                    </View>

                    {/* Table Rows Scroll */}
                    <ScrollView
                      style={styles.tableBodyScroll}
                      contentContainerStyle={styles.tableBodyContent}
                      showsVerticalScrollIndicator={true}
                    >
                      {items.length > 0 ? (
                        items.map((item, index) => {
                          const catBadge = getCategoryBadge(item.kategori, item.keterangan);
                          return (
                            <View
                              key={item.id || index}
                              style={[
                                styles.tableRow,
                                index % 2 === 1 && styles.tableRowAlt,
                                index === items.length - 1 && styles.tableRowLast,
                              ]}
                            >
                              <Text style={[styles.cellText, styles.colNo]}>
                                {index + 1}
                              </Text>
                              <Text style={[styles.cellText, styles.colWaktu]}>
                                {item.waktu}
                              </Text>
                              <View style={styles.colKetWrapper}>
                                <Text style={styles.toppingNameText}>
                                  {item.keterangan}
                                </Text>
                                <View
                                  style={[
                                    styles.categoryBadge,
                                    { backgroundColor: catBadge.bg },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.categoryBadgeText,
                                      { color: catBadge.color },
                                    ]}
                                  >
                                    {catBadge.label}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.cellJumlahText, styles.colJumlah]}>
                                {item.jumlah} {item.satuan || 'kg'}
                              </Text>
                              <Text style={[styles.cellTextTotal, styles.colTotal]}>
                                {formatCurrency(item.total)}
                              </Text>
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.emptyContainer}>
                          <Ionicons
                            name="receipt-outline"
                            size={32}
                            color="#8D7B70"
                            style={{ marginBottom: 6 }}
                          />
                          <Text style={styles.emptyText}>
                            Tidak ada transaksi pengeluaran pada tanggal ini.
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>

              {/* Total Pengeluaran Card (Bottom) */}
              <View style={styles.totalCard}>
                <View style={styles.totalCardInner}>
                  <View>
                    <Text style={styles.totalLabel}>Total Pengeluaran</Text>
                    <Text style={styles.totalDateText}>{dateTitle}</Text>
                  </View>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(totalNominal)}
                  </Text>
                </View>
              </View>

              {/* Tutup Button */}
              <TouchableOpacity
                style={styles.closeFullBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeFullBtnText}>Tutup Rincian</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
    backgroundColor: '#FAF7F5',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78665E',
    marginTop: 1,
  },
  readOnlyBadge: {
    backgroundColor: '#EFE7E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78665E',
  },
  tableCard: {
    flex: 1,
    minHeight: 240,
    maxHeight: 380,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    overflow: 'hidden',
  },
  tableHorizontalScroll: {
    minWidth: 500,
    flexGrow: 1,
  },
  tableInnerWrapper: {
    minWidth: 500,
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE5E0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#D8CBC3',
    minWidth: 500,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C1810',
  },
  colNo: {
    width: 28,
    textAlign: 'center',
    color: '#8D7B70',
  },
  colWaktu: {
    width: 50,
    textAlign: 'center',
    color: '#60646C',
  },
  colKet: {
    flex: 1,
    minWidth: 220,
    paddingHorizontal: 6,
    textAlign: 'left',
  },
  colKetWrapper: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  colJumlah: {
    width: 70,
    textAlign: 'center',
  },
  colTotal: {
    width: 88,
    textAlign: 'right',
    paddingRight: 4,
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableBodyContent: {
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#FAF7F5',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  cellText: {
    fontSize: 12,
    color: '#55453E',
  },
  toppingNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  cellJumlahText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#168653',
  },
  cellTextTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8D7B70',
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: '#52141D',
    marginHorizontal: 14,
    marginVertical: 12,
    padding: 14,
    borderRadius: 14,
  },
  totalCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DFB8BC',
    textTransform: 'uppercase',
  },
  totalDateText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeFullBtn: {
    backgroundColor: '#F8F5F2',
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDE5E0',
  },
  closeFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78665E',
  },
});
