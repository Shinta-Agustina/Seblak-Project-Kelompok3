import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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

  // Modals state
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRestockModalVisible, setIsRestockModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState(null);

  // Hitung status helper:
  // sisa <= 0 => Habis
  // sisa <= minimum => Menipis
  // selain itu => Aman
  const getItemStatus = (item) => {
    const sisa = item.sisa ?? 0;
    const min = item.minimum ?? 1;
    if (sisa <= 0) return 'Habis';
    if (sisa <= min) return 'Menipis';
    return 'Aman';
  };

  // Ringkasan Atas
  const totalBahan = stockItems.length;
  const countMenipis = stockItems.filter((i) => getItemStatus(i) === 'Menipis').length;
  const countHabis = stockItems.filter((i) => getItemStatus(i) === 'Habis').length;
  const countAman = stockItems.filter((i) => getItemStatus(i) === 'Aman').length;

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return stockItems.filter((item) => {
      const status = getItemStatus(item);
      const matchesStatus =
        statusFilter === 'Semua' || status.toLowerCase() === statusFilter.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.nama.toLowerCase().includes(query) ||
        (item.kategori && item.kategori.toLowerCase().includes(query)) ||
        (item.supplier && item.supplier.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [stockItems, statusFilter, searchQuery]);

  const filterOptions = [
    { id: 'Semua', label: 'Semua', count: totalBahan },
    { id: 'Aman', label: 'Aman', count: countAman },
    { id: 'Menipis', label: 'Menipis', count: countMenipis },
    { id: 'Habis', label: 'Habis', count: countHabis },
  ];

  // Handlers
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsEditMode(false);
    setIsFormModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsDetailModalVisible(false);
    setIsFormModalVisible(true);
  };

  const handleOpenRestock = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(false);
    setIsRestockModalVisible(true);
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
      setIsDetailModalVisible(false);
    }
  };

  // Render Item FlatList
  const renderStockItem = ({ item }) => {
    const status = getItemStatus(item);
    const maxReference = Math.max(item.stokAwal || 0, item.minimum * 2, item.sisa);

    return (
      <TouchableOpacity
        style={styles.stockCard}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleCol}>
            <View style={styles.nameRow}>
              <Text style={styles.stockName} numberOfLines={1}>
                {item.nama}
              </Text>
              <StatusBadge status={status} size="sm" />
            </View>
            <Text style={styles.stockCategory}>
              {item.kategori} · Supplier: {item.supplier || '-'}
            </Text>
          </View>
        </View>

        {/* Progress Bar & Sisa Ratio */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.stockRatioText}>
              Sisa:{' '}
              <Text
                style={{
                  fontWeight: '900',
                  color: status === 'Habis' ? '#DC2626' : status === 'Menipis' ? '#B45309' : '#168653',
                }}
              >
                {item.sisa} {item.satuan}
              </Text>{' '}
              / Min. {item.minimum} {item.satuan}
            </Text>

            <Text style={styles.estimateDaysText}>
              {status === 'Habis' ? 'Segera Restok!' : `~${item.estimasiHabisHari ?? 1.5} hari lagi`}
            </Text>
          </View>

          <StockProgressBar
            current={item.sisa}
            max={maxReference}
            status={status}
            height={7}
          />
        </View>

        {/* Quick Actions Row */}
        <View style={styles.cardActionsRow}>
          <Text style={styles.priceTag}>
            Rp {(item.hargaBeli || 0).toLocaleString('id-ID')} / {item.satuan}
          </Text>

          <View style={styles.actionButtonsGroup}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleOpenEdit(item)}
              activeOpacity={0.7}
              accessibilityLabel="Edit bahan"
            >
              <Ionicons name="create-outline" size={16} color="#78665E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setItemToDelete(item)}
              activeOpacity={0.7}
              accessibilityLabel="Hapus bahan"
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
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
      {/* Page Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Stok Bahan Baku Kedai</Text>
          <Text style={styles.pageSubtitle}>
            Pantau ketersediaan bahan, batas minimum, dan kelola restok harian
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Tambah Bahan</Text>
        </TouchableOpacity>
      </View>

      {/* 3 KARTU RINGKASAN ATAS */}
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

      {/* PENCARIAN & FILTER STATUS CHIPS */}
      <View style={styles.filterSection}>
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search-outline" size={18} color="#8D7B70" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama bahan, kategori, atau supplier..."
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

        {/* Filter Chips: Semua, Aman, Menipis, Habis */}
        <FilterChips
          options={filterOptions}
          selectedId={statusFilter}
          onSelect={setStatusFilter}
          accentColor="#C62828"
        />
      </View>

      {/* DAFTAR BAHAN (FLATLIST) */}
      <View style={styles.listContainer}>
        <View style={styles.listMetaRow}>
          <Text style={styles.listCountText}>
            Menampilkan <Text style={{ fontWeight: '800' }}>{filteredData.length}</Text> bahan
            {statusFilter !== 'Semua' ? ` status ${statusFilter}` : ''}
          </Text>
          <Text style={styles.listHintText}>Ketuk kartu untuk detail & riwayat restok</Text>
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderStockItem}
          scrollEnabled={false} // Di-scroll oleh parent ScrollView DashboardOwner
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={42} color="#D1C7BD" />
              <Text style={styles.emptyTitle}>Tidak ada bahan baku yang cocok</Text>
              <Text style={styles.emptySubtitle}>
                Coba ubah kata kunci pencarian atau ganti filter status.
              </Text>
            </View>
          }
        />
      </View>

      {/* MODAL 1: FORM TAMBAH / EDIT BAHAN */}
      <StockFormModal
        visible={isFormModalVisible}
        isEdit={isEditMode}
        initialData={selectedItem}
        onClose={() => setIsFormModalVisible(false)}
        onSubmit={(itemData) => {
          if (isEditMode) {
            onUpdateItem(itemData);
          } else {
            onAddItem(itemData);
          }
        }}
      />

      {/* MODAL 2: AKSI RESTOK */}
      <RestockModal
        visible={isRestockModalVisible}
        item={selectedItem}
        onClose={() => setIsRestockModalVisible(false)}
        onSubmitRestock={(itemId, addedQty, restockRecord) => {
          onRestockItem(itemId, addedQty, restockRecord);
        }}
      />

      {/* MODAL 3: DETAIL LENGKAP BAHAN */}
      <StockDetailModal
        visible={isDetailModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
        onOpenRestock={(item) => handleOpenRestock(item)}
        onEdit={(item) => handleOpenEdit(item)}
        onDelete={(item) => {
          setIsDetailModalVisible(false);
          setItemToDelete(item);
        }}
      />

      {/* MODAL 4: KONFIRMASI HAPUS */}
      <Modal
        visible={!!itemToDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setItemToDelete(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconBox}>
              <Ionicons name="trash" size={24} color="#DC2626" />
            </View>
            <Text style={styles.confirmTitle}>Hapus Bahan Baku?</Text>
            <Text style={styles.confirmDesc}>
              Bahan <Text style={{ fontWeight: '800' }}>{itemToDelete?.nama}</Text> akan dihapus dari sistem inventaris kedai seblak.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setItemToDelete(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmDeleteText}>Ya, Hapus</Text>
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