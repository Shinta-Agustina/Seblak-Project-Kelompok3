
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import FilterChips from '../FilterChips';
import StockProgressBar from '../StockProgressBar';
import StockFormModal from '../StockFormModal';
import RestockModal from '../RestockModal';
import StockDetailModal from '../StockDetailModal';

const WARNA = {
  merah: '#C62828',
  merahTua: '#52141D',
  merahMuda: '#FBEAEC',
  latar: '#F8F5F2',
  putih: '#FFFFFF',
  teks: '#2C1810',
  sekunder: '#78665E',
  garis: '#EFE7E2',
  hijau: '#168653',
  oranye: '#D97706',
  merahTerang: '#DC2626',
};

const parseAngka = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return NaN;
  }

  return Number(String(value).trim().replace(',', '.'));
};

const getJenisStok = (item) => {
  if (
    String(item?.jenisStok || '').toLowerCase() === 'bumbu'
  ) {
    return 'Bumbu';
  }

  const kategori = String(item?.kategori || '')
    .trim()
    .toLowerCase();

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

const getImageSource = (item) => {
  const foto = item?.foto ?? item?.image;

  if (!foto) return null;

  if (typeof foto === 'number') {
    return foto;
  }

  if (typeof foto === 'string') {
    return { uri: foto };
  }

  if (typeof foto === 'object' && foto.uri) {
    return foto;
  }

  return null;
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
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onRestockItem,
  initialFilterStatus = 'Semua',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    initialFilterStatus || 'Semua'
  );

  const [jenisFilter, setJenisFilter] = useState('Topping');
  const [activeSection, setActiveSection] = useState('Daftar Stok');

  const [opnameDraft, setOpnameDraft] = useState({});
  const [opnameNote, setOpnameNote] = useState('');

  const [expandedCategories, setExpandedCategories] = useState({});

  const [isFormModalVisible, setIsFormModalVisible] =
    useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [isRestockModalVisible, setIsRestockModalVisible] =
    useState(false);

  const [isDetailModalVisible, setIsDetailModalVisible] =
    useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    setStatusFilter(initialFilterStatus || 'Semua');
  }, [initialFilterStatus]);

  // Data stok berdasarkan jenis
  const stokJenisAktif = useMemo(() => {
    return stockItems.filter(
      (item) => getJenisStok(item) === jenisFilter
    );
  }, [stockItems, jenisFilter]);

  // Ringkasan stok
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

  // Filter daftar stok
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

  // Kelompokkan stok berdasarkan kategori
  const groupedByCategory = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      const kategori = item.kategori || 'Lainnya';

      if (!acc[kategori]) {
        acc[kategori] = [];
      }

      acc[kategori].push(item);

      return acc;
    }, {});
  }, [filteredData]);

  // Filter pilihan
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

  // Buka modal tambah
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsEditMode(false);
    setIsFormModalVisible(true);
  };

  // Buka modal edit
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsDetailModalVisible(false);
    setIsFormModalVisible(true);
  };

  // Buka modal restok
  const handleOpenRestock = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(false);
    setIsRestockModalVisible(true);
  };

  // Buka detail
  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };

  // Simpan data tambah atau edit
  const handleSaveItem = (itemData) => {
    if (!itemData) return;

    if (isEditMode) {
      onUpdateItem?.(itemData);
    } else {
      onAddItem?.(itemData);
    }

    setIsFormModalVisible(false);
    setSelectedItem(null);
  };

  // Simpan stock opname
  const handleSaveOpname = () => {
    const itemsDiisi = stokJenisAktif.filter((item) => {
      const value = opnameDraft[item.id];

      return (
        value !== undefined &&
        String(value).trim() !== ''
      );
    });

    if (itemsDiisi.length === 0) {
      Alert.alert(
        'Belum ada data',
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

      const selisih = Number(
        (fisik - sistem).toFixed(3)
      );

      dataValid.push({
        item,
        fisik,
        sistem,
        selisih,
      });
    });

    if (dataTidakValid.length > 0) {
      Alert.alert(
        'Jumlah stok tidak valid',
        `Periksa kembali jumlah fisik:\n${dataTidakValid.join(', ')}`
      );
      return;
    }

    const sekarang = new Date();
    const tanggal = sekarang.toLocaleString('id-ID');

    dataValid.forEach(
      ({ item, fisik, sistem, selisih }, index) => {
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

        onUpdateItem?.({
          ...item,
          sisa: fisik,
          riwayatOpname: [
            record,
            ...(item.riwayatOpname || []),
          ],
        });
      }
    );

    setOpnameDraft({});
    setOpnameNote('');

    Alert.alert(
      'Stock Opname Berhasil',
      `${dataValid.length} data stok berhasil diperbarui.`
    );

    setActiveSection('Riwayat');
  };

  // Konfirmasi hapus
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    onDeleteItem?.(itemToDelete.id);

    setItemToDelete(null);
    setIsDetailModalVisible(false);
    setSelectedItem(null);
  };

  // Perluas kategori
  const toggleCategoryExpand = (categoryName) => {
    const key = `${jenisFilter}-${categoryName}`;

    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset pencarian dan filter
  const resetFilter = () => {
    setSearchQuery('');
    setStatusFilter('Semua');
  };

  // Kartu stok
  const renderStockCard = (item) => {
    const status = getItemStatus(item);

    const sisa = Number(item.sisa ?? 0);
    const minimum = Number(item.minimum ?? 1);
    const stokAwal = Number(item.stokAwal ?? 0);

    const maxReference = Math.max(
      stokAwal,
      minimum * 2,
      sisa,
      1
    );

    const imageSource = getImageSource(item);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.stockCard}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTopRow}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.stockPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.stockPhotoPlaceholder}>
              <Ionicons
                name="image-outline"
                size={22}
                color="#A89A92"
              />
            </View>
          )}

          <View style={styles.cardTitleCol}>
            <View style={styles.nameRow}>
              <Text
                style={styles.stockName}
                numberOfLines={1}
              >
                {item.nama}
              </Text>

              <StatusBadge
                status={status}
                size="sm"
              />
            </View>

            <Text style={styles.stockCategory}>
              Supplier: {item.supplier || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.stockRatioText}>
              Sisa:{' '}
              <Text
                style={{
                  fontWeight: '900',
                  color:
                    status === 'Habis'
                      ? WARNA.merahTerang
                      : status === 'Menipis'
                      ? WARNA.oranye
                      : WARNA.hijau,
                }}
              >
                {sisa} {item.satuan}
              </Text>
              {' / Min. '}
              {minimum} {item.satuan}
            </Text>

            <Text style={styles.estimateDaysText}>
              {status === 'Habis'
                ? 'Segera Restok!'
                : `~${item.estimasiHabisHari ?? 1.5} hari lagi`}
            </Text>
          </View>

          <StockProgressBar
            current={sisa}
            max={maxReference}
            status={status}
            height={7}
          />
        </View>

        <View style={styles.cardActionsRow}>
          <Text style={styles.priceTag}>
            Rp{' '}
            {Number(item.hargaBeli || 0).toLocaleString('id-ID')}
            {' / '}
            {item.satuan}
          </Text>

          <View style={styles.actionButtonsGroup}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleOpenEdit(item)}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={WARNA.sekunder}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setItemToDelete(item)}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={WARNA.merahTerang}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickRestockBtn}
              onPress={() => handleOpenRestock(item)}
            >
              <Ionicons
                name="add"
                size={14}
                color={WARNA.putih}
              />

              <Text style={styles.quickRestockText}>
                Restok
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Riwayat stok berdasarkan jenis yang dipilih
  const historyData = useMemo(() => {
    return stokJenisAktif
      .flatMap((item) => [
        ...(item.riwayatOpname || []).map(
          (record, index) => ({
            ...record,
            id:
              record.id ||
              `${item.id}-opname-${index}`,
            nama: record.nama || item.nama,
            satuan: record.satuan || item.satuan,
            jenis: 'Stock Opname',
            itemId: item.id,
          })
        ),

        ...(item.riwayatRestok || []).map(
          (record, index) => ({
            ...record,
            id:
              record.id ||
              `${item.id}-restok-${index}`,
            nama: item.nama,
            satuan: record.satuan || item.satuan,
            jenis: 'Restok',
            itemId: item.id,
          })
        ),
      ])
      .sort((a, b) => {
        return (
          getHistoryTimestamp(b) -
          getHistoryTimestamp(a)
        );
      });
  }, [stokJenisAktif]);

  // Tampilan daftar stok
  const renderDaftarStok = () => (
    <>
      <View style={styles.summaryGrid}>
        <StatCard
          title="Total Jenis Bahan"
          value={`${totalBahan} Bahan`}
          subtitle="Tercatat dalam sistem"
          iconName="cube-outline"
          iconColor="#C62828"
          iconBg="#F4EFEB"
          onPress={() => setStatusFilter('Semua')}
        />

        <StatCard
          title="Bahan Menipis"
          value={`${countMenipis} Bahan`}
          subtitle="Mendekati batas minimum"
          iconName="alert-circle-outline"
          iconColor="#D97706"
          iconBg="#FEF3C7"
          badgeText="Perhatian"
          onPress={() => setStatusFilter('Menipis')}
        />

        <StatCard
          title="Bahan Habis"
          value={`${countHabis} Bahan`}
          subtitle="Segera lakukan restok"
          iconName="flame-outline"
          iconColor="#DC2626"
          iconBg="#FEE2E2"
          badgeText="Kritis"
          onPress={() => setStatusFilter('Habis')}
        />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchBarWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#8D7B70"
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder={`Cari ${jenisFilter.toLowerCase()}, kategori, atau supplier...`}
            placeholderTextColor="#A89A92"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#A89A92"
              />
            </TouchableOpacity>
          )}
        </View>

        <FilterChips
          options={filterOptions}
          selectedId={statusFilter}
          onSelect={setStatusFilter}
          accentColor={WARNA.merah}
        />
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listMetaRow}>
          <Text style={styles.listCountText}>
            Menampilkan{' '}
            <Text style={{ fontWeight: '800' }}>
              {filteredData.length}
            </Text>{' '}
            item {jenisFilter.toLowerCase()}
          </Text>

          <Text style={styles.listHintText}>
            Ketuk kartu untuk detail
          </Text>
        </View>

        {Object.keys(groupedByCategory).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="file-tray-outline"
              size={42}
              color="#D1C7BD"
            />

            <Text style={styles.emptyTitle}>
              Tidak ada item stok yang cocok
            </Text>

            <Text style={styles.emptySubtitle}>
              Coba ubah kata kunci pencarian atau filter status.
            </Text>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilter}
            >
              <Text style={styles.resetButtonText}>
                Reset Filter
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(groupedByCategory).map(
            (categoryName) => {
              const items = groupedByCategory[categoryName];

              const key = `${jenisFilter}-${categoryName}`;

              const isExpanded =
                !!expandedCategories[key];

              const displayedItems = isExpanded
                ? items
                : items.slice(0, 5);

              const hasMore = items.length > 5;

              return (
                <View
                  key={key}
                  style={styles.categoryGroup}
                >
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>
                      {categoryName}
                    </Text>

                    <Text style={styles.categoryCountBadge}>
                      {items.length} item
                    </Text>
                  </View>

                  <View style={styles.categoryItemsList}>
                    {displayedItems.map(renderStockCard)}
                  </View>

                  {hasMore && (
                    <TouchableOpacity
                      style={styles.seeMoreBtn}
                      onPress={() =>
                        toggleCategoryExpand(categoryName)
                      }
                    >
                      <Text style={styles.seeMoreText}>
                        {isExpanded
                          ? 'Tutup Sebagian'
                          : `Lihat ${items.length - 5} item lainnya`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
          )
        )}
      </View>
    </>
  );

  // Tampilan halaman restok
  const renderRestokBahan = () => (
    <View style={styles.listContainer}>
      <View style={styles.restokHeader}>
        <View style={styles.restokIcon}>
          <Ionicons
            name="cube-outline"
            size={22}
            color={WARNA.merah}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeading}>
            Penerimaan Stok Bahan
          </Text>

          <Text style={styles.sectionDescription}>
            Pilih bahan yang ingin ditambahkan ke persediaan.
          </Text>
        </View>
      </View>

      <View style={styles.restokSummary}>
        <Text style={styles.restokSummaryText}>
          {stokJenisAktif.length} jenis bahan tersedia
        </Text>
      </View>

      {stokJenisAktif.length === 0 ? (
        <Text style={styles.emptySubtitle}>
          Belum ada bahan pada kategori {jenisFilter}.
        </Text>
      ) : (
        stokJenisAktif.map((item) => {
          const status = getItemStatus(item);

          return (
            <View
              key={item.id}
              style={styles.restockListItem}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.stockName}>
                  {item.nama}
                </Text>

                <Text style={styles.opnameMeta}>
                  Stok saat ini: {item.sisa} {item.satuan}
                </Text>

                <Text style={styles.opnameMeta}>
                  Supplier: {item.supplier || '-'}
                </Text>
              </View>

              <View style={styles.restockRight}>
                <StatusBadge
                  status={status}
                  size="sm"
                />

                <TouchableOpacity
                  style={styles.restockAction}
                  onPress={() => handleOpenRestock(item)}
                >
                  <Ionicons
                    name="add"
                    size={15}
                    color={WARNA.putih}
                  />

                  <Text style={styles.restockActionText}>
                    Restok
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // Tampilan stock opname
  const renderStockOpname = () => (
    <View style={styles.listContainer}>
      <Text style={styles.sectionHeading}>
        Pemeriksaan Stok Fisik
      </Text>

      <Text style={styles.sectionDescription}>
        Masukkan jumlah bahan yang benar-benar tersedia.
        Setelah disimpan, stok sistem akan disesuaikan.
      </Text>

      {stokJenisAktif.length === 0 ? (
        <Text style={styles.emptySubtitle}>
          Tidak ada bahan yang bisa diperiksa.
        </Text>
      ) : (
        stokJenisAktif.map((item) => (
          <View
            key={item.id}
            style={styles.opnameRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.stockName}>
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
          size={17}
          color={WARNA.putih}
        />

        <Text style={styles.saveOpnameText}>
          Simpan Hasil Stock Opname
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Tampilan riwayat
  const renderRiwayat = () => (
    <View style={styles.listContainer}>
      <Text style={styles.sectionHeading}>
        Riwayat Perubahan Stok
      </Text>

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
            Riwayat restok dan stock opname {jenisFilter.toLowerCase()}
            {' '}akan muncul di sini.
          </Text>
        </View>
      ) : (
        historyData.map((record) => {
          const isRestok = record.jenis === 'Restok';

          const nilai = isRestok
            ? `+${record.jumlah ?? 0} ${record.satuan || ''}`
            : `${Number(record.selisih) > 0 ? '+' : ''}${record.selisih ?? 0} ${record.satuan || ''}`;

          return (
            <View
              key={record.id}
              style={styles.historyRow}
            >
              <View
                style={[
                  styles.historyIcon,
                  !isRestok && styles.historyOpnameIcon,
                ]}
              >
                <Ionicons
                  name={
                    isRestok
                      ? 'add-circle-outline'
                      : 'clipboard-outline'
                  }
                  size={18}
                  color={isRestok ? WARNA.hijau : WARNA.oranye}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.stockName}>
                  {record.nama}
                </Text>

                <Text style={styles.opnameMeta}>
                  {formatTanggal(record.tanggal)}
                </Text>

                <Text style={styles.historyType}>
                  {isRestok ? 'Stok Masuk' : 'Stock Opname'}
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

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>
            {activeSection === 'Restok Bahan'
              ? 'Restok Bahan'
              : activeSection === 'Stock Opname'
              ? 'Stock Opname'
              : activeSection === 'Riwayat'
              ? 'Riwayat Stok'
              : 'Manajemen Stok'}
          </Text>

          <Text style={styles.pageSubtitle}>
            Stok topping mengikuti transaksi Kasir; bumbu dikelola sesuai pencatatan stok.
          </Text>
        </View>

        {activeSection === 'Daftar Stok' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleOpenAdd}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add"
              size={20}
              color={WARNA.putih}
            />

            <Text style={styles.addBtnText}>
              Tambah {jenisFilter}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navigasi bagian */}
      <View style={styles.sectionTabs}>
        {[
          {
            id: 'Daftar Stok',
            icon: 'list-outline',
          },
          {
            id: 'Restok Bahan',
            icon: 'add-circle-outline',
          },
          {
            id: 'Stock Opname',
            icon: 'clipboard-outline',
          },
          {
            id: 'Riwayat',
            icon: 'time-outline',
          },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.sectionTab,
              activeSection === tab.id &&
                styles.sectionTabActive,
            ]}
            onPress={() => setActiveSection(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={
                activeSection === tab.id
                  ? WARNA.putih
                  : WARNA.sekunder
              }
            />

            <Text
              style={[
                styles.sectionTabText,
                activeSection === tab.id &&
                  styles.sectionTabTextActive,
              ]}
            >
              {tab.id}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jenis stok */}
      <View style={styles.stockTypeTabs}>
        {['Topping', 'Bumbu'].map((jenis) => (
          <TouchableOpacity
            key={jenis}
            style={[
              styles.stockTypeTab,
              jenisFilter === jenis &&
                styles.stockTypeTabActive,
            ]}
            onPress={() => {
              setJenisFilter(jenis);
              setStatusFilter('Semua');
              setSearchQuery('');
              setExpandedCategories({});
              setOpnameDraft({});
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                jenis === 'Topping'
                  ? 'fast-food-outline'
                  : 'leaf-outline'
              }
              size={17}
              color={
                jenisFilter === jenis
                  ? WARNA.putih
                  : WARNA.sekunder
              }
            />

            <Text
              style={[
                styles.stockTypeTabText,
                jenisFilter === jenis &&
                  styles.stockTypeTabTextActive,
              ]}
            >
              Stok {jenis}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Konten berdasarkan tab */}
      {activeSection === 'Daftar Stok' && renderDaftarStok()}

      {activeSection === 'Restok Bahan' && renderRestokBahan()}

      {activeSection === 'Stock Opname' && renderStockOpname()}

      {activeSection === 'Riwayat' && renderRiwayat()}

      {/* Modal tambah dan edit */}
      <StockFormModal
        visible={isFormModalVisible}
        isEdit={isEditMode}
        initialData={selectedItem}
        onClose={() => {
          setIsFormModalVisible(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSaveItem}
      />

      {/* Modal penerimaan stok */}
      <RestockModal
        visible={isRestockModalVisible}
        item={selectedItem}
        onClose={() => {
          setIsRestockModalVisible(false);
          setSelectedItem(null);
        }}
        onSubmitRestock={(itemId, addedQty, restockRecord) => {
          onRestockItem?.(
            itemId,
            addedQty,
            restockRecord
          );

          setIsRestockModalVisible(false);
          setSelectedItem(null);
        }}
      />

      {/* Modal detail */}
      <StockDetailModal
        visible={isDetailModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
        onOpenRestock={handleOpenRestock}
        onEdit={handleOpenEdit}
        onDelete={(item) => {
          setIsDetailModalVisible(false);
          setItemToDelete(item);
        }}
      />

      {/* Konfirmasi hapus */}
      <Modal
        visible={!!itemToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setItemToDelete(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconBox}>
              <Ionicons
                name="trash"
                size={24}
                color={WARNA.merahTerang}
              />
            </View>

            <Text style={styles.confirmTitle}>
              Hapus Bahan Baku?
            </Text>

            <Text style={styles.confirmDesc}>
              Item{' '}
              <Text style={{ fontWeight: '800' }}>
                {itemToDelete?.nama}
              </Text>{' '}
              akan dihapus dari sistem inventaris kedai seblak.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setItemToDelete(null)}
              >
                <Text style={styles.confirmCancelText}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.confirmDeleteText}>
                  Ya, Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARNA.latar,
    padding: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },

  headerTitles: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    minWidth: 0,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: WARNA.teks,
    letterSpacing: -0.3,
  },

  pageSubtitle: {
    fontSize: 13,
    color: WARNA.sekunder,
    marginTop: 4,
    lineHeight: 19,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WARNA.merah,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
  },

  addBtnText: {
    color: WARNA.putih,
    fontSize: 13,
    fontWeight: '800',
  },

  sectionTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },

  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E7DAD2',
    backgroundColor: WARNA.putih,
  },

  sectionTabActive: {
    backgroundColor: WARNA.merah,
    borderColor: WARNA.merah,
  },

  sectionTabText: {
    color: WARNA.sekunder,
    fontSize: 10,
    fontWeight: '700',
  },

  sectionTabTextActive: {
    color: WARNA.putih,
  },

  stockTypeTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  stockTypeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7DAD2',
    backgroundColor: WARNA.putih,
  },

  stockTypeTabActive: {
    backgroundColor: WARNA.merah,
    borderColor: WARNA.merah,
  },

  stockTypeTabText: {
    color: WARNA.sekunder,
    fontSize: 14,
    fontWeight: '800',
  },

  stockTypeTabTextActive: {
    color: WARNA.putih,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },

  filterSection: {
    gap: 12,
    marginBottom: 16,
  },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.putih,
    borderWidth: 1.5,
    borderColor: WARNA.garis,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: WARNA.teks,
  },

  clearSearchBtn: {
    padding: 4,
  },

  listContainer: {
    backgroundColor: WARNA.putih,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: WARNA.garis,
    marginBottom: 30,
  },

  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEB',
  },

  listCountText: {
    fontSize: 12,
    color: WARNA.sekunder,
  },

  listHintText: {
    fontSize: 11,
    color: '#A89A92',
    fontStyle: 'italic',
  },

  categoryGroup: {
    marginBottom: 20,
    backgroundColor: '#FAF6F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E7DAD2',
  },

  categoryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: WARNA.teks,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  categoryCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: WARNA.sekunder,
    backgroundColor: WARNA.putih,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WARNA.garis,
  },

  categoryItemsList: {
    gap: 10,
  },

  seeMoreBtn: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: WARNA.putih,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7DAD2',
  },

  seeMoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.merah,
  },

  stockCard: {
    backgroundColor: WARNA.putih,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  stockPhoto: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: WARNA.latar,
    marginRight: 12,
  },

  stockPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: WARNA.latar,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: WARNA.garis,
  },

  cardTitleCol: {
    flex: 1,
    marginRight: 10,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  stockName: {
    fontSize: 14,
    fontWeight: '800',
    color: WARNA.teks,
    flexShrink: 1,
  },

  stockCategory: {
    fontSize: 11,
    color: WARNA.sekunder,
  },

  progressSection: {
    marginBottom: 10,
  },

  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },

  stockRatioText: {
    fontSize: 12,
    color: '#523C34',
  },

  estimateDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: WARNA.sekunder,
  },

  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEB',
  },

  priceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: WARNA.sekunder,
  },

  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickRestockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WARNA.merah,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  quickRestockText: {
    color: WARNA.putih,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#523C34',
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 12,
    color: '#8D7B70',
    textAlign: 'center',
    lineHeight: 18,
  },

  resetButton: {
    marginTop: 10,
    backgroundColor: WARNA.merahMuda,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  resetButtonText: {
    color: WARNA.merah,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionHeading: {
    color: WARNA.merahTua,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },

  sectionDescription: {
    color: WARNA.sekunder,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 12,
  },

  restokHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  restokIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: WARNA.merahMuda,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restokSummary: {
    backgroundColor: WARNA.latar,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  restokSummaryText: {
    fontSize: 11,
    color: WARNA.sekunder,
    fontWeight: '700',
  },

  restockListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E9E4',
  },

  restockRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  restockAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: WARNA.merah,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  restockActionText: {
    color: WARNA.putih,
    fontSize: 11,
    fontWeight: '700',
  },

  opnameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E9E4',
  },

  opnameMeta: {
    color: '#8D7B70',
    fontSize: 10,
    marginTop: 3,
  },

  opnameInput: {
    width: 112,
    borderWidth: 1,
    borderColor: '#E7DAD2',
    borderRadius: 8,
    backgroundColor: WARNA.putih,
    paddingHorizontal: 9,
    paddingVertical: 9,
    fontSize: 11,
    color: WARNA.teks,
    textAlign: 'right',
  },

  opnameNoteInput: {
    borderWidth: 1,
    borderColor: '#E7DAD2',
    borderRadius: 8,
    backgroundColor: WARNA.putih,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 14,
    fontSize: 11,
    color: WARNA.teks,
    minHeight: 65,
    textAlignVertical: 'top',
  },

  saveOpnameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: WARNA.merah,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },

  saveOpnameText: {
    color: WARNA.putih,
    fontSize: 12,
    fontWeight: '800',
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E9E4',
  },

  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyOpnameIcon: {
    backgroundColor: '#FEF3C7',
  },

  historyType: {
    color: WARNA.sekunder,
    fontSize: 10,
    marginTop: 3,
  },

  historyNote: {
    color: WARNA.sekunder,
    fontSize: 10,
    marginTop: 3,
  },

  historyValue: {
    color: WARNA.hijau,
    fontSize: 11,
    fontWeight: '800',
  },

  historyOpnameValue: {
    color: WARNA.oranye,
  },

  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  confirmCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: WARNA.putih,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },

  confirmIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: WARNA.teks,
    marginBottom: 6,
  },

  confirmDesc: {
    fontSize: 13,
    color: WARNA.sekunder,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },

  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F4EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.sekunder,
  },

  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: WARNA.merahTerang,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.putih,
  },
});
