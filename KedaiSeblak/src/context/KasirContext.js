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
  signOut,
  getCurrentSession,
} from '../services/Authservice';

import { getMenus } from '../services/menuService';
import { getCashiers } from '../services/kasirService';

import {
  createTransaction,
  getTransactions,
  updateOrderStatus as updateOrderStatusService,
} from '../services/transaksiService';

const KasirContext = createContext(null);

const DEFAULT_KUAH = 'Original';
const DEFAULT_LEVEL = 3;
const DEFAULT_ORDER_TYPE = 'Dine In';

// Semua status pesanan yang boleh ditampilkan
// di halaman Pesanan Aktif, termasuk yang sudah selesai.
const ORDER_LIST_STATUSES = [
  'Menunggu',
  'Diproses',
  'Selesai',
];

// Normalisasi status lama agar konsisten.
const normalizeOrderStatus = (status) => {
  if (!status) return 'Menunggu';

  if (status === 'Proses') return 'Diproses';

  if (status === 'Siap Bayar') return 'Menunggu';

  return status;
};

// Mengubah data transaksi dari Supabase
// menjadi format yang digunakan aplikasi.
const mapTransaction = (row) => {
  const items = (row.detail_transaksi || []).map((detail) => ({
    id: detail.menu_id,
    nama: detail.nama_menu,
    name: detail.nama_menu,
    kategori: detail.menu_topping?.kategori || 'Topping',
    harga: Number(detail.harga_satuan),
    price: Number(detail.harga_satuan),
    qty: Number(detail.jumlah),
    subtotal: Number(detail.subtotal),
  }));

  const paymentStatus = row.status;

  const orderStatus = normalizeOrderStatus(
    row.status_pesanan
  );

  return {
    id: row.id,

    orderNo: row.nomor_transaksi,
    no: row.nomor_transaksi,

    date: row.created_at?.slice(0, 10),
    waktu: row.created_at,
    time: row.created_at,

    table: row.tipe_pesanan,
    tableNo: row.tipe_pesanan,
    orderType: row.tipe_pesanan,

    items,
    details: items,

    item: items
      .map((item) => `${item.qty}x ${item.nama}`)
      .join(', '),

    total: Number(row.total),

    metode: row.metode_pembayaran,
    method: row.metode_pembayaran,

    cashPaid: Number(row.uang_diterima),
    change: Number(row.kembalian),

    kasir: row.nama_kasir,

    kuah: row.kuah,
    pedas: row.level_pedas,
    catatan: row.catatan,

    // Status pembayaran dan pesanan dipisahkan.
    paymentStatus,
    orderStatus,
    statusPesanan: orderStatus,
    status_pesanan: orderStatus,

    // Alias untuk tampilan lama.
    status: orderStatus,
  };
};

