
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
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
import { TOPPING_ITEMS } from '../../data/mockData';

const WARNA = {
  latar: '#F8F5F2',
};

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const parseQuantity = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(
    String(value ?? '0')
      .trim()
      .replace(',', '.')
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const convertStockUnit = (jumlah, satuanBeli, satuanStok) => {
  const qty = Number(jumlah || 0);

  const beli = String(satuanBeli || '')
    .trim()
    .toLowerCase();

  const stok = String(satuanStok || '')
    .trim()
    .toLowerCase();

  if (beli === stok) return qty;

  if (
    ['gram', 'gr', 'g'].includes(beli) &&
    stok === 'kg'
  ) {
    return qty / 1000;
  }

  if (
    beli === 'kg' &&
    ['gram', 'gr', 'g'].includes(stok)
  ) {
    return qty * 1000;
  }

  if (
    ['liter', 'l'].includes(beli) &&
    ['ml', 'mililiter'].includes(stok)
  ) {
    return qty * 1000;
  }

  if (
    ['ml', 'mililiter'].includes(beli) &&
    ['liter', 'l'].includes(stok)
  ) {
    return qty / 1000;
  }

  return null;
};

export default function DashboardOwnerScreen() {
  const { width } = useWindowDimensions();

  const {
    transactions: kasirTransactions = [],
  } = useKasir();

  const isMobile = width < 768;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data awal sengaja kosong.
  // Data nantinya dimuat dari Supabase.
  const [stockItems, setStockItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [stockPresetFilter, setStockPresetFilter] =
    useState('Semua');

  const processedTransactionIds = useRef(new Set());
  const processingReceiptIds = useRef(new Set());

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // =====================================================
  // PENGURANGAN STOK OTOMATIS DARI TRANSAKSI KASIR
  // =====================================================
  // Catatan:
  // Bagian ini masih menghitung perubahan pada state lokal.
  // Penyimpanan ke Supabase perlu ditambahkan setelah
  // struktur tabel dan TabStok.js diketahui.

  useEffect(() => {
    const transaksiBaru = (kasirTransactions || []).filter(
      (trx) => {
        const id = trx.id || trx.orderNo || trx.no;

        const memilikiDetail =
          Array.isArray(trx.items) &&
          trx.items.length > 0;

        const status = String(
          trx.status || ''
        ).toLowerCase();

        const lunas =
          !status ||
          ['lunas', 'selesai'].includes(status);

        return (
          id &&
          !processedTransactionIds.current.has(String(id)) &&
          memilikiDetail &&
          lunas
        );
      }
    );

    if (!transaksiBaru.length) return;

    transaksiBaru.forEach((trx) => {
      const id = trx.id || trx.orderNo || trx.no;
      processedTransactionIds.current.add(String(id));
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

            const qty = parseQuantity(saleItem.qty);

            const berat = String(
              topping.berat || ''
            ).toLowerCase();

            if (stock.satuan === 'kg') {
              const gram = berat.match(
                /([0-9]+(?:[.,][0-9]+)?)\s*gr/
              );

              const kilo = berat.match(
                /([0-9]+(?:[.,][0-9]+)?)\s*kg/
              );

              if (gram) {
                pemakaian +=
                  qty *
                  Number(gram[1].replace(',', '.')) /
                  1000;
              } else if (kilo) {
                pemakaian +=
                  qty *
                  Number(kilo[1].replace(',', '.'));
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
              Number(stock.terpakaiHariIni || 0) +
              pemakaian
            ).toFixed(3)
          ),
        };
      })
    );
  }, [kasirTransactions]);

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
  // UPDATE DATA STOK
  // =====================================================

  const handleUpdateItem = (updatedItem) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id
          ? updatedItem
          : item
      )
    );
  };

  // =====================================================
  // TAMBAH PENGELUARAN
  // =====================================================

  const handleAddExpense = (newExpense) => {
    const jumlahBeli = parseQuantity(newExpense.jumlah);

    if (jumlahBeli <= 0) {
      Alert.alert(
        'Jumlah Tidak Valid',
        'Jumlah pembelian harus lebih dari 0.'
      );
      return;
    }

    const expenseWithStatus = {
      ...newExpense,
      id: newExpense.id || `EXP-${Date.now()}`,
      jumlah: jumlahBeli,
      jumlahDiterima: 0,
      statusPenerimaan: 'Menunggu Penerimaan',
      tanggalPembelian:
        newExpense.tanggalStr ||
        newExpense.tanggal ||
        new Date().toISOString(),
    };

    setExpenses((prev) => [
      expenseWithStatus,
      ...prev,
    ]);
  };

  // =====================================================
  // EDIT PENGELUARAN
  // =====================================================

  const handleUpdateExpense = (updatedExpense) => {
    const previous = expenses.find(
      (expense) => expense.id === updatedExpense.id
    );

    if (!previous) return;

    if (parseQuantity(previous.jumlahDiterima) > 0) {
      Alert.alert(
        'Tidak Dapat Mengubah Pengeluaran',
        'Pembelian ini sudah memiliki penerimaan stok. Data tidak dapat diedit.'
      );
      return;
    }

    const jumlahBaru = parseQuantity(updatedExpense.jumlah);

    if (jumlahBaru <= 0) {
      Alert.alert(
        'Jumlah Tidak Valid',
        'Jumlah pembelian harus lebih dari 0.'
      );
      return;
    }

    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === updatedExpense.id
          ? {
              ...updatedExpense,
              jumlah: jumlahBaru,
              jumlahDiterima: 0,
              statusPenerimaan: 'Menunggu Penerimaan',
            }
          : expense
      )
    );
  };

  // =====================================================
  // HAPUS PENGELUARAN
  // =====================================================

  const handleDeleteExpense = (expenseId) => {
    const target = expenses.find(
      (expense) => expense.id === expenseId
    );

    if (!target) return;

    if (parseQuantity(target.jumlahDiterima) > 0) {
      Alert.alert(
        'Tidak Dapat Menghapus',
        'Pembelian ini sudah memiliki penerimaan stok sehingga tidak dapat dihapus.'
      );
      return;
    }

    setExpenses((prev) =>
      prev.filter((expense) => expense.id !== expenseId)
    );
  };

  // =====================================================
  // TERIMA STOK
  // =====================================================

  const handleTerimaStok = (
    expenseId,
    jumlahDiterima,
    catatan = ''
  ) => {
    const receiptKey = String(expenseId);

    if (processingReceiptIds.current.has(receiptKey)) {
      return false;
    }

    processingReceiptIds.current.add(receiptKey);

    try {
      const expense = expenses.find(
        (item) => String(item.id) === receiptKey
      );

      if (!expense) {
        Alert.alert(
          'Data Tidak Ditemukan',
          'Data pembelian tidak ditemukan.'
        );
        return false;
      }

      const jumlahBeli = parseQuantity(expense.jumlah);
      const sudahDiterima = parseQuantity(
        expense.jumlahDiterima
      );
      const jumlahMasuk = parseQuantity(jumlahDiterima);

      const sisaBelumDiterima = Math.max(
        0,
        jumlahBeli - sudahDiterima
      );

      if (!Number.isFinite(jumlahMasuk) || jumlahMasuk <= 0) {
        Alert.alert(
          'Jumlah Tidak Valid',
          'Masukkan jumlah barang yang diterima lebih dari 0.'
        );
        return false;
      }

      if (jumlahMasuk > sisaBelumDiterima + 0.000001) {
        Alert.alert(
          'Jumlah Melebihi Pembelian',
          `Jumlah yang belum diterima hanya ${sisaBelumDiterima} ${expense.satuan || ''}.`
        );
        return false;
      }

      const namaBahan = normalizeName(
        expense.keterangan ||
        expense.namaBahan ||
        expense.nama
      );

      const satuanBeli = String(
        expense.satuan || ''
      ).trim();

      if (!namaBahan || !satuanBeli) {
        Alert.alert(
          'Data Pembelian Tidak Lengkap',
          'Nama bahan dan satuan pembelian harus tersedia.'
        );
        return false;
      }

      const targetItem = stockItems.find(
        (item) => normalizeName(item.nama) === namaBahan
      );

      if (!targetItem) {
        Alert.alert(
          'Bahan Tidak Ditemukan',
          `Bahan "${expense.keterangan || expense.namaBahan || expense.nama}" belum terdaftar di inventaris stok.`
        );
        return false;
      }

      const qtyKonversi = convertStockUnit(
        jumlahMasuk,
        satuanBeli,
        targetItem.satuan
      );

      if (
        qtyKonversi === null ||
        !Number.isFinite(qtyKonversi) ||
        qtyKonversi <= 0
      ) {
        Alert.alert(
          'Satuan Tidak Sesuai',
          `Satuan pembelian (${satuanBeli}) tidak sesuai dengan satuan stok (${targetItem.satuan}).`
        );
        return false;
      }

      const totalDiterimaBaru = Number(
        (sudahDiterima + jumlahMasuk).toFixed(3)
      );

      const sudahLengkap =
        totalDiterimaBaru >= jumlahBeli - 0.000001;

      const sekarang = new Date();

      const tanggalSekarang =
        sekarang.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

      const hargaTotal = parseQuantity(
        expense.total || expense.nominal
      );

      const hargaSatuan =
        jumlahBeli > 0 ? hargaTotal / jumlahBeli : 0;

      const restockRecord = {
        id: `TRM-${sekarang.getTime()}`,
        timestamp: sekarang.toISOString(),
        tanggal: tanggalSekarang,
        jumlah: Number(qtyKonversi.toFixed(3)),
        jumlahAsli: jumlahMasuk,
        satuan: targetItem.satuan,
        satuanPembelian: satuanBeli,
        supplier: expense.supplier || '',
        hargaBeli: Number(hargaSatuan.toFixed(2)),
        total: Number(
          (hargaSatuan * jumlahMasuk).toFixed(2)
        ),
        pic: 'Owner',
        jenis: 'Penerimaan Pembelian',
        expenseId: expense.id,
        catatan: String(catatan || '').trim(),
      };

      setStockItems((prev) =>
        prev.map((item) => {
          if (item.id !== targetItem.id) return item;

          const sisaBaru = Number(
            (
              parseQuantity(item.sisa) +
              qtyKonversi
            ).toFixed(3)
          );

          return {
            ...item,
            sisa: sisaBaru,
            estimasiHabisHari:
              Number(item.minimum || 0) > 0
                ? Number(
                    (
                      sisaBaru /
                      (Number(item.minimum) * 0.8)
                    ).toFixed(1)
                  )
                : item.estimasiHabisHari,
            supplier: expense.supplier || item.supplier,
            hargaBeli: hargaSatuan || item.hargaBeli,
            riwayatRestok: [
              restockRecord,
              ...(item.riwayatRestok || []),
            ],
          };
        })
      );

      setExpenses((prev) =>
        prev.map((item) => {
          if (String(item.id) !== receiptKey) return item;

          return {
            ...item,
            jumlahDiterima: totalDiterimaBaru,
            statusPenerimaan: sudahLengkap
              ? 'Sudah Diterima'
              : 'Diterima Sebagian',
            tanggalPenerimaan: tanggalSekarang,
          };
        })
      );

      Alert.alert(
        'Penerimaan Berhasil',
        `${jumlahMasuk} ${satuanBeli} ${expense.keterangan || expense.namaBahan || expense.nama} berhasil ditambahkan ke stok.`
      );

      return true;
    } finally {
      processingReceiptIds.current.delete(receiptKey);
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
  // TAMPILAN
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
                expenses={expenses}
                onUpdateItem={handleUpdateItem}
                onTerimaStok={handleTerimaStok}
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
