
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
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

import {
  getStocks,
  getStockMovements,
  updateStock,
} from '../../services/stokService';

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../services/pengeluaranService';

const WARNA = {
  latar: '#F8F5F2',
};

export default function DashboardOwnerScreen() {
  const { width } = useWindowDimensions();

  const {
    transactions: kasirTransactions = [],
    refreshData,
  } = useKasir();

  const isMobile = width < 768;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stockItems, setStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [stockPresetFilter, setStockPresetFilter] = useState('Semua');
  const [expenses, setExpenses] = useState([]);

  // =====================================================
  // MEMUAT DATA OWNER
  // =====================================================

  const refreshOwnerData = useCallback(async () => {
    const [
      stocksResult,
      movementsResult,
      expensesResult,
    ] = await Promise.allSettled([
      getStocks(),
      getStockMovements(),
      getExpenses(),
    ]);

    // -----------------------------------------
    // DATA STOK BAHAN BAKU
    // -----------------------------------------

    if (stocksResult.status === 'fulfilled') {
      setStockItems(
        stocksResult.value.map((r) => ({
          id: r.id,
          nama: r.nama_bahan,
          kategori: r.kategori,
          sisa: Number(r.stok),
          minimum: Number(r.stok_minimum),
          satuan: r.satuan,
          hargaBeli: Number(r.harga_satuan),
          hargaJual: Number(r.harga_jual || 0),
          jumlahPerPorsi:
            r.jumlah_per_porsi != null
              ? Number(r.jumlah_per_porsi)
              : null,
        }))
      );
    } else {
      console.warn(
        'Gagal memuat stok Owner:',
        stocksResult.reason?.message
      );
    }

    // -----------------------------------------
    // RIWAYAT MUTASI STOK
    // -----------------------------------------

    if (movementsResult.status === 'fulfilled') {
      setStockMovements(movementsResult.value || []);
    } else {
      console.warn(
        'Gagal memuat riwayat mutasi stok:',
        movementsResult.reason?.message
      );
    }

    // -----------------------------------------
    // DATA PENGELUARAN
    // -----------------------------------------

    if (expensesResult.status === 'fulfilled') {
      setExpenses(
        expensesResult.value.map((r) => ({
          ...r,
          keterangan: r.nama_pengeluaran,
          nama: r.nama_pengeluaran,
          total: Number(
            r.total ??
              (Number(r.jumlah || 0) *
                Number(r.harga_satuan || 0))
          ),
          nominal: Number(
            r.total ??
              (Number(r.jumlah || 0) *
                Number(r.harga_satuan || 0))
          ),
          jumlah: Number(r.jumlah || 0),
          tanggalStr: r.tanggal,
          satuan:
            r.bahan_satuan ||
            r.stok_bahan?.satuan ||
            'pcs',
          supplier: r.supplier || '-',
          fotoItem: r.foto_item || null,
          fotoStruk: r.foto_struk || null,
          jumlahDiterima: Number(r.jumlah || 0),
        }))
      );
    } else {
      console.warn(
        'Gagal memuat pengeluaran Owner:',
        expensesResult.reason?.message
      );
    }
  }, []);

  // =====================================================
  // REFRESH SAAT HALAMAN OWNER DIBUKA
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      refreshOwnerData();

      refreshData().catch((e) =>
        console.warn(
          'Gagal memuat transaksi:',
          e.message
        )
      );
    }, [refreshOwnerData, refreshData])
  );

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // =====================================================
  // NAVIGASI
  // =====================================================

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

  // =====================================================
  // UPDATE PENGATURAN STOK
  // Harga jual + pemakaian bahan per pcs
  // =====================================================

  const handleUpdateItem = async (updatedItem) => {
    try {
      await updateStock(updatedItem.id, {
        harga_jual: Number(
          updatedItem.hargaJual ??
            updatedItem.harga_jual ??
            0
        ),

        // Untuk bahan kg, 50 gram = 0.05 kg.
        jumlah_per_porsi: Number(
          updatedItem.jumlahPerPorsi ??
            updatedItem.jumlah_per_porsi
        ),
      });

      await refreshOwnerData();

      return true;
    } catch (e) {
      console.error(
        'Gagal memperbarui pengaturan stok:',
        e.message
      );

      throw e;
    }
  };

  // =====================================================
  // TAMBAH PENGELUARAN
  // =====================================================

  const handleAddExpense = async (newExpense) => {
    try {
      await createExpense({
        tanggal: newExpense.tanggal || newExpense.tanggalStr,
        waktu: newExpense.waktu,
        nama: newExpense.keterangan || newExpense.nama,
        kategori: newExpense.kategori,
        jumlah: Number(newExpense.jumlah || 1),
        satuan: newExpense.satuan || 'pcs',
        supplier: newExpense.supplier || null,
        total: Number(
          newExpense.total || newExpense.nominal || 0
        ),
        fotoItem: newExpense.fotoItem || null,
        fotoStruk: newExpense.fotoStruk || null,
        catatan: newExpense.catatan || null,
      });

      await refreshOwnerData();
    } catch (e) {
      console.error(
        'Gagal menyimpan pengeluaran:',
        e.message
      );

      throw e;
    }
  };

  // =====================================================
  // UPDATE PENGELUARAN
  // =====================================================

  const handleUpdateExpense = async (updatedExpense) => {
    try {
      await updateExpense(updatedExpense.id, {
        tanggal: updatedExpense.tanggal || updatedExpense.tanggalStr,
        waktu: updatedExpense.waktu,
        nama: updatedExpense.keterangan || updatedExpense.nama,
        kategori: updatedExpense.kategori,
        jumlah: Number(updatedExpense.jumlah || 1),
        satuan: updatedExpense.satuan || 'pcs',
        supplier: updatedExpense.supplier || null,
        total: Number(
          updatedExpense.total || updatedExpense.nominal || 0
        ),
        fotoItem: updatedExpense.fotoItem || null,
        fotoStruk: updatedExpense.fotoStruk || null,
        catatan: updatedExpense.catatan || null,
      });

      await refreshOwnerData();
    } catch (e) {
      console.error(
        'Gagal memperbarui pengeluaran:',
        e.message
      );

      throw e;
    }
  };

  // =====================================================
  // HAPUS PENGELUARAN
  // =====================================================

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      await refreshOwnerData();
    } catch (e) {
      console.error(
        'Gagal menghapus pengeluaran:',
        e.message
      );

      throw e;
    }
  };

  // =====================================================
  // JUDUL HEADER
  // =====================================================

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

  // =====================================================
  // TAMPILAN UTAMA
  // =====================================================

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
              <TabPenjualan
                transactions={kasirTransactions}
              />
            )}

            {activeTab === 'stok' && (
              <TabStok
                stockItems={stockItems}
                stockMovements={stockMovements}
                expenses={expenses}
                onUpdateItem={handleUpdateItem}
                initialFilterStatus={stockPresetFilter}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// =====================================================
// STYLE
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: WARNA.latar,
  },

  mobileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 20,
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
