
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

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

import {
  getStocks,
  getStockMovements,
  updateStock,
  recordStockMutation,
} from '../../services/stokService';

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  tanggalIndoKeISO,
} from '../../services/pengeluaranService';

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

// Mengubah nominal Rupiah menjadi angka.
// Contoh: "90.000" menjadi 90000.
const parseRupiah = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? '').replace(/[^\d-]/g, '');
  const result = Number(cleaned);

  return Number.isFinite(result) ? result : 0;
};

// Konversi satuan pembelian ke satuan inventaris stok.
const convertStockUnit = (jumlah, satuanBeli, satuanStok) => {
  const qty = parseQuantity(jumlah);

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
    user,
    refreshData,
  } = useKasir();

  const isMobile = width < 768;

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stockItems, setStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [stockPresetFilter, setStockPresetFilter] = useState('Semua');
  const [expenses, setExpenses] = useState([]);

  // ==========================================
  // MEMUAT ULANG DATA OWNER
  // ==========================================

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
    // DATA PENGELUARAN
    // -----------------------------------------

    let expenseRows = [];

    if (expensesResult.status === 'fulfilled') {
      expenseRows = Array.isArray(expensesResult.value)
        ? expensesResult.value
        : [];

      setExpenses(
        expenseRows.map((r) => {
          const jumlah = Number(r.jumlah || 0);
          const hargaSatuan = Number(r.harga_satuan || 0);

          const total = Number(
            r.total ?? r.nominal ?? jumlah * hargaSatuan
          );

          return {
            ...r,
            id: r.id,

            keterangan:
              r.nama_pengeluaran ||
              r.nama ||
              r.keterangan ||
              '-',

            nama:
              r.nama_pengeluaran ||
              r.nama ||
              r.keterangan ||
              '-',

            total,
            nominal: total,
            jumlah,

            tanggalStr: r.tanggalStr || r.tanggal,

            satuan:
              r.bahan_satuan ||
              r.satuan ||
              r.stok_bahan?.satuan ||
              'pcs',

            supplier: r.supplier || '-',

            fotoItem: r.fotoItem || r.foto_item || null,
            fotoStruk: r.fotoStruk || r.foto_struk || null,

            jumlahDiterima: Number(
              r.jumlah_diterima ?? r.jumlah ?? 0
            ),
          };
        })
      );
    } else {
      console.warn(
        'Gagal memuat pengeluaran:',
        expensesResult.reason?.message
      );
    }

    // -----------------------------------------
    // RIWAYAT MUTASI STOK
    // -----------------------------------------

    if (movementsResult.status === 'fulfilled') {
      setStockMovements(
        Array.isArray(movementsResult.value)
          ? movementsResult.value
          : []
      );
    } else {
      console.warn(
        'Gagal memuat riwayat mutasi stok:',
        movementsResult.reason?.message
      );
    }

    // -----------------------------------------
    // DATA STOK BAHAN BAKU
    // -----------------------------------------

    if (stocksResult.status === 'fulfilled') {
      const stocks = Array.isArray(stocksResult.value)
        ? stocksResult.value
        : [];

      const movements =
        movementsResult.status === 'fulfilled' &&
          Array.isArray(movementsResult.value)
          ? movementsResult.value
          : [];

      const movementByStock = movements.reduce((acc, movement) => {
        const stockId = movement.stok_id;

        if (!acc[stockId]) {
          acc[stockId] = [];
        }

        acc[stockId].push({
          tanggal: movement.created_at,
          jumlah: Number(movement.jumlah || 0),
          jenis: movement.tipe,
          keterangan: movement.keterangan,
          pic: 'Owner',
        });

        return acc;
      }, {});

      setStockItems(
        stocks.map((r) => {
          const matchingExpense = expenseRows.find(
            (expense) =>
              (expense.fotoItem || expense.foto_item) &&
              String(expense.stok_id || '') === String(r.id)
          ) || expenseRows.find(
            (expense) =>
              (expense.fotoItem || expense.foto_item) &&
              normalizeName(
                expense.nama ||
                expense.nama_pengeluaran ||
                expense.keterangan
              ) === normalizeName(r.nama_bahan)
          );

          return {
            id: r.id,
            nama: r.nama_bahan,
            kategori: r.kategori,
            sisa: Number(r.stok || 0),
            stokAwal: Number(r.stok || 0),
            minimum: Number(r.stok_minimum || 0),
            satuan: r.satuan,
            terpakaiHariIni: 0,
            estimasiHabisHari: 0,
            hargaBeli: Number(r.harga_satuan || 0),
            hargaJual: Number(r.harga_jual || 0),

            jumlahPerPorsi:
              r.jumlah_per_porsi != null
                ? Number(r.jumlah_per_porsi)
                : null,

            foto:
              matchingExpense?.fotoItem ||
              matchingExpense?.foto_item ||
              null,

            riwayatRestok: movementByStock[r.id] || [],
          };
        })
      );
    } else {
      console.warn(
        'Gagal memuat stok Owner:',
        stocksResult.reason?.message
      );
    }
  }, []);

  // ==========================================
  // REFRESH SAAT HALAMAN OWNER DIBUKA
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      refreshOwnerData();

      if (typeof refreshData === 'function') {
        refreshData().catch((error) =>
          console.warn(
            'Gagal memuat transaksi:',
            error.message
          )
        );
      }
    }, [refreshOwnerData, refreshData])
  );

  // ==========================================
  // RESPONSIVE SIDEBAR
  // ==========================================

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // ==========================================
  // NAVIGASI
  // ==========================================

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

  // ==========================================
  // UPDATE STOK
  // ==========================================

  const handleUpdateItem = async (updatedItem) => {
    try {
      const current = stockItems.find(
        (item) => String(item.id) === String(updatedItem.id)
      );

      await updateStock(updatedItem.id, {
        nama_bahan: updatedItem.nama,
        kategori: updatedItem.kategori,
        satuan: updatedItem.satuan,
        stok_minimum: Number(updatedItem.minimum || 0),
        harga_satuan: Number(updatedItem.hargaBeli || 0),

        harga_jual: Number(
          updatedItem.hargaJual ??
          updatedItem.harga_jual ??
          current?.hargaJual ??
          0
        ),

        jumlah_per_porsi:
          updatedItem.jumlahPerPorsi ??
          updatedItem.jumlah_per_porsi ??
          current?.jumlahPerPorsi ??
          null,
      });

      if (
        current &&
        Number(current.sisa) !== Number(updatedItem.sisa)
      ) {
        await recordStockMutation({
          stok_id: updatedItem.id,
          tipe: 'penyesuaian',
          jumlah: Number(updatedItem.sisa),
          keterangan: 'Penyesuaian stok (stock opname)',
          dibuat_oleh: user?.id,
        });
      }

      await refreshOwnerData();
    } catch (error) {
      console.error(
        'Gagal memperbarui stok:',
        error.message
      );

      Alert.alert(
        'Gagal',
        'Tidak berhasil memperbarui data stok.'
      );

      throw error;
    }
  };

  // ==========================================
  // TAMBAH PENGELUARAN
  // ==========================================

  const handleAddExpense = async (newExpense) => {
    try {
      const qty = parseQuantity(newExpense.jumlah);

      const total = parseRupiah(
        newExpense.total ?? newExpense.nominal
      );

      if (qty <= 0) {
        throw new Error('Jumlah pembelian harus lebih dari 0.');
      }

      if (total <= 0) {
        throw new Error('Total pembelian harus lebih dari Rp 0.');
      }

      await createExpense(
        {
          tanggal:
            tanggalIndoKeISO(newExpense.tanggalStr) ||
            undefined,

          waktu: newExpense.waktu,
          supplier: newExpense.supplier,
          fotoItem: newExpense.fotoItem,
          fotoStruk: newExpense.fotoStruk,

          nama:
            newExpense.keterangan ||
            newExpense.nama ||
            '',

          kategori: newExpense.kategori,
          jumlah: qty,
          total,
          harga_satuan: total / qty,

          catatan: [
            `Satuan: ${newExpense.satuan || 'unit'}`,
            `Supplier: ${newExpense.supplier || '-'}`,
          ].join('; '),
        },
        user?.id
      );

      await refreshOwnerData();
    } catch (error) {
      console.error(
        'Gagal menyimpan pengeluaran:',
        error.message
      );

      throw error;
    }
  };

  // ==========================================
  // EDIT PENGELUARAN
  // ==========================================

  const handleUpdateExpense = async (updatedExpense) => {
    try {
      const qty = parseQuantity(updatedExpense.jumlah);

      const totalValue =
        updatedExpense.total !== undefined &&
          updatedExpense.total !== null
          ? updatedExpense.total
          : updatedExpense.nominal;

      const total = parseRupiah(totalValue);

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error('Jumlah pembelian harus lebih dari 0.');
      }

      if (!Number.isFinite(total) || total <= 0) {
        throw new Error('Total pembelian harus lebih dari Rp 0.');
      }

      const hargaSatuan = total / qty;

      const nama =
        updatedExpense.keterangan ||
        updatedExpense.nama ||
        updatedExpense.nama_pengeluaran ||
        '';

      if (!String(nama).trim()) {
        throw new Error('Nama pengeluaran wajib diisi.');
      }

      await updateExpense(updatedExpense.id, {
        tanggal:
          tanggalIndoKeISO(
            updatedExpense.tanggalStr || updatedExpense.tanggal
          ) || undefined,

        waktu: updatedExpense.waktu,
        supplier: updatedExpense.supplier,

        fotoItem: updatedExpense.fotoItem,
        fotoStruk: updatedExpense.fotoStruk,

        catatan: [
          `Satuan: ${updatedExpense.satuan || 'unit'}`,
          `Supplier: ${updatedExpense.supplier || '-'}`,
          updatedExpense.kategoriTopping
            ? `Subkategori: ${updatedExpense.kategoriTopping}`
            : null,
        ]
          .filter(Boolean)
          .join('; '),

        nama,
        kategori: updatedExpense.kategori || 'Lainnya',

        jumlah: qty,
        harga_satuan: hargaSatuan,

        // Total tidak dikirim langsung ke kolom database.
        // Service akan menghitung harga_satuan dari total.
        total,
      });

      await refreshOwnerData();

      Alert.alert(
        'Berhasil',
        'Pengeluaran berhasil diperbarui.'
      );
    } catch (error) {
      console.error(
        'Gagal memperbarui pengeluaran:',
        error.message
      );

      Alert.alert(
        'Gagal',
        error.message || 'Pengeluaran gagal diperbarui.'
      );

      throw error;
    }
  };

  // ==========================================
  // HAPUS PENGELUARAN
  // ==========================================

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      await refreshOwnerData();
    } catch (error) {
      console.error(
        'Gagal menghapus pengeluaran:',
        error.message
      );

      throw error;
    }
  };

  // ==========================================
  // PENERIMAAN STOK DARI PEMBELIAN
  // ==========================================

  const handleTerimaStok = async (
    expenseId,
    jumlahDiterima,
    catatan = ''
  ) => {
    try {
      const expense = expenses.find(
        (item) => String(item.id) === String(expenseId)
      );

      if (!expense) {
        Alert.alert(
          'Data Tidak Ditemukan',
          'Data pembelian tidak ditemukan.'
        );

        return false;
      }

      const namaBahan = normalizeName(
        expense.keterangan ||
        expense.namaBahan ||
        expense.nama
      );

      const satuanBeli = String(
        expense.satuan || 'unit'
      ).trim();

      const targetItem = stockItems.find(
        (item) => normalizeName(item.nama) === namaBahan
      );

      if (!targetItem) {
        Alert.alert(
          'Bahan Tidak Ditemukan',
          `Bahan "${expense.keterangan || expense.nama}" belum terdaftar di inventaris stok.`
        );

        return false;
      }

      const jumlahMasuk = parseQuantity(jumlahDiterima);

      if (jumlahMasuk <= 0) {
        Alert.alert(
          'Jumlah Tidak Valid',
          'Jumlah stok yang diterima harus lebih dari 0.'
        );

        return false;
      }

      const qtyKonversi = convertStockUnit(
        jumlahMasuk,
        satuanBeli,
        targetItem.satuan
      );

      if (qtyKonversi === null) {
        Alert.alert(
          'Satuan Tidak Sesuai',
          `Satuan pembelian (${satuanBeli}) tidak dapat dikonversi ke satuan stok (${targetItem.satuan}).`
        );

        return false;
      }

      await recordStockMutation({
        stok_id: targetItem.id,
        tipe: 'masuk',
        jumlah: Number(qtyKonversi),

        keterangan: `Restok dari ${expense.supplier || 'Pembelian'}${catatan ? ` (${catatan})` : ''
          }`,

        dibuat_oleh: user?.id,
      });

      await refreshOwnerData();

      Alert.alert(
        'Penerimaan Berhasil',
        `${jumlahMasuk} ${satuanBeli} berhasil ditambahkan ke stok.`
      );

      return true;
    } catch (error) {
      console.error(
        'Gagal menerima stok:',
        error.message
      );

      Alert.alert(
        'Error',
        'Gagal memproses penerimaan stok.'
      );

      return false;
    }
  };

  // ==========================================
  // JUDUL HEADER
  // ==========================================

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

  // ==========================================
  // TAMPILAN
  // ==========================================

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

// ==========================================
// STYLES
// ==========================================

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
