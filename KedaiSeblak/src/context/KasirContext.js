import DialogHost from '../components/DialogHost';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

import { getMenus } from '../services/menuService';
import { getCashiers } from '../services/kasirService';

import {
  createTransaction,
  getTransactions,
  updateOrderProgress,
} from '../services/transaksiService';

// =====================================================
// CONTEXT DAN KONSTANTA
// =====================================================

const KasirContext = createContext(null);

const DEFAULT_KUAH = 'Original';
const DEFAULT_LEVEL = 3;
const DEFAULT_ORDER_TYPE = 'Dine In';

const ORDER_LIST_STATUSES = [
  'Menunggu',
  'Diproses',
  'Selesai',
];

// =====================================================
// HELPER TANGGAL DAN WAKTU
// =====================================================

const pad2 = (number) => {
  return String(number).padStart(2, '0');
};

const tanggalLokal = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join('-');
};

const jamLokal = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

// =====================================================
// NORMALISASI STATUS PESANAN
// =====================================================

const normalizeOrderStatus = (status) => {
  if (!status) {
    return 'Menunggu';
  }

  const normalized = String(status).trim();

  if (normalized === 'Proses') {
    return 'Diproses';
  }

  if (normalized === 'Siap Bayar') {
    return 'Menunggu';
  }

  return normalized;
};

// =====================================================
// PEMETAAN DATA KASIR
// =====================================================

const mapCashier = (cashier) => ({
  ...cashier,
  id: cashier.id,
  name: cashier.nama || cashier.name || '',
  email: cashier.username || cashier.email || '',
  phone: cashier.no_telepon || cashier.phone || '',
  status: cashier.status,
});

// =====================================================
// PEMETAAN DATA TRANSAKSI DARI SUPABASE
// =====================================================

const mapTransaction = (row) => {
  const items = (row.detail_transaksi || []).map((detail) => ({
    id: detail.menu_id,
    nama: detail.nama_menu,
    name: detail.nama_menu,
    kategori: detail.menu_topping?.kategori || 'Topping',
    harga: Number(detail.harga_satuan || 0),
    price: Number(detail.harga_satuan || 0),
    qty: Number(detail.jumlah || 0),
    subtotal: Number(detail.subtotal || 0),
  }));

  const paymentStatus = row.status || 'Belum Bayar';

  const orderStatus = normalizeOrderStatus(
    row.status_pesanan
  );

  return {
    id: row.id,

    orderNo: row.nomor_transaksi,
    no: row.nomor_transaksi,

    date: tanggalLokal(row.created_at),
    waktu: jamLokal(row.created_at),
    time: jamLokal(row.created_at),
    createdAt: row.created_at,

    table: row.tipe_pesanan,
    tableNo: row.tipe_pesanan,
    orderType: row.tipe_pesanan,

    items,
    details: items,

    item: items
      .map((item) => `${item.qty}x ${item.nama}`)
      .join(', '),

    total: Number(row.total || 0),

    metode: row.metode_pembayaran,
    method: row.metode_pembayaran,

    cashPaid: Number(row.uang_diterima || 0),
    change: Number(row.kembalian || 0),

    kasir: row.nama_kasir,

    kuah: row.kuah,
    pedas: row.level_pedas,
    catatan: row.catatan,

    paymentStatus,

    orderStatus,
    statusPesanan: orderStatus,
    status_pesanan: orderStatus,

    status: orderStatus,
  };
};

// =====================================================
// PROVIDER
// =====================================================

