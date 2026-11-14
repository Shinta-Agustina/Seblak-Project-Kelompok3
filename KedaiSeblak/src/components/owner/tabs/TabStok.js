import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StockDetailModal from '../StockDetailModal';

const WARNA = {
  merah: '#C62828',
  merahTua: '#681B22',
  merahMuda: '#FBEAEC',
  latar: '#F8F1ED',
  putih: '#FFFFFF',
  teks: '#2C1810',
  sekunder: '#78665E',
  garis: '#F0E0DA',
  hijau: '#168653',
  oranye: '#D97706',
  merahTerang: '#DC2626',
};

const ITEMS_PER_PAGE = 8;

const parseAngka = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return NaN;
  }

  return Number(
    String(value).trim().replace(',', '.')
  );
};

const getJenisStok = (item) => {
  if (
    String(item?.jenisStok || '').toLowerCase() === 'bumbu'
  ) {
    return 'Bumbu';
  }

  const kategori = String(
    item?.kategori || ''
  ).trim().toLowerCase();

  if (
    ['bumbu', 'bumbu & kuah', 'bahan dasar'].includes(kategori) ||
    String(item?.id || '').startsWith('STK-BAHAN-')
  ) {
    return 'Bumbu';
  }

  return 'Topping';
};

const getItemStatus = (item) => {
  const sisa = Number(item?.sisa ?? 0);
  const minimum = Number(item?.minimum ?? 1);

  if (sisa <= 0) return 'Habis';
  if (sisa <= minimum) return 'Menipis';

  return 'Aman';
};

const formatTanggal = (value) => {
  if (!value) return '-';

  if (value instanceof Date) {
    return value.toLocaleString('id-ID');
  }

  return String(value);
};

