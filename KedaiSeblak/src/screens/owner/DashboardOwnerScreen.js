import React, { useEffect, useRef, useState } from 'react';
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
import ManajemenKasirScreen from './ManajemenKasirScreen';
import PengeluaranScreen from './PengeluaranScreen';
import LaporanKeuanganScreen from './LaporanKeuanganScreen';
import KelolaKasirScreen from './KelolaKasirScreen';

import { useKasir } from '../../context/KasirContext';
import { TOPPING_ITEMS } from '../../data/mockData';

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
  const { transactions: kasirTransactions = [] } = useKasir();
  const isMobile = width < 768;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stockItems, setStockItems] = useState(INITIAL_STOCK_ITEMS);
  const [stockPresetFilter, setStockPresetFilter] = useState('Semua');

  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);

  const processedTransactionIds = useRef(new Set());

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Pengurangan stok otomatis dari transaksi kasir yang lunas
  useEffect(() => {
    const transaksiBaru = (kasirTransactions || []).filter((trx) => {
      const id = trx.id || trx.orderNo || trx.no;
      const memilikiDetail = Array.isArray(trx.items) && trx.items.length > 0;

      const lunas =
        !trx.status ||
        ['lunas', 'selesai'].includes(
          String(trx.status).toLowerCase()
        );

      return (
        id &&
        !processedTransactionIds.current.has(id) &&
        memilikiDetail &&
        lunas
      );
    });

    if (!transaksiBaru.length) return;

    transaksiBaru.forEach((trx) => {
      processedTransactionIds.current.add(
        trx.id || trx.orderNo || trx.no
      );
    });

    setStockItems((prev) =>
      prev.map((stock) => {
        if (!stock.toppingId) return stock;

        let pemakaian = 0;

        transaksiBaru.forEach((trx) => {
          (trx.items || []).forEach((saleItem) => {
            const topping = TOPPING_ITEMS.find(
              (item) =>
                item.id === saleItem.id ||
                item.nama === (saleItem.nama || saleItem.name)
            );

            if (
              !topping ||
              (saleItem.id && stock.toppingId !== saleItem.id)
            ) {
              return;
            }

            const qty = Number(saleItem.qty || 0);
            const berat = String(topping.berat || '').toLowerCase();

            if (stock.satuan === 'kg') {
              const gram = berat.match(/([0-9]+(?:[.,][0-9]+)?)\s*gr/);
              const kilo = berat.match(/([0-9]+(?:[.,][0-9]+)?)\s*kg/);

              if (gram) {
                pemakaian +=
                  qty * Number(gram[1].replace(',', '.')) / 1000;
              } else if (kilo) {
                pemakaian +=
                  qty * Number(kilo[1].replace(',', '.'));
              }
            } else if (stock.satuan === 'pcs') {
              const pcs = berat.match(/([0-9]+)\s*pcs/);
              pemakaian += qty * (pcs ? Number(pcs[1]) : 1);
            }
          });
        });

        if (pemakaian <= 0) return stock;

        const sisaBaru = Math.max(
          0,
          Number(stock.sisa || 0) - pemakaian
        );

        return {
          ...stock,
          sisa: Number(sisaBaru.toFixed(3)),
          terpakaiHariIni: Number(
            (
              Number(stock.terpakaiHariIni || 0) + pemakaian
            ).toFixed(3)
          ),
        };
      })
    );
  }, [kasirTransactions]);

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

  // CRUD stok
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

  // Restok stok
  const handleRestockItem = (itemId, addedQty, restockRecord) => {
    const targetItem = stockItems.find(
      (item) => item.id === itemId
    );

    if (!targetItem) return;

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const newSisa = Number(
          (
            (Number(item.sisa) || 0) + Number(addedQty)
          ).toFixed(1)
        );

        const minimum = Number(item.minimum) || 1;

        return {
          ...item,
          sisa: newSisa,
          estimasiHabisHari: Number(
            (newSisa / (minimum * 0.8)).toFixed(1)
          ),
          riwayatRestok: [
            restockRecord,
            ...(item.riwayatRestok || []),
          ],
          supplier: restockRecord.supplier || item.supplier,
          hargaBeli: restockRecord.hargaBeli || item.hargaBeli,
        };
      })
    );

    const hargaBeli =
      Number(restockRecord.hargaBeli) ||
      Number(targetItem.hargaBeli) ||
      0;

    const totalBiayaModal = Number(addedQty) * hargaBeli;

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

  // Pengeluaran
  const handleAddExpense = (newExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses((prev) =>
      prev.filter((expense) => expense.id !== expenseId)
    );
  };

  const handleUpdateStockFromExpense = (
    itemId,
    newSisa,
    newModal,
    newHargaRata
  ) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const addedQty = Math.max(
          0,
          Number(newSisa) - Number(item.sisa || 0)
        );

        const record = {
          tanggal: new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          jumlah: addedQty,
          satuan: item.satuan,
          supplier: 'Pembelian melalui Pengeluaran',
          hargaBeli: Number(newHargaRata || 0),
          pic: 'Owner',
        };

        return {
          ...item,
          sisa: Number(newSisa),
          modalTertanam: Number(newModal),
          hargaBeli: Number(newHargaRata),
          riwayatRestok:
            addedQty > 0
              ? [record, ...(item.riwayatRestok || [])]
              : item.riwayatRestok || [],
        };
      })
    );
  };

  // Judul header
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Owner Portal · Ringkasan Kesehatan Kedai';
      case 'Kelola Kasir':
        return 'Owner Portal · Kelola Akun Kasir';
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
      case 'manajemen_kasir':
        return 'Owner Portal · Manajemen Kasir';
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

        {activeTab === 'menu_harga' ? (
          <View style={styles.embeddedTabContainer}>
            <MenuHargaScreen isEmbedded={true} />
          </View>
        ) : activeTab === 'manajemen_kasir' ? (
          <View style={styles.embeddedTabContainer}>
            <ManajemenKasirScreen />
          </View>
        ) : activeTab === 'pengeluaran' ? (
          <View style={styles.embeddedTabContainer}>
            <PengeluaranScreen
              isEmbedded={true}
              expenses={expenses}
              stockItems={stockItems}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onUpdateStockAfterRestock={handleUpdateStockFromExpense}
            />
          </View>
        ) : activeTab === 'Kelola Kasir' ? (
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

            {/* DIPERBAIKI: TabStok sekarang dibungkus kondisi activeTab === 'stok' */}
            {activeTab === 'stok' && (
              <TabStok
                stockItems={stockItems}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
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