import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

import {
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentSession,
} from '../services/Authservice';

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

// Mengambil tanggal berdasarkan zona waktu perangkat.
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

// Mengambil jam berdasarkan zona waktu perangkat.
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

  // Status pembayaran dan status pesanan dipisahkan.
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

    // Status pembayaran.
    paymentStatus,

    // Status progres pesanan.
    orderStatus,
    statusPesanan: orderStatus,
    status_pesanan: orderStatus,

    // Alias untuk kompatibilitas tampilan lama.
    status: orderStatus,
  };
};

// =====================================================
// PROVIDER
// =====================================================

export function KasirProvider({ children }) {
  // =========================================
  // STATE USER DAN NAVIGASI
  // =========================================

  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('Kasir');

  const [initializing, setInitializing] = useState(true);

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
    const [menus, staff, sales] = await Promise.all([
      getMenus(),
      getCashiers(),
      getTransactions({ limit: 200 }),
    ]);

    // Data menu.
    setMenuItems(Array.isArray(menus) ? menus : []);

    // Data kasir.
    const mappedCashiers = (Array.isArray(staff) ? staff : [])
      .map(mapCashier);

    setCashiers(mappedCashiers);

    // Data transaksi.
    const mappedTransactions = (
      Array.isArray(sales) ? sales : []
    ).map(mapTransaction);

    setTransactions(mappedTransactions);

    // Pesanan Menunggu, Diproses, dan Selesai
    // tetap ditampilkan pada daftar pesanan.
    const mappedOrders = mappedTransactions.filter(
      (transaction) =>
        ORDER_LIST_STATUSES.includes(
          transaction.orderStatus
        )
    );

    setOrders(mappedOrders);

    return mappedTransactions;
  };

  // =====================================================
  // MENERAPKAN SESSION LOGIN
  // =====================================================

  const applySession = async (sessionData) => {
    if (!sessionData) {
      setUser(null);
      return;
    }

    const { user: authUser, profile } = sessionData;

    const normalizedRole =
      profile.role === 'owner' ? 'Owner' : 'Kasir';

    setUser({
      id: authUser.id,
      email: authUser.email,
      name: profile.nama,
      nama: profile.nama,
      role: normalizedRole,
    });

    setActiveTab(
      normalizedRole === 'Owner' ? 'dashboard' : 'Kasir'
    );

    await loadReferenceData();
  };

  // =====================================================
  // PEMULIHAN SESSION DAN AUTH LISTENER
  // =====================================================

  useEffect(() => {
    let mounted = true;

    getCurrentSession()
      .then(async (session) => {
        if (mounted && session) {
          await applySession(session);
        }
      })
      .catch((error) => {
        console.warn(
          'Pemulihan sesi Supabase gagal:',
          error.message
        );
      })
      .finally(() => {
        if (mounted) {
          setInitializing(false);
        }
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session && mounted) {
            setUser(null);
            setMenuItems([]);
            setCashiers([]);
            setOrders([]);
            setTransactions([]);
          }
        }
      );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (email, password) => {
    const result = await signIn(email, password);

    await applySession(result);

    return result.profile;
  };

  // =====================================================
  // LOGIN GOOGLE
  // =====================================================

  const loginGoogle = async () => {
    const result = await signInWithGoogle();

    // Pada web, halaman dapat dialihkan ke Google.
    if (!result) {
      return null;
    }

    await applySession(result);

    return result.profile;
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    await signOut();

    setUser(null);
    setCart([]);
    setOrders([]);
    setTransactions([]);
    setMenuItems([]);
    setCashiers([]);

    setActiveTab('Kasir');
  };

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

      isCashier ? user.id : null,

      user.name
    );

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

    // Tambahkan pesanan jika statusnya termasuk
    // status yang ditampilkan pada daftar pesanan.
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

    // Simpan progres pesanan ke Supabase.
    // Fungsi ini memperbarui kolom status_pesanan,
    // bukan status pembayaran.
    await updateOrderProgress(id, normalizedStatus);

    // Perbarui data transaksi di state.
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

    // Perbarui data pesanan di state.
    // Pesanan berstatus Selesai tetap ditampilkan.
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
  // TAMBAH KASIR
  // =====================================================

  const addCashier = async (values) => {
    const { createCashierAccount } = await import(
      '../services/kasirService'
    );

    const row = await createCashierAccount(values);

    setCashiers((previousCashiers) => [
      ...previousCashiers.filter(
        (item) => String(item.id) !== String(row.id)
      ),
      mapCashier(row),
    ]);

    return row;
  };

  // =====================================================
  // EDIT KASIR
  // =====================================================

  const updateCashier = async (id, values) => {
    const { updateCashier: update } = await import(
      '../services/kasirService'
    );

    const row = await update(id, values);

    setCashiers((previousCashiers) =>
      previousCashiers.map((item) =>
        String(item.id) === String(id)
          ? {
            ...item,
            ...mapCashier(row),
          }
          : item
      )
    );

    return row;
  };

  // =====================================================
  // HAPUS / NONAKTIFKAN KASIR
  // =====================================================

  const deleteCashier = async (id) => {
    const { deleteCashier: remove } = await import(
      '../services/kasirService'
    );

    await remove(id);

    setCashiers((previousCashiers) =>
      previousCashiers.map((item) =>
        String(item.id) === String(id)
          ? {
            ...item,
            status: 'nonaktif',
          }
          : item
      )
    );

    return true;
  };

  // =====================================================
  // VALUE CONTEXT
  // =====================================================

  const value = useMemo(
    () => ({
      // User dan autentikasi.
      user,
      login,
      loginGoogle,
      logout,
      initializing,

      // Refresh.
      refreshData,

      // Navigasi.
      activeTab,
      setActiveTab,

      // Data kasir.
      cashiers,
      addCashier,
      updateCashier,
      deleteCashier,

      // Data menu.
      menuItems,
      setMenuItems,

      // Keranjang.
      cart,
      setCart,
      addToCart,
      updateCartQty,
      removeFromCart,
      resetCart,
      getTotalPrice,
      getTotalItemsCount,

      // Pengaturan pesanan.
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

      // Pesanan.
      orders,
      setOrders,

      // Transaksi.
      transactions,
      setTransactions,

      // Proses transaksi.
      checkoutOrder,
      updateOrderStatus,
    }),

    [
      user,
      initializing,
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
      {children}
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
