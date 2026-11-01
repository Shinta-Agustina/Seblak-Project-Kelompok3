import React, { createContext, useContext, useState } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  INITIAL_MENU_ITEMS,
} from '../data/mockData';

const KasirContext = createContext(null);

const DEFAULT_KUAH = 'Original';
const DEFAULT_LEVEL = 3;
const DEFAULT_ORDER_TYPE = 'Dine In';

export function KasirProvider({ children }) {
  // =========================
  // USER, NAVIGASI, & MANAJEMEN KASIR
  // =========================
  // Nilai awal user diatur ke null agar setiap refresh/buka aplikasi selalu wajib login
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Kasir');

  // State global daftar kasir
  const [cashiers, setCashiers] = useState([
    { id: '1', name: 'Siti Aisyah', email: 'siti@kedaiseblak.com', phone: '081234567890', password: '123', status: 'Aktif' },
    { id: '2', name: 'Rini Wulandari', email: 'rini@kedaiseblak.com', phone: '089876543210', password: '123', status: 'Aktif' },
  ]);

  // ❌ BLOK useEffect PENGECEKAN localStorage SAAT REFRESH TELAH DIHAPUS
  // Ini memastikan setiap kali Anda menjalankan npm run web / refresh, user kembali null (wajib login).

  const addCashier = (newCashierData) => {
    const newCashier = {
      id: Date.now().toString(),
      name: newCashierData.name,
      email: newCashierData.email,
      phone: newCashierData.phone || '-',
      password: newCashierData.password,
      status: 'Aktif',
    };
    setCashiers((prev) => [...prev, newCashier]);
    return newCashier;
  };

  // Fungsi Edit Kasir (Nama, Email, Telepon, Password)
  const updateCashier = (id, updatedData) => {
    setCashiers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updatedData,
            name: updatedData.name !== undefined ? updatedData.name.trim() : item.name,
            email: updatedData.email !== undefined ? updatedData.email.trim() : item.email,
            phone: updatedData.phone !== undefined ? updatedData.phone.trim() : item.phone,
            password: updatedData.password !== undefined && updatedData.password !== '' ? updatedData.password : item.password,
          };
        }
        return item;
      })
    );
  };

  const deleteCashier = (id) => {
    setCashiers((prev) => prev.filter((item) => item.id !== id));
  };

  // Owner Menu & Harga state
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);

  // =========================
  // KERANJANG DAN PILIHAN MENU
  // =========================
  const [cart, setCart] = useState([]);
  const [selectedKuah, setSelectedKuah] = useState(DEFAULT_KUAH);
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_LEVEL);
  const [selectedOrderType, setSelectedOrderType] = useState(DEFAULT_ORDER_TYPE);
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
  const login = (identifier, password = '', role = 'Kasir') => {
    const normalizedRole =
      String(role).toLowerCase() === 'owner' ? 'Owner' : 'Kasir';

    let loggedInUser = null;

    if (normalizedRole === 'Kasir') {
      const foundCashier = cashiers.find(
        (c) => c.email.toLowerCase() === identifier.toLowerCase() || c.name.toLowerCase() === identifier.toLowerCase()
      );

      if (!foundCashier) {
        throw new Error('Akun kasir tidak ditemukan atau belum didaftarkan oleh Owner.');
      }
      if (foundCashier.password && foundCashier.password !== password) {
        throw new Error('Password kasir salah!');
      }

      loggedInUser = {
        name: foundCashier.name,
        role: 'Kasir',
        avatar: require('../../assets/images/avatar-kasir.png'),
      };
      setUser(loggedInUser);
      setActiveTab('Kasir');
    } else {
      loggedInUser = {
        name: identifier || 'Dewi',
        role: 'Owner',
        avatar: {
          uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        },
      };

      setUser(loggedInUser);
      setActiveTab('dashboard');
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      if (normalizedRole === 'Kasir') {
        localStorage.setItem('activeCashierLogin', loggedInUser.name);
      } else {
        localStorage.removeItem('activeCashierLogin');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setActiveTab('Kasir');
    resetCart();

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('activeCashierLogin');
    }
  };

  // =========================
  // KERANJANG
  // =========================
  const addToCart = (item) => {
    if (!item || item.id == null) {
      return;
    }

    const price = Number(item.harga ?? item.price);

    if (!Number.isFinite(price) || price < 0) {
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

  const removeFromCart = (itemId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== itemId)
    );
  };

  const resetCart = () => {
    setCart([]);
    setSelectedKuah(DEFAULT_KUAH);
    setSelectedLevel(DEFAULT_LEVEL);
    setSelectedOrderType(DEFAULT_ORDER_TYPE);
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
  const checkoutOrder = (
    paymentMethod,
    cashAmount = 0,
    customData = null
  ) => {
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

    const sourceItems =
      Array.isArray(customData?.items) &&
      customData.items.length > 0
        ? customData.items
        : cart;

    if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
      throw new Error('Keranjang masih kosong.');
    }

    const items = sourceItems.map((item) => {
      const price = Number(item.price ?? item.harga ?? 0);
      const qty = Number(item.qty ?? 1);

      return {
        ...item,
        id: item.id,
        name: item.name || item.nama || 'Item',
        nama: item.name || item.nama || 'Item',
        price,
        harga: price,
        qty,
        subtotal: price * qty,
      };
    });

    const total = items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const paidAmount = Number(cashAmount ?? 0);

    if (isCash && paidAmount < total) {
      throw new Error('Uang pembayaran masih kurang.');
    }

    const change = isCash ? paidAmount - total : 0;
    const now = new Date();

    const time = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const date = now.toLocaleDateString('id-ID');
    const orderNo = customData?.orderNo || `TRX-${now.getTime()}`;
    const itemsSummary = items
      .map((item) => `${item.qty}x ${item.name}`)
      .join(', ');

    const orderTypeVal = customData?.orderType || selectedOrderType;

    const newOrder = {
      id: orderNo,
      orderNo,
      time: customData?.time || time,
      date: customData?.date || date,
      table: orderTypeVal,
      tableNo: orderTypeVal,
      orderType: orderTypeVal,
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

    const newTransaction = {
      id: `TRX-${now.getTime()}`,
      no: orderNo,
      orderNo,
      waktu: newOrder.time,
      time: newOrder.time,
      date: newOrder.date,
      meja: orderTypeVal,
      tableNo: orderTypeVal,
      orderType: orderTypeVal,
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

    setOrders((previousOrders) => [
      newOrder,
      ...previousOrders,
    ]);

    setTransactions((previousTransactions) => [
      newTransaction,
      ...previousTransactions,
    ]);

    resetCart();
    return newTransaction;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId || order.orderNo === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  // Menu CRUD actions (Owner)
  const addMenuItem = (menuData) => {
    const newItem = {
      id: `menu-${Date.now()}`,
      nama: (menuData.nama || '').trim(),
      harga: Number(menuData.harga) || 0,
      stok: Number(menuData.stok) || 0,
      status: menuData.status || 'Aktif',
      kategori: menuData.kategori || 'Topping',
      emoji: menuData.emoji || '🥘',
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
        user,
        login,
        logout,
        activeTab,
        setActiveTab,
        cashiers,
        addCashier,
        updateCashier,
        deleteCashier,
        menuItems,
        setMenuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        resetMenuItems,
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
      }}
    >
      {children}
    </KasirContext.Provider>
  );
}

export function useKasir() {
  const context = useContext(KasirContext);

  if (!context) {
    throw new Error(
      'useKasir harus digunakan di dalam KasirProvider'
    );
  }

  return context;
}