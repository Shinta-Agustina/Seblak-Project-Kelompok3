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
import PengeluaranScreen from './PengeluaranScreen';
import LaporanKeuanganScreen from './LaporanKeuanganScreen';
import KelolaKasirScreen from './KelolaKasirScreen';

import { useKasir } from '../../context/KasirContext';
import { TOPPING_ITEMS } from '../../data/mockData';

import {
  INITIAL_STOCK_ITEMS,
} from '../../data/ownerData';
import { MASTER_EXPENSES } from '../../data/mockExpenses';

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

  const [expenses, setExpenses] = useState(MASTER_EXPENSES);

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

  // Sinkronisasi stok berdasarkan pembelian yang dicatat pada Pengeluaran.
  // Hanya bahan dengan nama dan satuan yang cocok yang diubah.
  const adjustStockFromExpense = (expense, multiplier = 1) => {
    const jumlah = Number(expense?.jumlah || 0);
    const namaBahan = String(expense?.keterangan || '').trim().toLowerCase();
    const satuanBeli = String(expense?.satuan || '').trim().toLowerCase();
    if (!jumlah || !namaBahan || !satuanBeli) return;

    setStockItems((prev) => {
      const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/rasa$/i, '').trim();
      const index = prev.findIndex((item) => normalizeName(item.nama) === normalizeName(namaBahan));

      if (index === -1) {
        if (multiplier < 0) return prev;
        const record = {
          tanggal: expense.tanggalStr || expense.tanggal,
          jumlah,
          satuan: satuanBeli,
          supplier: expense.supplier || '',
          hargaBeli: Number(expense.total || 0) / jumlah,
          total: Number(expense.total || 0),
          pic: 'Owner',
          jenis: 'Restok',
          expenseId: expense.id,
        };
        return [{
          id: `STK-EXP-${expense.id}`,
          nama: expense.keterangan,
          kategori: expense.kategori || 'Bahan Baku',
          sisa: jumlah,
          stokAwal: jumlah,
          minimum: 1,
          satuan: satuanBeli,
          terpakaiHariIni: 0,
          estimasiHabisHari: 0,
          supplier: expense.supplier || '',
          hargaBeli: record.hargaBeli,
          foto: null,
          riwayatRestok: [record],
        }, ...prev];
      }

      const item = prev[index];
      const satuanStok = String(item.satuan || '').trim().toLowerCase();
      let qtyMasuk = jumlah;
      if (satuanBeli === 'gram' && satuanStok === 'kg') qtyMasuk = jumlah / 1000;
      else if (satuanBeli === 'kg' && satuanStok === 'gram') qtyMasuk = jumlah * 1000;
      else if (satuanBeli !== satuanStok) return prev;

      const delta = qtyMasuk * multiplier;
      const record = {
        tanggal: expense.tanggalStr || expense.tanggal,
        jumlah: qtyMasuk,
        satuan: satuanStok,
        supplier: expense.supplier || '',
        hargaBeli: Number(expense.total || 0) / jumlah,
        total: Number(expense.total || 0),
        pic: 'Owner',
        jenis: 'Restok',
        expenseId: expense.id,
      };
      return prev.map((stock, i) => i !== index ? stock : ({
        ...stock,
        sisa: Math.max(0, Number((Number(stock.sisa || 0) + delta).toFixed(3))),
        stokAwal: Math.max(0, Number(stock.stokAwal || 0) + delta),
        supplier: multiplier > 0 ? (expense.supplier || stock.supplier) : stock.supplier,
        hargaBeli: multiplier > 0 ? record.hargaBeli : stock.hargaBeli,
        riwayatRestok: multiplier > 0
          ? [record, ...(stock.riwayatRestok || [])]
          : (stock.riwayatRestok || []).filter((r) => r.expenseId !== expense.id),
      }));
    });
  };

  const handleAddExpense = (newExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
    adjustStockFromExpense(newExpense, 1);
  };

  const handleUpdateExpense = (updatedExpense) => {
    const previous = expenses.find((expense) => expense.id === updatedExpense.id);
    if (previous) adjustStockFromExpense(previous, -1);
    adjustStockFromExpense(updatedExpense, 1);
    setExpenses((prev) => prev.map((expense) =>
      expense.id === updatedExpense.id ? updatedExpense : expense
    ));
  };

  const handleDeleteExpense = (expenseId) => {
    const target = expenses.find((expense) => expense.id === expenseId);
    if (target) adjustStockFromExpense(target, -1);
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
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
        ) : activeTab === 'pengeluaran' ? (
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
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
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