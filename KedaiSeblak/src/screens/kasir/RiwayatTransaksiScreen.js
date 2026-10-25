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
import {
  getTodayFormatted,
  getTodayIndonesian,
  getTodayIndonesianShort,
  getYesterdayFormatted,
} from '../../utils/dateUtils';

const METHOD_TABS = ['Semua', 'Tunai', 'Non Tunai'];

export default function RiwayatTransaksiScreen({ onOpenReceipt }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { transactions } = useKasir();

  const todayStr = getTodayFormatted();
  const todayIndo = getTodayIndonesian();
  const todayIndoShort = getTodayIndonesianShort();
  const yesterdayStr = getYesterdayFormatted();

  // Mode filter tanggal: 'today' (harian sesuai hari aslinya), 'yesterday', atau 'all' (semua)
  const [dateFilterMode, setDateFilterMode] = useState('today');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeMethod, setActiveMethod] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filter transaksi berdasarkan tanggal harian (sesuai hari aslinya saat digunakan)
  const dateFiltered = transactions.filter((t) => {
    if (dateFilterMode === 'today') {
      return (t.date || todayStr) === todayStr;
    }
    if (dateFilterMode === 'yesterday') {
      return t.date === yesterdayStr;
    }
    return true;
  });

  // Filter berdasarkan metode pembayaran
  const filtered = dateFiltered.filter((t) => {
    if (activeMethod === 'Semua') return true;
    if (activeMethod === 'Tunai') return t.metode === 'Tunai';
    return t.metode !== 'Tunai';
  });

  // Hitung total ringkasan metrik harian
  const totalAll = dateFiltered.reduce((acc, t) => acc + (t.total || 0), 0);
  const totalTunai = dateFiltered
    .filter((t) => t.metode === 'Tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);
  const totalNonTunai = dateFiltered
    .filter((t) => t.metode !== 'Tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);

  // Pagination slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const filterBoxLabel =
    dateFilterMode === 'today'
      ? (isMobile ? todayIndoShort : todayIndo)
      : dateFilterMode === 'yesterday'
      ? `Kemarin (${yesterdayStr})`
      : 'Semua Tanggal';

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
        <View>
          <Text style={styles.title}>Riwayat Transaksi</Text>
        </View>

        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={styles.dateRangeBox}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={15} color="#C62828" />
            <Text style={styles.dateRangeText}>{filterBoxLabel}</Text>
            <Ionicons name="chevron-down" size={12} color="#8D7B70" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="filter-outline" size={13} color="#FFFFFF" />
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

      {/* Content: Responsive Mobile Cards or Desktop Table */}
      {isMobile ? (
        <View style={styles.mobileList}>
          {paginatedItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Tidak ada riwayat transaksi pada tanggal ini</Text>
            </View>
          ) : (
            paginatedItems.map((trx, idx) => (
              <View key={trx.id || idx} style={styles.mobileTrxCard}>
                {/* Header: No, Meja, Jam, Metode */}
                <View style={styles.mobileCardHeader}>
                  <View style={styles.mobileMetaRow}>
                    <View style={styles.trxIdPill}>
                      <Text style={styles.trxIdPillText}>{trx.no || `#00${idx + 1}`}</Text>
                    </View>
                    <View style={styles.tableBadge}>
                      <Ionicons name="restaurant-outline" size={11} color="#4A2A22" />
                      <Text style={styles.tableBadgeText}>{trx.meja}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={11} color="#8D7B70" />
                      <Text style={styles.timeBadgeText}>{trx.waktu}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.methodBadge,
                      trx.metode === 'Tunai' ? styles.methodTunai : styles.methodNonTunai,
                    ]}
                  >
                    <Text
                      style={[
                        styles.methodBadgeText,
                        trx.metode === 'Tunai' ? styles.methodTunaiText : styles.methodNonTunaiText,
                      ]}
                    >
                      {trx.metode}
                    </Text>
                  </View>
                </View>

                {/* Items Summary */}
                <View style={styles.mobileItemsBox}>
                  <Ionicons
                    name="receipt-outline"
                    size={13}
                    color="#8D7B70"
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.mobileItemsText} numberOfLines={2}>
                    {trx.item || '1 Paket Seblak'}
                  </Text>
                </View>

                {/* Card Bottom: Total Price & Struk Action */}
                <View style={styles.mobileCardFooter}>
                  <View>
                    <Text style={styles.mobilePriceLabel}>Total Transaksi</Text>
                    <Text style={styles.mobilePriceValue}>{formatCurrency(trx.total)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.detailBtnMobile}
                    onPress={() =>
                      onOpenReceipt &&
                      onOpenReceipt({
                        orderNo: trx.no,
                        tableNo: trx.meja,
                        date: trx.date || todayStr,
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
                    <Ionicons name="receipt-outline" size={13} color="#C62828" />
                    <Text style={styles.detailBtnMobileText}>Struk</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        /* Desktop Table View */
        <View style={styles.tableCard}>
          <View style={styles.tableInner}>
            {/* Table Head */}
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 55 }]}>No</Text>
              <Text style={[styles.th, { width: 90 }]}>Waktu / Tgl</Text>
              <Text style={[styles.th, { width: 85 }]}>No. Meja</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Item</Text>
              <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Total</Text>
              <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>Metode</Text>
              <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>Aksi</Text>
            </View>

            {/* Table Rows */}
            {paginatedItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>Tidak ada riwayat transaksi pada tanggal ini</Text>
              </View>
            ) : (
              paginatedItems.map((trx, idx) => (
                <View
                  key={trx.id || idx}
                  style={[styles.tableRow, idx % 2 === 1 && styles.rowAlternate]}
                >
                  <Text style={[styles.td, { width: 55, fontWeight: '700', color: '#8D7B70' }]}>
                    {trx.no || `#00${idx + 1}`}
                  </Text>
                  <View style={{ width: 90 }}>
                    <Text style={[styles.td, { color: '#3D2820', fontWeight: '700' }]}>
                      {trx.waktu}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#8D7B70', marginTop: 1 }}>
                      {trx.date || todayStr}
                    </Text>
                  </View>
                  <Text style={[styles.td, { width: 85, fontWeight: '700', color: '#2C1810' }]}>
                    {trx.meja}
                  </Text>
                  <Text style={[styles.td, { flex: 1.5, color: '#3D2820' }]} numberOfLines={1}>
                    {trx.item || '1 Paket Seblak'}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      {
                        width: 110,
                        textAlign: 'right',
                        fontWeight: '800',
                        color: '#C62828',
                      },
                    ]}
                  >
                    {formatCurrency(trx.total)}
                  </Text>
                  <View style={{ width: 100, alignItems: 'center' }}>
                    <View
                      style={[
                        styles.methodBadge,
                        trx.metode === 'Tunai' ? styles.methodTunai : styles.methodNonTunai,
                      ]}
                    >
                      <Text
                        style={[
                          styles.methodBadgeText,
                          trx.metode === 'Tunai'
                            ? styles.methodTunaiText
                            : styles.methodNonTunaiText,
                        ]}
                      >
                        {trx.metode}
                      </Text>
                    </View>
                  </View>

                  {/* Detail Aksi */}
                  <View style={{ width: 75, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() =>
                        onOpenReceipt &&
                        onOpenReceipt({
                          orderNo: trx.no,
                          tableNo: trx.meja,
                          date: trx.date || todayStr,
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
              ))
            )}
          </View>
        </View>
      )}


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

      {/* Date Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={18} color="#C62828" />
                <Text style={styles.modalTitle}>Filter Tanggal Transaksi</Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={20} color="#8D7B70" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Gunakan filter ini untuk menyaring riwayat transaksi kasir berdasarkan periode tanggal yang diinginkan:
            </Text>

            {/* Opsi 1: Hari Ini (Harian Sesuai Tanggal Aslinya) */}
            <TouchableOpacity
              style={[
                styles.filterOptionBtn,
                dateFilterMode === 'today' && styles.filterOptionBtnActive,
              ]}
              onPress={() => {
                setDateFilterMode('today');
                setCurrentPage(1);
                setFilterModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={[
                      styles.optionTitle,
                      dateFilterMode === 'today' && styles.optionTitleActive,
                    ]}
                  >
                    Hari Ini (Harian)
                  </Text>
                  <View style={styles.badgeHarian}>
                    <Text style={styles.badgeHarianText}>Otomatis Hari Ini</Text>
                  </View>
                </View>
                <Text style={styles.optionSub}>
                  {todayIndo} ({todayStr})
                </Text>
              </View>
              {dateFilterMode === 'today' && (
                <Ionicons name="checkmark-circle" size={20} color="#C62828" />
              )}
            </TouchableOpacity>

            {/* Opsi 2: Kemarin */}
            <TouchableOpacity
              style={[
                styles.filterOptionBtn,
                dateFilterMode === 'yesterday' && styles.filterOptionBtnActive,
              ]}
              onPress={() => {
                setDateFilterMode('yesterday');
                setCurrentPage(1);
                setFilterModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionTitle,
                    dateFilterMode === 'yesterday' && styles.optionTitleActive,
                  ]}
                >
                  Kemarin
                </Text>
                <Text style={styles.optionSub}>
                  Rekap transaksi hari sebelumnya ({yesterdayStr})
                </Text>
              </View>
              {dateFilterMode === 'yesterday' && (
                <Ionicons name="checkmark-circle" size={20} color="#C62828" />
              )}
            </TouchableOpacity>

            {/* Opsi 3: Semua Riwayat Tanggal */}
            <TouchableOpacity
              style={[
                styles.filterOptionBtn,
                dateFilterMode === 'all' && styles.filterOptionBtnActive,
              ]}
              onPress={() => {
                setDateFilterMode('all');
                setCurrentPage(1);
                setFilterModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionTitle,
                    dateFilterMode === 'all' && styles.optionTitleActive,
                  ]}
                >
                  Semua Riwayat Tanggal
                </Text>
                <Text style={styles.optionSub}>
                  Tampilkan seluruh riwayat transaksi yang pernah dicatat
                </Text>
              </View>
              {dateFilterMode === 'all' && (
                <Ionicons name="checkmark-circle" size={20} color="#C62828" />
              )}
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
  todaySubText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '700',
    marginTop: 3,
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  filterOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    marginBottom: 10,
    backgroundColor: '#FAFAF8',
  },
  filterOptionBtnActive: {
    borderColor: '#C62828',
    backgroundColor: '#FDF4F4',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  optionTitleActive: {
    color: '#C62828',
  },
  optionSub: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 2,
  },
  badgeHarian: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeHarianText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '800',
  },
  // Mobile Card Styles
  mobileList: {
    gap: 12,
  },
  mobileTrxCard: {
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
  trxIdPill: {
    backgroundColor: '#F7F0EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trxIdPillText: {
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
    gap: 5,
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
  methodBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  methodTunai: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  methodNonTunai: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
  },
  methodTunaiText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  methodNonTunaiText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1565C0',
  },
});
