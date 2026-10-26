import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Modal,
  Alert,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

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

export default function DashboardKasirScreen({ navigation }) {
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
    user,
  } = useKasir();

  const [sidebarOpen, setSidebarOpen] = useState(false); // Default tertutup di layar kecil agar tidak menabrak
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [currentOrderPayload, setCurrentOrderPayload] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const safeCart = Array.isArray(cart) ? cart : [];

  const filteredToppings = TOPPING_ITEMS.filter((item) => {
    if (activeCategory === 'Semua') {
      return true;
    }

    return item.kategori === activeCategory;
  });

  const total = Number(getTotalPrice()) || 0;
  const totalItemsCount = Number(getTotalItemsCount()) || 0;

  // Membuka modal pembayaran berdasarkan isi keranjang.
  const handleOpenPayment = () => {
    if (safeCart.length === 0) {
      Alert.alert(
        'Keranjang Kosong',
        'Silakan pilih minimal satu topping terlebih dahulu.'
      );
      return;
    }

    const items = safeCart.map((item) => {
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

    const orderTotal = items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const hasInvalidItem = items.some((item) => {
      return (
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isFinite(item.qty) ||
        item.qty <= 0 ||
        !Number.isFinite(item.subtotal)
      );
    });

    if (
      items.length === 0 ||
      hasInvalidItem ||
      !Number.isFinite(orderTotal) ||
      orderTotal <= 0
    ) {
      Alert.alert(
        'Total Tidak Valid',
        'Periksa kembali harga dan jumlah setiap topping.'
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

    const payload = {
      orderNo: `TRX-${Date.now()}`,
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

    if (
      transactionItems.length === 0 ||
      !Number.isFinite(transactionTotal) ||
      transactionTotal <= 0
    ) {
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

    setPaymentVisible(false);
    setMobileCartOpen(false);
    setLastTransaction(completedTransaction);
    setReceiptVisible(true);
    setCurrentOrderPayload(null);
  };

  const handleOpenReceiptFromHistory = (txData) => {
    if (!txData) {
      Alert.alert(
        'Transaksi Tidak Ditemukan',
        'Data transaksi tidak tersedia.'
      );
      return;
    }

    if (navigation?.navigate) {
      navigation.navigate('DetailTransaksi', { transaction: txData });
      return;
    }

    setLastTransaction(txData);
    setReceiptVisible(true);
  };

  const handleClosePayment = () => {
    setPaymentVisible(false);
    setCurrentOrderPayload(null);
  };

  const handleCloseReceipt = () => {
    setReceiptVisible(false);
    setLastTransaction(null);
    setCurrentOrderPayload(null);
  };

  const handleNewOrder = () => {
    setReceiptVisible(false);
    setLastTransaction(null);
    setCurrentOrderPayload(null);
    resetCart();
    setCatatan('');

    if (setActiveTab) {
      setActiveTab('Kasir');
    }
  };

  const handleResetCart = () => {
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
  };

  const renderOrderPanel = () => (
    <View style={styles.orderPanel}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderInfo}>
          <Text style={styles.orderTitle}>Pesanan Saat Ini</Text>
          <Text style={styles.orderSubtitle}>
            {totalItemsCount} item dipilih ({selectedMeja || 'Meja 2'})
          </Text>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetCart}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={14} color="#C62828" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

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

      <View style={styles.tableHeader}>
        <Text style={[styles.thText, styles.numberColumn]}>No</Text>
        <Text style={[styles.thText, styles.itemNameColumn]}>Item</Text>
        <Text style={[styles.thText, styles.qtyControlRow]}>Jumlah</Text>
        <Text style={[styles.thText, styles.itemPriceColumn]}>Harga</Text>
      </View>

      <FlatList
        style={styles.orderItemsScroll}
        data={safeCart}
        keyExtractor={(item, index) => String(item.id ?? index)}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyCartBox}>
            <MaterialCommunityIcons
              name="bowl-mix-outline"
              size={32}
              color="#C62828"
              style={styles.emptyCartIcon}
            />
            <Text style={styles.emptyCartTitle}>
              Belum ada topping dipilih
            </Text>
            <Text style={styles.emptyCartSub}>
              Pilih topping dari katalog menu terlebih dahulu.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const itemPrice = Number(item.harga ?? item.price ?? 0);
          const qty = Number(item.qty ?? 1);
          const itemName = item.nama || item.name || 'Item';

          return (
            <View style={styles.orderRow}>
              <Text style={[styles.tdText, styles.numberColumn]}>
                {index + 1}
              </Text>
              <View style={styles.itemNameColumn}>
                <Text style={styles.itemNameText}>{itemName}</Text>
                {item.berat ? (
                  <Text style={styles.itemWeightText}>{item.berat}</Text>
                ) : null}
              </View>
              <View style={styles.qtyControlRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateCartQty(item.id, -1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={13} color="#C62828" />
                </TouchableOpacity>
                <Text style={styles.qtyNumberText}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnAdd]}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={13} color="#FFFFFF" />
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
        }}
      />

      <View style={styles.specsContainer}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Kuah</Text>
          <Text style={styles.specValue}>{selectedKuah || '-'}</Text>
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
                <Text key={index} style={styles.chiliEmoji}>🌶️</Text>
              ))
            )}
          </View>
        </View>
      </View>

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

      <TouchableOpacity
        style={[
          styles.checkoutButton,
          safeCart.length === 0 && styles.checkoutButtonDisabled,
        ]}
        onPress={handleOpenPayment}
        activeOpacity={0.85}
        disabled={safeCart.length === 0}
      >
        <View style={styles.checkoutBtnLeft}>
          <Ionicons name="calculator-outline" size={19} color="#FFFFFF" />
          <Text style={styles.checkoutBtnText}>Hitung Total</Text>
        </View>
        <Text style={styles.checkoutBtnAmount}>{formatCurrency(total)}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sidebar Desktop / Tablet Besar */}
      {!isMobile && sidebarOpen && (
        <Sidebar isMobile={false} />
      )}

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <View style={styles.mobileBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
          />
          <Sidebar
            isMobile
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}

      {/* Konten Utama */}
      <View style={styles.mainWrapper}>
        <TopHeader
          onToggleSidebar={() => {
            setSidebarOpen((previous) => !previous);
          }}
          isSidebarOpen={sidebarOpen}
        />

        {activeTab === 'Pesanan Aktif' && (
          <PesananAktifScreen
            onOpenDetail={handleOpenReceiptFromHistory}
          />
        )}

        {activeTab === 'Riwayat Transaksi' && (
          <RiwayatTransaksiScreen
            onOpenReceipt={handleOpenReceiptFromHistory}
          />
        )}

        {activeTab === 'Laporan' && <LaporanScreen />}

        {activeTab === 'Kasir' && (
          <View style={styles.posContainer}>
            <View
              style={[
                styles.posInner,
                !isMobile && !isTablet && styles.posRowLayout,
              ]}
            >
              <ScrollView
                style={styles.catalogColumn}
                contentContainerStyle={styles.catalogScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Pilih Topping</Text>
                  <Text style={styles.sectionSubHint}>
                    Pilih topping sesuai pesanan pelanggan.
                  </Text>
                </View>

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

                <View style={styles.toppingsGrid}>
                  {filteredToppings.map((item) => {
                    const cartItem = safeCart.find(
                      (cartEntry) => cartEntry.id === item.id
                    );

                    return (
                      <View
                        key={item.id}
                        style={styles.toppingCardWrapper}
                      >
                        <ToppingCard
                          item={item}
                          quantity={cartItem ? cartItem.qty : 0}
                          onAdd={() => addToCart(item)}
                          onRemove={() => updateCartQty(item.id, -1)}
                        />
                      </View>
                    );
                  })}
                </View>

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
                              <Ionicons
                                name="leaf-outline"
                                size={14}
                                color="#A09088"
                              />
                            ) : (
                              Array.from({ length: spice.chilis }).map(
                                (_, index) => (
                                  <Text key={index} style={styles.chiliEmoji}>
                                    🌶️
                                  </Text>
                                )
                              )
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

                <View style={styles.customSectionBox}>
                  <Text style={styles.customSectionTitle}>Pilihan Kuah</Text>
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

              {!isMobile && (
                <View
                  style={[
                    styles.orderColumnContainer,
                    isTablet && styles.orderColumnTablet,
                  ]}
                >
                  {renderOrderPanel()}
                </View>
              )}
            </View>

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
                    safeCart.length === 0 &&
                      styles.mobileViewCartBtnDisabled,
                  ]}
                  onPress={() => {
                    if (safeCart.length > 0) {
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
                  <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.mobileViewCartBtnText}>
                    Lihat Pesanan ({totalItemsCount})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                        <Ionicons name="close" size={22} color="#666666" />
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

      <PaymentModal
        visible={paymentVisible}
        onClose={handleClosePayment}
        transactionData={currentOrderPayload}
        onSuccessPayment={handleCheckoutSuccess}
      />

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
    position: 'relative',
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
    flex: 1, // Diperbaiki dari position: 'column' yang salah
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toppingCardWrapper: {
    width: '31.8%',
    marginBottom: 10,
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
  orderColumnContainer: {
    width: 360,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#EDE5DF',
  },
  orderColumnTablet: {
    width: 320,
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
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
    backgroundColor: '#FCFAF8',
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D7B70',
  },
  numberColumn: {
    width: 24,
    textAlign: 'center',
  },
  itemNameColumn: {
    flex: 1,
    paddingHorizontal: 6,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 75,
  },
  itemPriceColumn: {
    width: 85,
    alignItems: 'flex-end',
  },
  orderItemsScroll: {
    flex: 1,
    minHeight: 120,
  },
  emptyCartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 6,
  },
  emptyCartIcon: {
    opacity: 0.8,
  },
  emptyCartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3D2820',
  },
  emptyCartSub: {
    fontSize: 11,
    color: '#8D7B70',
    textAlign: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE6',
    paddingHorizontal: 4,
  },
  tdText: {
    fontSize: 12,
    color: '#3D2820',
  },
  itemNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  itemWeightText: {
    fontSize: 10,
    color: '#8D7B70',
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    minWidth: 16,
    textAlign: 'center',
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C1810',
  },
  removeItemButton: {
    marginTop: 2,
  },
  removeItemText: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '600',
  },
  specsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAF5F1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    marginTop: 8,
    marginBottom: 8,
  },
  specItem: {
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    color: '#8D7B70',
    fontWeight: '700',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C1810',
    marginTop: 1,
  },
  specChiliRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  specChiliMuted: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A3028',
    marginBottom: 4,
  },
  notesInput: {
    backgroundColor: '#FAF5F1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11,
    color: '#2C1810',
    minHeight: 45,
    textAlignVertical: 'top',
  },
  checkoutButton: {
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#D7CCC8',
    shadowOpacity: 0,
    elevation: 0,
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
    fontSize: 15,
    fontWeight: '900',
  },
  mobileBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE5DF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mobileCartSummary: {
    flex: 1,
  },
  mobileCartCount: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },
  mobileCartTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2C1810',
  },
  mobileViewCartBtn: {
    backgroundColor: '#C62828',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileViewCartBtnDisabled: {
    backgroundColor: '#D7CCC8',
  },
  mobileViewCartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  mobileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mobileModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '85%',
    minHeight: '50%',
  },
  mobileSheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE6',
    position: 'relative',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D7CCC8',
  },
  sheetCloseBtn: {
    position: 'absolute',
    right: 12,
    top: 6,
    padding: 4,
  },
});