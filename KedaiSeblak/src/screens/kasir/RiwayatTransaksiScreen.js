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

const METHOD_TABS = ['Semua', 'Tunai', 'Non Tunai'];

export default function RiwayatTransaksiScreen({ onOpenReceipt }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { transactions } = useKasir();

  const [activeMethod, setActiveMethod] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (activeMethod === 'Semua') return true;
    if (activeMethod === 'Tunai') return t.metode === 'Tunai';
    return t.metode !== 'Tunai';
  });

  // Calculate totals
  const totalAll = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const totalTunai = transactions
    .filter((t) => t.metode === 'Tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);
  const totalNonTunai = transactions
    .filter((t) => t.metode !== 'Tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);

  // Pagination slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Bar with Date Filter */}
      <View
        style={[
          styles.headerSection,
          isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
        ]}
      >
        <Text style={styles.title}>Riwayat Transaksi</Text>

        <View style={styles.dateFilterRow}>
          <View style={styles.dateRangeBox}>
            <Ionicons name="calendar-outline" size={15} color="#8D7B70" />
            <Text style={styles.dateRangeText}>16/10/2025 - 16/10/2025</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3 Metric Cards */}
      <View
        style={[
          styles.metricsRow,
          isMobile && { flexDirection: 'column', gap: 10 },
        ]}
      >
        {/* Total Transaksi */}
        <View style={styles.metricCard}>
          <View style={styles.metricIconCircleRed}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={20}
              color="#C62828"
            />
          </View>
          <View style={styles.metricTextGroup}>
            <Text style={styles.metricLabel}>Total Transaksi</Text>
            <Text style={styles.metricValue}>{formatCurrency(totalAll)}</Text>
          </View>
        </View>

        {/* Tunai */}
        <View style={styles.metricCard}>
          <View style={styles.metricIconCircleGreen}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={20}
              color="#2E7D32"
            />
          </View>
          <View style={styles.metricTextGroup}>
            <Text style={styles.metricLabel}>Tunai</Text>
            <Text style={styles.metricValue}>{formatCurrency(totalTunai)}</Text>
          </View>
        </View>

        {/* Non Tunai */}
        <View style={styles.metricCard}>
          <View style={styles.metricIconCircleBlue}>
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={20}
              color="#1565C0"
            />
          </View>
          <View style={styles.metricTextGroup}>
            <Text style={styles.metricLabel}>Non Tunai</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(totalNonTunai)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {METHOD_TABS.map((tab) => {
          const isActive = activeMethod === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                setActiveMethod(tab);
                setCurrentPage(1);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Table Card */}
      <View style={styles.tableCard}>
        <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={true}>
          <View style={[styles.tableInner, isMobile && { width: 640 }]}>
            {/* Table Head */}
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 60 }]}>No</Text>
              <Text style={[styles.th, { width: 70 }]}>Waktu</Text>
              <Text style={[styles.th, { width: 90 }]}>No. Meja</Text>
              <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>
                Total
              </Text>
              <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                Metode
              </Text>
              <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>
                Aksi
              </Text>
            </View>

            {/* Table Rows */}
            {paginatedItems.map((trx, idx) => (
              <View
                key={trx.id || idx}
                style={[styles.tableRow, idx % 2 === 1 && styles.rowAlternate]}
              >
                <Text
                  style={[
                    styles.td,
                    { width: 60, fontWeight: '700', color: '#8D7B70' },
                  ]}
                >
                  {trx.no || `#00${idx + 1}`}
                </Text>
                <Text style={[styles.td, { width: 70, color: '#6F5C53' }]}>
                  {trx.waktu}
                </Text>
                <Text
                  style={[
                    styles.td,
                    { width: 90, fontWeight: '700', color: '#2C1810' },
                  ]}
                >
                  {trx.meja}
                </Text>
                <Text
                  style={[
                    styles.td,
                    {
                      flex: 1.5,
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#C62828',
                    },
                  ]}
                >
                  {formatCurrency(trx.total)}
                </Text>
                <Text
                  style={[
                    styles.td,
                    { width: 110, textAlign: 'center', color: '#4A3028' },
                  ]}
                >
                  {trx.metode}
                </Text>

                {/* Detail Aksi */}
                <View style={{ width: 75, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() =>
                      onOpenReceipt &&
                      onOpenReceipt({
                        orderNo: trx.no,
                        tableNo: trx.meja,
                        date: trx.date || '16/10/2025',
                        time: trx.waktu,
                        items: [
                          {
                            name: trx.item || '1 Paket Seblak',
                            qty: 1,
                            price: trx.total,
                          },
                        ],
                        total: trx.total,
                        method: trx.metode,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailBtnText}>Detail</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Pagination Footer */}
      <View style={styles.paginationRow}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={14} color="#6F5C53" />
        </TouchableOpacity>

        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1;
          const isPageActive = currentPage === pageNum;
          return (
            <TouchableOpacity
              key={pageNum}
              style={[styles.pageBtn, isPageActive && styles.pageBtnActive]}
              onPress={() => setCurrentPage(pageNum)}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  isPageActive && styles.pageBtnTextActive,
                ]}
              >
                {pageNum}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.pageBtn,
            currentPage === totalPages && styles.pageBtnDisabled,
          ]}
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={14} color="#6F5C53" />
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dateRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A3028',
  },
  filterBtn: {
    backgroundColor: '#C62828',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  filterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  metricIconCircleRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextGroup: {
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2C1810',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingVertical: 6,
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
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  pageBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F5C53',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },
});
