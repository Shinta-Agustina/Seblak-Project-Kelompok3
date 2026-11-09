import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

import PengeluaranScreen from './PengeluaranScreen';
import LaporanKeuanganScreen from './LaporanKeuanganScreen';
import KelolaKasirScreen from './KelolaKasirScreen';

import { useKasir } from '../../context/KasirContext';
import { getStocks, getStockMovements, updateStock, recordStockMutation } from '../../services/stokService';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../services/pengeluaranService';

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
  const { transactions: kasirTransactions = [], user, refreshData } = useKasir();
  const isMobile = width < 768;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stockItems, setStockItems] = useState([]);
  const [stockPresetFilter, setStockPresetFilter] = useState('Semua');

  const [expenses, setExpenses] = useState([]);

  const refreshOwnerData = async () => {
    const [stocks, expenseRows, movements] = await Promise.all([getStocks(), getExpenses(), getStockMovements()]);
    const movementByStock = movements.reduce((acc, m) => { (acc[m.stok_id] ||= []).push({ tanggal: m.created_at, jumlah: Number(m.jumlah), jenis: m.tipe, keterangan: m.keterangan, pic: 'Owner' }); return acc; }, {});
    setStockItems(stocks.map((r) => ({ id: r.id, nama: r.nama_bahan, kategori: r.kategori, sisa: Number(r.stok), stokAwal: Number(r.stok), minimum: Number(r.stok_minimum), satuan: r.satuan, terpakaiHariIni: 0, estimasiHabisHari: 0, hargaBeli: Number(r.harga_satuan), riwayatRestok: movementByStock[r.id] || [] })));
    setExpenses(expenseRows.map((r) => ({ ...r, keterangan: r.nama, total: r.nominal, nominal: r.nominal, tanggalStr: r.tanggal, supplier: r.catatan || '-' })));
  };
  useFocusEffect(useCallback(() => {
    refreshOwnerData().catch((e) => console.warn('Gagal memuat data Owner:', e.message));
    refreshData().catch((e) => console.warn('Gagal memuat transaksi:', e.message));
  }, [refreshData]));


  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Stok tidak dikurangi otomatis dari transaksi sebelum resep/BOM topping tersedia.
  // Mutasi stok dicatat secara eksplisit agar saldo dan riwayat tetap konsisten.

  // Navigasi
  const handleChangeTab = (tab) => {
    setActiveTab(tab);

    if (tab !== 'stok') {
      setStockPresetFilter('Semua');
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleNavigateToStockFilter = (filterStatus) => {
    setStockPresetFilter(filterStatus);
    setActiveTab('stok');

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Update stok langsung ke Supabase.
  const handleUpdateItem = async (updatedItem) => {
    try {
      const current = stockItems.find((item) => item.id === updatedItem.id);
      await updateStock(updatedItem.id, { nama_bahan: updatedItem.nama, kategori: updatedItem.kategori, satuan: updatedItem.satuan, stok_minimum: Number(updatedItem.minimum), harga_satuan: Number(updatedItem.hargaBeli || 0) });
      if (current && Number(current.sisa) !== Number(updatedItem.sisa)) {
        await recordStockMutation({ stok_id: updatedItem.id, tipe: 'penyesuaian', jumlah: Number(updatedItem.sisa), keterangan: 'Penyesuaian stok (stock opname)', dibuat_oleh: user?.id });
      }
      await refreshOwnerData();
    } catch (e) { console.error('Gagal memperbarui stok:', e.message); }
  };

  const handleRestockItem = async (itemId, addedQty, restockRecord) => {
    try {
      await recordStockMutation({ stok_id: itemId, tipe: 'masuk', jumlah: Number(addedQty), keterangan: `Restok ${restockRecord?.supplier || ''}`.trim(), dibuat_oleh: user?.id });
      await refreshOwnerData();
    } catch (e) { console.error('Gagal mencatat restok:', e.message); }
  };

  const handleAddExpense = async (newExpense) => {
    try {
      const qty = Number(newExpense.jumlah || 1);
      const total = Number(newExpense.total || newExpense.nominal || 0);
      await createExpense({ tanggal: newExpense.tanggal, nama: newExpense.keterangan, kategori: newExpense.kategori, jumlah: qty, harga_satuan: total / qty, catatan: `Satuan: ${newExpense.satuan || 'unit'}; Supplier: ${newExpense.supplier || '-'}` }, user?.id);
      await refreshOwnerData();
    } catch (e) { console.error('Gagal menyimpan pengeluaran:', e.message); }
  };

  const handleUpdateExpense = async (updatedExpense) => {
    try {
      const qty = Number(updatedExpense.jumlah || 1);
      const total = Number(updatedExpense.total || updatedExpense.nominal || 0);
      await updateExpense(updatedExpense.id, { tanggal: updatedExpense.tanggal, nama: updatedExpense.keterangan, kategori: updatedExpense.kategori, jumlah: qty, harga_satuan: total / qty });
      await refreshOwnerData();
    } catch (e) { console.error('Gagal memperbarui pengeluaran:', e.message); }
  };

  const handleDeleteExpense = async (expenseId) => {
    try { await deleteExpense(expenseId); await refreshOwnerData(); }
    catch (e) { console.error('Gagal menghapus pengeluaran:', e.message); }
  };


  // Judul header
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Owner Portal · Ringkasan Kesehatan Kedai';
      case 'kelola_kasir':
        return 'Owner Portal · Kelola Akun Kasir';
      case 'penjualan':
        return 'Owner Portal · Laporan Penjualan Seblak';
      case 'stok':
        return 'Owner Portal · Inventaris Stok Bahan Baku';
      case 'pengeluaran':
        return 'Owner Portal · Modal Belanja Bahan Baku';
      case 'laporan_keuangan':
        return 'Owner Portal · Laporan Keuangan';
      default:
        return 'Owner Portal · Kedai Seblak Prasmanan';
    }
  };

  return (
    <View style={styles.container}>
      {!isMobile && sidebarOpen && (
        <Sidebar
          role="owner"
          activeTab={activeTab}
          setActiveTab={handleChangeTab}
          isMobile={false}
        />
      )}

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

        {activeTab === 'pengeluaran' ? (
          <View style={styles.embeddedTabContainer}>
            <PengeluaranScreen
              isEmbedded={true}
              expenses={expenses}
              stockItems={stockItems}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </View>
        ) : activeTab === 'kelola_kasir' ? (
          <View style={styles.embeddedTabContainer}>
            <KelolaKasirScreen isEmbedded={true} />
          </View>
        ) : activeTab === 'laporan_keuangan' ? (
          <View style={styles.embeddedTabContainer}>
            <LaporanKeuanganScreen isEmbedded={true} />
          </View>
        ) : (
          <View style={styles.tabContent}>
            {activeTab === 'dashboard' && (
              <TabDashboard
                setActiveTab={handleChangeTab}
                stockItems={stockItems}
                expenses={expenses}
                transactions={kasirTransactions}
                onNavigateToStockFilter={handleNavigateToStockFilter}
              />
            )}

            {activeTab === 'penjualan' && (
              <TabPenjualan transactions={kasirTransactions} />
            )}

            {activeTab === 'stok' && (
              <TabStok
                stockItems={stockItems}
                onUpdateItem={handleUpdateItem}
                onRestockItem={handleRestockItem}
                initialFilterStatus={stockPresetFilter}
              />
            )}
          </View>
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
  tabContent: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  embeddedTabContainer: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: '100%',
  },
});