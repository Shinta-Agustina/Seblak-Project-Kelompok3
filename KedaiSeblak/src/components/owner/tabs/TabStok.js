import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import FilterChips from '../FilterChips';
import StockProgressBar from '../StockProgressBar';
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
  if (typeof foto === 'number') return foto;
  if (typeof foto === 'string') return { uri: foto };
  if (typeof foto === 'object' && foto.uri) return foto;

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
  onUpdateItem,
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
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setStatusFilter(initialFilterStatus || 'Semua');
  }, [initialFilterStatus]);

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

  const filterOptions = [
    { id: 'Semua', label: 'Semua', count: totalBahan },
    { id: 'Aman', label: 'Aman', count: countAman },
    { id: 'Menipis', label: 'Menipis', count: countMenipis },
    { id: 'Habis', label: 'Habis', count: countHabis },
  ];

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };

  const handleSaveOpname = () => {
    const itemsDiisi = stokJenisAktif.filter((item) => {
      const value = opnameDraft[item.id];
      return value !== undefined && String(value).trim() !== '';
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
      const selisih = Number((fisik - sistem).toFixed(3));

      dataValid.push({ item, fisik, sistem, selisih });
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

      onUpdateItem?.({
        ...item,
        sisa: fisik,
        riwayatOpname: [record, ...(item.riwayatOpname || [])],
      });
    });

    setOpnameDraft({});
    setOpnameNote('');
    Alert.alert('Stock Opname Berhasil', `${dataValid.length} data stok berhasil diperbarui.`);
    setActiveSection('Riwayat');
  };

  const toggleCategoryExpand = (categoryName) => {
    const key = `${jenisFilter}-${categoryName}`;
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetFilter = () => {
    setSearchQuery('');
    setStatusFilter('Semua');
  };

  const renderStockCard = (item) => {
    const status = getItemStatus(item);
    const sisa = Number(item.sisa ?? 0);
    const minimum = Number(item.minimum ?? 1);
    const stokAwal = Number(item.stokAwal ?? 0);
    const maxReference = Math.max(stokAwal, minimum * 2, sisa, 1);
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
              <Ionicons name="image-outline" size={22} color="#A89A92" />
            </View>
          )}

          <View style={styles.cardTitleCol}>
            <View style={styles.nameRow}>
              <Text style={styles.stockName} numberOfLines={1}>
                {item.nama}
              </Text>
              <StatusBadge status={status} size="sm" />
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
                ? 'Segera Belanja!'
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
            Rp {Number(item.hargaBeli || 0).toLocaleString('id-ID')} / {item.satuan}
          </Text>
          <Text style={styles.infoHintText}>Ketuk untuk lihat detail</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          jenis: 'Restok (Pengeluaran)',
          itemId: item.id,
        })),
      ])
      .sort((a, b) => getHistoryTimestamp(b) - getHistoryTimestamp(a));
  }, [stokJenisAktif]);

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
          subtitle="Segera catat belanja"
          iconName="flame-outline"
          iconColor="#DC2626"
          iconBg="#FEE2E2"
          badgeText="Kritis"
          onPress={() => setStatusFilter('Habis')}
        />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchBarWrap}>
          <Ionicons name="search-outline" size={18} color="#8D7B70" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Cari ${jenisFilter.toLowerCase()}, kategori, atau supplier...`}
            placeholderTextColor="#A89A92"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#A89A92" />
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
            Menampilkan <Text style={{ fontWeight: '800' }}>{filteredData.length}</Text> item {jenisFilter.toLowerCase()}
          </Text>
          <Text style={styles.listHintText}>Stok diperbarui otomatis dari Pengeluaran</Text>
        </View>

        {Object.keys(groupedByCategory).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={42} color="#D1C7BD" />
            <Text style={styles.emptyTitle}>Tidak ada item stok yang cocok</Text>
            <Text style={styles.emptySubtitle}>Coba ubah kata kunci pencarian atau filter status.</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilter}>
              <Text style={styles.resetButtonText}>Reset Filter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(groupedByCategory).map((categoryName) => {
            const items = groupedByCategory[categoryName];
            const key = `${jenisFilter}-${categoryName}`;
            const isExpanded = !!expandedCategories[key];
            const displayedItems = isExpanded ? items : items.slice(0, 5);
            const hasMore = items.length > 5;

            return (
              <View key={key} style={styles.categoryGroup}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{categoryName}</Text>
                  <Text style={styles.categoryCountBadge}>{items.length} item</Text>
                </View>

                <View style={styles.categoryItemsList}>
                  {displayedItems.map(renderStockCard)}
                </View>

                {hasMore && (
                  <TouchableOpacity
                    style={styles.seeMoreBtn}
                    onPress={() => toggleCategoryExpand(categoryName)}
                  >
                    <Text style={styles.seeMoreText}>
                      {isExpanded ? 'Tutup Sebagian' : `Lihat ${items.length - 5} item lainnya`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>
    </>
  );

  const renderStockOpname = () => (
    <View style={styles.listContainer}>
      <Text style={styles.sectionHeading}>Pemeriksaan Stok Fisik (Stock Opname)</Text>
      <Text style={styles.sectionDescription}>
        Masukkan jumlah bahan yang benar-benar tersedia di dapur. Setelah disimpan, stok sistem akan disesuaikan.
      </Text>

      {stokJenisAktif.length === 0 ? (
        <Text style={styles.emptySubtitle}>Tidak ada bahan yang bisa diperiksa.</Text>
      ) : (
        stokJenisAktif.map((item) => (
          <View key={item.id} style={styles.opnameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stockName}>{item.nama}</Text>
              <Text style={styles.opnameMeta}>Stok sistem: {item.sisa} {item.satuan}</Text>
            </View>
            <TextInput
              keyboardType="decimal-pad"
              value={opnameDraft[item.id] ?? ''}
              onChangeText={(value) =>
                setOpnameDraft((prev) => ({ ...prev, [item.id]: value }))
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
        <Ionicons name="checkmark-circle-outline" size={17} color={WARNA.putih} />
        <Text style={styles.saveOpnameText}>Simpan Hasil Stock Opname</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRiwayat = () => (
    <View style={styles.listContainer}>
      <Text style={styles.sectionHeading}>Riwayat Perubahan Stok</Text>
      <Text style={styles.sectionDescription}>Riwayat otomatis dari belanja pengeluaran dan penyesuaian fisik.</Text>

      {historyData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={40} color="#D1C7BD" />
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptySubtitle}>
            Riwayat belanja pengeluaran dan stock opname {jenisFilter.toLowerCase()} akan muncul di sini.
          </Text>
        </View>
      ) : (
        historyData.map((record) => {
          const isRestok = record.jenis.includes('Restok');
          const nilai = isRestok
            ? `+${record.jumlah ?? 0} ${record.satuan || ''}`
            : `${Number(record.selisih) > 0 ? '+' : ''}${record.selisih ?? 0} ${record.satuan || ''}`;

          return (
            <View key={record.id} style={styles.historyRow}>
              <View style={[styles.historyIcon, !isRestok && styles.historyOpnameIcon]}>
                <Ionicons
                  name={isRestok ? 'cart-outline' : 'clipboard-outline'}
                  size={18}
                  color={isRestok ? WARNA.hijau : WARNA.oranye}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.stockName}>{record.nama}</Text>
                <Text style={styles.opnameMeta}>{formatTanggal(record.tanggal)}</Text>
                <Text style={styles.historyType}>{record.jenis}</Text>
                {record.catatan ? <Text style={styles.historyNote}>Catatan: {record.catatan}</Text> : null}
              </View>

              <Text style={[styles.historyValue, !isRestok && styles.historyOpnameValue]}>
                {nilai}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>
            {activeSection === 'Stock Opname'
              ? 'Stock Opname'
              : activeSection === 'Riwayat'
              ? 'Riwayat Stok'
              : 'Pemantauan Inventaris Stok'}
          </Text>
          <Text style={styles.pageSubtitle}>
            Stok diperbarui otomatis dari pencatatan Pengeluaran belanja owner.
          </Text>
        </View>
      </View>

      <View style={styles.sectionTabs}>
        {[
          { id: 'Daftar Stok', icon: 'list-outline' },
          { id: 'Stock Opname', icon: 'clipboard-outline' },
          { id: 'Riwayat', icon: 'time-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.sectionTab, activeSection === tab.id && styles.sectionTabActive]}
            onPress={() => setActiveSection(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={activeSection === tab.id ? WARNA.putih : WARNA.sekunder}
            />
            <Text style={[styles.sectionTabText, activeSection === tab.id && styles.sectionTabTextActive]}>
              {tab.id}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stockTypeTabs}>
        {['Topping', 'Bumbu'].map((jenis) => (
          <TouchableOpacity
            key={jenis}
            style={[styles.stockTypeTab, jenisFilter === jenis && styles.stockTypeTabActive]}
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
              name={jenis === 'Topping' ? 'fast-food-outline' : 'leaf-outline'}
              size={17}
              color={jenisFilter === jenis ? WARNA.putih : WARNA.sekunder}
            />
            <Text style={[styles.stockTypeTabText, jenisFilter === jenis && styles.stockTypeTabTextActive]}>
              Stok {jenis}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === 'Daftar Stok' && renderDaftarStok()}
      {activeSection === 'Stock Opname' && renderStockOpname()}
      {activeSection === 'Riwayat' && renderRiwayat()}

      <StockDetailModal
        visible={isDetailModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARNA.latar,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitles: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WARNA.merahTua,
  },
  pageSubtitle: {
    fontSize: 13,
    color: WARNA.sekunder,
    marginTop: 4,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: WARNA.putih,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    gap: 4,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  sectionTabActive: {
    backgroundColor: WARNA.merah,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.sekunder,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
    gap: 6,
  },
  stockTypeTabActive: {
    backgroundColor: WARNA.merahTua,
    borderColor: WARNA.merahTua,
  },
  stockTypeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: WARNA.sekunder,
  },
  stockTypeTabTextActive: {
    color: WARNA.putih,
  },
summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Memungkinkan card turun ke baris berikutnya jika layar sempit
    gap: 12,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.putih,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WARNA.garis,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: WARNA.teks,
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContainer: {
    backgroundColor: WARNA.putih,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: WARNA.garis,
    marginBottom: 40,
  },
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listCountText: {
    fontSize: 13,
    color: WARNA.sekunder,
  },
  listHintText: {
    fontSize: 12,
    color: '#A89A92',
  },
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
  categoryGroup: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WARNA.latar,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WARNA.merahTua,
  },
  categoryCountBadge: {
    fontSize: 11,
    color: WARNA.sekunder,
    fontWeight: '600',
  },
  categoryItemsList: {
    gap: 10,
  },
  seeMoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.merah,
  },
  stockCard: {
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 10,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  stockPhoto: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  stockPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: WARNA.latar,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WARNA.teks,
    flex: 1,
  },
  stockCategory: {
    fontSize: 12,
    color: WARNA.sekunder,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stockRatioText: {
    fontSize: 12,
    color: WARNA.teks,
  },
  estimateDaysText: {
    fontSize: 12,
    color: WARNA.sekunder,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: WARNA.garis,
    paddingTop: 8,
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '600',
    color: WARNA.teks,
  },
  infoHintText: {
    fontSize: 11,
    color: WARNA.sekunder,
    fontStyle: 'italic',
  },
  opnameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: WARNA.garis,
    gap: 12,
  },
  opnameMeta: {
    fontSize: 12,
    color: WARNA.sekunder,
    marginTop: 2,
  },
  opnameInput: {
    width: 100,
    height: 38,
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: WARNA.putih,
    textAlign: 'right',
  },
  opnameNoteInput: {
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    backgroundColor: WARNA.putih,
    height: 70,
    textAlignVertical: 'top',
    marginVertical: 14,
  },
  saveOpnameBtn: {
    backgroundColor: WARNA.hijau,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  saveOpnameText: {
    color: WARNA.putih,
    fontWeight: 'bold',
    fontSize: 14,
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
    width: 36,
    height: 36,
    borderRadius: 8,
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
    marginTop: 2,
  },
  historyNote: {
    fontSize: 12,
    color: WARNA.teks,
    marginTop: 2,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WARNA.hijau,
  },
  historyOpnameValue: {
    color: WARNA.oranye,
  },
});