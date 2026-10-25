
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import TabDashboard from '../../components/owner/tabs/TabDashboard';
import TabPenjualan from '../../components/owner/tabs/TabPenjualan';
import TabStok from '../../components/owner/tabs/TabStok';
import MenuHargaScreen from './MenuHargaScreen';
import PengeluaranScreen from './PengeluaranScreen';
import LaporanKeuanganScreen from './LaporanKeuanganScreen';

import {
  INITIAL_STOCK_ITEMS,
  INITIAL_EXPENSES,
} from '../../data/ownerData';

const WARNA = {
  merah: '#C62828',
  merahTua: '#52141D',
  latar: '#F8F5F2',
  putih: '#FFFFFF',
  teks: '#2C1810',
  abu: '#78665E',
  garis: '#EFE7E2',
};

export default function DashboardOwnerScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('dashboard');

  // State inventaris stok
  const [stockItems, setStockItems] = useState(INITIAL_STOCK_ITEMS);
  const [stockPresetFilter, setStockPresetFilter] = useState('Semua');

  // State pengeluaran modal belanja bahan baku
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Navigasi tab
  const handleChangeTab = (tab) => {
    setActiveTab(tab);

    if (tab !== 'stok') {
      setStockPresetFilter('Semua');
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Navigasi dari peringatan stok di Dashboard ke filter stok
  const handleNavigateToStockFilter = (filterStatus) => {
    setStockPresetFilter(filterStatus);
    setActiveTab('stok');

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // ==========================================
  // HANDLERS CRUD INVENTARIS STOK
  // ==========================================

  const handleAddItem = (newItem) => {
    setStockItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateItem = (updatedItem) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleDeleteItem = (itemId) => {
    setStockItems((prev) =>
      prev.filter((item) => item.id !== itemId)
    );
  };

  // Restok: menambah stok dan mencatat pengeluaran
  const handleRestockItem = (itemId, addedQty, restockRecord) => {
    const targetItem = stockItems.find(
      (item) => item.id === itemId
    );

    if (!targetItem) {
      return;
    }

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const newSisa = Number(
          ((Number(item.sisa) || 0) + Number(addedQty)).toFixed(1)
        );

        const minimum = Number(item.minimum) || 1;
        const newEst = Number(
          (newSisa / (minimum * 0.8)).toFixed(1)
        );

        return {
          ...item,
          sisa: newSisa,
          estimasiHabisHari: newEst,
          riwayatRestok: [
            restockRecord,
            ...(item.riwayatRestok || []),
          ],
          supplier:
            restockRecord.supplier || item.supplier,
          hargaBeli:
            restockRecord.hargaBeli || item.hargaBeli,
        };
      })
    );

    // Sinkronisasi ke catatan pengeluaran modal belanja
    const hargaBeli =
      Number(restockRecord.hargaBeli) ||
      Number(targetItem.hargaBeli) ||
      0;

    const totalBiayaModal =
      Number(addedQty) * hargaBeli;

    const modalExpense = {
      id: `MODAL-${Date.now()}`,
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      waktu: 'Baru saja (Restok)',
      keterangan: `Restok ${targetItem.nama} (+${addedQty} ${targetItem.satuan})`,
      kategori: targetItem.kategori || 'Bahan Baku',
      nominal: totalBiayaModal,
      supplier:
        restockRecord.supplier ||
        targetItem.supplier ||
        'Supplier Langganan',
      metode: 'Tunai',
      pic: 'Owner',
    };

    setExpenses((prev) => [modalExpense, ...prev]);
  };

  // ==========================================
  // HANDLERS PENGELUARAN
  // ==========================================

  const handleAddExpense = (newExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses((prev) =>
      prev.filter((expense) => expense.id !== expenseId)
    );
  };

  // ==========================================
  // HEADER TITLE
  // ==========================================

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Owner Portal · Ringkasan Kesehatan Kedai';

      case 'penjualan':
        return 'Owner Portal · Laporan Penjualan Seblak';

      case 'stok':
        return 'Owner Portal · Inventaris Stok Bahan Baku';

      case 'menu_harga':
        return 'Owner Portal · Manajemen Menu & Harga';

      case 'pengeluaran':
        return 'Owner Portal · Modal Belanja Bahan Baku';

      case 'laporan_keuangan':
        return 'Owner Portal · Laporan Keuangan';

      default:
        return 'Owner Portal · Kedai Seblak Prasmanan';
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <View style={styles.container}>
      {/* Sidebar Desktop */}
      {!isMobile && sidebarOpen && (
        <Sidebar
          role="owner"
          activeTab={activeTab}
          setActiveTab={handleChangeTab}
          isMobile={false}
        />
      )}

      {/* Sidebar Mobile */}
      {isMobile && sidebarOpen && (
        <View style={styles.mobileBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
            accessibilityLabel="Tutup menu navigasi"
          />

          <Sidebar
            role="owner"
            activeTab={activeTab}
            setActiveTab={handleChangeTab}
            isMobile={true}
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}

      <View style={styles.mainWrapper}>
        <TopHeader
          onToggleSidebar={() =>
            setSidebarOpen((prev) => !prev)
          }
          isSidebarOpen={sidebarOpen}
          title={getHeaderTitle()}
          role="Owner"
        />

        {/* Tab Menu Harga */}
        {activeTab === 'menu_harga' ? (
          <View style={styles.embeddedTabContainer}>
            <MenuHargaScreen isEmbedded={true} />
          </View>
        ) : activeTab === 'pengeluaran' ? (
          /* Tab Pengeluaran */
          <View style={styles.embeddedTabContainer}>
            <PengeluaranScreen
              isEmbedded={true}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </View>
        ) : activeTab === 'laporan_keuangan' ? (
          /* Tab Laporan Keuangan */
          <View style={styles.embeddedTabContainer}>
            <LaporanKeuanganScreen isEmbedded={true} />
          </View>
        ) : (
          /* Tab Dashboard, Penjualan, dan Stok */
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              isMobile && styles.scrollContentMobile,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'dashboard' && (
              <TabDashboard
                setActiveTab={handleChangeTab}
                stockItems={stockItems}
                expenses={expenses}
                onNavigateToStockFilter={
                  handleNavigateToStockFilter
                }
              />
            )}

            {activeTab === 'penjualan' && (
              <TabPenjualan />
            )}

            {activeTab === 'stok' && (
              <TabStok
                stockItems={stockItems}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onRestockItem={handleRestockItem}
                initialFilterStatus={stockPresetFilter}
              />
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: WARNA.latar,
  },

  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    flexDirection: 'row',
  },

  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 24, 16, 0.45)',
  },

  mainWrapper: {
    flex: 1,
    minWidth: 0,
    height: '100%',
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    padding: 22,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },

  scrollContentMobile: {
    padding: 14,
    paddingBottom: 40,
  },

  embeddedTabContainer: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: '100%',
  },
});
