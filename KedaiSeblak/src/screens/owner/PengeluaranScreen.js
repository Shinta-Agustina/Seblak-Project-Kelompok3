import React, { useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import DetailPengeluaranModal from '../../components/DetailPengeluaranModal';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../services/pengeluaranService';
import { useKasir } from '../../context/KasirContext';

// Palet Warna Elegan Khas Proyek Kedai Seblak
const WARNA = {
  merahTua: '#52141D',      // Brand Deep Maroon
  merahCabe: '#C62828',     // Crimson Accent
  orangeProject: '#C62828',
  merahJreng: '#DC2626',    // Merah cerah untuk harga & total
  kuningGold: '#F59E0B',    // Kuning Gold
  goldTua: '#B45309',       // Gold Tua Elegan
  biruCatat: '#0284C7',     // Biru Catat Pengeluaran
  latar: '#F8F5F2',
  kartu: '#FFFFFF',
  teks: '#2C1810',
  abu: '#78665E',
  garis: '#EDE5E0',
};

export default function PengeluaranScreen({ isEmbedded = false, navigation, expenses: expensesProp, onAddExpense, onUpdateExpense, onDeleteExpense }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // 1. Single Source of Truth untuk seluruh data Pengeluaran
  const [localExpenses, setLocalExpenses] = useState([]);
  const { user } = useKasir();
  const [expenseLoading, setExpenseLoading] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (Array.isArray(expensesProp)) return;
    setExpenseLoading(true);
    try {
      const rows = await getExpenses();
      setLocalExpenses(
        rows.map((r) => ({
          ...r,
          keterangan: r.nama,
          total: r.nominal,
          nominal: r.nominal,
          tanggalStr: new Date(`${r.tanggal}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          waktu: new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          satuan: 'unit',
          supplier: r.catatan || '-',
        }))
      );
    } catch (e) {
      console.error('Gagal memuat pengeluaran:', e.message);
    } finally {
      setExpenseLoading(false);
    }
  }, [expensesProp]);

  useFocusEffect(useCallback(() => { loadExpenses(); }, [loadExpenses]));
  const expenses = Array.isArray(expensesProp) ? expensesProp : localExpenses;

  // 2. Tab Periode: 'harian' | 'mingguan' | 'bulanan'
  const [activeTab, setActiveTab] = useState('harian');

  // 3. Filter Tanggal per Periode
  const [harianDate, setHarianDate] = useState('17 Oktober 2026');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const handleOpenDetailModal = (item) => {
    setSelectedDetailItem(item);
    setDetailModalVisible(true);
  };

  const [mingguanDate, setMingguanDate] = useState('13 Oktober 2026 – 19 Oktober 2026');
  const [bulananDate, setBulananDate] = useState('1 Oktober 2026 – 31 Oktober 2026');

  // State Modals
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [rincianModalVisible, setRincianModalVisible] = useState(false);
  const [rincianData, setRincianData] = useState({ dateTitle: '', items: [], totalNominal: 0 });

  // Helper parsing tanggal
  // Tanggal pengeluaran dari Supabase berformat ISO (YYYY-MM-DD) -> ambil nomor harinya.
  const parseDayNumber = (dateStr) => {
    if (!dateStr) return null;
    const iso = String(dateStr).match(/^\d{4}-\d{2}-(\d{2})/);
    if (iso) return parseInt(iso[1], 10);
    const match = String(dateStr).match(/^(\d{1,2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const labelTanggalPanjang = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const tanggalKeISO = (dateStr) => {
    if (!dateStr) return '';
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const match = String(dateStr).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (!match) return '';
    const bulan = {
      januari: '01', februari: '02', maret: '03', april: '04',
      mei: '05', juni: '06', juli: '07', agustus: '08',
      september: '09', oktober: '10', november: '11', desember: '12',
    };
    const mm = bulan[match[2].toLowerCase()];
    return mm ? `${match[3]}-${mm}-${match[1].padStart(2, '0')}` : '';
  };

  const parseWeekRange = (rangeStr) => {
    if (!rangeStr) return [13, 19];
    const match = rangeStr.match(/(\d{1,2}).*?–.*?(\d{1,2})/);
    if (match) return [parseInt(match[1], 10), parseInt(match[2], 10)];
    return [13, 19];
  };

  const currentDateText = useMemo(() => {
    if (activeTab === 'harian') return harianDate;
    if (activeTab === 'mingguan') return mingguanDate;
    return bulananDate;
  }, [activeTab, harianDate, mingguanDate, bulananDate]);

  // Data Filtering
  const currentHarianItems = useMemo(() => {
    const targetIso = tanggalKeISO(harianDate);
    if (!targetIso) return expenses;
    return expenses.filter(
      (item) => item.tanggal === targetIso || item.tanggalStr === harianDate
    );
  }, [expenses, harianDate]);

  const currentMingguanGroups = useMemo(() => {
    const isOktober2026 = mingguanDate.includes('Oktober 2026');
    if (!isOktober2026) return [];
    const [startDay, endDay] = parseWeekRange(mingguanDate);
    const groupsMap = {};

    for (let d = startDay; d <= endDay; d++) {
      const iso = `2026-10-${String(d).padStart(2, '0')}`;
      groupsMap[iso] = { isoDate: iso, dayNumber: d, items: [], total: 0, labelHari: labelTanggalPanjang(iso), labelTanggal: labelTanggalPanjang(iso) };
    }

    expenses.forEach((item) => {
      const dNum = parseDayNumber(item.tanggal);
      if (dNum && dNum >= startDay && dNum <= endDay && String(item.tanggal).startsWith('2026-10')) {
        const iso = item.tanggal;
        if (!groupsMap[iso]) {
          groupsMap[iso] = { isoDate: iso, dayNumber: dNum, items: [], total: 0, labelHari: labelTanggalPanjang(iso), labelTanggal: labelTanggalPanjang(iso) };
        }
        groupsMap[iso].items.push(item);
        groupsMap[iso].total += item.total || 0;
      }
    });

    return Object.values(groupsMap).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [expenses, mingguanDate]);

  const currentBulananGroups = useMemo(() => {
    const isOktober2026 = bulananDate.includes('Oktober 2026');
    if (!isOktober2026) return [];
    const groupsMap = {};

    expenses.forEach((item) => {
      if (item.tanggal && item.tanggal.startsWith('2026-10')) {
        const iso = item.tanggal;
        if (!groupsMap[iso]) {
          const dNum = parseDayNumber(item.tanggal);
          groupsMap[iso] = { isoDate: iso, dayNumber: dNum || 1, items: [], total: 0, labelHari: labelTanggalPanjang(iso), labelTanggal: labelTanggalPanjang(iso) };
        }
        groupsMap[iso].items.push(item);
        groupsMap[iso].total += item.total || 0;
      }
    });

    return Object.values(groupsMap).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [expenses, bulananDate]);

  const totalNominal = useMemo(() => {
    if (activeTab === 'harian') return currentHarianItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
    if (activeTab === 'mingguan') return currentMingguanGroups.reduce((acc, curr) => acc + (curr.total || 0), 0);
    return currentBulananGroups.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [activeTab, currentHarianItems, currentMingguanGroups, currentBulananGroups]);

  const expenseSubLabel = useMemo(() => {
    if (activeTab === 'harian') return 'Biaya belanja hari ini';
    if (activeTab === 'mingguan') return 'Biaya belanja minggu ini';
    return 'Biaya belanja bulan ini';
  }, [activeTab]);

  const highestExpense = useMemo(() => {
    let list = [];
    if (activeTab === 'harian') list = currentHarianItems;
    else if (activeTab === 'mingguan') currentMingguanGroups.forEach((g) => { list = list.concat(g.items || []); });
    else currentBulananGroups.forEach((g) => { list = list.concat(g.items || []); });
    if (!list.length) return null;

    const toppingTotals = {};
    list.forEach((item) => {
      const name = item.keterangan || item.nama || 'Topping';
      toppingTotals[name] = (toppingTotals[name] || 0) + (item.total || 0);
    });

    let topName = '';
    let maxTotal = 0;
    Object.entries(toppingTotals).forEach(([name, tot]) => {
      if (tot > maxTotal) { maxTotal = tot; topName = name; }
    });

    return { nama: topName, total: maxTotal };
  }, [activeTab, currentHarianItems, currentMingguanGroups, currentBulananGroups]);

  // CRUD Handlers
  const handleSaveExpense = async (itemData) => {
    try {
      const tanggalStr = itemData.tanggalStr || harianDate;
      const tanggal = tanggalKeISO(tanggalStr) || new Date().toISOString().slice(0, 10);
      const jumlah = Number(itemData.jumlah || 1);
      const total = Number(itemData.total || itemData.nominal || 0);
      const payload = {
        tanggal,
        nama: itemData.keterangan,
        kategori: itemData.kategori,
        jumlah,
        harga_satuan: total / jumlah,
        catatan: `Satuan: ${itemData.satuan || 'unit'}; Supplier: ${itemData.supplier || '-'}`,
      };
      if (onAddExpense && !editingItem) onAddExpense(itemData);
      else if (onUpdateExpense && editingItem) onUpdateExpense({ ...editingItem, ...itemData });
      else if (editingItem) await updateExpense(editingItem.id, payload);
      else await createExpense(payload, user?.id);
      await loadExpenses();
    } catch (e) {
      console.error('Gagal menyimpan pengeluaran:', e.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (onDeleteExpense) onDeleteExpense(itemToDelete.id);
      else await deleteExpense(itemToDelete.id);
      await loadExpenses();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (e) {
      console.error('Gagal menghapus pengeluaran:', e.message);
    }
  };

  const handleOpenRincian = (group) => {
    setRincianData({
      dateTitle: group.labelHari || group.labelTanggal || `Tanggal ${group.dayNumber} Oktober 2026`,
      items: group.items || [],
      totalNominal: group.total || 0,
    });
    setRincianModalVisible(true);
  };

  const content = (
    <View style={styles.mainContainer}>
      {/* 1. Tab Periode */}
      <View style={styles.tabPeriodWrapper}>
        <View style={styles.tabPeriodContainer}>
          {['harian', 'mingguan', 'bulanan'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPeriodBtn, activeTab === tab && styles.tabPeriodBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPeriodText, activeTab === tab && styles.tabPeriodTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Filter Tanggal */}
      <View style={styles.dateFilterContainerRow}>
        <TouchableOpacity style={styles.dateFilterCard} onPress={() => setDatePickerVisible(true)} activeOpacity={0.7}>
          <View style={styles.dateFilterLeft}>
            <Ionicons name="calendar-outline" size={18} color={WARNA.merahTua} />
            <Text style={styles.dateFilterText}>{currentDateText}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={WARNA.abu} />
        </TouchableOpacity>
      </View>

      {/* 3. Dual Card Total & Pengeluaran Terbesar */}
      <View style={styles.dualCardRow}>
        <View style={styles.totalCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.totalCardLabel}>Total Pengeluaran</Text>
            <View style={styles.coinBadge}>
              <Ionicons name="wallet-outline" size={18} color={WARNA.kuningGold} />
            </View>
          </View>
          <Text style={styles.totalCardAmount}>{formatCurrency(totalNominal)}</Text>
          <Text style={styles.totalCardSub} numberOfLines={1}>{expenseSubLabel}</Text>
        </View>

        <View style={styles.topExpenseCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.topExpenseCardLabel}>Pengeluaran Terbesar</Text>
            <View style={styles.topExpenseBadge}>
              <Ionicons name="flame-outline" size={18} color={WARNA.goldTua} />
            </View>
          </View>
          <Text style={styles.topExpenseCardName} numberOfLines={1}>{highestExpense ? highestExpense.nama : '-'}</Text>
          <Text style={styles.topExpenseCardSub}>{highestExpense ? formatCurrency(highestExpense.total) : 'Belum ada data'}</Text>
        </View>
      </View>

      {/* Tab Harian Content */}
      {activeTab === 'harian' && (
        <View style={styles.harianWrapper}>
          <View style={styles.catatBtnContainer}>
            <TouchableOpacity style={styles.catatPengeluaranBtn} onPress={() => { setEditingItem(null); setFormModalVisible(true); }} activeOpacity={0.8}>
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.catatPengeluaranBtnText}>Catat Pengeluaran</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableHorizontalScroll}>
              <View style={styles.tableInnerWrapper}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerColText, styles.colWaktu]}>Waktu</Text>
                  <Text style={[styles.headerColText, styles.colKet]}>Keterangan</Text>
                  <Text style={[styles.headerColText, styles.colKategori]}>Kategori</Text>
                  <Text style={[styles.headerColText, styles.colJumlah]}>Jumlah</Text>
                  <Text style={[styles.headerColText, styles.colTotal]}>Total</Text>
                  <Text style={[styles.headerColText, styles.colFotoItem]}>Foto Item</Text>
                  <Text style={[styles.headerColText, styles.colFotoStruk]}>Foto Struk</Text>
                  <Text style={[styles.headerColText, styles.colAksi]}>Aksi</Text>
                </View>

                <FlatList
                  data={currentHarianItems}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item, index }) => (
                    <SwipeableExpenseRow
                      item={item}
                      index={index}
                      isLast={index === currentHarianItems.length - 1}
                      onEdit={(it) => { setEditingItem(it); setFormModalVisible(true); }}
                      onDelete={(it) => { setItemToDelete(it); setDeleteModalVisible(true); }}
                      onViewDetail={handleOpenDetailModal}
                    />
                  )}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Tab Mingguan & Bulanan Rekap */}
      {activeTab === 'mingguan' && (
        <View style={styles.rekapCard}>
          <ScrollView showsVerticalScrollIndicator>
            {currentMingguanGroups.map((group, index) => (
              <TouchableOpacity key={group.isoDate || index} style={styles.rekapItemRow} onPress={() => handleOpenRincian(group)}>
                <View>
                  <Text style={styles.rekapDateTitle}>{group.labelHari || `Hari ke-${group.dayNumber}`}</Text>
                  <Text style={styles.rekapItemCount}>{group.items.length} item pembelian</Text>
                </View>
                <Text style={styles.rekapNominalText}>{formatCurrency(group.total)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeTab === 'bulanan' && (
        <View style={styles.rekapCard}>
          <ScrollView showsVerticalScrollIndicator>
            {currentBulananGroups.map((group, index) => (
              <TouchableOpacity key={group.isoDate || index} style={styles.rekapItemRow} onPress={() => handleOpenRincian(group)}>
                <View>
                  <Text style={styles.rekapDateTitle}>{group.labelTanggal}</Text>
                  <Text style={styles.rekapItemCount}>{group.items.length} item pembelian</Text>
                </View>
                <Text style={styles.rekapNominalText}>{formatCurrency(group.total)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <DatePickerModal visible={datePickerVisible} onClose={() => setDatePickerVisible(false)} mode={activeTab} currentDateText={currentDateText} onSelectDate={(d) => { if (activeTab === 'harian') setHarianDate(d); else if (activeTab === 'mingguan') setMingguanDate(d); else setBulananDate(d); }} />
      <ExpenseFormModal visible={formModalVisible} onClose={() => { setFormModalVisible(false); setEditingItem(null); }} onSubmit={handleSaveExpense} initialData={editingItem} selectedDateStr={harianDate} />
      <DeleteExpenseModal visible={deleteModalVisible} item={itemToDelete} onClose={() => { setDeleteModalVisible(false); setItemToDelete(null); }} onConfirm={handleConfirmDelete} />
      <DetailPengeluaranModal visible={detailModalVisible} item={selectedDetailItem} onClose={() => { setDetailModalVisible(false); setSelectedDetailItem(null); }} />
      <RincianPengeluaranModal visible={rincianModalVisible} onClose={() => setRincianModalVisible(false)} dateTitle={rincianData.dateTitle} items={rincianData.items} totalNominal={rincianData.totalNominal} />
    </View>
  );

  if (isEmbedded) return content;

  return (
    <View style={styles.standaloneContainer}>
      {!isMobile && sidebarOpen && <Sidebar role="owner" activeTab="pengeluaran" isMobile={false} />}
      <View style={styles.standaloneMain}>
        <TopHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} isSidebarOpen={sidebarOpen} title="Owner Portal · Pengeluaran" role="Owner" />
        <View style={styles.standaloneContent}>{content}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  standaloneContainer: { flex: 1, flexDirection: 'row', backgroundColor: WARNA.latar },
  standaloneMain: { flex: 1, minWidth: 0, height: '100%' },
  standaloneContent: { flex: 1, width: '100%' },
  mainContainer: { flex: 1, width: '100%', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, backgroundColor: WARNA.latar },
  tabPeriodWrapper: { marginBottom: 10 },
  tabPeriodContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 3, borderWidth: 1.5, borderColor: '#E8DCD4', gap: 4 },
  tabPeriodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabPeriodBtnActive: { backgroundColor: WARNA.merahTua },
  tabPeriodText: { fontSize: 13, fontWeight: '600', color: WARNA.abu },
  tabPeriodTextActive: { color: '#FFFFFF' },
  dateFilterContainerRow: { marginBottom: 12 },
  dateFilterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: WARNA.garis },
  dateFilterLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateFilterText: { fontSize: 13, fontWeight: '600', color: WARNA.merahTua },
  dualCardRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  totalCard: { flex: 1, backgroundColor: WARNA.merahTua, borderRadius: 14, padding: 14 },
  totalCardLabel: { fontSize: 12, color: '#F3E8E8', fontWeight: '500' },
  totalCardAmount: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },
  totalCardSub: { fontSize: 11, color: '#E8DCD4', marginTop: 2 },
  topExpenseCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: WARNA.garis },
  topExpenseCardLabel: { fontSize: 12, color: WARNA.abu, fontWeight: '500' },
  topExpenseCardName: { fontSize: 16, fontWeight: '700', color: WARNA.teks, marginTop: 4 },
  topExpenseCardSub: { fontSize: 11, color: WARNA.merahJreng, fontWeight: '600', marginTop: 2 },
  cardHeaderSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coinBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topExpenseBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  sectionHeaderRow: { marginBottom: 10 },
  sectionTitleText: { fontSize: 15, fontWeight: '700', color: WARNA.teks },
  harianWrapper: { flex: 1 },
  catatBtnContainer: { alignItems: 'flex-end', marginBottom: 10 },
  catatPengeluaranBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: WARNA.biruCatat, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  catatPengeluaranBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  tableCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: WARNA.garis, overflow: 'hidden' },
  tableHorizontalScroll: { flexGrow: 1, paddingBottom: 8 },
  tableInnerWrapper: { minWidth: 796, flexGrow: 1 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F4ECE6', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: WARNA.garis },
  headerColText: { fontSize: 12, fontWeight: '700', color: WARNA.merahTua },
  colWaktu: { width: 75, textAlign: 'center' },
  colKet: { flex: 1, minWidth: 140, paddingHorizontal: 6 },
  colKategori: { width: 95, paddingHorizontal: 6 },
  colJumlah: { width: 75, paddingHorizontal: 6, textAlign: 'center' },
  colTotal: { width: 110, paddingHorizontal: 6 },
  colFotoItem: { width: 85, textAlign: 'center' },
  colFotoStruk: { width: 85, textAlign: 'center' },
  colAksi: { width: 115, textAlign: 'center' },
  rekapCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: WARNA.garis, padding: 10 },
  rekapItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: WARNA.garis },
  rekapDateTitle: { fontSize: 14, fontWeight: '600', color: WARNA.teks, textTransform: 'capitalize' },
  rekapItemCount: { fontSize: 11, color: WARNA.abu, marginTop: 2 },
  rekapNominalText: { fontSize: 14, fontWeight: '700', color: WARNA.merahJreng },
});