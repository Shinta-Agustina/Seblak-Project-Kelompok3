import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';
import formatCurrency from '../../utils/formatCurrency';

const METHOD_TABS = ['Semua', 'Tunai', 'Non Tunai'];
const PAGE_SIZE = 5;

const getFormattedDate = (date) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString('id-ID');
  }
};

const getFormattedToday = () => getFormattedDate(new Date());

const getFormattedYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getFormattedDate(yesterday);
};

// Membantu membaca tanggal transaksi dari beberapa format umum.
const getTransactionDate = (transaction) => {
  const rawDate = transaction?.date || transaction?.tanggal;
  if (!rawDate) return null;

  if (typeof rawDate === 'string') {
    const match = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getDate() !== Number(day)
      ) return null;
      return date;
    }
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPaymentMethod = (transaction) =>
  String(transaction?.metode || transaction?.method || '').trim();

const isSameDay = (firstDate, secondDate) => {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
};

export default function RiwayatTransaksiScreen({ onOpenReceipt }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { transactions = [] } = useKasir();

  const [activeMethod, setActiveMethod] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState('today');

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayFormatted = getFormattedToday();
  const yesterdayFormatted = getFormattedYesterday();

  // Filter berdasarkan metode pembayaran dan tanggal.
  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const method = getPaymentMethod(transaction).toLowerCase();
      const isCash = method === 'tunai' || method === 'cash';
      const methodMatch =
        activeMethod === 'Semua' ||
        (activeMethod === 'Tunai' ? isCash : !isCash);

      if (!methodMatch) return false;

      if (dateFilterMode === 'all') return true;

      const transactionDate = getTransactionDate(transaction);

      // Jika transaksi tidak memiliki tanggal yang dapat dibaca,
      // transaksi hanya bisa ditampilkan pada filter semua riwayat.
      if (!transactionDate) return false;

      if (dateFilterMode === 'today') {
        return isSameDay(transactionDate, today);
      }

      if (dateFilterMode === 'yesterday') {
        return isSameDay(transactionDate, yesterday);
      }

      return true;
    });
  }, [transactions, activeMethod, dateFilterMode]);

  // Ringkasan nilai transaksi.
  const totalAll = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.total || 0),
    0
  );

  const totalTunai = transactions
    .filter((transaction) => ['tunai', 'cash'].includes(getPaymentMethod(transaction).toLowerCase()))
    .reduce(
      (sum, transaction) => sum + Number(transaction.total || 0),
      0
    );

  const totalNonTunai = transactions
    .filter((transaction) => !['tunai', 'cash'].includes(getPaymentMethod(transaction).toLowerCase()))
    .reduce(
      (sum, transaction) => sum + Number(transaction.total || 0),
      0
    );

  // Pagination.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  const changeMethod = (method) => {
    setActiveMethod(method);
    setCurrentPage(1);
  };

  const changeDateFilter = (mode) => {
    setDateFilterMode(mode);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  const openReceipt = (transaction) => {
    if (!onOpenReceipt) return;

    const transactionDate = getTransactionDate(transaction);

    const receiptItems = Array.isArray(transaction.items)
      ? transaction.items
      : Array.isArray(transaction.details)
        ? transaction.details
        : [];

    onOpenReceipt({
      orderNo: transaction.orderNo || transaction.no || transaction.id || '-',
      tableNo: transaction.tableNo || transaction.meja || transaction.table || '-',
      date: transactionDate
        ? transactionDate.toLocaleDateString('id-ID')
        : transaction.tanggal || '-',
      time: transaction.time || transaction.waktu || '-',
      items: receiptItems,
      total: Number(transaction.total || 0),
      method: getPaymentMethod(transaction) || '-',
      cashPaid: Number(transaction.cashPaid ?? transaction.cashAmount ?? 0),
      change: Number(transaction.change || 0),
      kasir: transaction.kasir || '-',
      kuah: transaction.kuah || 'Original',
      pedas: transaction.pedas ?? 3,
      catatan: transaction.catatan || '',
      status: transaction.status || '-',
    });
  };

  const renderTransaction = ({ item: trx, index }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 1 && styles.rowAlternate,
      ]}
    >
      <Text
        style={[
          styles.td,
          { width: 60, fontWeight: '700', color: '#8D7B70' },
        ]}
      >
        {trx.no || `#00${index + 1}`}
      </Text>

      <Text style={[styles.td, { width: 70, color: '#6F5C53' }]}>
        {trx.waktu || '-'}
      </Text>

      <Text
        style={[
          styles.td,
          { width: 90, fontWeight: '700', color: '#2C1810' },
        ]}
      >
        {trx.meja || '-'}
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
        {formatCurrency(Number(trx.total || 0))}
      </Text>

      <Text
        style={[
          styles.td,
          { width: 110, textAlign: 'center', color: '#4A3028' },
        ]}
      >
        {getPaymentMethod(trx) || '-'}
      </Text>

      <View style={{ width: 75, alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => openReceipt(trx)}
          activeOpacity={0.7}
        >
          <Text style={styles.detailBtnText}>Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="receipt-text-outline"
        size={40}
        color="#BCA99D"
      />
      <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
      <Text style={styles.emptyDescription}>
        Tidak ada transaksi yang sesuai dengan filter yang dipilih.
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.headerSection,
          isMobile && {
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 10,
          },
        ]}
      >
        <Text style={styles.title}>Riwayat Transaksi</Text>

        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={styles.dateRangeBox}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#C62828"
            />
            <Text style={styles.dateRangeText}>
              {dateFilterMode === 'today'
                ? todayFormatted
                : dateFilterMode === 'yesterday'
                ? 'Kemarin'
                : 'Semua Riwayat'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="filter-outline"
              size={13}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ringkasan transaksi */}
      <View
        style={[
          styles.metricsRow,
          isMobile && { flexDirection: 'column', gap: 10 },
        ]}
      >
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
            <Text style={styles.metricValue}>
              {formatCurrency(totalAll)}
            </Text>
          </View>
        </View>

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
            <Text style={styles.metricValue}>
              {formatCurrency(totalTunai)}
            </Text>
          </View>
        </View>

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

      {/* Filter metode pembayaran */}
      <View style={styles.tabsRow}>
        {METHOD_TABS.map((tab) => {
          const isActive = activeMethod === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => changeMethod(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tabel riwayat transaksi */}
      <View style={styles.tableCard}>
        <ScrollView
          horizontal={isMobile}
          showsHorizontalScrollIndicator={true}
        >
          <View style={[styles.tableInner, isMobile && { width: 640 }]}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 60 }]}>No</Text>
              <Text style={[styles.th, { width: 70 }]}>Waktu</Text>
              <Text style={[styles.th, { width: 90 }]}>No. Meja</Text>
              <Text
                style={[
                  styles.th,
                  { flex: 1.5, textAlign: 'right' },
                ]}
              >
                Total
              </Text>
              <Text
                style={[
                  styles.th,
                  { width: 110, textAlign: 'center' },
                ]}
              >
                Metode
              </Text>
              <Text
                style={[
                  styles.th,
                  { width: 75, textAlign: 'center' },
                ]}
              >
                Aksi
              </Text>
            </View>

            <FlatList
              data={paginatedItems}
              keyExtractor={(item, index) =>
                String(item.id ?? item.no ?? index)
              }
              renderItem={renderTransaction}
              ListEmptyComponent={renderEmptyList}
              scrollEnabled={false}
              initialNumToRender={PAGE_SIZE}
              removeClippedSubviews={false}
            />
          </View>
        </ScrollView>
      </View>

      {/* Pagination */}
      <View style={styles.paginationRow}>
        <TouchableOpacity
          style={[
            styles.pageBtn,
            safeCurrentPage === 1 && styles.pageBtnDisabled,
          ]}
          onPress={() =>
            setCurrentPage((page) => Math.max(1, page - 1))
          }
          disabled={safeCurrentPage === 1}
        >
          <Ionicons
            name="chevron-back"
            size={14}
            color="#6F5C53"
          />
        </TouchableOpacity>

        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNumber = index + 1;
          const isActive = safeCurrentPage === pageNumber;

          return (
            <TouchableOpacity
              key={pageNumber}
              style={[
                styles.pageBtn,
                isActive && styles.pageBtnActive,
              ]}
              onPress={() => setCurrentPage(pageNumber)}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  isActive && styles.pageBtnTextActive,
                ]}
              >
                {pageNumber}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.pageBtn,
            safeCurrentPage === totalPages &&
              styles.pageBtnDisabled,
          ]}
          onPress={() =>
            setCurrentPage((page) =>
              Math.min(totalPages, page + 1)
            )
          }
          disabled={safeCurrentPage === totalPages}
        >
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#6F5C53"
          />
        </TouchableOpacity>
      </View>

      {/* Modal filter tanggal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#C62828"
                />
                <Text style={styles.modalTitle}>
                  Filter Riwayat Transaksi
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#8D7B70"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Pilih rentang waktu transaksi yang ingin ditampilkan:
            </Text>

            <TouchableOpacity
              style={[
                styles.filterOptionBtn,
                dateFilterMode === 'today' &&
                  styles.filterOptionBtnActive,
              ]}
              onPress={() => changeDateFilter('today')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      dateFilterMode === 'today' &&
                        styles.optionTitleActive,
                    ]}
                  >
                    Hari Ini (Harian)
                  </Text>

                  <View style={styles.badgeHarian}>
                    <Text style={styles.badgeHarianText}>
                      Otomatis
                    </Text>
                  </View>
                </View>

                <Text style={styles.optionSub}>
                  {todayFormatted}
                </Text>
              </View>

              {dateFilterMode === 'today' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#C62828"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOptionBtn,
                dateFilterMode === 'yesterday' &&
                  styles.filterOptionBtnActive,
              ]}
              onPress={() => changeDateFilter('yesterday')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      dateFilterMode === 'yesterday' &&
                        styles.optionTitleActive,
                    ]}
                  >
                    Kemarin
                  </Text>

                  <View
                    style={[
                      styles.badgeHarian,
                      {
                        backgroundColor: '#E3F2FD',
                        borderColor: '#BBDEFB',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeHarianText,
                        { color: '#1565C0' },
                      ]}
                    >
                      Otomatis
                    </Text>
                  </View>
                </View>

                <Text style={styles.optionSub}>
                  {yesterdayFormatted}
                </Text>
              </View>

              {dateFilterMode === 'yesterday' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#C62828"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOptionBtn,
                dateFilterMode === 'all' &&
                  styles.filterOptionBtnActive,
              ]}
              onPress={() => changeDateFilter('all')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionTitle,
                    dateFilterMode === 'all' &&
                      styles.optionTitleActive,
                  ]}
                >
                  Semua Riwayat Tanggal
                </Text>

                <Text style={styles.optionSub}>
                  Tampilkan seluruh riwayat transaksi yang pernah
                  dicatat
                </Text>
              </View>

              {dateFilterMode === 'all' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#C62828"
                />
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
  },
  emptyDescription: {
    marginTop: 5,
    fontSize: 12,
    color: '#8D7B70',
    textAlign: 'center',
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
});