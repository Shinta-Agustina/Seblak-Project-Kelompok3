import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StockDetailModal from '../StockEditModal';

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

// =====================================================
// HELPER
// =====================================================

const getJenisStok = (item) => {
  if (String(item?.jenisStok || '').toLowerCase() === 'bumbu') {
    return 'Bumbu';
  }

  const kategori = String(item?.kategori || '').trim().toLowerCase();

  if (
    ['bumbu', 'bumbu & kuah', 'bahan dasar'].includes(kategori) ||
    String(item?.id || '').startsWith('STK-BAHAN-')
  ) {
    return 'Bumbu';
  }

  return 'Topping';
};

const getItemStatus = (item) => {
  const sisa = Number(item?.sisa ?? item?.stok ?? 0);
  const minimum = Number(item?.minimum ?? item?.stok_minimum ?? 1);

  if (sisa <= 0) return 'Habis';
  if (sisa <= minimum) return 'Menipis';

  return 'Aman';
};

const formatTanggal = (value) => {
  if (!value) return '-';

  const tanggal = new Date(value);

  if (Number.isNaN(tanggal.getTime())) {
    return String(value);
  }

  return tanggal.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatJumlah = (value) => {
  return Number(value || 0).toLocaleString('id-ID', {
    maximumFractionDigits: 4,
  });
};

const getHistoryTimestamp = (record) => {
  const raw =
    record.created_at ||
    record.timestamp ||
    record.createdAt ||
    record.tanggalISO ||
    record.date;

  if (!raw) return 0;

  const parsed = new Date(raw).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

// =====================================================
// INFORMASI JENIS MUTASI
// =====================================================

const getMovementInfo = (record) => {
  const tipe = String(record?.tipe || '').toLowerCase();

  if (tipe === 'masuk') {
    return {
      label: 'Stok Masuk',
      icon: 'arrow-down-circle-outline',
      color: WARNA.hijau,
      background: '#DCFCE7',
      prefix: '+',
    };
  }

  if (tipe === 'keluar' && record?.transaksi_id) {
    return {
      label: 'Penjualan',
      icon: 'cart-outline',
      color: WARNA.merah,
      background: '#FCE1E5',
      prefix: '-',
    };
  }

  if (tipe === 'keluar') {
    return {
      label: 'Stok Keluar',
      icon: 'arrow-up-circle-outline',
      color: WARNA.oranye,
      background: '#FFF0DD',
      prefix: '-',
    };
  }

  if (tipe === 'penyesuaian') {
    return {
      label: 'Penyesuaian Stok',
      icon: 'swap-horizontal-outline',
      color: WARNA.oranye,
      background: '#FFF0DD',
      prefix: '+',
    };
  }

  return {
    label: tipe || 'Mutasi Stok',
    icon: 'cube-outline',
    color: WARNA.sekunder,
    background: '#F1ECE9',
    prefix: '',
  };
};

// =====================================================
// KOMPONEN UTAMA
// =====================================================

export default function TabStok({
  stockItems = [],
  stockMovements = [],
  onUpdateItem,
  initialFilterStatus = 'Semua',
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // =========================================
  // STATE
  // =========================================

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState(
    initialFilterStatus || 'Semua'
  );

  const [jenisFilter, setJenisFilter] = useState('Topping');

  const [activeSection, setActiveSection] = useState('Daftar Stok');

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setStatusFilter(initialFilterStatus || 'Semua');
  }, [initialFilterStatus]);

  // =========================================
  // DATA STOK
  // =========================================

  const safeStockItems = Array.isArray(stockItems) ? stockItems : [];

  const safeStockMovements = Array.isArray(stockMovements)
    ? stockMovements
    : [];

  const stokJenisAktif = useMemo(() => {
    return safeStockItems.filter(
      (item) => getJenisStok(item) === jenisFilter
    );
  }, [safeStockItems, jenisFilter]);

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

  const totalTopping = safeStockItems.filter(
    (item) => getJenisStok(item) === 'Topping'
  ).length;

  const totalBumbu = safeStockItems.filter(
    (item) => getJenisStok(item) === 'Bumbu'
  ).length;

  // =========================================
  // PENCARIAN DAN FILTER
  // =========================================

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return stokJenisAktif.filter((item) => {
      const status = getItemStatus(item);

      const nama = String(
        item.nama || item.nama_bahan || ''
      ).toLowerCase();

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
    {
      id: 'Semua',
      label: 'Semua',
      count: totalBahan,
    },
    {
      id: 'Aman',
      label: 'Aman',
      count: countAman,
    },
    {
      id: 'Menipis',
      label: 'Menipis',
      count: countMenipis,
    },
    {
      id: 'Habis',
      label: 'Habis',
      count: countHabis,
    },
  ];

  // =========================================
  // DETAIL BAHAN
  // =========================================

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
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
  // PEMETAAN STOK BERDASARKAN ID
  // =========================================

  const stockById = useMemo(() => {
    const map = new Map();

    safeStockItems.forEach((item) => {
      if (item?.id !== undefined && item?.id !== null) {
        map.set(String(item.id), item);
      }
    });

    return map;
  }, [safeStockItems]);

  // =========================================
  // RIWAYAT STOK DARI DATABASE
  // =========================================

  const historyData = useMemo(() => {
    return safeStockMovements
      .filter((movement) => {
        const stok = stockById.get(String(movement.stok_id));

        // Utamakan data bahan dari stok_id.
        if (stok) {
          return getJenisStok(stok) === jenisFilter;
        }

        // Fallback jika movement sudah memiliki kategori.
        if (movement.kategori || movement.jenisStok) {
          return getJenisStok(movement) === jenisFilter;
        }

        return false;
      })
      .map((movement, index) => {
        const stok = stockById.get(String(movement.stok_id));

        const info = getMovementInfo(movement);

        const jumlah = Number(movement.jumlah || 0);

        return {
          ...movement,

          id:
            movement.id ||
            `${movement.stok_id}-${movement.created_at}-${index}`,

          nama:
            stok?.nama ||
            stok?.nama_bahan ||
            movement.nama_bahan ||
            movement.nama ||
            'Bahan tidak ditemukan',

          satuan: stok?.satuan || movement.satuan || '',

          jenis: info.label,
          icon: info.icon,
          warna: info.color,
          background: info.background,
          prefix: info.prefix,

          jumlahTampil: jumlah,

          tanggal:
            movement.created_at ||
            movement.tanggal ||
            movement.timestamp,

          catatan: movement.keterangan || movement.catatan || '',
        };
      })
      .sort(
        (a, b) => getHistoryTimestamp(b) - getHistoryTimestamp(a)
      );
  }, [safeStockMovements, stockById, jenisFilter]);

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
  // BARIS DAFTAR STOK MOBILE
  // =========================================

  const renderStockRowMobile = (item) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.8}
      onPress={() => handleOpenDetail(item)}
      style={styles.mobileStockCard}
    >
      <View style={styles.mobileStockHeader}>
        <Text style={styles.mobileStockName} numberOfLines={1}>
          {item.nama || item.nama_bahan || 'Tanpa nama'}
        </Text>

        {renderStatus(item)}
      </View>

      <View style={styles.mobileStockInfo}>
        <Text style={styles.mobileStockInfoText}>
          Stok:{' '}
          <Text style={styles.mobileStockInfoStrong}>
            {formatJumlah(item.sisa ?? item.stok ?? 0)}{' '}
            {item.satuan || ''}
          </Text>
        </Text>

        <Text style={styles.mobileStockMinimum}>
          Min: {formatJumlah(item.minimum ?? item.stok_minimum ?? 0)}{' '}
          {item.satuan || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // =========================================
  // BARIS DAFTAR STOK DESKTOP
  // =========================================

  const renderStockRow = (item) => (
    <View key={item.id} style={styles.stockRow}>
      <View style={styles.stockNameColumn}>
        <Text style={styles.stockRowName} numberOfLines={1}>
          {item.nama || item.nama_bahan || 'Tanpa nama'}
        </Text>
      </View>

      <Text style={styles.stockCategory}>{jenisFilter}</Text>

      <Text style={styles.stockQuantity}>
        {formatJumlah(item.sisa ?? item.stok ?? 0)}{' '}
        {item.satuan || ''}
      </Text>

      <Text style={styles.stockMinimum}>
        {formatJumlah(item.minimum ?? item.stok_minimum ?? 0)}{' '}
        {item.satuan || ''}
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

          <Text style={styles.detailButtonText}>Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =========================================
  // DAFTAR STOK
  // =========================================

  const renderDaftarStok = () => (
    <>
      {/* RINGKASAN STOK */}

      <View
        style={[
          styles.summaryGrid,
          isMobile && styles.summaryGridMobile,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.summaryCard,
            isMobile && styles.summaryCardMobile,
          ]}
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
          style={[
            styles.summaryCard,
            isMobile && styles.summaryCardMobile,
          ]}
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

            <Text style={styles.summaryCaption}>
              Perlu perhatian
            </Text>
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
          style={[
            styles.summaryCard,
            isMobile && styles.summaryCardMobile,
          ]}
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

            <Text style={styles.summaryCaption}>
              Perlu diperhatikan
            </Text>
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

      {/* PENCARIAN DAN FILTER */}

      <View
        style={[
          styles.searchFilterRow,
          isMobile && styles.searchFilterRowMobile,
        ]}
      >
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
            <TouchableOpacity onPress={() => setSearchQuery('')}>
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
              (filterOptions.findIndex(
                (item) => item.id === statusFilter
              ) +
                1) %
              filterOptions.length;

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

      {/* FILTER CHIP */}

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

      {/* TABEL STOK */}

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
              {safeStockItems.length === 0
                ? 'Belum Ada Data Bahan'
                : 'Tidak Ada Bahan yang Cocok'}
            </Text>

            <Text style={styles.emptySubtitle}>
              {safeStockItems.length === 0
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
            {isMobile && (
              <View style={styles.mobileStockList}>
                {paginatedData.map(renderStockRowMobile)}
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
              style={isMobile ? { display: 'none' } : undefined}
            >
              <View
                style={[
                  styles.tableContent,
                  {
                    width: Math.max(
                      width - (isMobile ? 32 : 240),
                      760
                    ),
                  },
                ]}
              >
                <View style={styles.tableHeading}>
                  <Text style={styles.headingName}>
                    Nama Bahan
                  </Text>

                  <Text style={styles.headingCategory}>
                    Kategori
                  </Text>

                  <Text style={styles.headingQuantity}>
                    Stok Saat Ini
                  </Text>

                  <Text style={styles.headingMinimum}>
                    Minimum
                  </Text>

                  <Text style={styles.headingStatus}>
                    Status
                  </Text>

                  <Text style={styles.headingAction}>Aksi</Text>
                </View>

                {paginatedData.map(renderStockRow)}
              </View>
            </ScrollView>

            {/* PAGINATION */}

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
        Catatan perubahan stok bahan dari transaksi penjualan
        dan aktivitas mutasi stok lainnya.
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
            Riwayat stok {jenisFilter.toLowerCase()} akan muncul
            di sini setelah ada aktivitas stok masuk atau keluar.
          </Text>
        </View>
      ) : (
        historyData.map((record) => {
          const nilai =
            `${record.prefix}${formatJumlah(record.jumlahTampil)} ${record.satuan || ''}`;

          return (
            <View key={record.id} style={styles.historyRow}>
              <View
                style={[
                  styles.historyIcon,
                  { backgroundColor: record.background },
                ]}
              >
                <Ionicons
                  name={record.icon}
                  size={19}
                  color={record.warna}
                />
              </View>

              <View style={styles.historyContent}>
                <Text style={styles.stockRowName}>
                  {record.nama}
                </Text>

                <Text style={styles.historyDate}>
                  {formatTanggal(record.tanggal)}
                </Text>

                <Text
                  style={[
                    styles.historyType,
                    { color: record.warna },
                  ]}
                >
                  {record.jenis}
                </Text>

                {record.nama_pengeluaran ? (
                  <Text style={styles.historyNote}>
                    Pengeluaran: {record.nama_pengeluaran}
                  </Text>
                ) : null}

                {record.catatan ? (
                  <Text style={styles.historyNote}>
                    Catatan: {record.catatan}
                  </Text>
                ) : null}
              </View>

              <Text
                style={[
                  styles.historyValue,
                  { color: record.warna },
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
      {/* HEADER */}

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
            <Text style={styles.pageTitle}>Stok Bahan</Text>

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
          <View style={styles.sectionTabs}>
            {[
              {
                id: 'Daftar Stok',
                icon: 'cube-outline',
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
                      active ? WARNA.putih : WARNA.merahTua
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
                setCurrentPage(1);
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={jenis === 'Topping' ? 'restaurant' : 'leaf'}
                size={23}
                color={active ? WARNA.putih : WARNA.merahTua}
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
                  {jenis === 'Topping' ? totalTopping : totalBumbu}{' '}
                  bahan
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ISI BERDASARKAN MENU */}

      {activeSection === 'Daftar Stok' && renderDaftarStok()}

      {activeSection === 'Riwayat' && renderRiwayat()}

      {/* MODAL DETAIL BAHAN */}

      <StockDetailModal
        visible={isDetailModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
        onSavePengaturan={async (item, values) => {
          if (typeof onUpdateItem !== 'function') {
            return;
          }

          await onUpdateItem({
            ...item,
            ...values,
          });
        }}
      />
    </ScrollView>
  );
}

// =====================================================
// STYLING
// =====================================================

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
    fontSize: 11,
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

  summaryGridMobile: {
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
  },

  summaryCardMobile: {
    flex: 0,
    flexShrink: 0,
    width: '100%',
    height: 76,
    minHeight: 76,
  },

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

  searchFilterRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
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

  // TAMPILAN MOBILE

  mobileStockList: {
    padding: 10,
  },

  mobileStockCard: {
    backgroundColor: WARNA.putih,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    padding: 12,
    marginBottom: 8,
  },

  mobileStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  mobileStockName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: WARNA.merahTua,
  },

  mobileStockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  mobileStockInfoText: {
    fontSize: 12,
    color: '#6F5C53',
  },

  mobileStockInfoStrong: {
    fontWeight: '800',
    color: WARNA.teks,
  },

  mobileStockMinimum: {
    fontSize: 12,
    color: '#8D7B70',
  },

  // PAGINATION

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
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

  // RIWAYAT

  sectionDescription: {
    color: WARNA.sekunder,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
  },

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
    justifyContent: 'center',
    alignItems: 'center',
  },

  historyContent: {
    flex: 1,
    minWidth: 0,
  },

  historyDate: {
    fontSize: 11,
    color: WARNA.sekunder,
    marginTop: 3,
  },

  historyType: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },

  historyNote: {
    fontSize: 11,
    color: WARNA.sekunder,
    marginTop: 3,
  },

  historyValue: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
    maxWidth: 110,
  },
});
