import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';
import formatCurrency from '../../utils/formatCurrency';

const STATUS_CONFIG = {
  Diproses: { bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' },
  'Siap Bayar': { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' },
  Proses: { bg: '#E0F7FA', text: '#00838F', border: '#B2EBF2' },
  Selesai: { bg: '#EDE7F6', text: '#4527A0', border: '#D1C4E9' },
};

export default function PesananAktifScreen({ onOpenDetail }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { orders, updateOrderStatus } = useKasir();

  const [activeTab, setActiveTab] = useState('Semua');

  const countDiproses = orders.filter(
    (o) => o.status === 'Diproses' || o.status === 'Proses'
  ).length;
  const countSiapBayar = orders.filter((o) => o.status === 'Siap Bayar').length;
  const countSelesai = orders.filter((o) => o.status === 'Selesai').length;

  const tabs = [
    { id: 'Semua', label: `Semua (${orders.length})` },
    { id: 'Diproses', label: `Diproses (${countDiproses})` },
    { id: 'Siap Bayar', label: `Siap Bayar (${countSiapBayar})` },
    { id: 'Selesai', label: `Selesai (${countSelesai})` },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'Semua') return true;
    if (activeTab === 'Diproses')
      return o.status === 'Diproses' || o.status === 'Proses';
    return o.status === activeTab;
  });

  const handleCycleStatus = (order) => {
    let nextStatus = 'Diproses';
    if (order.status === 'Diproses' || order.status === 'Proses') {
      nextStatus = 'Siap Bayar';
    } else if (order.status === 'Siap Bayar') {
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
                        accessibilityHint="Ketuk untuk mengubah status"
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
                            date: order.date || '16/10/2025',
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
        <View>
          <Text style={styles.footerLabel}>Total Pesanan Hari Ini</Text>
          <Text style={styles.footerNumber}>12</Text>
        </View>
        <View style={styles.footerIconBox}>
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={24}
            color="#C62828"
          />
        </View>
      </View>
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 220,
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
  footerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
