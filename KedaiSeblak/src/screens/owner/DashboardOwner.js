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
import { INITIAL_STOCK_ITEMS, INITIAL_EXPENSES } from '../../data/ownerData';

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

  // State Inventaris Stok (CRUD Lengkap)
  const [stockItems, setStockItems] = useState(INITIAL_STOCK_ITEMS);
  const [stockPresetFilter, setStockPresetFilter] = useState('Semua');

  // State Pengeluaran Modal Belanja Bahan Baku (Topping)
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    if (tab !== 'stok') {
      setStockPresetFilter('Semua');
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Navigasi cepat dari Peringatan Stok di Dashboard ke Tab Stok
  const handleNavigateToStockFilter = (filterStatus) => {
    setStockPresetFilter(filterStatus);
    setActiveTab('stok');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // ==========================================
  // HANDLERS CRUD INVENTARIS STOK (OWNER)
  // ==========================================
  const handleAddItem = (newItem) => {
    setStockItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateItem = (updatedItem) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleDeleteItem = (itemId) => {
    setStockItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // RESTOK: Tambah stok dan otomatis catat modal belanja bahan keluar!
  const handleRestockItem = (itemId, addedQty, restockRecord) => {
    let targetItem = null;

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          targetItem = item;
          const newSisa = Number(((item.sisa || 0) + addedQty).toFixed(1));
          const min = item.minimum || 1;
          const newEst = Number((newSisa / (min * 0.8 || 1)).toFixed(1));
          const updatedLogs = [restockRecord, ...(item.riwayatRestok || [])];

          return {
            ...item,
            sisa: newSisa,
            estimasiHabisHari: newEst,
            riwayatRestok: updatedLogs,
            supplier: restockRecord.supplier || item.supplier,
            hargaBeli: restockRecord.hargaBeli || item.hargaBeli,
          };
        }
        return item;
      })
    );

    // Otomatis sinkronisasi ke catatan Pengeluaran Modal Belanja Bahan
    if (targetItem) {
      const hargaBeli = restockRecord.hargaBeli || targetItem.hargaBeli || 0;
      const totalBiayaModal = addedQty * hargaBeli;

      const modalExpense = {
        id: `MODAL-${Date.now().toString().slice(-4)}`,
        tanggal: '24 Okt 2026',
        waktu: 'Baru saja (Restok)',
        keterangan: `Restok ${targetItem.nama} (+${addedQty} ${targetItem.satuan})`,
        kategori: targetItem.kategori || 'Kerupuk & Makaroni',
        nominal: totalBiayaModal,
        supplier: restockRecord.supplier || targetItem.supplier || 'Supplier Langganan',
        metode: 'Tunai',
        pic: 'Dewi (Owner)',
      };

      setExpenses((prev) => [modalExpense, ...prev]);
    }
  };

  // ==========================================
  // HANDLERS PENGELUARAN MODAL BELANJA
  // ==========================================
  const handleAddExpense = (newExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  // Header Title
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Owner Portal · Ringkasan Kesehatan Kedai';
      case 'penjualan':
        return 'Owner Portal · Laporan Penjualan Seblak';
      case 'stok':
        return 'Owner Portal · Inventaris Stok Bahan Baku';
      case 'pengeluaran':
        return 'Owner Portal · Modal Belanja Bahan Baku';
      default:
        return 'Owner Portal · Kedai Seblak Prasmanan';
    }
  };

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

      {/* Sidebar Mobile Backdrop Drawer */}
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
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
          title={getHeaderTitle()}
          role="Owner"
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            isMobile && styles.scrollContentMobile,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* FITUR 1: DASHBOARD KEDAI */}
          {activeTab === 'dashboard' && (
            <TabDashboard
              setActiveTab={handleChangeTab}
              stockItems={stockItems}
              expenses={expenses}
              onNavigateToStockFilter={handleNavigateToStockFilter}
            />
          )}

          {/* FITUR 2: LAPORAN PENJUALAN */}
          {activeTab === 'penjualan' && <TabPenjualan />}

          {/* FITUR 3: INVENTARIS STOK (DENGAN CRUD LENGKAP) */}
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

          
       
          {/* FITUR 4: PENGELUARAN MODAL BELANJA */}
          {activeTab === 'pengeluaran' && (
            <PengeluaranScreen isEmbedded={true} />
          )}


          {activeTab === 'menu_harga' && (
            <MenuHargaScreen isEmbedded />
          )}

          {activeTab === 'laporan_keuangan' && (
            <LaporanKeuanganScreen isEmbedded />
          )}


        </ScrollView>
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
});