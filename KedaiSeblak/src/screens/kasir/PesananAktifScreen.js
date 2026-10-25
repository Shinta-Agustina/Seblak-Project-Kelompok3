import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';
import formatCurrency from '../../utils/formatCurrency';
import { getTodayFormatted } from '../../utils/dateUtils';

const STATUS_CONFIG = {
  Diproses: { bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' },
  Proses: { bg: '#E0F7FA', text: '#00838F', border: '#B2EBF2' },
  Selesai: { bg: '#EDE7F6', text: '#4527A0', border: '#D1C4E9' },
};

export default function PesananAktifScreen({ onOpenDetail }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { orders, updateOrderStatus } = useKasir();

  const [activeTab, setActiveTab] = useState('Semua');
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // Normalize any leftover 'Siap Bayar' in memory to 'Diproses'
  const normalizedOrders = orders.map((o) =>
    o.status === 'Siap Bayar' ? { ...o, status: 'Diproses' } : o
  );

  const countDiproses = normalizedOrders.filter(
    (o) => o.status === 'Diproses' || o.status === 'Proses'
  ).length;
  const countSelesai = normalizedOrders.filter((o) => o.status === 'Selesai').length;
  const totalNilaiAktif = normalizedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const tabs = [
    { id: 'Semua', label: `Semua (${normalizedOrders.length})` },
    { id: 'Diproses', label: `Diproses (${countDiproses})` },
    { id: 'Selesai', label: `Selesai (${countSelesai})` },
  ];

  const filteredOrders = normalizedOrders.filter((o) => {
    if (activeTab === 'Semua') return true;
    if (activeTab === 'Diproses')
      return o.status === 'Diproses' || o.status === 'Proses';
    return o.status === activeTab;
  });

  const handleCycleStatus = (order) => {
    let nextStatus = 'Diproses';
    if (order.status === 'Diproses' || order.status === 'Proses') {
      nextStatus = 'Selesai';
    } else {
      nextStatus = 'Diproses';
    }
    updateOrderStatus(order.id, nextStatus);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Title & Subtitle */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Pesanan Aktif</Text>
        <Text style={styles.subtitle}>
          Daftar pesanan yang sedang diproses dan menunggu pembayaran.
        </Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, isActive && styles.tabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Order Content: Responsive Mobile Card List (HP) or Desktop Table */}
      {isMobile ? (
        <View style={styles.mobileList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Tidak ada pesanan aktif</Text>
            </View>
          ) : (
            filteredOrders.map((order, idx) => {
              const cfg =
                STATUS_CONFIG[order.status] || STATUS_CONFIG['Diproses'];

              return (
                <View key={order.id || idx} style={styles.mobileOrderCard}>
                  {/* Top Bar: Order ID, Meja, Jam, Status */}
                  <View style={styles.mobileCardHeader}>
                    <View style={styles.mobileMetaRow}>
                      <View style={styles.orderIdPill}>
                        <Text style={styles.orderIdPillText}>
                          {order.id || `#00${idx + 1}`}
                        </Text>
                      </View>
                      <View style={styles.tableBadge}>
                        <Ionicons name="restaurant-outline" size={11} color="#4A2A22" />
                        <Text style={styles.tableBadgeText}>
                          {order.table || 'Meja 1'}
                        </Text>
                      </View>
                      <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={11} color="#8D7B70" />
                        <Text style={styles.timeBadgeText}>
                          {order.time || '09:00'}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: cfg.bg,
                          borderColor: cfg.border,
                        },
                      ]}
                      onPress={() => handleCycleStatus(order)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.statusText, { color: cfg.text }]}>
                        {order.status}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Order Items Description */}
                  <View style={styles.mobileItemsBox}>
                    <Ionicons
                      name="receipt-outline"
                      size={13}
                      color="#8D7B70"
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.mobileItemsText} numberOfLines={2}>
                      {order.items}
                    </Text>
                  </View>

                  {/* Card Bottom: Total Price & Detail Action Button */}
                  <View style={styles.mobileCardFooter}>
                    <View>
                      <Text style={styles.mobilePriceLabel}>Total</Text>
                      <Text style={styles.mobilePriceValue}>
                        {formatCurrency(order.total)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.detailBtnMobile}
                      onPress={() =>
                        onOpenDetail &&
                        onOpenDetail({
                          orderNo: order.id,
                          tableNo: order.table,
                          date: order.date || getTodayFormatted(),
                          time: order.time || '09:45',
                          items: order.details || [
                            {
                              name: order.items,
                              qty: 1,
                              price: order.total,
                            },
                          ],
                          total: order.total,
                          method: order.metode || 'QRIS',
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.detailBtnMobileText}>Detail</Text>
                      <Ionicons name="chevron-forward" size={12} color="#C62828" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : (
        /* Desktop / Tablet Table Container */
        <View style={styles.tableCard}>
          <ScrollView horizontal={false} showsHorizontalScrollIndicator={false}>
            <View style={styles.tableInner}>
              {/* Table Head */}
              <View style={styles.tableHead}>
                <Text style={[styles.th, { width: 55 }]}>No</Text>
                <Text style={[styles.th, { width: 65 }]}>Waktu</Text>
                <Text style={[styles.th, { width: 85 }]}>No. Meja</Text>
                <Text style={[styles.th, { flex: 1.8 }]}>Item</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>
                  Total
                </Text>
                <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                  Status
                </Text>
                <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>
                  Aksi
                </Text>
              </View>

              {/* Table Rows */}
              {filteredOrders.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyText}>Tidak ada pesanan aktif</Text>
                </View>
              ) : (
                filteredOrders.map((order, idx) => {
                  const cfg =
                    STATUS_CONFIG[order.status] || STATUS_CONFIG['Diproses'];

                  return (
                    <View
                      key={order.id || idx}
                      style={[
                        styles.tableRow,
                        idx % 2 === 1 && styles.rowAlternate,
                      ]}
                    >
                      <Text
                        style={[
                          styles.td,
                          { width: 55, fontWeight: '700', color: '#8D7B70' },
                        ]}
                      >
                        {order.id || `#00${idx + 1}`}
                      </Text>
                      <Text style={[styles.td, { width: 65, color: '#6F5C53' }]}>
                        {order.time || '09:00'}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          { width: 85, fontWeight: '700', color: '#2C1810' },
                        ]}
                      >
                        {order.table || 'Meja 1'}
                      </Text>
                      <Text
                        style={[styles.td, { flex: 1.8, color: '#3D2820' }]}
                        numberOfLines={1}
                      >
                        {order.items}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          {
                            width: 100,
                            textAlign: 'right',
                            fontWeight: '800',
                            color: '#C62828',
                          },
                        ]}
                      >
                        {formatCurrency(order.total)}
                      </Text>

                      {/* Status Badge */}
                      <View style={{ width: 110, alignItems: 'center' }}>
                        <TouchableOpacity
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: cfg.bg,
                              borderColor: cfg.border,
                            },
                          ]}
                          onPress={() => handleCycleStatus(order)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.statusText, { color: cfg.text }]}>
                            {order.status}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Aksi Button: Detail */}
                      <View style={{ width: 75, alignItems: 'center' }}>
                        <TouchableOpacity
                          style={styles.detailBtn}
                          onPress={() =>
                            onOpenDetail &&
                            onOpenDetail({
                              orderNo: order.id,
                              tableNo: order.table,
                              date: order.date || getTodayFormatted(),
                              time: order.time || '09:45',
                              items: order.details || [
                                {
                                  name: order.items,
                                  qty: 1,
                                  price: order.total,
                                },
                              ],
                              total: order.total,
                              method: order.metode || 'QRIS',
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={styles.detailBtnText}>Detail</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Bottom Summary: Total Pesanan Hari Ini */}
      <View style={styles.footerSummaryCard}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total Pesanan Hari Ini</Text>
          <Text style={styles.footerNumber}>{orders.length}</Text>
        </View>

        <TouchableOpacity
          style={styles.footerIconBox}
          onPress={() => setSummaryModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Lihat rincian status pesanan"
        >
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={24}
            color="#C62828"
          />
        </TouchableOpacity>
      </View>

      {/* Modal Rincian Ringkasan Pesanan Hari Ini */}
      <Modal
        visible={summaryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSummaryModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalHeaderIconBox}>
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={20}
                    color="#C62828"
                  />
                </View>
                <Text style={styles.modalTitle}>Ringkasan Pesanan Hari Ini</Text>
              </View>
              <TouchableOpacity onPress={() => setSummaryModalVisible(false)}>
                <Ionicons name="close" size={20} color="#8D7B70" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Rincian status seluruh antrean pesanan aktif di kedai hari ini:
            </Text>

            <View style={styles.summaryList}>
              {/* Total Pesanan */}
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                  <Text style={styles.summaryRowLabel}>Total Antrean Pesanan</Text>
                </View>
                <Text style={styles.summaryRowVal}>{orders.length} Pesanan</Text>
              </View>

              {/* Diproses */}
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>🍳</Text>
                  <Text style={styles.summaryRowLabel}>Sedang Diproses (Dapur)</Text>
                </View>
                <View style={styles.statusPillDiproses}>
                  <Text style={styles.statusPillTextDiproses}>{countDiproses} Pesanan</Text>
                </View>
              </View>


              {/* Selesai */}
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>✅</Text>
                  <Text style={styles.summaryRowLabel}>Selesai & Lunas</Text>
                </View>
                <View style={styles.statusPillSelesai}>
                  <Text style={styles.statusPillTextSelesai}>{countSelesai} Pesanan</Text>
                </View>
              </View>

              {/* Total Nilai Pesanan */}
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <Text style={styles.summaryTotalLabel}>Estimasi Omzet Pesanan:</Text>
                <Text style={styles.summaryTotalVal}>{formatCurrency(totalNilaiAktif)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSummaryModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Tutup Ringkasan</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#8D7B70',
    marginTop: 3,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: 16,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCD4',
  },
  tabActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E6E67',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tableInner: {
    width: '100%',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF9',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8D7B70',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE6',
  },
  rowAlternate: {
    backgroundColor: '#FCFAF8',
  },
  td: {
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D7B70',
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#8D7B70',
    fontWeight: '600',
  },
  footerSummaryCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  footerLabel: {
    fontSize: 12,
    color: '#8D7B70',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2C1810',
    marginTop: 2,
  },
  footerLeft: {
    flex: 1,
  },
  footerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  footerTag: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  footerTagText: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '700',
  },
  footerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8D7DA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    elevation: 6,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E2',
  },
  modalHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8D7B70',
    marginBottom: 14,
  },
  summaryList: {
    gap: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#FAF7F5',
    borderRadius: 10,
  },
  summaryRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D2820',
  },
  summaryRowVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C1810',
  },
  statusPillDiproses: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  statusPillTextDiproses: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E65100',
  },
  statusPillSiapBayar: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusPillTextSiapBayar: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  statusPillSelesai: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1C4E9',
  },
  statusPillTextSelesai: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4527A0',
  },
  summaryRowTotal: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    paddingVertical: 12,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E6E67',
  },
  summaryTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C62828',
  },
  modalCloseBtn: {
    backgroundColor: '#C62828',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Mobile Card Styles
  mobileList: {
    gap: 12,
  },
  mobileOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    padding: 14,
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F0EB',
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  orderIdPill: {
    backgroundColor: '#F7F0EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderIdPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5C483F',
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFDEC2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4A2A22',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeBadgeText: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },
  mobileItemsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FAF7F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  mobileItemsText: {
    fontSize: 12,
    color: '#3D2820',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  mobileCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobilePriceLabel: {
    fontSize: 10,
    color: '#8D7B70',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mobilePriceValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#C62828',
    marginTop: 1,
  },
  detailBtnMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F8D7DA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailBtnMobileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C62828',
  },
});