export function KasirProvider({ children }) {
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('Kasir');

  const [cashiers, setCashiers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [cart, setCart] = useState([]);

  const [selectedKuah, setSelectedKuah] =
    useState(DEFAULT_KUAH);

  const [selectedLevel, setSelectedLevel] =
    useState(DEFAULT_LEVEL);

  const [selectedOrderType, setSelectedOrderType] =
    useState(DEFAULT_ORDER_TYPE);

  const [catatan, setCatatan] = useState('');

  const [activeCategory, setActiveCategory] =
    useState('Semua');

  const [orders, setOrders] = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [initializing, setInitializing] = useState(true);

  // =========================================
  // LOAD DATA REFERENSI
  // =========================================

  const loadReferenceData = async () => {
    const [menus, staff, sales] = await Promise.all([
      getMenus(),
      getCashiers(),
      getTransactions({ limit: 200 }),
    ]);

    setMenuItems(menus);

    setCashiers(
      staff.map((cashier) => ({
        ...cashier,

        id: cashier.id,

        name: cashier.nama,
        email: cashier.username,
        phone: cashier.no_telepon,

        status: cashier.status,
      }))
    );

    const mappedTransactions = sales.map(mapTransaction);

    setTransactions(mappedTransactions);

    // PERBAIKAN:
    // Pesanan Menunggu, Diproses, dan Selesai
    // semuanya tetap masuk ke daftar orders.
    setOrders(
      mappedTransactions.filter((transaction) =>
        ORDER_LIST_STATUSES.includes(
          transaction.orderStatus
        )
      )
    );

    return mappedTransactions;
  };

  // =========================================
  // MENERAPKAN SESSION LOGIN
  // =========================================

  const applySession = async (sessionData) => {
    if (!sessionData) {
      setUser(null);
      return;
    }

    const {
      user: authUser,
      profile,
    } = sessionData;

    if (!authUser || !profile) {
      throw new Error(
        'Data profil pengguna tidak ditemukan.'
      );
    }

    const normalizedRole =
      profile.role === 'owner'
        ? 'Owner'
        : 'Kasir';

    setUser({
      id: authUser.id,

      email: authUser.email,

      name: profile.nama,
      nama: profile.nama,

      role: normalizedRole,
    });

    setActiveTab(
      normalizedRole === 'Owner'
        ? 'dashboard'
        : 'Kasir'
    );

    await loadReferenceData();
  };

  // =========================================
  // RESTORE SESSION
  // =========================================

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const session = await getCurrentSession();

        if (mounted && session) {
          await applySession(session);
        }
      } catch (error) {
        console.warn(
          'Pemulihan sesi Supabase gagal:',
          error.message
        );
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && mounted) {
          setUser(null);

          setMenuItems([]);
          setCashiers([]);

          setOrders([]);
          setTransactions([]);

          setCart([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================================
  // LOGIN
  // =========================================

  const login = async (email, password) => {
    const result = await signIn(email, password);

    await applySession(result);

    return result.profile;
  };

  // =========================================
  // LOGOUT
  // =========================================

  const logout = async () => {
    await signOut();

    setUser(null);

    setCart([]);

    setMenuItems([]);
    setCashiers([]);

    setOrders([]);
    setTransactions([]);

    setActiveTab('Kasir');
  };

  // =========================================
  // MENAMBAHKAN ITEM KE KERANJANG
  // =========================================

  const addToCart = (item) => {
    if (!item?.id) return;

    const price = Number(
      item.harga ?? item.price
    );

    if (!Number.isFinite(price) || price <= 0) {
      return;
    }

    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return previousCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                qty:
                  Number(cartItem.qty || 1) + 1,
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

  // =========================================
  // UPDATE JUMLAH ITEM KERANJANG
  // =========================================

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

  // =========================================
  // HAPUS ITEM KERANJANG
  // =========================================

  const removeFromCart = (id) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.id !== id
      )
    );
  };

  // =========================================
  // RESET KERANJANG
  // =========================================

  const resetCart = () => {
    setCart([]);

    setSelectedKuah(DEFAULT_KUAH);

    setSelectedLevel(DEFAULT_LEVEL);

    setSelectedOrderType(DEFAULT_ORDER_TYPE);

    setCatatan('');
  };

  // =========================================
  // TOTAL HARGA KERANJANG
  // =========================================

  const getTotalPrice = () => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.harga ?? item.price ?? 0
        ) *
          Number(item.qty || 1),
      0
    );
  };

  // =========================================
  // TOTAL JUMLAH ITEM
  // =========================================

  const getTotalItemsCount = () => {
    return cart.reduce(
      (sum, item) =>
        sum + Number(item.qty || 1),
      0
    );
  };

  // =========================================
  // CHECKOUT PESANAN
  // =========================================

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
      customData.items.length
        ? customData.items
        : cart;

    if (!sourceItems.length) {
      throw new Error(
        'Keranjang masih kosong.'
      );
    }

    const total = sourceItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.harga ?? item.price ?? 0
        ) *
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

    const savedTransaction =
      await createTransaction(
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

    const mappedTransaction =
      mapTransaction(savedTransaction);

    setTransactions((previous) => [
      mappedTransaction,

      ...previous.filter(
        (item) =>
          item.id !== mappedTransaction.id
      ),
    ]);

    // Pesanan baru tetap masuk ke daftar.
    if (
      ORDER_LIST_STATUSES.includes(
        mappedTransaction.orderStatus
      )
    ) {
      setOrders((previous) => [
        mappedTransaction,

        ...previous.filter(
          (item) =>
            item.id !== mappedTransaction.id
        ),
      ]);
    }

    resetCart();

    return mappedTransaction;
  };

  // =========================================
  // UPDATE STATUS PESANAN
  // =========================================

  const updateOrderStatus = async (id, status) => {
    if (!id) {
      throw new Error('ID pesanan tidak ditemukan.');
    }

    const allowedStatuses = [
      'Menunggu',
      'Diproses',
      'Selesai',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error('Status pesanan tidak valid.');
    }

    // Simpan status baru ke Supabase.
    const updatedRow =
      await updateOrderStatusService(id, status);

    if (!updatedRow) {
      throw new Error(
        'Data pesanan setelah diperbarui tidak ditemukan.'
      );
    }

    const mappedTransaction =
      mapTransaction(updatedRow);

    // Perbarui data transaksi.
    setTransactions((previous) => {
      const exists = previous.some(
        (item) => item.id === id
      );

      if (!exists) {
        return [
          mappedTransaction,
          ...previous,
        ];
      }

      return previous.map((item) =>
        item.id === id
          ? mappedTransaction
          : item
      );
    });

    // PERBAIKAN UTAMA:
    // Jangan menghapus pesanan ketika status Selesai.
    // Semua status tetap disimpan di orders.
    setOrders((previous) => {
      const exists = previous.some(
        (item) => item.id === id
      );

      if (exists) {
        return previous.map((item) =>
          item.id === id
            ? mappedTransaction
            : item
        );
      }

      return [
        mappedTransaction,
        ...previous,
      ];
    });

    return mappedTransaction;
  };

  // =========================================
  // REFRESH DATA
  // =========================================

  const refreshData = loadReferenceData;

  // =========================================
  // TAMBAH KASIR
  // =========================================

  const addCashier = async (values) => {
    const {
      createCashierAccount,
    } = await import(
      '../services/kasirService'
    );

    const row = await createCashierAccount(values);

    setCashiers((previous) => [
      ...previous.filter(
        (item) =>
          String(item.id) !== String(row.id)
      ),

      {
        ...row,

        id: row.id,

        name: row.nama,
        email: row.username,
        phone: row.no_telepon,

        status: row.status,
      },
    ]);

    return row;
  };

  // =========================================
  // EDIT KASIR
  // =========================================

  const updateCashier = async (id, values) => {
    const {
      updateCashier: update,
    } = await import(
      '../services/kasirService'
    );

    const row = await update(id, values);

    setCashiers((previous) =>
      previous.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              ...row,

              id: row.id,

              name: row.nama,
              email: row.username,
              phone: row.no_telepon,

              status: row.status,
            }
          : item
      )
    );

    return row;
  };

  // =========================================
  // HAPUS / NONAKTIFKAN KASIR
  // =========================================

  const deleteCashier = async (id) => {
    const {
      deleteCashier: remove,
    } = await import(
      '../services/kasirService'
    );

    await remove(id);

    setCashiers((previous) =>
      previous.map((item) =>
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

  // =========================================
  // VALUE CONTEXT
  // =========================================

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      initializing,

      refreshData,

      activeTab,
      setActiveTab,

      // Data kasir
      cashiers,
      addCashier,
      updateCashier,
      deleteCashier,

      // Data menu
      menuItems,
      setMenuItems,

      // Keranjang
      cart,
      setCart,

      addToCart,
      updateCartQty,
      removeFromCart,
      resetCart,

      getTotalPrice,
      getTotalItemsCount,

      // Pengaturan pesanan
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

      // Pesanan
      orders,
      setOrders,

      // Transaksi
      transactions,
      setTransactions,

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

  // =========================================
  // PROVIDER
  // =========================================

  return (
    <KasirContext.Provider value={value}>
      {children}
    </KasirContext.Provider>
  );
}

// =========================================
// CUSTOM HOOK
// =========================================

export function useKasir() {
  const context = useContext(KasirContext);

  if (!context) {
    throw new Error(
      'useKasir harus digunakan di dalam KasirProvider'
    );
  }

  return context;
}
