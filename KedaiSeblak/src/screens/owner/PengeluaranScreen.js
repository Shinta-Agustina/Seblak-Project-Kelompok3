import React, {
  useState,
  useMemo,
  useCallback,
} from 'react';

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
import CustomButton from '../../components/CustomButton';
import SwipeableExpenseRow from '../../components/SwipeableExpenseRow';
import ExpenseCard from '../../components/ExpenseCard';

import DatePickerModal, {
  mingguHariIni,
  bulanHariIni,
} from '../../components/DatePickerModal';

import ExpenseFormModal from '../../components/ExpenseFormModal';
import DeleteExpenseModal from '../../components/DeleteExpenseModal';
import RincianPengeluaranModal from '../../components/RincianPengeluaranModal';
import DetailPengeluaranModal from '../../components/DetailPengeluaranModal';

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  hariIniIndo,
} from '../../services/pengeluaranService';

import { useKasir } from '../../context/KasirContext';

const WARNA = {
  merahTua: '#52141D',
  merahCabe: '#C62828',
  merahJreng: '#DC2626',
  kuningGold: '#F59E0B',
  goldTua: '#B45309',
  biruCatat: '#0284C7',
  latar: '#F8F5F2',
  kartu: '#FFFFFF',
  teks: '#2C1810',
  abu: '#78665E',
  garis: '#EDE5E0',
};

const BULAN_ID = [
  'januari',
  'februari',
  'maret',
  'april',
  'mei',
  'juni',
  'juli',
  'agustus',
  'september',
  'oktober',
  'november',
  'desember',
];

// =====================================================
// HELPER TANGGAL
// =====================================================

function tanggalLokalISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isoKeTanggalIndo(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));

  if (!match) return String(iso || '');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return String(iso);

  return `${day} ${BULAN_ID[month - 1].charAt(0).toUpperCase()}${BULAN_ID[
    month - 1
  ].slice(1)} ${year}`;
}

function tanggalKeISO(value) {
  if (!value) return '';

  const text = String(value).trim();

  // Tanggal dari database.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  // Tanggal Indonesia: 15 November 2026.
  const indo = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i.exec(text);

  if (indo) {
    const month = BULAN_ID.indexOf(indo[2].toLowerCase()) + 1;

    if (month) {
      return `${indo[3]}-${String(month).padStart(2, '0')}-${String(
        Number(indo[1])
      ).padStart(2, '0')}`;
    }
  }

  return '';
}

function parseRange(rangeStr) {
  const text = String(rangeStr || '');

  const match =
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}).*?[–-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i.exec(
      text
    );

  if (!match) return null;

  const startMonth = BULAN_ID.indexOf(match[2].toLowerCase()) + 1;
  const endMonth = BULAN_ID.indexOf(match[5].toLowerCase()) + 1;

  if (!startMonth || !endMonth) return null;

  const start = `${match[3]}-${String(startMonth).padStart(2, '0')}-${String(
    match[1]
  ).padStart(2, '0')}`;

  const end = `${match[6]}-${String(endMonth).padStart(2, '0')}-${String(
    match[4]
  ).padStart(2, '0')}`;

  return { start, end };
}

function parseBulan(value) {
  const text = String(value || '').toLowerCase();

  const match = /([a-z]+)\s+(\d{4})/.exec(text);

  if (match) {
    const month = BULAN_ID.indexOf(match[1]) + 1;

    if (month) {
      return {
        year: Number(match[2]),
        month,
      };
    }
  }

  const range = parseRange(value);

  if (range) {
    const date = new Date(`${range.start}T00:00:00`);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }

  const iso = tanggalKeISO(value);

  if (iso) {
    const date = new Date(`${iso}T00:00:00`);

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }

  return null;
}

function nominalAngka(value) {
  if (typeof value === 'number') return value || 0;

  const number = Number(
    String(value || '').replace(/[^0-9-]/g, '')
  );

  return Number.isFinite(number) ? number : 0;
}

