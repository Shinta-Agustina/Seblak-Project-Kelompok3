import React, { createContext, useContext, useState } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  INITIAL_MENU_ITEMS,
} from '../data/mockData';

const KasirContext = createContext(null);

const DEFAULT_KUAH = 'Original';
const DEFAULT_LEVEL = 3;
const DEFAULT_MEJA = 'Meja 2';

export function KasirProvider({ children }) {
  // =========================
  // USER DAN NAVIGASI
  // =========================
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Kasir');

  // Owner Menu & Harga state
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);

  // =========================
  // KERANJANG DAN PILIHAN MENU
  // =========================
  const [cart, setCart] = useState([]);
  const [selectedKuah, setSelectedKuah] = useState(DEFAULT_KUAH);
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_LEVEL);
  const [selectedMeja, setSelectedMeja] = useState(DEFAULT_MEJA);
  const [catatan, setCatatan] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // =========================
  // PESANAN DAN RIWAYAT
  // =========================
  const [orders, setOrders] = useState(INITIAL_ORDERS || []);
  const [transactions, setTransactions] = useState(
    INITIAL_TRANSACTIONS || []
  );

  // =========================
  // LOGIN DAN LOGOUT
  // =========================
  const login = (username, role = 'Kasir') => {
    const normalizedRole =
      String(role).toLowerCase() === 'owner' ? 'Owner' : 'Kasir';

    setUser({
      name:
        username ||
        (normalizedRole === 'Owner' ? 'Dewi' : 'Siti Aisyah'),
      role: normalizedRole,
      avatar:
        normalizedRole === 'Owner'
          ? {
            uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
          }
          : require('../../assets/images/avatar-kasir.png'),
    });

    setActiveTab(
      normalizedRole === 'Owner' ? 'Laporan' : 'Kasir'
    );
  };

  const logout = () => {
    setUser(null);
    setActiveTab('Kasir');
    resetCart();
  };

  // =========================
  // KERANJANG
  // =========================

  // Menambahkan topping/menu ke keranjang.
  // Item dengan ID sama akan menambah jumlah.
  const addToCart = (item) => {
    if (!item || item.id == null) {
      return;
    }

    const price = Number(item.harga ?? item.price);

    if (!Number.isFinite(price) || price < 0) {
      console.warn('Harga item tidak valid:', item);
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

  // Mengubah jumlah item.
  // Jika jumlah menjadi 0, item dihapus.
  const updateCartQty = (itemId, delta) => {
    const change = Number(delta);

    if (!Number.isFinite(change) || change === 0) {
      return;
    }

    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          const newQty = Number(item.qty || 1) + change;

          if (newQty <= 0) {
            return null;
          }

          return {
            ...item,
            qty: newQty,
          };
        })
        .filter(Boolean)
    );
  };

  // Menghapus item tertentu.
  const removeFromCart = (itemId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== itemId)
    );
  };

  // Mengosongkan keranjang dan mengembalikan pilihan ke awal.
  const resetCart = () => {
    setCart([]);
    setSelectedKuah(DEFAULT_KUAH);
    setSelectedLevel(DEFAULT_LEVEL);
    setSelectedMeja(DEFAULT_MEJA);
    setCatatan('');
  };

  // =========================
  // PERHITUNGAN TOTAL
  // =========================

  const getTotalPrice = () =>
    cart.reduce((total, item) => {
      const price = Number(item.harga ?? item.price ?? 0);
      const qty = Number(item.qty ?? 1);

      return total + price * qty;
    }, 0);

  const getTotalItemsCount = () =>
    cart.reduce(
      (total, item) => total + Number(item.qty ?? 1),
      0
    );

  // =========================
  // CHECKOUT DAN PEMBAYARAN
  // =========================
  //
  // PENTING:
  // Fungsi ini harus dipanggil setelah PaymentModal
  // mengonfirmasi pembayaran berhasil.
  //
  // Parameter:
  // paymentMethod = 'Tunai', 'QRIS', atau metode lain
  // cashAmount    = nominal uang yang diterima
  // customData    = detail pesanan dari Dashboard
  //
  const checkoutOrder = (
    paymentMethod,
    cashAmount = 0,
    customData = null
  ) => {
    // Pastikan metode pembayaran dipilih.
    if (
      typeof paymentMethod !== 'string' ||
      paymentMethod.trim() === ''
    ) {
      throw new Error('Metode pembayaran harus dipilih.');
    }

    const normalizedMethod = paymentMethod.trim();
    const isCash = ['tunai', 'cash'].includes(
      normalizedMethod.toLowerCase()
    );

    // Ambil item dari payload Dashboard atau keranjang.
    const sourceItems =
      Array.isArray(customData?.items) &&
        customData.items.length > 0
        ? customData.items
        : cart;

    if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
      throw new Error('Keranjang masih kosong.');
    }

    // Normalisasi data item untuk keranjang, transaksi, dan struk.
    const items = sourceItems.map((item) => {
      const price = Number(item.price ?? item.harga ?? 0);
      const qty = Number(item.qty ?? 1);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(
          `Harga item ${item.name || item.nama || ''} tidak valid.`
        );
      }

      if (!Number.isInteger(qty) || qty < 1) {
        throw new Error('Jumlah item harus minimal 1.');
      }

      const name = item.name || item.nama || 'Item';

      return {
        ...item,
        id: item.id,
        name,
        nama: name,
        price,
        harga: price,
        qty,
        subtotal: price * qty,
      };
    });

    // Hitung ulang dari item untuk menghindari total yang keliru.
    const total = items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    if (!Number.isFinite(total) || total <= 0) {
      throw new Error('Total pembayaran tidak valid.');
    }

    // Validasi pembayaran tunai.
    const paidAmount = Number(cashAmount ?? 0);

    if (isCash) {
      if (
        !Number.isFinite(paidAmount) ||
        paidAmount < total
      ) {
        throw new Error('Uang pembayaran masih kurang.');
      }
    }

    const change = isCash ? paidAmount - total : 0;

    // Waktu dan nomor transaksi.
    const now = new Date();

    const time = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const date = now.toLocaleDateString('id-ID');

    const orderNo =
      customData?.orderNo ||
      `TRX-${now.getTime()}`;

    const itemsSummary = items
      .map((item) => `${item.qty}x ${item.name}`)
      .join(', ');

    // Data pesanan.
    const newOrder = {
      id: orderNo,
      orderNo,
      time: customData?.time || time,
      date: customData?.date || date,
      table: customData?.tableNo || selectedMeja,
      tableNo: customData?.tableNo || selectedMeja,
      items: itemsSummary,
      details: items,
      total,
      status: 'Selesai',
      kuah: customData?.kuah ?? selectedKuah,
      pedas: customData?.pedas ?? selectedLevel,
      catatan: customData?.catatan ?? catatan,
      metode: normalizedMethod,
      method: normalizedMethod,
      cashAmount: isCash ? paidAmount : 0,
      cashPaid: isCash ? paidAmount : 0,
      change,
      kasir: customData?.kasir || user?.name || 'Kasir',
    };

    // Data transaksi untuk riwayat dan struk.
    const newTransaction = {
      id: `TRX-${now.getTime()}`,
      no: orderNo,
      orderNo,
      waktu: newOrder.time,
      time: newOrder.time,
      date: newOrder.date,
      meja: newOrder.table,
      tableNo: newOrder.table,
      item: itemsSummary,
      items,
      total,
      metode: normalizedMethod,
      method: normalizedMethod,
      cashAmount: isCash ? paidAmount : 0,
      cashPaid: isCash ? paidAmount : 0,
      change,
      kasir: newOrder.kasir,
      status: 'Lunas',
      kuah: newOrder.kuah,
      pedas: newOrder.pedas,
      catatan: newOrder.catatan,
    };

    // Simpan ke state aplikasi.
    setOrders((previousOrders) => [
      newOrder,
      ...previousOrders,
    ]);

    setTransactions((previousTransactions) => [
      newTransaction,
      ...previousTransactions,
    ]);

    // Kosongkan keranjang setelah transaksi berhasil dibuat.
    resetCart();

    // Kembalikan data agar Dashboard bisa membuka struk.
    return newTransaction;
  };

  // =========================
  // UPDATE STATUS PESANAN
  // =========================
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId || order.orderNo === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  // =========================
  // CONTEXT PROVIDER
  // =========================
  // Menu CRUD actions (Owner)
  const addMenuItem = (menuData) => {
    const newItem = {
      id: `menu-${Date.now()}`,
      nama: (menuData.nama || '').trim(),
      harga: Number(menuData.harga) || 0,
      stok: Number(menuData.stok) || 0,
      status: menuData.status || 'Aktif',
      kategori: menuData.kategori || 'Topping',
      emoji: menuData.emoji || '≡ƒìÿ',
      image: menuData.image || null,
      createdAt: new Date().toISOString(),
    };

    setMenuItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateMenuItem = (id, updatedData) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updatedData,
            nama: updatedData.nama !== undefined ? updatedData.nama.trim() : item.nama,
            harga: updatedData.harga !== undefined ? Number(updatedData.harga) : item.harga,
            stok: updatedData.stok !== undefined ? Number(updatedData.stok) : item.stok,
            status: updatedData.status !== undefined ? updatedData.status : item.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  const deleteMenuItem = (id) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetMenuItems = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
  };



  return (
    <KasirContext.Provider
      value={{
        // User dan navigasi
        user,
        login,
        logout,
        activeTab,
        setActiveTab,
        menuItems,
        setMenuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        resetMenuItems,

        // Keranjang
        cart,
        setCart,
        addToCart,
        updateCartQty,
        removeFromCart,
        resetCart,

        // Perhitungan
        getTotalPrice,
        getTotalItemsCount,

        // Pilihan pesanan
        selectedKuah,
        setSelectedKuah,
        selectedLevel,
        setSelectedLevel,
        selectedMeja,
        setSelectedMeja,
        catatan,
        setCatatan,
        activeCategory,
        setActiveCategory,

        // Pesanan dan transaksi
        orders,
        setOrders,
        transactions,
        setTransactions,
        checkoutOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </KasirContext.Provider>
  );
}

// Hook untuk mengakses context.
export function useKasir() {
  const context = useContext(KasirContext);

  if (!context) {
    throw new Error(
      'useKasir harus digunakan di dalam KasirProvider'
    );
  }

  return context;
}