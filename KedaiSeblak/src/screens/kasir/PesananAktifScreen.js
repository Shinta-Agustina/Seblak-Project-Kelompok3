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

const STATUS_CONFIG = {
  Diproses: { bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' },
  Proses: { bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' },
  Selesai: { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' },
};

const normalizeStatus = (status) => {
  if (status === 'Siap Bayar') return 'Diproses';
  return status || 'Diproses';
};

const getFormattedToday = () => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch (e) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
};

export default function PesananAktifScreen({ onOpenDetail }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { orders, updateOrderStatus } = useKasir();

  const [activeTab, setActiveTab] = useState('Semua');
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  const countDiproses = orders.filter(
    (o) => normalizeStatus(o.status) === 'Diproses' || o.status === 'Proses'
  ).length;
  const countSelesai = orders.filter(
    (o) => normalizeStatus(o.status) === 'Selesai'
  ).length;

  const tabs = [
    { id: 'Semua', label: `Semua (${orders.length})` },
    { id: 'Diproses', label: `Diproses (${countDiproses})` },
    { id: 'Selesai', label: `Selesai (${countSelesai})` },
  ];

  const filteredOrders = orders.filter((o) => {
    const current = normalizeStatus(o.status);
    if (activeTab === 'Semua') return true;
    if (activeTab === 'Diproses')
      return current === 'Diproses' || current === 'Proses';
    return current === activeTab;
  });

  const handleCycleStatus = (order) => {
    const current = normalizeStatus(order.status);
    const nextStatus =
      current === 'Diproses' || current === 'Proses' ? 'Selesai' : 'Diproses';
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

      {/* Responsive Table Container */}
      <View style={styles.tableCard}>
        <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={true}>
          <View style={[styles.tableInner, isMobile && { width: 700 }]}>
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
                const currentStatus = normalizeStatus(order.status);
                const cfg =
                  STATUS_CONFIG[currentStatus] || STATUS_CONFIG['Diproses'];

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
                        accessibilityHint="Ketuk untuk mengubah status"
                      >
                        <Text style={[styles.statusText, { color: cfg.text }]}>
                          {currentStatus}
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
                            date: order.date || getFormattedToday(),
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

      {/* Bottom Summary: Total Pesanan Hari Ini */}
      <View style={styles.footerSummaryCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Total Pesanan Hari Ini</Text>
          <Text style={styles.footerNumber}>{orders.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.footerIconBox}
          activeOpacity={0.7}
          onPress={() => setSummaryModalVisible(true)}
          accessibilityLabel="Tampilkan rincian ringkasan pesanan"
        >
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={24}
            color="#C62828"
          />
        </TouchableOpacity>
      </View>

      {/* Modal Ringkasan Pesanan Hari Ini */}
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
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
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
              <TouchableOpacity
                onPress={() => setSummaryModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#8D7B70" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Statistik akumulasi pesanan yang sedang aktif dan berjalan:
            </Text>

            <View style={styles.summaryList}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Total Pesanan</Text>
                <Text style={styles.summaryRowVal}>{orders.length} Pesanan</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: '#E65100' },
                    ]}
                  />
                  <Text style={styles.summaryRowLabel}>Sedang Diproses</Text>
                </View>
                <Text
                  style={[
                    styles.summaryRowVal,
                    { color: '#E65100', fontWeight: '800' },
                  ]}
                >
                  {countDiproses}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: '#2E7D32' },
                    ]}
                  />
                  <Text style={styles.summaryRowLabel}>Selesai Disajikan</Text>
                </View>
                <Text
                  style={[
                    styles.summaryRowVal,
                    { color: '#2E7D32', fontWeight: '800' },
                  ]}
                >
                  {countSelesai}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  {
                    backgroundColor: '#FFF5F4',
                    borderTopWidth: 1,
                    borderColor: '#FFD6D6',
                    marginTop: 4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.summaryRowLabel,
                    { fontWeight: '800', color: '#2C1810' },
                  ]}
                >
                  Total Nilai Pesanan
                </Text>
                <Text
                  style={[
                    styles.summaryRowVal,
                    { color: '#C62828', fontWeight: '900', fontSize: 14 },
                  ]}
                >
                  {formatCurrency(
                    orders.reduce((acc, o) => acc + (o.total || 0), 0)
                  )}
                </Text>
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
    padding: 18,
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
    shadowRadius: 5,
  },
  footerLabel: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },
  footerNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2C1810',
    marginTop: 2,
  },
  footerSubText: {
    fontSize: 10,
    color: '#A09088',
    marginTop: 4,
    fontWeight: '500',
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
    maxWidth: 420,
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
    paddingVertical: 10,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
});