function jumlahAngka(value) {
  const number = Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
}

function formatTanggalPanjang(iso) {
  const date = new Date(`${iso}T00:00:00`);

  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// =====================================================
// SCREEN
// =====================================================

export default function PengeluaranScreen({
  isEmbedded = false,
  navigation,
  expenses: expensesProp,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user } = useKasir();

  const [localExpenses, setLocalExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (Array.isArray(expensesProp)) return;

    setExpenseLoading(true);

    try {
      const rows = await getExpenses();

      const mapped = (rows || []).map((row) => {
        const tanggalISO = tanggalKeISO(row.tanggal);

        const nominal = nominalAngka(
          row.nominal ?? row.total ?? 0
        );

        return {
          ...row,

          tanggal: tanggalISO || row.tanggal,
          tanggalStr: isoKeTanggalIndo(tanggalISO),

          keterangan:
            row.keterangan ||
            row.nama ||
            row.nama_pengeluaran ||
            '',

          nama:
            row.nama ||
            row.nama_pengeluaran ||
            row.keterangan ||
            '',

          total: nominal,
          nominal,
          jumlah: row.jumlah ?? 0,

          waktu: row.waktu || '',
          supplier: row.supplier || '',
          fotoItem: row.fotoItem || row.foto_item || null,
          fotoStruk: row.fotoStruk || row.foto_struk || null,
        };
      });

      setLocalExpenses(mapped);
    } catch (error) {
      console.error('Gagal memuat pengeluaran:', error);
    } finally {
      setExpenseLoading(false);
    }
  }, [expensesProp]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const expenses = Array.isArray(expensesProp)
    ? expensesProp
    : localExpenses;

  // ===================================================
  // STATE FILTER
  // ===================================================

  const [activeTab, setActiveTab] = useState('harian');

  const [harianDate, setHarianDate] = useState(hariIniIndo());
  const [mingguanDate, setMingguanDate] = useState(
    mingguHariIni().label
  );
  const [bulananDate, setBulananDate] = useState(
    bulanHariIni()
  );

  const [tahunDate, setTahunDate] = useState(
    new Date().getFullYear()
  );

  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const currentDateText = useMemo(() => {
    if (activeTab === 'harian') return harianDate;
    if (activeTab === 'mingguan') return mingguanDate;
    if (activeTab === 'bulanan') return bulananDate;

    return `Tahun ${tahunDate}`;
  }, [
    activeTab,
    harianDate,
    mingguanDate,
    bulananDate,
    tahunDate,
  ]);

  // ===================================================
  // STATE MODAL
  // ===================================================

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const [rincianModalVisible, setRincianModalVisible] = useState(false);
  const [rincianData, setRincianData] = useState({
    dateTitle: '',
    items: [],
    totalNominal: 0,
  });

  // ===================================================
  // FILTER HARIAN
  // ===================================================

  const currentHarianItems = useMemo(() => {
    const targetISO = tanggalKeISO(harianDate);

    if (!targetISO) return [];

    return expenses.filter((item) => {
      const itemISO = tanggalKeISO(item.tanggal);

      return itemISO === targetISO;
    });
  }, [expenses, harianDate]);

  // ===================================================
  // FILTER MINGGUAN
  // ===================================================

  const currentMingguanGroups = useMemo(() => {
    const range = parseRange(mingguanDate);

    if (!range) return [];

    return buatGrupTanggal(expenses, range.start, range.end);
  }, [expenses, mingguanDate]);

  // ===================================================
  // FILTER BULANAN
  // ===================================================

  const currentBulananGroups = useMemo(() => {
    const range = parseRange(bulananDate);

    if (range) {
      return buatGrupTanggal(expenses, range.start, range.end);
    }

    const monthData = parseBulan(bulananDate);

    if (!monthData) return [];

    const firstDay = `${monthData.year}-${String(
      monthData.month
    ).padStart(2, '0')}-01`;

    const lastDay = new Date(
      monthData.year,
      monthData.month,
      0
    );

    const lastISO = tanggalLokalISO(lastDay);

    return buatGrupTanggal(expenses, firstDay, lastISO);
  }, [expenses, bulananDate]);

  // ===================================================
  // FILTER TAHUNAN
  // ===================================================

  const currentTahunanGroups = useMemo(() => {
    const start = `${tahunDate}-01-01`;
    const end = `${tahunDate}-12-31`;

    return buatGrupTanggal(expenses, start, end);
  }, [expenses, tahunDate]);

  // ===================================================
  // TOTAL PERIODE
  // ===================================================

  const groupsAktif = useMemo(() => {
    if (activeTab === 'mingguan') return currentMingguanGroups;
    if (activeTab === 'bulanan') return currentBulananGroups;
    if (activeTab === 'tahunan') return currentTahunanGroups;

    return [];
  }, [
    activeTab,
    currentMingguanGroups,
    currentBulananGroups,
    currentTahunanGroups,
  ]);

  const daftarAktif = useMemo(() => {
    if (activeTab === 'harian') return currentHarianItems;

    return groupsAktif.flatMap((group) => group.items || []);
  }, [activeTab, currentHarianItems, groupsAktif]);

  const totalNominal = useMemo(() => {
    return daftarAktif.reduce(
      (total, item) => total + nominalAngka(item.total ?? item.nominal),
      0
    );
  }, [daftarAktif]);

  const highestExpense = useMemo(() => {
    if (!daftarAktif.length) return null;

    const totals = {};

    daftarAktif.forEach((item) => {
      const name =
        item.keterangan ||
        item.nama ||
        item.nama_pengeluaran ||
        'Pengeluaran lainnya';

      totals[name] =
        (totals[name] || 0) +
        nominalAngka(item.total ?? item.nominal);
    });

    const result = Object.entries(totals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return result
      ? { nama: result[0], total: result[1] }
      : null;
  }, [daftarAktif]);

  const expenseSubLabel = {
    harian: 'Biaya belanja harian',
    mingguan: 'Biaya belanja mingguan',
    bulanan: 'Biaya belanja bulanan',
    tahunan: 'Biaya belanja tahunan',
  }[activeTab];

  // ===================================================
  // CRUD: SIMPAN
  // ===================================================

  const handleSaveExpense = async (itemData) => {
    try {
      const tanggalText =
        itemData.tanggalStr ||
        (editingItem?.tanggalStr) ||
        harianDate;

      const tanggal = tanggalKeISO(tanggalText);

      if (!tanggal) {
        throw new Error(
          'Format tanggal tidak valid. Contoh: 15 November 2026.'
        );
      }

      const jumlah = jumlahAngka(itemData.jumlah);

      if (!jumlah || jumlah <= 0) {
        throw new Error('Jumlah pembelian harus lebih dari 0.');
      }

      const total = nominalAngka(
        itemData.total ?? itemData.nominal
      );

      if (!total || total <= 0) {
        throw new Error('Total pembelian harus lebih dari Rp 0.');
      }

      const hargaSatuan = total / jumlah;

      const payload = {
        tanggal,
        waktu: itemData.waktu,
        supplier: itemData.supplier,

        nama:
          itemData.keterangan ||
          itemData.nama ||
          '',

        kategori: itemData.kategori,
        jumlah,
        harga_satuan: hargaSatuan,

        // Total tidak dikirim jika kolom total adalah generated column.
        catatan: [
          `Satuan: ${itemData.satuan || 'unit'}`,
          `Supplier: ${itemData.supplier || '-'}`,
          itemData.kategoriTopping
            ? `Subkategori: ${itemData.kategoriTopping}`
            : null,
        ]
          .filter(Boolean)
          .join('; '),

        fotoItem: itemData.fotoItem || null,
        fotoStruk: itemData.fotoStruk || null,
      };

      if (onAddExpense && !editingItem) {
        await onAddExpense(itemData);
      } else if (onUpdateExpense && editingItem) {
        await onUpdateExpense({
          ...editingItem,
          ...itemData,
          ...payload,
          total,
          nominal: total,
        });
      } else if (editingItem) {
        await updateExpense(editingItem.id, payload);
      } else {
        await createExpense(payload, user?.id);
      }

      if (!Array.isArray(expensesProp)) {
        await loadExpenses();
      }

      setEditingItem(null);
      setFormModalVisible(false);

      // Setelah menyimpan, arahkan ke tanggal pembelian.
      setHarianDate(isoKeTanggalIndo(tanggal));
      setActiveTab('harian');
    } catch (error) {
      console.error('Gagal menyimpan pengeluaran:', error);
      throw error;
    }
  };

  // ===================================================
  // CRUD: HAPUS
  // ===================================================

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (onDeleteExpense) {
        await onDeleteExpense(itemToDelete.id);
      } else {
        await deleteExpense(itemToDelete.id);
      }

      if (!Array.isArray(expensesProp)) {
        await loadExpenses();
      }

      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Gagal menghapus pengeluaran:', error);
    }
  };

  // ===================================================
  // DETAIL DAN RINCIAN
  // ===================================================

  const handleOpenDetailModal = (item) => {
    setSelectedDetailItem(item);
    setDetailModalVisible(true);
  };

  const handleOpenRincian = (group) => {
    setRincianData({
      dateTitle: group.labelTanggal,
      items: group.items || [],
      totalNominal: group.total || 0,
    });

    setRincianModalVisible(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormModalVisible(true);
  };

  const openDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  // ===================================================
  // RENDER REKAP
  // ===================================================

  const renderRekap = (groups) => (
    <View style={styles.rekapCard}>
      {groups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="receipt-outline"
            size={30}
            color="#A69A90"
          />
          <Text style={styles.emptyText}>
            Belum ada pengeluaran pada periode ini.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.isoDate}
              style={styles.rekapItemRow}
              onPress={() => handleOpenRincian(group)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rekapDateTitle}>
                  {group.labelTanggal}
                </Text>

                <Text style={styles.rekapItemCount}>
                  {group.items.length} item pembelian
                </Text>
              </View>

              <Text style={styles.rekapNominalText}>
                {formatCurrency(group.total)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // ===================================================
  // CONTENT
  // ===================================================

  const content = (
    <View style={styles.mainContainer}>
      <View style={styles.tabPeriodWrapper}>
        <View style={styles.tabPeriodContainer}>
          {['harian', 'mingguan', 'bulanan', 'tahunan'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabPeriodBtn,
                activeTab === tab && styles.tabPeriodBtnActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabPeriodText,
                  activeTab === tab && styles.tabPeriodTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.dateFilterContainerRow}>
        {activeTab === 'tahunan' ? (
          <View style={styles.dateFilterCard}>
            <TouchableOpacity
              onPress={() => setTahunDate((year) => year - 1)}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={WARNA.merahTua}
              />
            </TouchableOpacity>

            <Text style={styles.dateFilterText}>
              Tahun {tahunDate}
            </Text>

            <TouchableOpacity
              onPress={() => setTahunDate((year) => year + 1)}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={WARNA.merahTua}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.dateFilterCard}
            onPress={() => setDatePickerVisible(true)}
          >
            <View style={styles.dateFilterLeft}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={WARNA.merahTua}
              />

              <Text style={styles.dateFilterText}>
                {currentDateText}
              </Text>
            </View>

            <Ionicons
              name="chevron-down"
              size={16}
              color={WARNA.abu}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dualCardRow}>
        <View style={styles.totalCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.totalCardLabel}>
              Total Pengeluaran
            </Text>

            <Ionicons
              name="wallet-outline"
              size={19}
              color={WARNA.kuningGold}
            />
          </View>

          <Text style={styles.totalCardAmount}>
            {formatCurrency(totalNominal)}
          </Text>

          <Text style={styles.totalCardSub}>
            {expenseSubLabel}
          </Text>
        </View>

        <View style={styles.topExpenseCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.topExpenseCardLabel}>
              Pengeluaran Terbesar
            </Text>

            <Ionicons
              name="flame-outline"
              size={19}
              color={WARNA.goldTua}
            />
          </View>

          <Text style={styles.topExpenseCardName} numberOfLines={1}>
            {highestExpense?.nama || '-'}
          </Text>

          <Text style={styles.topExpenseCardSub}>
            {highestExpense
              ? formatCurrency(highestExpense.total)
              : 'Belum ada data'}
          </Text>
        </View>
      </View>

      {activeTab === 'harian' && (
        <View style={styles.harianWrapper}>
          <View style={styles.catatBtnContainer}>
            <TouchableOpacity
              style={styles.catatPengeluaranBtn}
              onPress={() => {
                setEditingItem(null);
                setFormModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.catatPengeluaranBtnText}>
                Catat Pengeluaran
              </Text>
            </TouchableOpacity>
          </View>

          {expenseLoading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Memuat data pengeluaran...
              </Text>
            </View>
          ) : currentHarianItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Belum ada pengeluaran pada tanggal ini.
              </Text>
            </View>
          ) : isMobile ? (
            <ScrollView>
              {currentHarianItems.map((item) => (
                <ExpenseCard
                  key={String(item.id)}
                  item={item}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onViewDetail={handleOpenDetailModal}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerColText, styles.colWaktu]}>
                  Waktu
                </Text>
                <Text style={[styles.headerColText, styles.colKet]}>
                  Keterangan
                </Text>
                <Text style={[styles.headerColText, styles.colKategori]}>
                  Kategori
                </Text>
                <Text style={[styles.headerColText, styles.colJumlah]}>
                  Jumlah
                </Text>
                <Text style={[styles.headerColText, styles.colTotal]}>
                  Total
                </Text>
                <Text style={[styles.headerColText, styles.colFotoItem]}>
                  Foto Item
                </Text>
                <Text style={[styles.headerColText, styles.colFotoStruk]}>
                  Foto Nota
                </Text>
                <Text style={[styles.headerColText, styles.colAksi]}>
                  Aksi
                </Text>
              </View>

              <FlatList
                data={currentHarianItems}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item, index }) => (
                  <SwipeableExpenseRow
                    item={item}
                    index={index}
                    isLast={index === currentHarianItems.length - 1}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onViewDetail={handleOpenDetailModal}
                  />
                )}
              />
            </View>
          )}
        </View>
      )}

      {activeTab === 'mingguan' &&
        renderRekap(currentMingguanGroups)}

      {activeTab === 'bulanan' &&
        renderRekap(currentBulananGroups)}

      {activeTab === 'tahunan' &&
        renderRekap(currentTahunanGroups)}

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        mode={activeTab}
        currentDateText={currentDateText}
        onSelectDate={(value) => {
          if (activeTab === 'harian') {
            setHarianDate(value);
          } else if (activeTab === 'mingguan') {
            setMingguanDate(value);
          } else if (activeTab === 'bulanan') {
            setBulananDate(value);
          }
        }}
      />

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

      <DeleteExpenseModal
        visible={deleteModalVisible}
        item={itemToDelete}
        onClose={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <DetailPengeluaranModal
        visible={detailModalVisible}
        item={selectedDetailItem}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedDetailItem(null);
        }}
      />

      <RincianPengeluaranModal
        visible={rincianModalVisible}
        onClose={() => setRincianModalVisible(false)}
        dateTitle={rincianData.dateTitle}
        items={rincianData.items}
        totalNominal={rincianData.totalNominal}
      />
    </View>
  );

  if (isEmbedded) return content;

  return (
    <View style={styles.standaloneContainer}>
      {!isMobile && sidebarOpen && (
        <Sidebar
          role="owner"
          activeTab="pengeluaran"
          isMobile={false}
        />
      )}

      <View style={styles.standaloneMain}>
        <TopHeader
          onToggleSidebar={() =>
            setSidebarOpen((previous) => !previous)
          }
          isSidebarOpen={sidebarOpen}
          title="Owner Portal · Pengeluaran"
          role="Owner"
        />

        <View style={styles.standaloneContent}>
          {content}
        </View>
      </View>
    </View>
  );
}

