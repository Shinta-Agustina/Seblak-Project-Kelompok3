import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';
import formatCurrency from '../../utils/formatCurrency';
import CustomButton from '../../components/CustomButton';
import MenuFormModal from '../../components/MenuFormModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import { TOPPING_ITEMS, TOPPING_CATEGORIES } from '../../data/mockData';

const WARNA_CARD_OMZET = '#52141D';
const WARNA_TOMBOL = '#C62828'; // Warna orange/merah identik button Masuk Login
const WARNA_HARGA_JRENG = '#DC2626'; // Merah jreng cerah untuk harga (bukan maroon)
const WARNA_GOLD = '#F59E0B';

// Helper penentu label dan warna kategori topping sesuai data kasir
export const getCategoryBadge = (kategori = '', nama = '') => {
  const text = `${kategori} ${nama}`.toLowerCase();
  if (
    text.includes('seafood') ||
    text.includes('olahan') ||
    text.includes('dumpling') ||
    text.includes('chikuwa') ||
    text.includes('fish') ||
    text.includes('crab') ||
    text.includes('lobster') ||
    text.includes('salmon') ||
    text.includes('shrimp') ||
    text.includes('scallop') ||
    text.includes('odeng') ||
    text.includes('bakso') ||
    text.includes('sosis')
  ) {
    return { label: 'Seafood', color: '#0284C7', bg: '#E0F2FE' };
  }
  if (
    text.includes('kerupuk') ||
    text.includes('makaroni') ||
    text.includes('cuanki') ||
    text.includes('siomay') ||
    text.includes('fusilli') ||
    text.includes('penne')
  ) {
    return { label: 'Kerupuk', color: '#D97706', bg: '#FEF3C7' };
  }
  if (
    text.includes('daging') ||
    text.includes('jeroan') ||
    text.includes('ayam') ||
    text.includes('ceker') ||
    text.includes('sayap') ||
    text.includes('kepala')
  ) {
    return { label: 'Daging', color: '#DC2626', bg: '#FEE2E2' };
  }
  if (text.includes('telur') || text.includes('tahu')) {
    return { label: 'Telur & Tahu', color: '#EA580C', bg: '#FFEDD5' };
  }
  if (
    text.includes('sayur') ||
    text.includes('jamur') ||
    text.includes('sawi') ||
    text.includes('kol') ||
    text.includes('kangkung') ||
    text.includes('pakcoy') ||
    text.includes('wortel') ||
    text.includes('jagung')
  ) {
    return { label: 'Sayur & Jamur', color: '#16A34A', bg: '#DCFCE7' };
  }
  if (
    text.includes('mie') ||
    text.includes('bihun') ||
    text.includes('kwetiau') ||
    text.includes('pasta')
  ) {
    return { label: 'Mie & Bihun', color: '#CA8A04', bg: '#FEF9C3' };
  }
  return { label: kategori || 'Topping', color: '#52141D', bg: '#FBEAEC' };
};

const FILTER_CATEGORIES = TOPPING_CATEGORIES.filter((c) => c !== 'Extra & Taburan');