const getHistoryTimestamp = (record) => {
  const raw =
    record.timestamp ||
    record.createdAt ||
    record.tanggalISO ||
    record.date;

  if (raw) {
    const parsed = new Date(raw).getTime();

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

export default function TabStok({
  stockItems = [],
  expenses = [],
  onUpdateItem,
  onTerimaStok,
  initialFilterStatus = 'Semua',
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // =========================================
  // STATE DAFTAR STOK
  // =========================================

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState(
    initialFilterStatus || 'Semua'
  );

  const [jenisFilter, setJenisFilter] = useState('Topping');
  const [activeSection, setActiveSection] = useState('Daftar Stok');

  const [opnameDraft, setOpnameDraft] = useState({});
  const [opnameNote, setOpnameNote] = useState('');

  const [isDetailModalVisible, setIsDetailModalVisible] =
    useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // =========================================
  // STATE MODAL PENERIMAAN STOK
  // =========================================

  const [isReceiveModalVisible, setIsReceiveModalVisible] =
    useState(false);

  const [selectedExpenseId, setSelectedExpenseId] =
    useState(null);

  const [jumlahDiterimaInput, setJumlahDiterimaInput] =
    useState('');

  const [catatanPenerimaan, setCatatanPenerimaan] =
    useState('');

  useEffect(() => {
    setStatusFilter(initialFilterStatus || 'Semua');
  }, [initialFilterStatus]);

  // =========================================
  // DATA STOK
  // =========================================

  const stokJenisAktif = useMemo(() => {
    return stockItems.filter(
      (item) => getJenisStok(item) === jenisFilter
    );
  }, [stockItems, jenisFilter]);

  const totalBahan = stokJenisAktif.length;

  const countMenipis = stokJenisAktif.filter(
    (item) => getItemStatus(item) === 'Menipis'
  ).length;

  const countHabis = stokJenisAktif.filter(
    (item) => getItemStatus(item) === 'Habis'
  ).length;

  const countAman = stokJenisAktif.filter(
    (item) => getItemStatus(item) === 'Aman'
  ).length;

  const totalTopping = stockItems.filter(
    (item) => getJenisStok(item) === 'Topping'
  ).length;

  const totalBumbu = stockItems.filter(
    (item) => getJenisStok(item) === 'Bumbu'
  ).length;

  // =========================================
  // PEMBELIAN YANG BELUM DITERIMA
  // =========================================

  const pembelianMenunggu = useMemo(() => {
    return expenses
      .map((expense) => {
        const jumlahBeli = parseAngka(expense.jumlah);

        const nilaiDiterima = parseAngka(
          expense.jumlahDiterima ?? 0
        );

        const sudahDiterima = Number.isFinite(nilaiDiterima)
          ? nilaiDiterima
          : 0;

        const sisaBelumDiterima =
          jumlahBeli - sudahDiterima;

        return {
          ...expense,
          jumlahBeli,
          sudahDiterima,
          sisaBelumDiterima,
        };
      })
      .filter((expense) => {
        return (
          Number.isFinite(expense.jumlahBeli) &&
          expense.jumlahBeli > 0 &&
          expense.sisaBelumDiterima > 0.000001
        );
      });
  }, [expenses]);

  const selectedExpense = pembelianMenunggu.find(
    (expense) =>
      String(expense.id) === String(selectedExpenseId)
  );

  // =========================================
  // PENCARIAN DAN FILTER
  // =========================================

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return stokJenisAktif.filter((item) => {
      const status = getItemStatus(item);

      const nama = String(item.nama || '').toLowerCase();
      const kategori = String(item.kategori || '').toLowerCase();
      const supplier = String(item.supplier || '').toLowerCase();

      const matchesStatus =
        statusFilter === 'Semua' ||
        status.toLowerCase() === statusFilter.toLowerCase();

      const matchesSearch =
        !query ||
        nama.includes(query) ||
        kategori.includes(query) ||
        supplier.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [stokJenisAktif, statusFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = filteredData.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [jenisFilter, statusFilter, searchQuery]);

  // =========================================
  // FILTER STATUS
  // =========================================

  const filterOptions = [
    { id: 'Semua', label: 'Semua', count: totalBahan },
    { id: 'Aman', label: 'Aman', count: countAman },
    { id: 'Menipis', label: 'Menipis', count: countMenipis },
    { id: 'Habis', label: 'Habis', count: countHabis },
  ];

  // =========================================
  // DETAIL BAHAN
  // =========================================

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };

  // =========================================
  // TERIMA STOK
  // =========================================

  const handleTerimaStok = () => {
    const pembelianPertama =
      pembelianMenunggu.length > 0
        ? pembelianMenunggu[0]
        : null;

    setSelectedExpenseId(
      pembelianPertama ? pembelianPertama.id : null
    );

    setJumlahDiterimaInput('');
    setCatatanPenerimaan('');

    // Modal selalu dibuka, termasuk ketika belum ada pembelian.
    setIsReceiveModalVisible(true);
  };

  const handlePilihPembelian = (expense) => {
    setSelectedExpenseId(expense.id);
    setJumlahDiterimaInput('');
    setCatatanPenerimaan('');
  };

  const handleKonfirmasiPenerimaan = () => {
    if (!selectedExpense) {
      Alert.alert(
        'Pembelian Tidak Ditemukan',
        'Silakan pilih pembelian yang masih menunggu penerimaan.'
      );
      return;
    }

    const jumlahMasuk = parseAngka(
      jumlahDiterimaInput
    );

    if (
      !Number.isFinite(jumlahMasuk) ||
      jumlahMasuk <= 0
    ) {
      Alert.alert(
        'Jumlah Tidak Valid',
        'Masukkan jumlah stok yang diterima lebih dari 0.'
      );
      return;
    }

    if (
      jumlahMasuk >
      selectedExpense.sisaBelumDiterima + 0.000001
    ) {
      Alert.alert(
        'Jumlah Melebihi Pembelian',
        `Jumlah yang dapat diterima hanya ${selectedExpense.sisaBelumDiterima} ${selectedExpense.satuan || ''}.`
      );
      return;
    }

    if (typeof onTerimaStok !== 'function') {
      Alert.alert(
        'Fungsi Belum Tersedia',
        'Fitur penerimaan stok belum terhubung dengan Dashboard Owner.'
      );
      return;
    }

    const berhasil = onTerimaStok(
      selectedExpense.id,
      jumlahMasuk,
      catatanPenerimaan.trim()
    );

    // Modal tidak ditutup jika proses penerimaan gagal.
    if (berhasil !== true) {
      return;
    }

    setIsReceiveModalVisible(false);
    setSelectedExpenseId(null);
    setJumlahDiterimaInput('');
    setCatatanPenerimaan('');
  };

  const handleTutupModalPenerimaan = () => {
    setIsReceiveModalVisible(false);
    setSelectedExpenseId(null);
    setJumlahDiterimaInput('');
    setCatatanPenerimaan('');
  };

  // =========================================
  // RESET FILTER
  // =========================================

  const resetFilter = () => {
    setSearchQuery('');
    setStatusFilter('Semua');
    setCurrentPage(1);
  };

  // =========================================
  // STOK OPNAME
  // =========================================

  const handleSaveOpname = () => {
    if (typeof onUpdateItem !== 'function') {
      Alert.alert(
        'Fungsi Belum Tersedia',
        'Hubungkan fungsi penyimpanan stok terlebih dahulu.'
      );
      return;
    }

    const itemsDiisi = stokJenisAktif.filter((item) => {
      const value = opnameDraft[item.id];

      return (
        value !== undefined &&
        String(value).trim() !== ''
      );
    });

    if (itemsDiisi.length === 0) {
      Alert.alert(
        'Belum Ada Data',
        'Isi minimal satu jumlah stok fisik sebelum menyimpan.'
      );
      return;
    }

    const dataValid = [];
    const dataTidakValid = [];

    itemsDiisi.forEach((item) => {
      const fisik = parseAngka(opnameDraft[item.id]);

      if (!Number.isFinite(fisik) || fisik < 0) {
        dataTidakValid.push(item.nama);
        return;
      }

      const sistem = Number(item.sisa ?? 0);
      const selisih = Number((fisik - sistem).toFixed(3));

      dataValid.push({
        item,
        fisik,
        sistem,
        selisih,
      });
    });

    if (dataTidakValid.length > 0) {
      Alert.alert(
        'Jumlah Stok Tidak Valid',
        `Periksa kembali jumlah fisik:\n${dataTidakValid.join(', ')}`
      );
      return;
    }

    const sekarang = new Date();
    const tanggal = sekarang.toLocaleString('id-ID');

    dataValid.forEach(({ item, fisik, sistem, selisih }, index) => {
      const record = {
        id: `OPNAME-${sekarang.getTime()}-${index}`,
        nama: item.nama,
        satuan: item.satuan || 'pcs',
        sistem,
        fisik,
        selisih,
        tanggal,
        timestamp: sekarang.toISOString(),
        jenis: 'Stock Opname',
        catatan: opnameNote.trim(),
      };

      onUpdateItem({
        ...item,
        sisa: fisik,
        riwayatOpname: [
          record,
          ...(item.riwayatOpname || []),
        ],
      });
    });

    setOpnameDraft({});
    setOpnameNote('');

    Alert.alert(
      'Stok Opname Berhasil',
      `${dataValid.length} data stok berhasil diperbarui.`
    );

    setActiveSection('Riwayat');
  };

  // =========================================
  // RIWAYAT STOK
  // =========================================

  const historyData = useMemo(() => {
    return stokJenisAktif
      .flatMap((item) => [
        ...(item.riwayatOpname || []).map((record, index) => ({
          ...record,
          id: record.id || `${item.id}-opname-${index}`,
          nama: record.nama || item.nama,
          satuan: record.satuan || item.satuan,
          jenis: 'Stock Opname',
          itemId: item.id,
        })),

        ...(item.riwayatRestok || []).map((record, index) => ({
          ...record,
          id: record.id || `${item.id}-restok-${index}`,
          nama: item.nama,
          satuan: record.satuan || item.satuan,
          jenis: 'Restok',
          itemId: item.id,
        })),
      ])
      .sort(
        (a, b) =>
          getHistoryTimestamp(b) - getHistoryTimestamp(a)
      );
  }, [stokJenisAktif]);

  // =========================================
  // KOMPONEN STATUS
  // =========================================

  const renderStatus = (item) => {
    const status = getItemStatus(item);

    const config = {
      Aman: {
        background: '#E5F3E6',
        color: '#16852D',
        dot: '#16852D',
      },
      Menipis: {
        background: '#FFF0DD',
        color: '#E87500',
        dot: '#F08A19',
      },
      Habis: {
        background: '#FCE1E5',
        color: '#DC263B',
        dot: '#E32636',
      },
    };

    const selected = config[status];

    return (
      <View
        style={[
          styles.statusPill,
          { backgroundColor: selected.background },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: selected.dot },
          ]}
        />

        <Text
          style={[
            styles.statusPillText,
            { color: selected.color },
          ]}
        >
          {status}
        </Text>
      </View>
    );
  };

  // =========================================
  // BARIS DAFTAR STOK
  // =========================================

  const renderStockRow = (item) => (
    <View key={item.id} style={styles.stockRow}>
      <View style={styles.stockNameColumn}>
        <Text style={styles.stockRowName} numberOfLines={1}>
          {item.nama || 'Tanpa nama'}
        </Text>
      </View>

      <Text style={styles.stockCategory}>
        {jenisFilter}
      </Text>

      <Text style={styles.stockQuantity}>
        {Number(item.sisa ?? 0).toLocaleString('id-ID')} {item.satuan || ''}
      </Text>

      <Text style={styles.stockMinimum}>
        {Number(item.minimum ?? 0).toLocaleString('id-ID')} {item.satuan || ''}
      </Text>

      <View style={styles.stockStatusColumn}>
        {renderStatus(item)}
      </View>

      <View style={styles.stockActionColumn}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => handleOpenDetail(item)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="eye-outline"
            size={15}
            color={WARNA.putih}
          />

          <Text style={styles.detailButtonText}>
            Detail
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =========================================
  // DAFTAR STOK
  // =========================================

  const renderDaftarStok = () => (
    <>
      <View style={[styles.summaryGrid, isMobile && styles.summaryGridMobile]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.summaryCard, isMobile && styles.summaryCardMobile]}
          onPress={() => setStatusFilter('Semua')}
        >
          <View style={styles.summaryIconRed}>
            <Ionicons
              name="cube-outline"
              size={28}
              color={WARNA.merah}
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Bahan</Text>
            <Text style={styles.summaryValue}>{totalBahan}</Text>
            <Text style={styles.summaryCaption}>Jenis bahan</Text>
          </View>

          <View style={styles.summaryArrowRed}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={WARNA.merah}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.summaryCard, isMobile && styles.summaryCardMobile]}
          onPress={() => setStatusFilter('Menipis')}
        >
          <View style={styles.summaryIconOrange}>
            <Ionicons
              name="warning"
              size={28}
              color="#F59E0B"
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Menipis</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: WARNA.oranye },
              ]}
            >
              {countMenipis}
            </Text>
            <Text style={styles.summaryCaption}>Perlu perhatian</Text>
          </View>

          <View style={styles.summaryArrowOrange}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={WARNA.oranye}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.summaryCard, isMobile && styles.summaryCardMobile]}
          onPress={() => setStatusFilter('Habis')}
        >
          <View style={styles.summaryIconRed}>
            <Ionicons
              name="alert-circle"
              size={28}
              color={WARNA.merahTerang}
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Habis</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: WARNA.merahTerang },
              ]}
            >
              {countHabis}
            </Text>
            <Text style={styles.summaryCaption}>Segera restock</Text>
          </View>

          <View style={styles.summaryArrowRed}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={WARNA.merah}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterRow}>
        <View style={styles.searchBarWrap}>
          <Ionicons
            name="search-outline"
            size={19}
            color="#987F78"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama bahan atau supplier..."
            placeholderTextColor="#A89A92"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#A89A92"
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.8}
          onPress={() => {
            const nextIndex =
              (
                filterOptions.findIndex(
                  (item) => item.id === statusFilter
                ) + 1
              ) % filterOptions.length;

            setStatusFilter(filterOptions[nextIndex].id);
          }}
        >
          <Ionicons
            name="filter-outline"
            size={19}
            color={WARNA.merahTua}
          />

          <Text style={styles.filterButtonText}>
            {statusFilter === 'Semua'
              ? 'Filter Status'
              : statusFilter}
          </Text>

          <Ionicons
            name="chevron-down"
            size={16}
            color={WARNA.merahTua}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterChipsRow}>
        {filterOptions.map((option) => {
          const selected = statusFilter === option.id;

          const chipStyle =
            option.id === 'Aman'
              ? styles.filterChipAman
              : option.id === 'Menipis'
                ? styles.filterChipMenipis
                : option.id === 'Habis'
                  ? styles.filterChipHabis
                  : styles.filterChipSemua;

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => setStatusFilter(option.id)}
              style={[
                styles.filterChip,
                chipStyle,
                selected && styles.filterChipSelected,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.filterChipText}>
                {option.label} {option.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <View style={styles.listHeaderLeft}>
            <Ionicons
              name="restaurant-outline"
              size={19}
              color={WARNA.merahTua}
            />

            <Text style={styles.listHeaderTitle}>
              Daftar Bahan {jenisFilter}
            </Text>
          </View>

          <Text style={styles.categoryCountBadge}>
            {totalBahan} bahan
          </Text>
        </View>

        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="file-tray-outline"
              size={38}
              color="#D1C7BD"
            />

            <Text style={styles.emptyTitle}>
              {stockItems.length === 0
                ? 'Belum Ada Data Bahan'
                : 'Tidak Ada Bahan yang Cocok'}
            </Text>

            <Text style={styles.emptySubtitle}>
              {stockItems.length === 0
                ? 'Data bahan akan ditampilkan setelah ditambahkan.'
                : 'Coba ubah kata kunci pencarian atau filter status.'}
            </Text>

            {(searchQuery || statusFilter !== 'Semua') && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilter}
              >
                <Text style={styles.resetButtonText}>
                  Reset Filter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.tableContent}>
                <View style={styles.tableHeading}>
                  <Text style={styles.headingName}>Nama Bahan</Text>
                  <Text style={styles.headingCategory}>Kategori</Text>
                  <Text style={styles.headingQuantity}>Stok Saat Ini</Text>
                  <Text style={styles.headingMinimum}>Minimum</Text>
                  <Text style={styles.headingStatus}>Status</Text>
                  <Text style={styles.headingAction}>Aksi</Text>
                </View>

                {paginatedData.map(renderStockRow)}
              </View>
            </ScrollView>

            <View style={styles.paginationRow}>
              <Text style={styles.paginationInfo}>
                Menampilkan{' '}
                {Math.min(
                  (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1,
                  filteredData.length
                )}{' '}
                -{' '}
                {Math.min(
                  safeCurrentPage * ITEMS_PER_PAGE,
                  filteredData.length
                )}{' '}
                dari {filteredData.length} bahan
              </Text>

              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    safeCurrentPage === 1 &&
                    styles.pageButtonDisabled,
                  ]}
                  disabled={safeCurrentPage === 1}
                  onPress={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                >
                  <Ionicons
                    name="chevron-back"
                    size={17}
                    color={WARNA.merahTua}
                  />
                </TouchableOpacity>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - safeCurrentPage) <= 1
                  )
                  .map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={[
                        styles.pageButton,
                        safeCurrentPage === page &&
                        styles.pageButtonActive,
                      ]}
                      onPress={() => setCurrentPage(page)}
                    >
                      <Text
                        style={[
                          styles.pageButtonText,
                          safeCurrentPage === page &&
                          styles.pageButtonTextActive,
                        ]}
                      >
                        {page}
                      </Text>
                    </TouchableOpacity>
                  ))}

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    safeCurrentPage === totalPages &&
                    styles.pageButtonDisabled,
                  ]}
                  disabled={safeCurrentPage === totalPages}
                  onPress={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={WARNA.merahTua}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </>
  );

  // =========================================
  // TAMPILAN STOCK OPNAME
  // =========================================

  const renderStockOpname = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Ionicons
            name="clipboard-outline"
            size={19}
            color={WARNA.merahTua}
          />

          <Text style={styles.listHeaderTitle}>
            Pemeriksaan Stok Fisik
          </Text>
        </View>
      </View>

      <Text style={styles.sectionDescription}>
        Masukkan jumlah bahan yang benar-benar tersedia di dapur.
        Setelah disimpan, stok sistem akan disesuaikan.
      </Text>

      {stokJenisAktif.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySubtitle}>
            Tidak ada bahan yang bisa diperiksa.
          </Text>
        </View>
      ) : (
        stokJenisAktif.map((item) => (
          <View key={item.id} style={styles.opnameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stockRowName}>
                {item.nama}
              </Text>

              <Text style={styles.opnameMeta}>
                Stok sistem: {item.sisa} {item.satuan}
              </Text>
            </View>

            <TextInput
              keyboardType="decimal-pad"
              value={opnameDraft[item.id] ?? ''}
              onChangeText={(value) =>
                setOpnameDraft((prev) => ({
                  ...prev,
                  [item.id]: value,
                }))
              }
              placeholder={`Fisik (${item.satuan})`}
              placeholderTextColor="#A89A92"
              style={styles.opnameInput}
            />
          </View>
        ))
      )}

      <TextInput
        value={opnameNote}
        onChangeText={setOpnameNote}
        placeholder="Catatan (opsional), misalnya bahan rusak atau terbuang"
        placeholderTextColor="#A89A92"
        style={styles.opnameNoteInput}
        multiline
      />

      <TouchableOpacity
        style={styles.saveOpnameBtn}
        onPress={handleSaveOpname}
        activeOpacity={0.8}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color={WARNA.putih}
        />

        <Text style={styles.saveOpnameText}>
          Simpan Hasil Stok Opname
        </Text>
      </TouchableOpacity>
    </View>
  );

  // =========================================
  // TAMPILAN RIWAYAT
  // =========================================

  const renderRiwayat = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Ionicons
            name="time-outline"
            size={19}
            color={WARNA.merahTua}
          />

          <Text style={styles.listHeaderTitle}>
            Riwayat Perubahan Stok
          </Text>
        </View>

        <Text style={styles.categoryCountBadge}>
          {historyData.length} riwayat
        </Text>
      </View>

      <Text style={styles.sectionDescription}>
        Riwayat penerimaan bahan dan penyesuaian stok fisik.
      </Text>

      {historyData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="time-outline"
            size={40}
            color="#D1C7BD"
          />

          <Text style={styles.emptyTitle}>
            Belum Ada Riwayat
          </Text>

          <Text style={styles.emptySubtitle}>
            Riwayat perubahan stok akan muncul di sini setelah
            terdapat aktivitas penerimaan atau stok opname.
          </Text>
        </View>
      ) : (
        historyData.map((record) => {
          const isRestok = String(record.jenis || '').includes('Restok') ||
            String(record.jenis || '').includes('Penerimaan');

          const nilai = isRestok
            ? `+${record.jumlah ?? 0} ${record.satuan || ''}`
            : `${Number(record.selisih) > 0 ? '+' : ''}${record.selisih ?? 0} ${record.satuan || ''}`;

          return (
            <View key={record.id} style={styles.historyRow}>
              <View
                style={[
                  styles.historyIcon,
                  !isRestok && styles.historyOpnameIcon,
                ]}
              >
                <Ionicons
                  name={
                    isRestok
                      ? 'cart-outline'
                      : 'clipboard-outline'
                  }
                  size={18}
                  color={
                    isRestok
                      ? WARNA.hijau
                      : WARNA.oranye
                  }
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.stockRowName}>
                  {record.nama}
                </Text>

                <Text style={styles.opnameMeta}>
                  {formatTanggal(record.tanggal)}
                </Text>

                <Text style={styles.historyType}>
                  {record.jenis}
                </Text>

                {record.catatan ? (
                  <Text style={styles.historyNote}>
                    Catatan: {record.catatan}
                  </Text>
                ) : null}
              </View>

              <Text
                style={[
                  styles.historyValue,
                  !isRestok && styles.historyOpnameValue,
                ]}
              >
                {nilai}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  // =========================================
  // TAMPILAN UTAMA
  // =========================================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.headerMain,
          isMobile && styles.headerMainMobile,
        ]}
      >
        <View style={styles.headerTitleGroup}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="cube"
              size={43}
              color={WARNA.merahTua}
            />
          </View>

          <View style={styles.headerTitles}>
            <Text style={styles.pageTitle}>
              Stok Bahan
            </Text>

            <Text style={styles.pageSubtitle}>
              Pantau persediaan bahan Kedai Seblak
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.headerActions,
            isMobile && styles.headerActionsMobile,
          ]}
        >
          <TouchableOpacity
            style={styles.receiveButton}
            onPress={handleTerimaStok}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Buka penerimaan stok"
          >
            <Ionicons
              name="cart"
              size={21}
              color={WARNA.putih}
            />

            <Text style={styles.receiveButtonText}>
              Terima Stok
            </Text>
          </TouchableOpacity>

          <View style={styles.sectionTabs}>
            {[
              {
                id: 'Daftar Stok',
                icon: 'cube-outline',
              },
              {
                id: 'Stok Opname',
                icon: 'clipboard-outline',
              },
              {
                id: 'Riwayat',
                icon: 'time-outline',
              },
            ].map((tab) => {
              const active = activeSection === tab.id;

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.sectionTab,
                    active && styles.sectionTabActive,
                  ]}
                  onPress={() => setActiveSection(tab.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={
                      active
                        ? WARNA.putih
                        : WARNA.merahTua
                    }
                  />

                  <Text
                    style={[
                      styles.sectionTabText,
                      active && styles.sectionTabTextActive,
                    ]}
                  >
                    {tab.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* KATEGORI TOPPING DAN BUMBU */}

      <View style={styles.stockTypeTabs}>
        {['Topping', 'Bumbu'].map((jenis) => {
          const active = jenisFilter === jenis;

          return (
            <TouchableOpacity
              key={jenis}
              style={[
                styles.stockTypeTab,
                active && styles.stockTypeTabActive,
              ]}
              onPress={() => {
                setJenisFilter(jenis);
                setStatusFilter('Semua');
                setSearchQuery('');
                setOpnameDraft({});
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={
                  jenis === 'Topping'
                    ? 'restaurant'
                    : 'leaf'
                }
                size={23}
                color={
                  active
                    ? WARNA.putih
                    : WARNA.merahTua
                }
              />

              <View style={styles.stockTypeTextWrap}>
                <Text
                  style={[
                    styles.stockTypeTabText,
                    active && styles.stockTypeTabTextActive,
                  ]}
                >
                  {jenis}
                </Text>

                <Text
                  style={[
                    styles.stockTypeCount,
                    active && styles.stockTypeCountActive,
                  ]}
                >
                  {jenis === 'Topping'
                    ? totalTopping
                    : totalBumbu}{' '}
                  bahan
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ISI BERDASARKAN MENU */}

      {activeSection === 'Daftar Stok' && renderDaftarStok()}
      {activeSection === 'Stok Opname' && renderStockOpname()}
      {activeSection === 'Riwayat' && renderRiwayat()}

      {/* MODAL PENERIMAAN STOK */}

      <Modal
        visible={isReceiveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleTutupModalPenerimaan}
        statusBarTranslucent
      >
        <View style={styles.receiveModalOverlay}>
          <View style={styles.receiveModalContainer}>
            <View style={styles.receiveModalHeader}>
              <View style={styles.receiveModalTitleWrap}>
                <Ionicons
                  name="cart-outline"
                  size={23}
                  color={WARNA.merahTua}
                />

                <Text style={styles.receiveModalTitle}>
                  Penerimaan Stok
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleTutupModalPenerimaan}
                accessibilityRole="button"
                accessibilityLabel="Tutup modal penerimaan"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={WARNA.sekunder}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.receiveModalDescription}>
              Pilih pembelian dan masukkan jumlah bahan yang
              benar-benar diterima.
            </Text>

            <Text style={styles.receiveFieldLabel}>
              Daftar Pembelian Menunggu
            </Text>

            <ScrollView
              style={styles.purchaseList}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {pembelianMenunggu.map((expense) => {
                const selected =
                  String(selectedExpenseId) === String(expense.id);

                return (
                  <TouchableOpacity
                    key={String(expense.id)}
                    style={[
                      styles.purchaseOption,
                      selected && styles.purchaseOptionSelected,
                    ]}
                    onPress={() =>
                      handlePilihPembelian(expense)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.purchaseOptionTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.purchaseName}>
                          {expense.keterangan ||
                            expense.namaBahan ||
                            expense.nama ||
                            'Tanpa nama bahan'}
                        </Text>

                        <Text style={styles.purchaseMeta}>
                          {expense.kategori || '-'} •{' '}
                          {expense.supplier || 'Tanpa supplier'}
                        </Text>

                        <Text style={styles.purchaseMeta}>
                          Tanggal:{' '}
                          {expense.tanggalStr ||
                            expense.tanggal ||
                            expense.tanggalPembelian ||
                            '-'}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          selected
                            ? 'radio-button-on'
                            : 'radio-button-off'
                        }
                        size={21}
                        color={
                          selected
                            ? WARNA.merah
                            : WARNA.sekunder
                        }
                      />
                    </View>

                    <View style={styles.purchaseQuantityInfo}>
                      <Text style={styles.purchaseQuantityText}>
                        Dibeli: {expense.jumlahBeli} {expense.satuan || ''}
                      </Text>

                      <Text style={styles.purchaseQuantityText}>
                        Diterima: {expense.sudahDiterima} {expense.satuan || ''}
                      </Text>

                      <Text style={styles.purchaseRemainingText}>
                        Belum diterima: {expense.sisaBelumDiterima} {expense.satuan || ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {pembelianMenunggu.length === 0 && (
                <View style={styles.emptyPurchase}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={35}
                    color={WARNA.hijau}
                  />

                  <Text style={styles.emptyPurchaseText}>
                    Tidak ada pembelian yang menunggu penerimaan.
                  </Text>

                  <Text style={styles.emptyPurchaseText}>
                    Tambahkan pembelian melalui menu Pengeluaran
                    terlebih dahulu.
                  </Text>
                </View>
              )}
            </ScrollView>

            {selectedExpense && (
              <>
                <Text style={styles.receiveFieldLabel}>
                  Jumlah yang Diterima
                </Text>

                <View style={styles.receiveInputWrap}>
                  <TextInput
                    style={styles.receiveInput}
                    value={jumlahDiterimaInput}
                    onChangeText={setJumlahDiterimaInput}
                    placeholder="Masukkan jumlah"
                    placeholderTextColor="#A89A92"
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.receiveUnit}>
                    {selectedExpense.satuan || 'Unit'}
                  </Text>
                </View>

                <Text style={styles.receiveHint}>
                  Maksimal penerimaan:{' '}
                  {selectedExpense.sisaBelumDiterima}{' '}
                  {selectedExpense.satuan || ''}
                </Text>

                <Text style={styles.receiveFieldLabel}>
                  Catatan Penerimaan (Opsional)
                </Text>

                <TextInput
                  style={styles.receiveNoteInput}
                  value={catatanPenerimaan}
                  onChangeText={setCatatanPenerimaan}
                  placeholder="Contoh: Bahan diterima dalam kondisi baik"
                  placeholderTextColor="#A89A92"
                  multiline
                />
              </>
            )}

            <View style={styles.receiveModalActions}>
              <TouchableOpacity
                style={styles.receiveCancelButton}
                onPress={handleTutupModalPenerimaan}
              >
                <Text style={styles.receiveCancelText}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.receiveConfirmButton,
                  !selectedExpense && { opacity: 0.5 },
                ]}
                disabled={!selectedExpense}
                onPress={handleKonfirmasiPenerimaan}
                accessibilityRole="button"
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={WARNA.putih}
                />

                <Text style={styles.receiveConfirmText}>
                  Konfirmasi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DETAIL */}

      <StockDetailModal
        visible={isDetailModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
      />
    </ScrollView>
  );
}

// =============================================
// STYLING
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARNA.latar,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },

  // HEADER

  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },

  headerMainMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  headerIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTitles: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: WARNA.merahTua,
  },

  pageSubtitle: {
    fontSize: 12,
    color: WARNA.sekunder,
    marginTop: 3,
  },

  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
    flex: 1,
    maxWidth: 410,
  },

  headerActionsMobile: {
    maxWidth: '100%',
    width: '100%',
    alignItems: 'stretch',
  },

  receiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WARNA.merah,
    paddingHorizontal: 19,
    paddingVertical: 9,
    borderRadius: 11,
    gap: 9,
    minWidth: 150,
    minHeight: 42,
    position: 'relative',
    zIndex: 10,
    elevation: 5,
  },

  receiveButtonText: {
    color: WARNA.putih,
    fontSize: 14,
    fontWeight: '800',
  },

  // NAVIGASI

  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFDFC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: WARNA.garis,
    gap: 4,
    width: '100%',
  },

  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 9,
    gap: 5,
  },

  sectionTabActive: {
    backgroundColor: WARNA.merahTua,
  },

  sectionTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: WARNA.merahTua,
  },

  sectionTabTextActive: {
    color: WARNA.putih,
  },

  // KATEGORI

  stockTypeTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  stockTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: '#F7E4E0',
    borderWidth: 1,
    borderColor: '#F2D9D3',
    gap: 10,
  },

  stockTypeTabActive: {
    backgroundColor: WARNA.merahTua,
    borderColor: WARNA.merahTua,
  },

  stockTypeTextWrap: {
    alignItems: 'center',
  },

  stockTypeTabText: {
    fontSize: 15,
    fontWeight: '800',
    color: WARNA.merahTua,
  },

  stockTypeTabTextActive: {
    color: WARNA.putih,
  },

  stockTypeCount: {
    color: WARNA.sekunder,
    fontSize: 10,
    marginTop: 2,
  },

  stockTypeCountActive: {
    color: '#F8E9E9',
  },

  // KARTU RINGKASAN

  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  summaryGridMobile: { flexDirection: 'column', gap: 8, flexShrink: 0 },
  summaryCardMobile: { flex: 0, flexShrink: 0, width: '100%', height: 76, minHeight: 76 },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.putih,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },

  summaryIconRed: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#FCE3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryIconOrange: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#FFF0DD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    flex: 1,
    minWidth: 0,
  },

  summaryLabel: {
    color: WARNA.merahTua,
    fontSize: 12,
    fontWeight: '700',
  },

  summaryValue: {
    color: WARNA.merahTua,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 1,
  },

  summaryCaption: {
    color: WARNA.sekunder,
    fontSize: 10,
    marginTop: 1,
  },

  summaryArrowRed: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: '#FCE1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryArrowOrange: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: '#FFF0DD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // PENCARIAN DAN FILTER

  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 9,
  },

  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.putih,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WARNA.garis,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: WARNA.teks,
    outlineStyle: 'none',
  },

  filterButton: {
    minWidth: 135,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WARNA.putih,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WARNA.garis,
    paddingHorizontal: 10,
    gap: 7,
  },

  filterButtonText: {
    color: WARNA.teks,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },

  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },

  filterChipSemua: {
    backgroundColor: '#FCE1E1',
  },

  filterChipAman: {
    backgroundColor: '#E8E5E2',
  },

  filterChipMenipis: {
    backgroundColor: '#FBE4D6',
  },

  filterChipHabis: {
    backgroundColor: '#FAD9DC',
  },

  filterChipSelected: {
    borderWidth: 1,
    borderColor: WARNA.merah,
  },

  filterChipText: {
    color: WARNA.merah,
    fontSize: 11,
    fontWeight: '700',
  },

  // DAFTAR BAHAN

  listContainer: {
    backgroundColor: WARNA.putih,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    marginBottom: 25,
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
    marginBottom: 0,
  },

  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: WARNA.teks,
  },

  categoryCountBadge: {
    fontSize: 12,
    color: WARNA.sekunder,
  },

  // TABEL

  tableContent: {
    minWidth: 760,
    flexGrow: 1,
  },

  tableHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8EEE8',
    minHeight: 38,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
  },

  headingName: {
    flex: 22,
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },

  headingCategory: {
    flex: 16,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },

  headingQuantity: {
    flex: 17,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },

  headingMinimum: {
    flex: 17,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },

  headingStatus: {
    flex: 15,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },

  headingAction: {
    flex: 13,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 41,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
  },

  stockNameColumn: {
    flex: 22,
    paddingRight: 5,
  },

  stockRowName: {
    color: WARNA.teks,
    fontSize: 13,
    fontWeight: '800',
  },

  stockCategory: {
    flex: 16,
    textAlign: 'center',
    color: WARNA.merah,
    fontSize: 11,
    fontWeight: '700',
  },

  stockQuantity: {
    flex: 17,
    textAlign: 'center',
    color: WARNA.merahTua,
    fontSize: 12,
    fontWeight: '700',
  },

  stockMinimum: {
    flex: 17,
    textAlign: 'center',
    color: WARNA.merahTua,
    fontSize: 12,
    fontWeight: '700',
  },

  stockStatusColumn: {
    flex: 15,
    alignItems: 'center',
  },

  stockActionColumn: {
    flex: 13,
    alignItems: 'center',
  },

  statusPill: {
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WARNA.merahTua,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    minWidth: 75,
  },

  detailButtonText: {
    color: WARNA.putih,
    fontSize: 11,
    fontWeight: '700',
  },

  // PAGINATION

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10,
  },

  paginationInfo: {
    flex: 1,
    color: WARNA.sekunder,
    fontSize: 11,
  },

  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  pageButton: {
    minWidth: 29,
    height: 29,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#F5ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageButtonActive: {
    backgroundColor: WARNA.merah,
  },

  pageButtonDisabled: {
    opacity: 0.45,
  },

  pageButtonText: {
    color: WARNA.merahTua,
    fontSize: 11,
    fontWeight: '700',
  },

  pageButtonTextActive: {
    color: WARNA.putih,
  },

  // DATA KOSONG

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: WARNA.teks,
    marginTop: 10,
  },

  emptySubtitle: {
    fontSize: 13,
    color: WARNA.sekunder,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },

  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: WARNA.merahMuda,
    borderRadius: 6,
  },

  resetButtonText: {
    color: WARNA.merah,
    fontWeight: '600',
    fontSize: 13,
  },

  // STOCK OPNAME

  sectionDescription: {
    color: WARNA.sekunder,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
  },

  opnameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
    gap: 12,
  },

  opnameMeta: {
    fontSize: 12,
    color: WARNA.sekunder,
    marginTop: 3,
  },

  opnameInput: {
    width: 115,
    height: 38,
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: WARNA.putih,
    textAlign: 'right',
    color: WARNA.teks,
  },

  opnameNoteInput: {
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: WARNA.putih,
    height: 70,
    textAlignVertical: 'top',
    marginVertical: 14,
    color: WARNA.teks,
  },

  saveOpnameBtn: {
    backgroundColor: WARNA.hijau,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 7,
  },

  saveOpnameText: {
    color: WARNA.putih,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // RIWAYAT

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
    gap: 12,
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  historyOpnameIcon: {
    backgroundColor: '#FEF3C7',
  },

  historyType: {
    fontSize: 11,
    fontWeight: 'bold',
    color: WARNA.sekunder,
    marginTop: 3,
  },

  historyNote: {
    fontSize: 12,
    color: WARNA.teks,
    marginTop: 3,
  },

  historyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WARNA.hijau,
  },

  historyOpnameValue: {
    color: WARNA.oranye,
  },

  // MODAL PENERIMAAN STOK

  receiveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  receiveModalContainer: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    backgroundColor: WARNA.putih,
    borderRadius: 15,
    padding: 18,
  },

  receiveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
  },

  receiveModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  receiveModalTitle: {
    color: WARNA.merahTua,
    fontSize: 18,
    fontWeight: '800',
  },

  receiveModalDescription: {
    fontSize: 12,
    color: WARNA.sekunder,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
  },

  receiveFieldLabel: {
    color: WARNA.teks,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 8,
  },

  purchaseList: {
    maxHeight: 220,
    flexGrow: 0,
  },

  purchaseOption: {
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 10,
    padding: 11,
    marginBottom: 8,
    backgroundColor: '#FFFCFA',
  },

  purchaseOptionSelected: {
    borderColor: WARNA.merah,
    backgroundColor: WARNA.merahMuda,
  },

  purchaseOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  purchaseName: {
    color: WARNA.teks,
    fontSize: 13,
    fontWeight: '800',
  },

  purchaseMeta: {
    color: WARNA.sekunder,
    fontSize: 11,
    marginTop: 3,
  },

  purchaseQuantityInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: WARNA.garis,
  },

  purchaseQuantityText: {
    color: WARNA.sekunder,
    fontSize: 10,
  },

  purchaseRemainingText: {
    color: WARNA.merah,
    fontSize: 10,
    fontWeight: '800',
  },

  emptyPurchase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 8,
  },

  emptyPurchaseText: {
    color: WARNA.sekunder,
    fontSize: 12,
    textAlign: 'center',
  },

  receiveInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 9,
    backgroundColor: WARNA.putih,
    paddingHorizontal: 10,
  },

  receiveInput: {
    flex: 1,
    height: 42,
    color: WARNA.teks,
    fontSize: 14,
    outlineStyle: 'none',
  },

  receiveUnit: {
    color: WARNA.sekunder,
    fontSize: 12,
    fontWeight: '700',
  },

  receiveHint: {
    color: WARNA.oranye,
    fontSize: 11,
    marginTop: 5,
  },

  receiveNoteInput: {
    minHeight: 65,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 9,
    padding: 10,
    color: WARNA.teks,
    fontSize: 12,
    textAlignVertical: 'top',
    backgroundColor: WARNA.putih,
  },

  receiveModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 18,
  },

  receiveCancelButton: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WARNA.garis,
    justifyContent: 'center',
  },

  receiveCancelText: {
    color: WARNA.sekunder,
    fontSize: 12,
    fontWeight: '700',
  },

  receiveConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WARNA.merah,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },

  receiveConfirmText: {
    color: WARNA.putih,
    fontSize: 12,
    fontWeight: '800',
  },
});