// =====================================================
// GROUP DATA BERDASARKAN TANGGAL TRANSAKSI
// =====================================================

function buatGrupTanggal(expenses, startISO, endISO) {
  const map = {};

  (expenses || []).forEach((item) => {
    const iso = tanggalKeISO(item.tanggal);

    if (!iso || iso < startISO || iso > endISO) return;

    if (!map[iso]) {
      map[iso] = {
        isoDate: iso,
        labelTanggal: formatTanggalPanjang(iso),
        items: [],
        total: 0,
      };
    }

    map[iso].items.push(item);

    map[iso].total += nominalAngka(
      item.total ?? item.nominal
    );
  });

  return Object.values(map).sort((a, b) =>
    a.isoDate.localeCompare(b.isoDate)
  );
}

// =====================================================
// STYLES
// =====================================================

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
  mainContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: WARNA.latar,
  },
  tabPeriodWrapper: {
    marginBottom: 10,
  },
  tabPeriodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E8DCD4',
    gap: 3,
  },
  tabPeriodBtn: {
    flex: 1,
    minWidth: 65,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabPeriodBtnActive: {
    backgroundColor: WARNA.merahTua,
  },
  tabPeriodText: {
    fontSize: 11,
    fontWeight: '600',
    color: WARNA.abu,
  },
  tabPeriodTextActive: {
    color: '#FFFFFF',
  },
  dateFilterContainerRow: {
    marginBottom: 12,
  },
  dateFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
  },
  dateFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.merahTua,
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  totalCard: {
    flex: 1,
    backgroundColor: WARNA.merahTua,
    borderRadius: 14,
    padding: 14,
  },
  totalCardLabel: {
    fontSize: 12,
    color: '#F3E8E8',
    fontWeight: '500',
  },
  totalCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 5,
  },
  totalCardSub: {
    fontSize: 11,
    color: '#E8DCD4',
    marginTop: 3,
  },
  topExpenseCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: WARNA.garis,
  },
  topExpenseCardLabel: {
    fontSize: 12,
    color: WARNA.abu,
    fontWeight: '500',
  },
  topExpenseCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: WARNA.teks,
    marginTop: 5,
  },
  topExpenseCardSub: {
    fontSize: 11,
    color: WARNA.merahJreng,
    fontWeight: '600',
    marginTop: 3,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  harianWrapper: {
    flex: 1,
  },
  catatBtnContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  catatPengeluaranBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WARNA.biruCatat,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  catatPengeluaranBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4ECE6',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
  },
  headerColText: {
    fontSize: 11,
    fontWeight: '700',
    color: WARNA.merahTua,
  },
  colWaktu: {
    width: 75,
    textAlign: 'center',
  },
  colKet: {
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 5,
  },
  colKategori: {
    width: 85,
    paddingHorizontal: 5,
  },
  colJumlah: {
    width: 70,
    paddingHorizontal: 5,
  },
  colTotal: {
    width: 105,
    paddingHorizontal: 5,
  },
  colFotoItem: {
    width: 80,
    textAlign: 'center',
  },
  colFotoStruk: {
    width: 80,
    textAlign: 'center',
  },
  colAksi: {
    width: 105,
    textAlign: 'center',
  },
  rekapCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    padding: 10,
  },
  rekapItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
    gap: 10,
  },
  rekapDateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.teks,
    textTransform: 'capitalize',
  },
  rekapItemCount: {
    fontSize: 11,
    color: WARNA.abu,
    marginTop: 3,
  },
  rekapNominalText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.merahJreng,
  },
  emptyBox: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    gap: 8,
  },
  emptyText: {
    color: WARNA.abu,
    fontSize: 12,
    textAlign: 'center',
  },
});
