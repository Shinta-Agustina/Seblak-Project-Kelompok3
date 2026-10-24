import React, { createContext, useContext, useState } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  TOPPING_ITEMS,
} from '../data/mockData';

const KasirContext = createContext();

export function KasirProvider({ children }) {
  // Auth state - null by default to show Login screen, with quick 1-click entry
  const [user, setUser] = useState(null);

  // Active navigation tab: 'Kasir', 'Pesanan Aktif', 'Riwayat Transaksi', 'Laporan'
  const [activeTab, setActiveTab] = useState('Kasir');

  // POS Order builder state - pre-populated with items matching reference screen
  const [cart, setCart] = useState([
    { id: 'top-1', nama: 'Kerupuk', harga: 1000, berat: '100 gr', emoji: '🍘', qty: 1 },
    { id: 'top-2', nama: 'Makaroni', harga: 500,  berat: '50 gr',  emoji: '🍝', qty: 1 },
    { id: 'top-3', nama: 'Sosis',    harga: 1000, berat: '50 gr',  emoji: '🌭', qty: 1 },
    { id: 'top-4', nama: 'Bakso',    harga: 1000, berat: '50 gr',  emoji: '🧆', qty: 1 },
    { id: 'top-5', nama: 'Ceker',    harga: 1000, berat: '50 gr',  emoji: '🍗', qty: 1 },
  ]);

  const [selectedKuah, setSelectedKuah] = useState('Original');
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [selectedMeja, setSelectedMeja] = useState('Meja 2');
  const [catatan, setCatatan] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // Orders and history state
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Auth actions
  const login = (username, role = 'Kasir') => {
    const isOwner = role === 'Owner';
    setUser({
      name: username || (isOwner ? 'Dewi' : 'Siti Aisyah'),
      role: role || 'Kasir',
      avatar: isOwner
        ? { uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' }
        : require('../../assets/images/avatar-kasir.png'),
    });
    if (isOwner) {
      setActiveTab('Laporan');
    } else {
      setActiveTab('Kasir');
    }
  };

  const logout = () => {
    setUser(null);
    resetCart();
  };

  // Cart actions
  const addToCart = (topping) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === topping.id);
      if (existing) {
        return prev.map((item) =>
          item.id === topping.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...topping, qty: 1 }];
    });
  };

  const updateCartQty = (toppingId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === toppingId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (toppingId) => {
    setCart((prev) => prev.filter((item) => item.id !== toppingId));
  };

  const resetCart = () => {
    setCart([]);
    setSelectedKuah('Original');
    setSelectedLevel(3);
    setCatatan('');
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  };

  const getTotalItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  };

  // Create new order & transaction
  const checkoutOrder = (paymentMethod, cashAmount = 0, customData = null) => {
    const total = customData?.total ?? getTotalPrice();
    const orderNum = customData?.orderNo || `#00${orders.length + 1}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`;

    const itemsSummary = customData?.items
      ? customData.items.map((i) => `${i.qty || 1}x ${i.nama || i.name}`).join(', ')
      : cart.map((item) => `${item.qty}x ${item.nama}`).join(', ');

    const newOrder = {
      id: orderNum,
      time: timeStr,
      date: dateStr,
      table: customData?.tableNo || selectedMeja,
      items: itemsSummary || '1 Paket Seblak',
      total: total,
      status: 'Selesai',
      details: customData?.items || [...cart],
      kuah: selectedKuah,
      pedas: selectedLevel,
      catatan: catatan,
      metode: paymentMethod,
      cashAmount: cashAmount,
      change: Math.max(0, cashAmount - total),
      kasir: user?.name || 'Siti Aisyah',
    };

    setOrders((prev) => [newOrder, ...prev]);

    const newTrx = {
      id: `#TRX-${Date.now().toString().slice(-4)}`,
      no: orderNum,
      waktu: timeStr,
      date: dateStr,
      meja: customData?.tableNo || selectedMeja,
      item: itemsSummary || '1 Paket Seblak',
      total: total,
      metode: paymentMethod,
      kasir: user?.name || 'Siti Aisyah',
      status: 'Lunas',
    };

    setTransactions((prev) => [newTrx, ...prev]);

    resetCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <KasirContext.Provider
      value={{
        user,
        login,
        logout,
        activeTab,
        setActiveTab,
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
        selectedMeja,
        setSelectedMeja,
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
    throw new Error('useKasir harus digunakan di dalam KasirProvider');
  }
  return context;
}
