import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import DatePickerModal from '../../components/DatePickerModal';
import CustomButton from '../../components/CustomButton';
import SwipeableExpenseRow from '../../components/SwipeableExpenseRow';
import ExpenseFormModal from '../../components/ExpenseFormModal';
import DeleteExpenseModal from '../../components/DeleteExpenseModal';
import RincianPengeluaranModal from '../../components/RincianPengeluaranModal';
import { MASTER_EXPENSES } from '../../data/mockExpenses';

// Palet Warna Elegan Khas Proyek Kedai Seblak
const WARNA = {
  merahTua: '#52141D',     // Brand Deep Maroon
  merahCabe: '#C62828',    // Crimson Accent (Warna Tombol Login)
  orangeProject: '#C62828',// Diselaraskan dengan tombol login #C62828
  merahJreng: '#DC2626',   // Merah jreng cerah untuk harga & total
  kuningGold: '#F59E0B',   // Kuning Gold
  goldTua: '#B45309',      // Gold Tua Elegan
  biruCatat: '#0284C7',    // Biru Catat Pengeluaran
  latar: '#F8F5F2',
  kartu: '#FFFFFF',
  teks: '#2C1810',
  abu: '#78665E',
  garis: '#EDE5E0',
};

export default function PengeluaranScreen({ isEmbedded = false, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // 1. Single Source of Truth untuk seluruh data Pengeluaran Topping
  const [expenses, setExpenses] = useState(MASTER_EXPENSES);

  // 2. Tab Periode: 'harian' | 'mingguan' | 'bulanan'
  const [activeTab, setActiveTab] = useState('harian');

  // 3. Filter Tanggal per Periode (Default)
  const [harianDate, setHarianDate] = useState('16 Oktober 2026');
  const [mingguanDate, setMingguanDate] = useState('13 Oktober 2026 – 19 Oktober 2026');
  const [bulananDate, setBulananDate] = useState('1 Oktober 2026 – 31 Oktober 2026');

  // State Date Picker Modal
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // State Standalone Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // State Modal Form (Catat / Edit)
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // State Modal Konfirmasi Hapus
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // State Modal Rincian Pengeluaran
  const [rincianModalVisible, setRincianModalVisible] = useState(false);
  const [rincianData, setRincianData] = useState({
    dateTitle: '',
    items: [],
    totalNominal: 0,
  });

  // Helper parsing tanggal
  const parseDayNumber = (dateStr) => {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{1,2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const parseWeekRange = (rangeStr) => {
    if (!rangeStr) return [13, 19];
    const match = rangeStr.match(/(\d{1,2}).*?–.*?(\d{1,2})/);
    if (match) {
      return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }
    return [13, 19];
  };

  const currentDateText = useMemo(() => {
    if (activeTab === 'harian') return harianDate;
    if (activeTab === 'mingguan') return mingguanDate;
    return bulananDate;
  }, [activeTab, harianDate, mingguanDate, bulananDate]);

  // ==========================================================================
  // DATA FILTERING DINAMIS
  // ==========================================================================

  // A. Data Harian
  const currentHarianItems = useMemo(() => {
    const isOktober2026 = harianDate.includes('Oktober 2026');
    if (!isOktober2026) return [];

    const targetDay = parseDayNumber(harianDate);
    if (!targetDay) return [];

    const targetIso = `2026-10-${String(targetDay).padStart(2, '0')}`;
    return expenses.filter(
      (item) => item.tanggal === targetIso || item.tanggalStr === harianDate
    );
  }, [expenses, harianDate]);

  // B. Data Mingguan
  const currentMingguanGroups = useMemo(() => {
    const isOktober2026 = mingguanDate.includes('Oktober 2026');
    if (!isOktober2026) return [];

    const [startDay, endDay] = parseWeekRange(mingguanDate);
    const groupsMap = {};

    for (let d = startDay; d <= endDay; d++) {
      const iso = `2026-10-${String(d).padStart(2, '0')}`;
      groupsMap[iso] = {
        isoDate: iso,
        dayNumber: d,
        items: [],
        total: 0,
        labelHari: '',
        labelTanggal: '',
      };
    }

    expenses.forEach((item) => {
      const dNum = parseDayNumber(item.tanggalStr);
      if (dNum && dNum >= startDay && dNum <= endDay) {
        const iso = item.tanggal;
        if (!groupsMap[iso]) {
          groupsMap[iso] = {
            isoDate: iso,
            dayNumber: dNum,
            items: [],
            total: 0,
            labelHari: item.hari || '',
            labelTanggal: item.tanggalStr || '',
          };
        }
        groupsMap[iso].items.push(item);
        groupsMap[iso].total += item.total || 0;
        if (item.hari) groupsMap[iso].labelHari = item.hari;
        if (item.tanggalStr) groupsMap[iso].labelTanggal = item.tanggalStr;
      }
    });

    return Object.values(groupsMap).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [expenses, mingguanDate]);

  // C. Data Bulanan
  const currentBulananGroups = useMemo(() => {
    const isOktober2026 = bulananDate.includes('Oktober 2026');
    if (!isOktober2026) return [];

    const groupsMap = {};

    expenses.forEach((item) => {
      if (item.tanggal && item.tanggal.startsWith('2026-10')) {
        const iso = item.tanggal;
        if (!groupsMap[iso]) {
          const dNum = parseDayNumber(item.tanggalStr);
          groupsMap[iso] = {
            isoDate: iso,
            dayNumber: dNum || 1,
            items: [],
            total: 0,
            labelHari: item.hari || '',
            labelTanggal: item.tanggalStr || `${dNum} Oktober 2026`,
          };
        }
        groupsMap[iso].items.push(item);
        groupsMap[iso].total += item.total || 0;
      }
    });

    return Object.values(groupsMap).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [expenses, bulananDate]);

  // ==========================================================================
  // PERHITUNGAN TOTAL PENGELUARAN & TOTAL VOLUME BAHAN (KG)
  // ==========================================================================
  const totalNominal = useMemo(() => {
    if (activeTab === 'harian') {
      return currentHarianItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
    }
    if (activeTab === 'mingguan') {
      return currentMingguanGroups.reduce((acc, curr) => acc + (curr.total || 0), 0);
    }
    return currentBulananGroups.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [activeTab, currentHarianItems, currentMingguanGroups, currentBulananGroups]);

  // Subtitle Deskriptif Sesuai Periode
  const expenseSubLabel = useMemo(() => {
    if (activeTab === 'harian') return 'Biaya belanja hari ini';
    if (activeTab === 'mingguan') return 'Biaya belanja minggu ini';
    return 'Biaya belanja bulan ini';
  }, [activeTab]);

  // Pengeluaran Terbanyak (Topping yang paling banyak keluar biayanya di periode ini)
  const highestExpense = useMemo(() => {
    let list = [];
    if (activeTab === 'harian') list = currentHarianItems;
    else if (activeTab === 'mingguan') {
      currentMingguanGroups.forEach((g) => {
        list = list.concat(g.items || []);
      });
    } else {
      currentBulananGroups.forEach((g) => {
        list = list.concat(g.items || []);
      });
    }
    if (!list.length) return null;

    const toppingTotals = {};
    list.forEach((item) => {
      const name = item.keterangan || item.nama || 'Topping';
      toppingTotals[name] = (toppingTotals[name] || 0) + (item.total || 0);
    });

    let topName = '';
    let maxTotal = 0;
    Object.entries(toppingTotals).forEach(([name, tot]) => {
      if (tot > maxTotal) {
        maxTotal = tot;
        topName = name;
      }
    });

    return { nama: topName, total: maxTotal };
  }, [activeTab, currentHarianItems, currentMingguanGroups, currentBulananGroups]);

  // ==========================================================================
  // HANDLERS CRUD
  // ==========================================================================
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormModalVisible(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormModalVisible(true);
  };

  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleSaveExpense = (itemData) => {
    if (editingItem) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === editingItem.id ? { ...e, ...itemData } : e))
      );
    } else {
      const targetDay = parseDayNumber(itemData.tanggalStr || harianDate) || 16;
      const targetIso = `2026-10-${String(targetDay).padStart(2, '0')}`;
      const newRecord = {
        ...itemData,
        id: `EXP-${Date.now()}`,
        tanggal: targetIso,
        tanggalStr: itemData.tanggalStr || harianDate,
        hari: `Kamis, ${targetDay} Oktober`,
      };
      setExpenses((prev) => [newRecord, ...prev]);
    }
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setExpenses((prev) => prev.filter((e) => e.id !== itemToDelete.id));
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleOpenRincian = (group) => {
    setRincianData({
      dateTitle:
        group.labelHari ||
        group.labelTanggal ||
        `Tanggal ${group.dayNumber} Oktober 2026`,
      items: group.items || [],
      totalNominal: group.total || 0,
    });
    setRincianModalVisible(true);
  };

  const handleSelectDate = (newDateStr) => {
    if (activeTab === 'harian') setHarianDate(newDateStr);
    else if (activeTab === 'mingguan') setMingguanDate(newDateStr);
    else if (activeTab === 'bulanan') setBulananDate(newDateStr);
  };

  const sectionTitle = useMemo(() => {
    if (activeTab === 'harian') return 'Data Pengeluaran Harian';
    if (activeTab === 'mingguan') return 'Rekap Pengeluaran Mingguan';
    return 'Rekap Pengeluaran Bulanan';
  }, [activeTab]);

  // ==========================================================================
  // RENDER CONTENT
  // ==========================================================================
  const content = (
    <View style={styles.mainContainer}>
      {/* 1. TAB PERIODE (Harian | Mingguan | Bulanan) */}
      <View style={styles.tabPeriodWrapper}>
        <View style={styles.tabPeriodContainer}>
          <TouchableOpacity
            style={[
              styles.tabPeriodBtn,
              activeTab === 'harian' && styles.tabPeriodBtnActive,
            ]}
            onPress={() => setActiveTab('harian')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPeriodText,
                activeTab === 'harian' && styles.tabPeriodTextActive,
              ]}
            >
              Harian
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPeriodBtn,
              activeTab === 'mingguan' && styles.tabPeriodBtnActive,
            ]}
            onPress={() => setActiveTab('mingguan')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPeriodText,
                activeTab === 'mingguan' && styles.tabPeriodTextActive,
              ]}
            >
              Mingguan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPeriodBtn,
              activeTab === 'bulanan' && styles.tabPeriodBtnActive,
            ]}
            onPress={() => setActiveTab('bulanan')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPeriodText,
                activeTab === 'bulanan' && styles.tabPeriodTextActive,
              ]}
            >
              Bulanan
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. FILTER TANGGAL */}
      <TouchableOpacity
        style={styles.dateFilterCard}
        onPress={() => setDatePickerVisible(true)}
        activeOpacity={0.7}
        accessibilityLabel="Pilih tanggal atau periode"
      >
        <View style={styles.dateFilterLeft}>
          <Ionicons name="calendar-outline" size={18} color={WARNA.merahTua} />
          <Text style={styles.dateFilterText}>{currentDateText}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={WARNA.abu} />
      </TouchableOpacity>

      {/* 3. CARD TOTAL PENGELUARAN & PENGELUARAN TERBESAR (DUAL CARD BERSIH) */}
      <View style={styles.dualCardRow}>
        {/* Card 1: Total Pengeluaran (Deep Maroon Identik Dashboard) */}
        <View style={styles.totalCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.totalCardLabel}>Total Pengeluaran</Text>
            <View style={styles.coinBadge}>
              <Ionicons name="wallet-outline" size={18} color={WARNA.kuningGold} />
            </View>
          </View>
          <Text style={styles.totalCardAmount}>
            {formatCurrency(totalNominal)}
          </Text>
          <Text style={styles.totalCardSub} numberOfLines={1}>
            {expenseSubLabel}
          </Text>
        </View>

        {/* Card 2: Pengeluaran Terbesar (Pengganti Total Volume Bahan, Tanpa Warna Hijau) */}
        <View style={styles.topExpenseCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.topExpenseCardLabel}>Pengeluaran Terbesar</Text>
            <View style={styles.topExpenseBadge}>
              <Ionicons name="flame-outline" size={18} color={WARNA.goldTua} />
            </View>
          </View>
          <Text style={styles.topExpenseCardName} numberOfLines={1}>
            {highestExpense ? highestExpense.nama : '-'}
          </Text>
          <Text style={styles.topExpenseCardSub}>
            {highestExpense ? formatCurrency(highestExpense.total) : 'Belum ada data'}
          </Text>
        </View>
      </View>

      {/* 4. JUDUL SECTION DATA PENGELUARAN */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleText}>{sectionTitle}</Text>
      </View>

      {/* ================================================================== */}
      {/* KONDISI A: TAB HARIAN (CRUD: + CATAT PENGELUARAN + SWIPE ACTIONS) */}
      {/* ================================================================== */}
      {activeTab === 'harian' ? (
        <View style={styles.harianWrapper}>
          {/* TOMBOL + CATAT PENGELUARAN: WARNA BIRU, SIMBOL '+' SATU SAJA */}
          <CustomButton
            title="+ Catat Pengeluaran"
            variant="primary"
            onPress={handleOpenCreateModal}
            style={styles.catatPengeluaranBtn}
          />

          {/* TABEL PENGELUARAN HARIAN (Dapat digeser menyamping jika nama/label panjang) */}
          <View style={styles.tableCard}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.tableHorizontalScroll}
            >
              <View style={styles.tableInnerWrapper}>
                {/* Header Kolom Tetap / Sticky */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerColText, styles.colNo]}>No</Text>
                  <Text style={[styles.headerColText, styles.colWaktu]}>Waktu</Text>
                  <Text style={[styles.headerColText, styles.colKet]}>
                    List Topping
                  </Text>
                  <Text style={[styles.headerColText, styles.colJumlah]}>
                    Jumlah
                  </Text>
                  <Text style={[styles.headerColText, styles.colTotal]}>Total</Text>
                  <View style={styles.headerSwipeSpacer} />
                </View>

                {/* Daftar Baris Pengeluaran (FlatList dengan Swipe Action) */}
                <FlatList
                  data={currentHarianItems}
                  keyExtractor={(item) => String(item.id)}
                  showsVerticalScrollIndicator={true}
                  style={styles.tableBodyScroll}
                  contentContainerStyle={styles.tableBodyContent}
                  renderItem={({ item, index }) => (
                    <SwipeableExpenseRow
                      item={item}
                      index={index}
                      isLast={index === currentHarianItems.length - 1}
                      onEdit={handleOpenEditModal}
                      onDelete={handleOpenDeleteModal}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconCircle}>
                        <Ionicons name="receipt-outline" size={32} color={WARNA.abu} />
                      </View>
                      <Text style={styles.emptyTitle}>
                        Belum Ada Catatan Pengeluaran
                      </Text>
                      <Text style={styles.emptySubtitle}>
                        Tidak ada pengeluaran topping pada {harianDate}.
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyAddBtn}
                        onPress={handleOpenCreateModal}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={16}
                          color="#FFFFFF"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.emptyAddBtnText}>
                          Catat Topping Pertama
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}

      {/* ================================================================== */}
      {/* KONDISI B: TAB MINGGUAN (REKAP PER HARI)                           */}
      {/* ================================================================== */}
      {activeTab === 'mingguan' ? (
        <View style={styles.rekapCard}>
          <ScrollView
            style={styles.rekapScroll}
            showsVerticalScrollIndicator={true}
          >
            {currentMingguanGroups.length > 0 ? (
              currentMingguanGroups.map((group, index) => {
                const dayDateText =
                  group.labelHari ||
                  `Hari ke-${group.dayNumber}, ${group.labelTanggal}`;
                const itemCount = group.items.length;

                return (
                  <TouchableOpacity
                    key={group.isoDate || index}
                    style={[
                      styles.rekapItemRow,
                      index === currentMingguanGroups.length - 1 &&
                        styles.rekapItemRowLast,
                    ]}
                    onPress={() => handleOpenRincian(group)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rekapItemLeft}>
                      <Text style={styles.rekapDateTitle}>{dayDateText}</Text>
                      <Text style={styles.rekapItemCount}>
                        {itemCount > 0
                          ? `${itemCount} pembelian topping`
                          : 'Tidak ada pembelian'}
                      </Text>
                    </View>

                    <View style={styles.rekapItemRight}>
                      <Text style={styles.rekapNominalText}>
                        {formatCurrency(group.total)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={WARNA.abu}
                        style={{ marginLeft: 6 }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={32} color={WARNA.abu} />
                <Text style={styles.emptyTitle}>
                  Tidak Ada Data untuk Rentang Ini
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}

      {/* ================================================================== */}
      {/* KONDISI C: TAB BULANAN (REKAP PER TANGGAL OKTOBER)                 */}
      {/* ================================================================== */}
      {activeTab === 'bulanan' ? (
        <View style={styles.rekapCard}>
          <ScrollView
            style={styles.rekapScroll}
            showsVerticalScrollIndicator={true}
          >
            {currentBulananGroups.length > 0 ? (
              currentBulananGroups.map((group, index) => {
                const dateLabel =
                  group.labelTanggal ||
                  `${String(group.dayNumber).padStart(2, '0')} Oktober 2026`;
                const itemCount = group.items.length;

                return (
                  <TouchableOpacity
                    key={group.isoDate || index}
                    style={[
                      styles.rekapItemRow,
                      index === currentBulananGroups.length - 1 &&
                        styles.rekapItemRowLast,
                    ]}
                    onPress={() => handleOpenRincian(group)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rekapItemLeft}>
                      <Text style={styles.rekapDateTitle}>{dateLabel}</Text>
                      <Text style={styles.rekapItemCount}>
                        {itemCount} pembelian topping
                      </Text>
                    </View>

                    <View style={styles.rekapItemRight}>
                      <Text style={styles.rekapNominalText}>
                        {formatCurrency(group.total)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={WARNA.abu}
                        style={{ marginLeft: 6 }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={32} color={WARNA.abu} />
                <Text style={styles.emptyTitle}>
                  Tidak Ada Data untuk Bulan Ini
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}

      {/* Modal Kalender Interaktif */}
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        mode={activeTab}
        currentDateText={currentDateText}
        onSelectDate={handleSelectDate}
      />

      {/* Modal Form Catat & Edit Pengeluaran Topping */}
      <ExpenseFormModal
        visible={formModalVisible}
        onClose={() => {
          setFormModalVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveExpense}
        initialData={editingItem}
        selectedDateStr={harianDate}
      />

      {/* Modal Konfirmasi Hapus */}
      <DeleteExpenseModal
        visible={deleteModalVisible}
        item={itemToDelete}
        onClose={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal Rincian Pengeluaran */}
      <RincianPengeluaranModal
        visible={rincianModalVisible}
        onClose={() => setRincianModalVisible(false)}
        dateTitle={rincianData.dateTitle}
        items={rincianData.items}
        totalNominal={rincianData.totalNominal}
      />
    </View>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <View style={styles.standaloneContainer}>
      {!isMobile && sidebarOpen && (
        <Sidebar role="owner" activeTab="pengeluaran" isMobile={false} />
      )}

      {isMobile && sidebarOpen && (
        <View style={styles.mobileBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
          />
          <Sidebar
            role="owner"
            activeTab="pengeluaran"
            isMobile={true}
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}

      <View style={styles.standaloneMain}>
        <TopHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
          title="Owner Portal · Pengeluaran"
          role="Owner"
        />
        <View style={styles.standaloneContent}>{content}</View>
      </View>
    </View>
  );
}

// ============================================================================
// STYLING
// ============================================================================
const styles = StyleSheet.create({
  standaloneContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: WARNA.latar,
  },
  standaloneMain: {
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  standaloneContent: {
    flex: 1,
    width: '100%',
  },
  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    flexDirection: 'row',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: WARNA.latar,
  },

  // 1. Tab Periode
  tabPeriodWrapper: {
    marginBottom: 10,
  },
  tabPeriodContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    gap: 4,
  },
  tabPeriodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabPeriodBtnActive: {
    backgroundColor: WARNA.orangeProject, // Orange Project Palette
    shadowColor: WARNA.orangeProject,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  tabPeriodText: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.abu,
  },
  tabPeriodTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 2. Filter Tanggal
  dateFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  dateFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.teks,
  },

  // 3. Dual Card Row (Total Pengeluaran & Total Volume Bahan)
  dualCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  totalCard: {
    flex: 1.2,
    backgroundColor: WARNA.merahTua, // Deep Maroon identik Dashboard
    borderRadius: 14,
    padding: 14,
    shadowColor: WARNA.merahTua,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DFB8BC',
    textTransform: 'uppercase',
  },
  totalCardAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  totalCardSub: {
    fontSize: 10,
    color: '#D1C7BD',
    marginTop: 2,
  },
  coinBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pengeluaran Terbanyak Card (Warm project palette, NO GREEN!)
  topExpenseCard: {
    flex: 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topExpenseCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: WARNA.abu,
    textTransform: 'uppercase',
  },
  topExpenseCardName: {
    fontSize: 16,
    fontWeight: '900',
    color: WARNA.teks,
    marginTop: 2,
  },
  topExpenseCardSub: {
    fontSize: 11,
    fontWeight: '700',
    color: WARNA.goldTua,
    marginTop: 2,
  },
  topExpenseBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 4. Section Header
  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: WARNA.teks,
  },

  // Harian Action
  harianWrapper: {
    flex: 1,
  },
  catatPengeluaranBtn: {
    marginBottom: 10,
    height: 42,
    backgroundColor: WARNA.biruCatat, // Biru Project
    borderColor: WARNA.biruCatat,
    borderRadius: 10,
  },

  // Table Card
  tableCard: {
    flex: 1,
    minHeight: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    overflow: 'hidden',
  },
  tableHorizontalScroll: {
    minWidth: 540,
    flexGrow: 1,
  },
  tableInnerWrapper: {
    minWidth: 540,
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE5E0',
    borderBottomWidth: 1.5,
    borderBottomColor: '#D8CBC3',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 540,
  },
  headerColText: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },
  headerSwipeSpacer: {
    width: 18,
  },
  colNo: {
    width: 28,
    textAlign: 'center',
  },
  colWaktu: {
    width: 50,
    textAlign: 'center',
  },
  colKet: {
    flex: 1,
    minWidth: 240,
    paddingHorizontal: 6,
    textAlign: 'left',
  },
  colJumlah: {
    width: 75,
    textAlign: 'center',
  },
  colTotal: {
    width: 90,
    textAlign: 'right',
    paddingRight: 4,
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableBodyContent: {
    paddingBottom: 8,
  },

  // Rekap Mingguan & Bulanan
  rekapCard: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    overflow: 'hidden',
  },
  rekapScroll: {
    flex: 1,
  },
  rekapItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
    backgroundColor: '#FFFFFF',
  },
  rekapItemRowLast: {
    borderBottomWidth: 0,
  },
  rekapItemLeft: {
    flex: 1,
  },
  rekapDateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 2,
  },
  rekapItemCount: {
    fontSize: 11,
    color: '#78665E',
  },
  rekapItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rekapNominalText: {
    fontSize: 14,
    fontWeight: '800',
    color: WARNA.merahJreng,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F5F2',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#78665E',
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 260,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.merahCabe,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