export default function MenuHargaScreen({ isEmbedded = false, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Context & Menu Data
  const {
    menuItems = [],
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useKasir();

  // Inisialisasi daftar menu yang tersinkronisasi 100% dengan data topping kasir (TOPPING_ITEMS)
  const [localMenuItems, setLocalMenuItems] = useState(() => {
    return TOPPING_ITEMS.map((item, idx) => ({
      id: item.id || `menu-${idx + 1}`,
      nama: item.nama,
      kategori: item.kategori,
      harga: item.harga,
      berat: item.berat || '1 pcs',
      stok: 20 + ((idx * 7) % 30),
      status: 'Aktif',
      emoji: item.emoji || '🍲',
      image: item.image,
    }));
  });

  // Local UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Modal States
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Feedback banner state
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const showFeedback = (message, type = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // Filter menu items berdasarkan query pencarian dan kategori kasir
  const filteredMenus = useMemo(() => {
    return localMenuItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.nama?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q) ||
        item.kategori?.toLowerCase().includes(q);

      const matchCat =
        selectedCategory === 'Semua' ||
        item.kategori?.toLowerCase() === selectedCategory.toLowerCase();

      return matchQuery && matchCat;
    });
  }, [localMenuItems, searchQuery, selectedCategory]);

  // Handlers: Tambah Menu
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormModalVisible(true);
  };

  // Handlers: Edit Menu
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormModalVisible(true);
  };

  // Handlers: Submit Form (Tambah / Edit)
  const handleFormSubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editingItem) {
        // Edit Menu
        setLocalMenuItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...formData } : item
          )
        );
        if (updateMenuItem) updateMenuItem(editingItem.id, formData);
        showFeedback(`Menu "${formData.nama}" berhasil diperbarui.`);
      } else {
        // Tambah Menu
        const newItem = {
          id: `menu-${Date.now()}`,
          ...formData,
          stok: formData.stok ? Number(formData.stok) : 25,
          status: formData.status || 'Aktif',
          berat: formData.berat || '1 pcs',
          emoji: formData.emoji || '🍲',
        };
        setLocalMenuItems((prev) => [newItem, ...prev]);
        if (addMenuItem) addMenuItem(newItem);
        showFeedback(`Menu "${formData.nama}" berhasil ditambahkan.`);
      }
      setFormModalVisible(false);
      setEditingItem(null);
    } catch (err) {
      showFeedback('Terjadi kesalahan saat menyimpan menu.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Handlers: Hapus Menu
  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setModalLoading(true);
    try {
      const deletedName = itemToDelete.nama;
      setLocalMenuItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete.id)
      );
      if (deleteMenuItem) deleteMenuItem(itemToDelete.id);
      setDeleteModalVisible(false);
      setItemToDelete(null);
      showFeedback(`Menu "${deletedName}" berhasil dihapus.`);
    } catch (err) {
      showFeedback('Gagal menghapus menu.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Konten Utama Menu & Harga (Sticky Header + Scrollable Cards)
  const content = (
    <View style={styles.mainContainer}>
      {/* 1. BAGIAN HEADER STICKY: SEARCH & TAMBAH MENU */}
      <View style={styles.stickyHeaderSection}>
        {/* Feedback Banner (Notifikasi Sukses / Error) */}
        {feedback && (
          <View
            style={[
              styles.feedbackBanner,
              feedback.type === 'error'
                ? styles.feedbackBannerError
                : styles.feedbackBannerSuccess,
            ]}
          >
            <Ionicons
              name={
                feedback.type === 'error'
                  ? 'alert-circle-outline'
                  : 'checkmark-circle-outline'
              }
              size={20}
              color={feedback.type === 'error' ? '#C62828' : '#168653'}
            />
            <Text
              style={[
                styles.feedbackText,
                feedback.type === 'error'
                  ? styles.feedbackTextError
                  : styles.feedbackTextSuccess,
              ]}
            >
              {feedback.message}
            </Text>
            <TouchableOpacity
              onPress={() => setFeedback(null)}
              style={styles.feedbackClose}
            >
              <Ionicons name="close" size={16} color="#8D7B70" />
            </TouchableOpacity>
          </View>
        )}

        {/* Baris Pencarian & Tombol Tambah Menu */}
        <View style={styles.actionHeaderRow}>
          <View style={styles.searchBarWrapper}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#8D7B70"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari topping / menu kasir..."
              placeholderTextColor="#A69A90"
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchClearBtn}
              >
                <Ionicons name="close-circle" size={16} color="#8D7B70" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.addMenuBtn}
            onPress={handleOpenAddModal}
            activeOpacity={0.8}
            accessibilityLabel="Tambah Menu Baru"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addMenuBtnText}>Tambah Menu</Text>
          </TouchableOpacity>
        </View>

        {/* Chips Filter Kategori Topping Sesuai Kasir */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

     
{/* 2. AREA DAFTAR MENU MENGGUNAKAN FLATLIST */}
<FlatList
  style={styles.cardsScrollArea}
  contentContainerStyle={styles.cardsScrollContent}
  data={filteredMenus}
  keyExtractor={(item, index) =>
    String(item.id ?? index)
  }
  renderItem={({ item }) => (
    <MenuItemCard
      item={item}
      onEdit={() => handleOpenEditModal(item)}
      onDelete={() => handleOpenDeleteModal(item)}
    />
  )}
  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
  showsVerticalScrollIndicator
  keyboardShouldPersistTaps="handled"
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={searchQuery ? 'search-outline' : 'restaurant-outline'}
          size={36}
          color="#8D7B70"
        />
      </View>

      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Menu Tidak Ditemukan' : 'Belum Ada Menu'}
      </Text>

      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `Tidak ada menu yang sesuai dengan kata kunci "${searchQuery}".`
          : 'Daftar menu masih kosong. Tekan tombol Tambah Menu untuk menambahkan.'}
      </Text>

      <CustomButton
        title={searchQuery ? 'Reset Pencarian' : '+ Tambah Menu Pertama'}
        variant={searchQuery ? 'outline' : 'primary'}
        onPress={() =>
          searchQuery
            ? setSearchQuery('')
            : handleOpenAddModal()
        }
        style={styles.emptyActionBtn}
      />
    </View>
  }