export function KasirProvider({ children }) {
  // =========================================
  // INTEGRASI AUTH DARI AUTHCONTEXT
  // =========================================

  const auth = useAuth();
  const { user } = auth;

  const [activeTab, setActiveTab] = useState(
    user?.role === 'Owner' ? 'dashboard' : 'Kasir'
  );

  // =========================================
  // STATE DATA
  // =========================================

  const [cashiers, setCashiers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // =========================================
  // STATE KERANJANG
  // =========================================

  const [cart, setCart] = useState([]);

  const [selectedKuah, setSelectedKuah] = useState(
    DEFAULT_KUAH
  );

  const [selectedLevel, setSelectedLevel] = useState(
    DEFAULT_LEVEL
  );

  const [selectedOrderType, setSelectedOrderType] = useState(
    DEFAULT_ORDER_TYPE
  );

  const [catatan, setCatatan] = useState('');

  const [activeCategory, setActiveCategory] = useState('Semua');

  // =====================================================
  // MEMUAT DATA REFERENSI
  // =====================================================

  const loadReferenceData = async () => {
    try {
      const [menus, staff, sales] = await Promise.all([
        getMenus(),
        getCashiers(),
        getTransactions({ limit: 200 }),
      ]);

      setMenuItems(Array.isArray(menus) ? menus : []);

      const mappedCashiers = (Array.isArray(staff) ? staff : [])
        .map(mapCashier);

      setCashiers(mappedCashiers);

      const mappedTransactions = (
        Array.isArray(sales) ? sales : []
      ).map(mapTransaction);

      setTransactions(mappedTransactions);

      const mappedOrders = mappedTransactions.filter(
        (transaction) =>
          ORDER_LIST_STATUSES.includes(
            transaction.orderStatus
          )
      );

      setOrders(mappedOrders);

      return {
        transactions: mappedTransactions,
        cashiers: mappedCashiers,
      };
    } catch (err) {
      console.warn('Gagal memuat data referensi:', err.message);
      return { transactions: [], cashiers: [] };
    }
  };

  // Reaksi saat user login atau logout dari AuthContext
  useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'Owner' ? 'dashboard' : 'Kasir');
      loadReferenceData().catch((err) =>
        console.warn('Gagal memuat data saat user aktif:', err.message)
      );
    } else {
      setActiveTab('Kasir');
      setCart([]);
      setOrders([]);
      setTransactions([]);
      setMenuItems([]);
      setCashiers([]);
    }
  }, [user?.id, user?.role]);

  // =====================================================
  // MENAMBAHKAN ITEM KE KERANJANG
  // =====================================================

  const addToCart = (item) => {
    if (!item?.id) {
      return;
    }

    const price = Number(
      item.harga ?? item.price
    );

    if (!Number.isFinite(price) || price < 0) {
      return;
    }

    setCart((previousCart) => {
      const found = previousCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (found) {
        return previousCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
              ...cartItem,
              qty: Number(cartItem.qty || 1) + 1,
            }
            : cartItem
        );
      }

      return [
        ...previousCart,
        {
          ...item,
          harga: price,
          qty: 1,
        },
      ];
    });
  };

  // =====================================================
  // UPDATE JUMLAH ITEM KERANJANG
  // =====================================================

  const updateCartQty = (id, delta) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === id
            ? {
              ...item,
              qty:
                Number(item.qty || 1) +
                Number(delta),
            }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // =====================================================
  // HAPUS ITEM KERANJANG
  // =====================================================

  const removeFromCart = (id) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.id !== id
      )
    );
  };

  // =====================================================
  // RESET KERANJANG
  // =====================================================

  const resetCart = () => {
    setCart([]);

    setSelectedKuah(DEFAULT_KUAH);
    setSelectedLevel(DEFAULT_LEVEL);
    setSelectedOrderType(DEFAULT_ORDER_TYPE);

    setCatatan('');
  };

  // =====================================================
  // TOTAL HARGA KERANJANG
  // =====================================================

  const getTotalPrice = () => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.harga ?? item.price ?? 0) *
        Number(item.qty || 1),
      0
    );
  };

  // =====================================================
  // TOTAL JUMLAH ITEM
  // =====================================================

  const getTotalItemsCount = () => {
    return cart.reduce(
      (sum, item) =>
        sum + Number(item.qty || 1),
      0
    );
  };

  // =====================================================
  // CHECKOUT PESANAN
  // =====================================================

  const checkoutOrder = async (
    paymentMethod,
    cashAmount = 0,
    customData = null
  ) => {
    if (!user?.id) {
      throw new Error(
        'Sesi login tidak ditemukan. Silakan login kembali.'
      );
    }

    const sourceItems =
      Array.isArray(customData?.items) &&
        customData.items.length > 0
        ? customData.items
        : cart;

    if (!sourceItems.length) {
      throw new Error('Keranjang masih kosong.');
    }

    const total = sourceItems.reduce(
      (sum, item) =>
        sum +
        Number(item.harga ?? item.price ?? 0) *
        Number(item.qty || 1),
      0
    );

    const isCash = [
      'tunai',
      'cash',
    ].includes(
      String(paymentMethod).toLowerCase()
    );

    if (isCash && Number(cashAmount) < total) {
      throw new Error(
        'Uang pembayaran masih kurang.'
      );
    }

    const isCashier = user.role === 'Kasir';

    // Pastikan ID kasir benar-benar ditemukan.
    // Jangan mengirim ID Supabase Auth sebagai kasir_id.
    if (isCashier && !user.kasirId) {
      throw new Error(
        'Data akun kasir tidak ditemukan. Pastikan username login sama dengan username pada data kasir, lalu login ulang.'
      );
    }

    // Simpan transaksi ke Supabase.
    const savedTransaction = await createTransaction(
      {
        items: sourceItems,

        nomor_transaksi: customData?.orderNo,

        tipe_pesanan:
          customData?.orderType ||
          selectedOrderType,

        kuah:
          customData?.kuah ?? selectedKuah,

        level_pedas:
          customData?.pedas ?? selectedLevel,

        catatan:
          customData?.catatan ?? catatan,

        metode_pembayaran: paymentMethod,

        uang_diterima: isCash
          ? Number(cashAmount)
          : total,
      },

      // Gunakan ID dari tabel kasir.
      isCashier ? user.kasirId : null,

      user.name
    );

    if (!savedTransaction?.id) {
      throw new Error(
        'Transaksi tidak berhasil disimpan. Data transaksi dari server tidak ditemukan.'
      );
    }

    const mappedTransaction = mapTransaction(
      savedTransaction
    );

    // Perbarui daftar transaksi.
    setTransactions((previousTransactions) => [
      mappedTransaction,

      ...previousTransactions.filter(
        (item) => item.id !== mappedTransaction.id
      ),
    ]);

    // Tambahkan pesanan ke Pesanan Aktif.
    if (
      ORDER_LIST_STATUSES.includes(
        mappedTransaction.orderStatus
      )
    ) {
      setOrders((previousOrders) => [
        mappedTransaction,

        ...previousOrders.filter(
          (item) => item.id !== mappedTransaction.id
        ),
      ]);
    }

    resetCart();

    return mappedTransaction;
  };

  // =====================================================
  // UPDATE STATUS PESANAN
  // =====================================================

  const updateOrderStatus = async (id, status) => {
    if (!id) {
      throw new Error(
        'ID pesanan tidak ditemukan.'
      );
    }

    const normalizedStatus = normalizeOrderStatus(status);

    if (
      !ORDER_LIST_STATUSES.includes(normalizedStatus)
    ) {
      throw new Error(
        'Status pesanan tidak valid.'
      );
    }

    await updateOrderProgress(id, normalizedStatus);

    setTransactions((previousTransactions) =>
      previousTransactions.map((item) =>
        item.id === id
          ? {
            ...item,
            orderStatus: normalizedStatus,
            statusPesanan: normalizedStatus,
            status_pesanan: normalizedStatus,
            status: normalizedStatus,
          }
          : item
      )
    );

    setOrders((previousOrders) => {
      const exists = previousOrders.some(
        (item) => item.id === id
      );

      if (exists) {
        return previousOrders.map((item) =>
          item.id === id
            ? {
              ...item,
              orderStatus: normalizedStatus,
              statusPesanan: normalizedStatus,
              status_pesanan: normalizedStatus,
              status: normalizedStatus,
            }
            : item
        );
      }

      const transaction = transactions.find(
        (item) => item.id === id
      );

      if (!transaction) {
        return previousOrders;
      }

      return [
        {
          ...transaction,
          orderStatus: normalizedStatus,
          statusPesanan: normalizedStatus,
          status_pesanan: normalizedStatus,
          status: normalizedStatus,
        },
        ...previousOrders,
      ];
    });

    return {
      id,
      status: normalizedStatus,
    };
  };

  // =====================================================
  // REFRESH DATA
  // =====================================================

  const refreshData = loadReferenceData;

  // =====================================================
  // MANAJEMEN KASIR & AUTH (DIDELEGASIKAN KE AUTHCONTEXT)
  // =====================================================

  const addCashier = auth.addCashier;
  const updateCashier = auth.updateCashier;
  const deleteCashier = auth.deleteCashier;
  const login = auth.login;
  const loginGoogle = auth.loginGoogle;
  const logout = auth.logout;
  const initializing = auth.initializing;

  // =====================================================
  // VALUE CONTEXT
  // =====================================================

  const value = useMemo(
    () => ({
      user,
      profile: auth.profile,
      login,
      loginGoogle,
      logout,
      initializing,

      refreshData,

      activeTab,
      setActiveTab,

      cashiers: auth.cashiers && auth.cashiers.length > 0 ? auth.cashiers : cashiers,
      addCashier,
      updateCashier,
      deleteCashier,

      menuItems,
      setMenuItems,

      cart,
      setCart,
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

      selectedOrderType,
      setSelectedOrderType,

      catatan,
      setCatatan,

      activeCategory,
      setActiveCategory,

      orders,
      setOrders,

      transactions,
      setTransactions,

      checkoutOrder,
      updateOrderStatus,
    }),

    [
      user,
      auth.profile,
      auth.cashiers,
      auth.addCashier,
      auth.updateCashier,
      auth.deleteCashier,
      auth.login,
      auth.loginGoogle,
      auth.logout,
      auth.initializing,
      activeTab,
      cashiers,
      menuItems,
      cart,
      selectedKuah,
      selectedLevel,
      selectedOrderType,
      catatan,
      activeCategory,
      orders,
      transactions,
    ]
  );

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <KasirContext.Provider value={value}>
      {children}<DialogHost />
    </KasirContext.Provider>
  );
}

// =====================================================
// CUSTOM HOOK
// =====================================================

export function useKasir() {
  const context = useContext(KasirContext);

  if (!context) {
    throw new Error(
      'useKasir harus digunakan di dalam KasirProvider'
    );
  }

  return context;
}
