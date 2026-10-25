import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useKasir } from '../../context/KasirContext';
import {
  TOPPING_CATEGORIES,
  TOPPING_ITEMS,
  SPICE_LEVELS,
  BROTH_OPTIONS,
  TABLE_OPTIONS,
} from '../../data/mockData';

import formatCurrency from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import ToppingCard from '../../components/ToppingCard';
import PaymentModal from '../../components/PaymentModal';
import ReceiptModal from '../../components/ReceiptModal';

import PesananAktifScreen from './PesananAktifScreen';
import RiwayatTransaksiScreen from './RiwayatTransaksiScreen';
import LaporanScreen from './LaporanPenjualanScreen';

export default function DashboardKasirScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const {
    activeTab,
    setActiveTab,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    resetCart,
    getTotalPrice,
    getTotalItemsCount,
    selectedKuah,
    setSelectedKuah,
    selectedLevel,
    setSelectedLevel,
    selectedMeja,
    setSelectedMeja,
    catatan,
    setCatatan,
    activeCategory,
    setActiveCategory,
    orders,
    user,
  } = useKasir();

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Modal pembayaran dan struk
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);

  // Data pesanan yang sedang dibayar
  const [currentOrderPayload, setCurrentOrderPayload] = useState(null);

  // Data transaksi yang akan ditampilkan pada struk
  const [lastTransaction, setLastTransaction] = useState(null);

  // Keranjang pada tampilan mobile
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Menyesuaikan tampilan sidebar ketika ukuran layar berubah
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Menu berdasarkan kategori
  const filteredToppings = TOPPING_ITEMS.filter((item) => {
    if (activeCategory === 'Semua') {
      return true;
    }

    return item.kategori === activeCategory;
  });

  // Total harga dan jumlah item
  const total = Number(getTotalPrice()) || 0;
  const totalItemsCount = Number(getTotalItemsCount()) || 0;

  /**
   * Membuka modal pembayaran.
   * Data pesanan disiapkan dari keranjang yang sedang aktif.
   */
  const handleOpenPayment = () => {
    if (!Array.isArray(cart) || cart.length === 0) {
      Alert.alert(
        'Keranjang Kosong',
        'Silakan pilih minimal satu topping terlebih dahulu.'
      );
      return;
    }

    const items = cart.map((item) => {
      const price = Number(item.harga ?? item.price ?? 0);
      const qty = Number(item.qty ?? 1);
      const name = item.nama || item.name || 'Item';

      return {
        id: item.id,
        name,
        nama: name,
        qty,
        price,
        harga: price,
        berat: item.berat || '',
        subtotal: price * qty,
      };
    });

    const orderTotal = items.reduce((sum, item) => {
      return sum + item.subtotal;
    }, 0);

    if (orderTotal <= 0) {
      Alert.alert(
        'Total Tidak Valid',
        'Pastikan harga topping yang dipilih sudah benar.'
      );
      return;
    }

    const now = new Date();

    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateStr = now.toLocaleDateString('id-ID');

    const orderNum = `TRX-${Date.now()}`;

    const payload = {
      orderNo: orderNum,
      tableNo: selectedMeja || 'Meja 2',
      time: timeStr,
      date: dateStr,
      kuah: selectedKuah,
      pedas: selectedLevel,
      catatan: (catatan || '').trim(),
      items,
      total: orderTotal,
      kasir: user?.name || user?.nama || 'Kasir',
    };

    setCurrentOrderPayload(payload);
    setPaymentVisible(true);
  };

  /**
   * Callback ketika PaymentModal mengonfirmasi pembayaran berhasil.
   *
   * Catatan:
   * PaymentModal sudah memanggil checkoutOrder() dari KasirContext.
   * Jadi dashboard TIDAK boleh memanggil checkoutOrder() lagi.
   */
  const handleCheckoutSuccess = (txData) => {
    if (!txData) {
      Alert.alert(
        'Transaksi Tidak Ditemukan',
        'Data pembayaran tidak tersedia. Silakan coba kembali.'
      );
      return;
    }

    const fallbackOrder = currentOrderPayload || {};

    const transactionItems = Array.isArray(txData.items)
      ? txData.items
      : Array.isArray(fallbackOrder.items)
        ? fallbackOrder.items
        : [];

    const transactionTotal = Number(
      txData.total ?? fallbackOrder.total ?? 0
    );

    if (transactionItems.length === 0 || transactionTotal <= 0) {
      Alert.alert(
        'Data Transaksi Tidak Valid',
        'Data pesanan tidak lengkap sehingga struk tidak dapat ditampilkan.'
      );
      return;
    }

    const completedTransaction = {
      ...fallbackOrder,
      ...txData,

      orderNo:
        txData.orderNo ||
        fallbackOrder.orderNo ||
        `TRX-${Date.now()}`,

      tableNo:
        txData.tableNo ||
        txData.no_meja ||
        fallbackOrder.tableNo ||
        '-',

      date: txData.date || fallbackOrder.date || '-',

      time: txData.time || fallbackOrder.time || '-',

      kuah: txData.kuah ?? fallbackOrder.kuah ?? '-',

      pedas: txData.pedas ?? fallbackOrder.pedas ?? 0,

      catatan:
        txData.catatan ??
        fallbackOrder.catatan ??
        '',

      items: transactionItems,

      total: transactionTotal,

      method:
        txData.method ||
        txData.metode ||
        txData.paymentMethod ||
        '-',

      cashPaid: Number(txData.cashPaid ?? 0),

      change: Number(txData.change ?? 0),

      kasir:
        txData.kasir ||
        fallbackOrder.kasir ||
        user?.name ||
        user?.nama ||
        'Kasir',

      status: txData.status || 'Lunas',
    };

    // Tutup modal pembayaran
    setPaymentVisible(false);

    // Tutup keranjang mobile jika terbuka
    setMobileCartOpen(false);

    // Simpan transaksi untuk ditampilkan pada struk
    setLastTransaction(completedTransaction);

    // Tampilkan struk setelah pembayaran berhasil
    setReceiptVisible(true);

    // Bersihkan pesanan saat ini.
    // Keranjang sudah di-reset oleh checkoutOrder pada context.
    setCurrentOrderPayload(null);
  };

  /**
   * Membuka detail transaksi dari menu Pesanan Aktif atau Riwayat.
   */
  const handleOpenReceiptFromHistory = (txData) => {
    if (!txData) {
      Alert.alert(
        'Transaksi Tidak Ditemukan',
        'Data transaksi tidak tersedia.'
      );
      return;
    }

    setLastTransaction(txData);
    setReceiptVisible(true);
  };

  /**
   * Menutup pembayaran tanpa menyelesaikan transaksi.
   * Keranjang tidak dihapus agar kasir bisa melanjutkan.
   */
  const handleClosePayment = () => {
    setPaymentVisible(false);
    setCurrentOrderPayload(null);
  };

  /**
   * Menutup struk.
   */
  const handleCloseReceipt = () => {
    setReceiptVisible(false);
    setLastTransaction(null);
    setCurrentOrderPayload(null);
  };

  /**
   * Pesanan Baru dari struk: reset keranjang dan arahkan ke tab Kasir
   */
  const handleNewOrder = () => {
    setReceiptVisible(false);
    setLastTransaction(null);
    setCurrentOrderPayload(null);
    resetCart();
    if (setActiveTab) {
      setActiveTab('Kasir');
    }
  };

  /**
   * Panel pesanan saat ini.
   */
  const renderOrderPanel = () => (
    <View style={styles.orderPanel}>
      {/* Header pesanan */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderInfo}>
          <Text style={styles.orderTitle}>Pesanan Saat Ini</Text>

          <Text style={styles.orderSubtitle}>
            {totalItemsCount} item dipilih ({selectedMeja || 'Meja 2'})
          </Text>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            Alert.alert(
              'Reset Pesanan',
              'Yakin ingin menghapus semua item dari keranjang?',
              [
                {
                  text: 'Batal',
                  style: 'cancel',
                },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    resetCart();
                    setCatatan('');
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={14} color="#C62828" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Pilihan meja */}
      <View style={styles.mejaSelectBox}>
        <Text style={styles.mejaSelectLabel}>Pilih No. Meja</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mejaPillsRow}
        >
          {TABLE_OPTIONS.map((meja) => {
            const isSelected = selectedMeja === meja;

            return (
              <TouchableOpacity
                key={meja}
                style={[
                  styles.mejaPill,
                  isSelected && styles.mejaPillActive,
                ]}
                onPress={() => setSelectedMeja(meja)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.mejaPillText,
                    isSelected && styles.mejaPillTextActive,
                  ]}
                >
                  {meja}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Header tabel */}
      <View style={styles.tableHeader}>
        <Text style={[styles.thText, { width: 24 }]}>No</Text>

        <Text style={[styles.thText, { flex: 1 }]}>Item</Text>

        <Text style={[styles.thText, { width: 76, textAlign: 'center' }]}>
          Jumlah
        </Text>

        <Text style={[styles.thText, { width: 78, textAlign: 'right' }]}>
          Harga
        </Text>
      </View>

      {/* Daftar item */}
      <ScrollView
        style={styles.orderItemsScroll}
        showsVerticalScrollIndicator={false}
      >
        {cart.length === 0 ? (
          <View style={styles.emptyCartBox}>
            <Text style={styles.emptyCartEmoji}>🍜</Text>

            <Text style={styles.emptyCartTitle}>
              Belum ada topping dipilih
            </Text>

            <Text style={styles.emptyCartSub}>
              Pilih topping dari katalog menu terlebih dahulu.
            </Text>
          </View>
        ) : (
          cart.map((item, index) => {
            const itemPrice = Number(item.harga ?? item.price ?? 0);
            const qty = Number(item.qty ?? 1);
            const itemName = item.nama || item.name || 'Item';

            return (
              <View key={item.id} style={styles.orderRow}>
                <Text style={[styles.tdText, styles.numberColumn]}>
                  {index + 1}
                </Text>

                <View style={styles.itemNameColumn}>
                  <Text style={styles.itemNameText}>{itemName}</Text>

                  {item.berat ? (
                    <Text style={styles.itemWeightText}>
                      {item.berat}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.qtyControlRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateCartQty(item.id, -1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="remove"
                      size={13}
                      color="#C62828"
                    />
                  </TouchableOpacity>

                  <Text style={styles.qtyNumberText}>{qty}</Text>

                  <TouchableOpacity
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add"
                      size={13}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemPriceColumn}>
                  <Text style={styles.itemPriceText}>
                    {formatCurrency(itemPrice * qty)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id)}
                    style={styles.removeItemButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeItemText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Informasi kuah dan level pedas */}
      <View style={styles.specsContainer}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Kuah</Text>

          <Text style={styles.specValue}>
            {selectedKuah || '-'}
          </Text>
        </View>

        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Level Pedas</Text>

          <View style={styles.specChiliRow}>
            {Number(selectedLevel) === 0 ? (
              <Text style={styles.specChiliMuted}>0 Cabai</Text>
            ) : (
              Array.from({
                length: Math.max(0, Number(selectedLevel) || 0),
              }).map((_, index) => (
                <Text key={index} style={styles.chiliEmoji}>
                  🌶️
                </Text>
              ))
            )}
          </View>
        </View>
      </View>

      {/* Catatan */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesLabel}>Catatan (opsional)</Text>

        <TextInput
          style={styles.notesInput}
          placeholder="Contoh: tambah bawang, tanpa sayur"
          placeholderTextColor="#B0A097"
          value={catatan}
          onChangeText={setCatatan}
          multiline
          maxLength={250}
        />
      </View>

      {/* Tombol pembayaran */}
      <TouchableOpacity
        style={[
          styles.checkoutButton,
          cart.length === 0 && styles.checkoutButtonDisabled,
        ]}
        onPress={handleOpenPayment}
        activeOpacity={0.85}
        disabled={cart.length === 0}
      >
        <View style={styles.checkoutBtnLeft}>
          <Ionicons
            name="calculator-outline"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.checkoutBtnText}>Hitung Total</Text>
        </View>

        <Text style={styles.checkoutBtnAmount}>
          {formatCurrency(total)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sidebar desktop */}
      {!isMobile && sidebarOpen && (
        <Sidebar isMobile={false} />
      )}

      {/* Sidebar mobile */}
      {isMobile && sidebarOpen && (
        <View style={styles.mobileBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
          />

          <Sidebar
            isMobile={true}
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}

      {/* Konten utama */}
      <View style={styles.mainWrapper}>
        <TopHeader
          onToggleSidebar={() => {
            setSidebarOpen((previous) => !previous);
          }}
          isSidebarOpen={sidebarOpen}
        />

        {/* Halaman Pesanan Aktif */}
        {activeTab === 'Pesanan Aktif' && (
          <PesananAktifScreen
            onOpenDetail={handleOpenReceiptFromHistory}
          />
        )}

        {/* Halaman Riwayat Transaksi */}
        {activeTab === 'Riwayat Transaksi' && (
          <RiwayatTransaksiScreen
            onOpenReceipt={handleOpenReceiptFromHistory}
          />
        )}

        {/* Halaman Laporan */}
        {activeTab === 'Laporan' && <LaporanScreen />}

        {/* Halaman Kasir */}
        {activeTab === 'Kasir' && (
          <View style={styles.posContainer}>
            <View
              style={[
                styles.posInner,
                !isMobile && !isTablet && styles.posRowLayout,
              ]}
            >
              {/* Kolom katalog */}
              <ScrollView
                style={styles.catalogColumn}
                contentContainerStyle={styles.catalogScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Pilih Topping
                  </Text>

                  <Text style={styles.sectionSubHint}>
                    Pilih topping sesuai pesanan pelanggan.
                  </Text>
                </View>

                {/* Kategori topping */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {TOPPING_CATEGORIES.map((category) => {
                    const isActive = activeCategory === category;

                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.catPill,
                          isActive && styles.catPillActive,
                        ]}
                        onPress={() => setActiveCategory(category)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            isActive && styles.catPillTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Kartu topping */}
                <View style={styles.toppingsGrid}>
                  {filteredToppings.map((item) => {
                    const cartItem = cart.find(
                      (cartEntry) => cartEntry.id === item.id
                    );

                    return (
                      <ToppingCard
                        key={item.id}
                        item={item}
                        quantity={cartItem ? cartItem.qty : 0}
                        onAdd={() => addToCart(item)}
                        onRemove={() => updateCartQty(item.id, -1)}
                      />
                    );
                  })}
                </View>

                {/* Pilihan level pedas */}
                <View style={styles.customSectionBox}>
                  <Text style={styles.customSectionTitle}>
                    Level Kepedasan
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.levelsRow}
                  >
                    {SPICE_LEVELS.map((spice) => {
                      const isSelected = selectedLevel === spice.level;

                      return (
                        <TouchableOpacity
                          key={spice.level}
                          style={[
                            styles.levelCard,
                            isSelected && styles.levelCardActive,
                          ]}
                          onPress={() => setSelectedLevel(spice.level)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.levelNumber,
                              isSelected && styles.levelNumberActive,
                            ]}
                          >
                            {spice.level}
                          </Text>

                          <View style={styles.chiliIconsRow}>
                            {spice.chilis === 0 ? (
                              <Text style={styles.noChiliEmoji}>
                                🌶️
                              </Text>
                            ) : (
                              Array.from({
                                length: spice.chilis,
                              }).map((_, index) => (
                                <Text
                                  key={index}
                                  style={styles.chiliEmoji}
                                >
                                  🌶️
                                </Text>
                              ))
                            )}
                          </View>

                          <Text
                            style={[
                              styles.levelLabel,
                              isSelected && styles.levelLabelActive,
                            ]}
                          >
                            {spice.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Pilihan kuah */}
                <View style={styles.customSectionBox}>
                  <Text style={styles.customSectionTitle}>
                    Pilihan Kuah
                  </Text>

                  <View style={styles.brothPillsRow}>
                    {BROTH_OPTIONS.map((broth) => {
                      const isSelected = selectedKuah === broth;

                      return (
                        <TouchableOpacity
                          key={broth}
                          style={[
                            styles.brothPill,
                            isSelected && styles.brothPillActive,
                          ]}
                          onPress={() => setSelectedKuah(broth)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.brothPillText,
                              isSelected && styles.brothPillTextActive,
                            ]}
                          >
                            {broth}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Panel pesanan desktop */}
              {!isMobile && !isTablet && (
                <View style={styles.orderColumnContainer}>
                  {renderOrderPanel()}
                </View>
              )}
            </View>

            {/* Tombol keranjang mobile */}
            {isMobile && (
              <View style={styles.mobileBottomBar}>
                <View style={styles.mobileCartSummary}>
                  <Text style={styles.mobileCartCount}>
                    {totalItemsCount} item ({selectedMeja || 'Meja 2'})
                  </Text>

                  <Text style={styles.mobileCartTotal}>
                    {formatCurrency(total)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.mobileViewCartBtn,
                    cart.length === 0 && styles.mobileViewCartBtnDisabled,
                  ]}
                  onPress={() => {
                    if (cart.length > 0) {
                      setMobileCartOpen(true);
                    } else {
                      Alert.alert(
                        'Pilih Topping',
                        'Silakan pilih topping terlebih dahulu.'
                      );
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="cart-outline"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text style={styles.mobileViewCartBtnText}>
                    Lihat Pesanan ({totalItemsCount})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Modal keranjang mobile */}
            {isMobile && (
              <Modal
                visible={mobileCartOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setMobileCartOpen(false)}
              >
                <View style={styles.mobileModalOverlay}>
                  <TouchableOpacity
                    style={styles.mobileModalBackdrop}
                    onPress={() => setMobileCartOpen(false)}
                    activeOpacity={1}
                  />

                  <View style={styles.mobileModalContent}>
                    <View style={styles.mobileSheetHeader}>
                      <View style={styles.sheetHandle} />

                      <TouchableOpacity
                        style={styles.sheetCloseBtn}
                        onPress={() => setMobileCartOpen(false)}
                      >
                        <Ionicons
                          name="close"
                          size={22}
                          color="#666666"
                        />
                      </TouchableOpacity>
                    </View>

                    {renderOrderPanel()}
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}
      </View>

      {/* Modal pembayaran */}
      <PaymentModal
        visible={paymentVisible}
        onClose={handleClosePayment}
        transactionData={currentOrderPayload}
        onSuccessPayment={handleCheckoutSuccess}
      />

      {/* Modal struk */}
      <ReceiptModal
        visible={receiptVisible}
        transactionData={lastTransaction}
        onClose={handleCloseReceipt}
        onNewOrder={handleNewOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F5F2',
  },

  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    flexDirection: 'row',
  },

  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
  },

  posContainer: {
    flex: 1,
    position: 'relative',
  },

  posInner: {
    flex: 1,
  },

  posRowLayout: {
    flexDirection: 'row',
  },

  catalogColumn: {
    flex: 1,
  },

  catalogScrollContent: {
    padding: 16,
    paddingBottom: 50,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
    letterSpacing: 0.2,
  },

  sectionSubHint: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '500',
  },

  categoryScroll: {
    gap: 8,
    paddingBottom: 12,
  },

  catPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCD4',
  },

  catPillActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E6E67',
  },

  catPillTextActive: {
    color: '#FFFFFF',
  },

  toppingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },

  customSectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    elevation: 1,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 14,
  },

  customSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 10,
  },

  levelsRow: {
    gap: 8,
    paddingVertical: 4,
  },

  levelCard: {
    width: 82,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#FAF5F1',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  levelCardActive: {
    backgroundColor: '#FDECEC',
    borderColor: '#C62828',
  },

  levelNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#3D2820',
  },

  levelNumberActive: {
    color: '#C62828',
  },

  chiliIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    minHeight: 18,
  },

  chiliEmoji: {
    fontSize: 12,
  },

  noChiliEmoji: {
    fontSize: 13,
    opacity: 0.35,
  },

  levelLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8D7B70',
    textAlign: 'center',
  },

  levelLabelActive: {
    color: '#C62828',
    fontWeight: '700',
  },

  brothPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  brothPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FAF5F1',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },

  brothPillActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  brothPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F5C53',
  },

  brothPillTextActive: {
    color: '#FFFFFF',
  },

  // Panel pesanan
  orderColumnContainer: {
    width: 360,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#EDE5DF',
  },

  orderPanel: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  orderHeaderInfo: {
    flex: 1,
  },

  orderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },

  orderSubtitle: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 2,
  },

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },

  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },

  mejaSelectBox: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE6',
  },

  mejaSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A3028',
    marginBottom: 5,
  },

  mejaPillsRow: {
    gap: 6,
  },

  mejaPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FAF5F1',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },

  mejaPillActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  mejaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6F5C53',
  },

  mejaPillTextActive: {
    color: '#FFFFFF',
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E5DF',
  },

  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D7B70',
  },

  orderItemsScroll: {
    maxHeight: 250,
    minHeight: 100,
  },

  emptyCartBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyCartEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },

  emptyCartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F5C53',
  },

  emptyCartSub: {
    fontSize: 11,
    color: '#A09088',
    marginTop: 4,
    textAlign: 'center',
  },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7EFEA',
  },

  tdText: {
    fontSize: 12,
    color: '#3D2820',
  },

  numberColumn: {
    width: 24,
    color: '#A09088',
  },

  itemNameColumn: {
    flex: 1,
    paddingRight: 4,
  },

  itemNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },

  itemWeightText: {
    fontSize: 10,
    color: '#8D7B70',
    marginTop: 2,
  },

  qtyControlRow: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },

  qtyBtnAdd: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  qtyNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C1810',
  },

  itemPriceColumn: {
    width: 78,
    alignItems: 'flex-end',
  },

  itemPriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
    textAlign: 'right',
  },

  removeItemButton: {
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 3,
  },

  removeItemText: {
    fontSize: 10,
    color: '#A09088',
    textDecorationLine: 'underline',
  },

  specsContainer: {
    backgroundColor: '#FAF5F1',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },

  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  specLabel: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },

  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C62828',
  },

  specChiliRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  specChiliMuted: {
    fontSize: 11,
    color: '#8D7B70',
  },

  notesContainer: {
    marginTop: 8,
  },

  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D7B70',
    marginBottom: 4,
  },

  notesInput: {
    minHeight: 40,
    maxHeight: 80,
    backgroundColor: '#FAF5F1',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#3D2820',
    textAlignVertical: 'top',
  },

  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C62828',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 12,
  },

  checkoutButtonDisabled: {
    opacity: 0.5,
  },

  checkoutBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  checkoutBtnAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  // Keranjang mobile
  mobileBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE5DF',
  },

  mobileCartSummary: {
    flex: 1,
  },

  mobileCartCount: {
    fontSize: 11,
    color: '#8D7B70',
    marginBottom: 3,
  },

  mobileCartTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C62828',
  },

  mobileViewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#C62828',
    borderRadius: 9,
  },

  mobileViewCartBtnDisabled: {
    opacity: 0.6,
  },

  mobileViewCartBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  mobileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  mobileModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  mobileModalContent: {
    height: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  mobileSheetHeader: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D8CCC5',
  },

  sheetCloseBtn: {
    position: 'absolute',
    right: 14,
    top: 8,
    padding: 3,
  },
});