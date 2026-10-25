
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import FilterChips from '../FilterChips';
import StockProgressBar from '../StockProgressBar';
import StockFormModal from '../StockFormModal';
import RestockModal from '../RestockModal';
import StockDetailModal from '../StockDetailModal';

export default function TabStok({
  stockItems = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onRestockItem,
  initialFilterStatus = 'Semua',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilterStatus);
  const [jenisFilter, setJenisFilter] = useState('Topping');

  // State modal
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRestockModalVisible, setIsRestockModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

// Menentukan jenis stok
const getJenisStok = (item) => {
  if (item.jenisStok) {
    return item.jenisStok;
  }

  const kategori = String(item.kategori ?? '')
    .trim()
    .toLowerCase();

  if (
    ['bumbu', 'bumbu & kuah', 'bahan dasar'].includes(kategori) ||
    String(item.id ?? '').startsWith('STK-BAHAN-')
  ) {
    return 'Bumbu';
  }

  return 'Topping';
};

  // Menentukan status stok
  const getItemStatus = (item) => {
    const sisa = Number(item.sisa ?? 0);
    const minimum = Number(item.minimum ?? 1);

    if (sisa <= 0) return 'Habis';
    if (sisa <= minimum) return 'Menipis';

    return 'Aman';
  };

  // Mengambil sumber foto lokal atau URL.
  // require() menghasilkan angka pada React Native,
  // sedangkan foto URL menggunakan objek { uri }.
  const getImageSource = (item) => {
    const foto = item?.foto ?? item?.image;

    if (foto == null || foto === '') {
      return null;
    }

    if (typeof foto === 'number') {
      return foto;
    }

    if (typeof foto === 'string') {
      return { uri: foto };
    }

    // Mendukung sumber gambar yang sudah berbentuk objek.
    if (typeof foto === 'object' && foto.uri) {
      return foto;
    }

    return null;
  };

  // Ringkasan stok sesuai jenis yang dipilih
  const stokJenisAktif = useMemo(
    () => stockItems.filter((item) => getJenisStok(item) === jenisFilter),
    [stockItems, jenisFilter]
  );

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

  // Pencarian dan filter
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return stockItems.filter((item) => {
      const status = getItemStatus(item);
      const nama = String(item.nama ?? '').toLowerCase();
      const kategori = String(item.kategori ?? '').toLowerCase();
      const supplier = String(item.supplier ?? '').toLowerCase();

      const matchesJenis = getJenisStok(item) === jenisFilter;

      const matchesStatus =
        statusFilter === 'Semua' ||
        status.toLowerCase() === statusFilter.toLowerCase();

      const matchesSearch =
        !query ||
        nama.includes(query) ||
        kategori.includes(query) ||
        supplier.includes(query);

      return matchesJenis && matchesStatus && matchesSearch;
    });
  }, [stockItems, statusFilter, searchQuery, jenisFilter]);

  const filterOptions = [
    { id: 'Semua', label: 'Semua', count: totalBahan },
    { id: 'Aman', label: 'Aman', count: countAman },
    { id: 'Menipis', label: 'Menipis', count: countMenipis },
    { id: 'Habis', label: 'Habis', count: countHabis },
  ];

  // Handler modal tambah
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsEditMode(false);
    setIsFormModalVisible(true);
  };

  // Handler modal edit
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsDetailModalVisible(false);
    setIsFormModalVisible(true);
  };

  // Handler modal restok
  const handleOpenRestock = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(false);
    setIsRestockModalVisible(true);
  };

  // Handler modal detail
  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };

  // Konfirmasi hapus
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    onDeleteItem?.(itemToDelete.id);
    setItemToDelete(null);
    setIsDetailModalVisible(false);
  };

  // Render setiap kartu stok
  const renderStockItem = ({ item }) => {
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
        style={styles.stockCard}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.75}
      >
        {/* Foto dan informasi bahan */}
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
              <Text style={styles.stockName} numberOfLines={1}>
                {item.nama}
              </Text>

              <StatusBadge status={status} size="sm" />
            </View>

            <Text style={styles.stockCategory}>
              {item.kategori || 'Tanpa kategori'} · Supplier:{' '}
              {item.supplier || '-'}
            </Text>
          </View>
        </View>

        {/* Progress stok */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.stockRatioText}>
              Sisa:{' '}
              <Text
                style={{
                  fontWeight: '900',
                  color:
                    status === 'Habis'
                      ? '#DC2626'
                      : status === 'Menipis'
                      ? '#B45309'
                      : '#168653',
                }}
              >
                {sisa} {item.satuan}
              </Text>{' '}
              / Min. {minimum} {item.satuan}
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

        {/* Harga dan aksi */}
        <View style={styles.cardActionsRow}>
          <Text style={styles.priceTag}>
            Rp {Number(item.hargaBeli || 0).toLocaleString('id-ID')} /{' '}
            {item.satuan}
          </Text>

          <View style={styles.actionButtonsGroup}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleOpenEdit(item)}
              activeOpacity={0.7}
              accessibilityLabel="Edit bahan"
            >
              <Ionicons
                name="create-outline"
                size={16}
                color="#78665E"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setItemToDelete(item)}
              activeOpacity={0.7}
              accessibilityLabel="Hapus bahan"
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#DC2626"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickRestockBtn}
              onPress={() => handleOpenRestock(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.quickRestockText}>Restok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Manajemen Stok</Text>
          <Text style={styles.pageSubtitle}>
            Kelola stok topping dan bumbu secara terpisah
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>
            Tambah {jenisFilter}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab jenis stok */}
      <View style={styles.stockTypeTabs}>
        {['Topping', 'Bumbu'].map((jenis) => (
          <TouchableOpacity
            key={jenis}
            style={[
              styles.stockTypeTab,
              jenisFilter === jenis && styles.stockTypeTabActive,
            ]}
            onPress={() => {
              setJenisFilter(jenis);
              setStatusFilter('Semua');
              setSearchQuery('');
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
              color={jenisFilter === jenis ? '#FFFFFF' : '#78665E'}
            />

            <Text
              style={[
                styles.stockTypeTabText,
                jenisFilter === jenis && styles.stockTypeTabTextActive,
              ]}
            >
              Stok {jenis}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ringkasan stok */}
      <View style={styles.summaryGrid}>
        <StatCard
          title="Total Jenis Bahan"
          value={`${totalBahan} Bahan`}
          subtitle="Tercatat dalam sistem"
          iconName="cube-outline"
          iconColor="#52141D"
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

      {/* Pencarian dan filter */}
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
          accentColor="#C62828"
        />
      </View>

      {/* Daftar stok */}
      <View style={styles.listContainer}>
        <View style={styles.listMetaRow}>
          <Text style={styles.listCountText}>
            Menampilkan{' '}
            <Text style={{ fontWeight: '800' }}>
              {filteredData.length}
            </Text>{' '}
            item {jenisFilter.toLowerCase()}
            {statusFilter !== 'Semua' ? ` status ${statusFilter}` : ''}
          </Text>

          <Text style={styles.listHintText}>
            Ketuk kartu untuk detail & riwayat restok
          </Text>
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item, index) =>
            String(item.id ?? `${item.nama}-${index}`)
          }
          renderItem={renderStockItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 10 }} />
          )}
          ListEmptyComponent={
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
                Coba ubah kata kunci pencarian atau ganti filter status.
              </Text>
            </View>
          }
        />
      </View>

      {/* Modal tambah dan edit */}
      <StockFormModal
        visible={isFormModalVisible}
        isEdit={isEditMode}
        initialData={selectedItem}
        onClose={() => setIsFormModalVisible(false)}
        onSubmit={(itemData) => {
          if (isEditMode) {
            onUpdateItem?.(itemData);
          } else {
            onAddItem?.(itemData);
          }

          setIsFormModalVisible(false);
        }}
      />

      {/* Modal restok */}
      <RestockModal
        visible={isRestockModalVisible}
        item={selectedItem}
        onClose={() => setIsRestockModalVisible(false)}
        onSubmitRestock={(itemId, addedQty, restockRecord) => {
          onRestockItem?.(itemId, addedQty, restockRecord);
          setIsRestockModalVisible(false);
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

      {/* Modal konfirmasi hapus */}
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
                color="#DC2626"
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
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmDeleteText}>
                  Ya, Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
    backgroundColor: '#FFFFFF',
  },
  stockTypeTabActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  stockTypeTabText: {
    color: '#78665E',
    fontSize: 14,
    fontWeight: '800',
  },
  stockTypeTabTextActive: {
    color: '#FFFFFF',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
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
    color: '#2C1810',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#78665E',
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C62828',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },

  filterSection: {
    gap: 12,
    marginBottom: 16,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#3D2922',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
  },
  clearSearchBtn: {
    padding: 4,
  },

  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    shadowColor: '#3D2922',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEB',
  },
  listCountText: {
    fontSize: 12,
    color: '#78665E',
  },
  listHintText: {
    fontSize: 11,
    color: '#A89A92',
    fontStyle: 'italic',
  },

  stockPhoto: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F8F5F2',
    marginRight: 12,
  },
  stockPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F8F5F2',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  stockCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
    color: '#2C1810',
    flexShrink: 1,
  },
  stockCategory: {
    fontSize: 11,
    color: '#78665E',
  },

  progressSection: {
    marginBottom: 12,
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
    color: '#78665E',
  },

  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFE7E2',
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78665E',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickRestockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C62828',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quickRestockText: {
    color: '#FFFFFF',
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
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8D7B70',
    textAlign: 'center',
    maxWidth: 280,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    color: '#2C1810',
    marginBottom: 6,
  },
  confirmDesc: {
    fontSize: 13,
    color: '#78665E',
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
    color: '#78665E',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