/>


      {/* Reusable Form Modal (Tambah & Edit) */}
      <MenuFormModal
        visible={formModalVisible}
        initialData={editingItem}
        loading={modalLoading}
        onClose={() => {
          setFormModalVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        item={itemToDelete}
        loading={modalLoading}
        onClose={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );

  // Jika dipanggil sebagai Embedded Tab di dalam DashboardOwnerScreen
  if (isEmbedded) {
    return content;
  }

  // Jika dibuka sebagai Halaman Mandiri (Standalone Screen)
  return (
    <View style={styles.standaloneContainer}>
      {!isMobile && sidebarOpen && (
        <Sidebar
          role="owner"
          activeTab="menu_harga"
          isMobile={false}
        />
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
            activeTab="menu_harga"
            isMobile={true}
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}

      <View style={styles.standaloneMain}>
        <TopHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
          title="Owner Portal · Menu & Harga"
          role="Owner"
        />
        <View style={styles.standaloneContent}>
          {content}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// KOMPONEN KARTU MENU (MENGIKUTI WIREFRAME & DESIGN SYSTEM)
// ============================================================================
function MenuItemCard({ item, onEdit, onDelete }) {
  const [imageError, setImageError] = useState(false);
  const isAktif = item.status === 'Aktif';
  const catBadge = getCategoryBadge(item.kategori, item.nama);

  return (
    <View style={styles.card}>
      {/* 1. Foto Thumbnail / Emoji Placeholder */}
      <View style={styles.cardImageContainer}>
        {!imageError && item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.cardImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderEmoji}>{item.emoji || '🍲'}</Text>
          </View>
        )}
      </View>

      {/* 2. Informasi Menu (Nama, Harga, Satuan, Stok) */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.nama}
        </Text>

        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>{formatCurrency(item.harga)}</Text>
          <Text style={styles.cardSatuan}>/ {item.berat || 'pcs'}</Text>
        </View>

        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>Stok: {item.stok ?? 0}</Text>
        </View>
      </View>

      {/* 3. Status Pill & Tombol Aksi (Edit & Hapus) */}
      <View style={styles.cardActions}>
        <View
          style={[
            styles.statusPill,
            isAktif ? styles.statusPillAktif : styles.statusPillNonaktif,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isAktif ? styles.statusTextAktif : styles.statusTextNonaktif,
            ]}
          >
            {item.status || 'Aktif'}
          </Text>
        </View>

        <View style={styles.actionIconsRow}>
          {/* Tombol Edit */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onEdit}
            activeOpacity={0.7}
            accessibilityLabel={`Edit menu ${item.nama}`}
          >
            <Ionicons name="pencil-outline" size={17} color={WARNA_CARD_OMZET} />
          </TouchableOpacity>

          {/* Tombol Hapus */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onDelete}
            activeOpacity={0.7}
            accessibilityLabel={`Hapus menu ${item.nama}`}
          >
            <Ionicons name="trash-outline" size={17} color={WARNA_GOLD} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#F8F5F2',
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
    backgroundColor: '#F8F5F2',
  },

  // 1. Sticky Header Section (Search, Kategori & Tambah Button)
  stickyHeaderSection: {
    backgroundColor: '#F8F5F2',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0 } : {}),
  },
  categoryScroll: {
    marginTop: 10,
  },
  categoryScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCD4',
  },
  categoryChipActive: {
    backgroundColor: WARNA_CARD_OMZET,
    borderColor: WARNA_CARD_OMZET,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78665E',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  cardSatuan: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78665E',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  feedbackBannerSuccess: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  feedbackBannerError: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  feedbackTextSuccess: {
    color: '#168653',
  },
  feedbackTextError: {
    color: '#C62828',
  },
  feedbackClose: {
    padding: 4,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    height: '100%',
  },
  searchClearBtn: {
    padding: 4,
  },
  addMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WARNA_TOMBOL,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    shadowColor: WARNA_TOMBOL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addMenuBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // 2. Area Scroll Cards
  cardsScrollArea: {
    flex: 1,
  },
  cardsScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  listContainer: {
    gap: 12,
  },

  // Menu Card Styling
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1.5,
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5ECE7',
    marginRight: 14,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5ECE7',
  },
  placeholderEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: WARNA_HARGA_JRENG,
    marginBottom: 4,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F5F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8DCD4',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D7B70',
  },
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 10,
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillAktif: {
    backgroundColor: '#E8F5E9',
  },
  statusPillNonaktif: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextAktif: {
    color: '#168653',
  },
  statusTextNonaktif: {
    color: '#C62828',
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: '#E8DCD4',
    justifyContent: 'center',
    alignItems: 'center',
  },


  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE5E0',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F8F5F2',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8D7B70',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 18,
  },
  emptyActionBtn: {
    minWidth: 180,
    height: 44,
  },
});
