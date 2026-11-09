import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { signIn, signOut, getCurrentSession } from '../services/authService';
import { getMenus } from '../services/menuService';
import { getCashiers } from '../services/kasirService';
import { createTransaction, getTransactions, updateTransactionStatus } from '../services/transaksiService';

const KasirContext = createContext(null);
const DEFAULT_KUAH = 'Original';
const DEFAULT_LEVEL = 3;
const DEFAULT_ORDER_TYPE = 'Dine In';

const mapTransaction = (row) => {
  const items = (row.detail_transaksi || []).map((d) => ({
    id: d.menu_id, nama: d.nama_menu, name: d.nama_menu, kategori: d.menu_topping?.kategori || 'Topping',
    harga: Number(d.harga_satuan), price: Number(d.harga_satuan), qty: Number(d.jumlah),
    subtotal: Number(d.subtotal),
  }));
  return {
    id: row.id, orderNo: row.nomor_transaksi, no: row.nomor_transaksi,
    date: row.created_at?.slice(0, 10), waktu: row.created_at,
    time: row.created_at, table: row.tipe_pesanan, tableNo: row.tipe_pesanan,
    orderType: row.tipe_pesanan, items, details: items,
    item: items.map((x) => `${x.qty}x ${x.nama}`).join(', '),
    total: Number(row.total), metode: row.metode_pembayaran, method: row.metode_pembayaran,
    cashPaid: Number(row.uang_diterima), change: Number(row.kembalian),
    kasir: row.nama_kasir, status: row.status, kuah: row.kuah,
    pedas: row.level_pedas, catatan: row.catatan,
  };
};

export function KasirProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Kasir');
  const [cashiers, setCashiers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedKuah, setSelectedKuah] = useState(DEFAULT_KUAH);
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_LEVEL);
  const [selectedOrderType, setSelectedOrderType] = useState(DEFAULT_ORDER_TYPE);
  const [catatan, setCatatan] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [initializing, setInitializing] = useState(true);

  const loadReferenceData = async () => {
    const [menus, staff, sales] = await Promise.all([
      getMenus(), getCashiers(), getTransactions({ limit: 200 }),
    ]);
    setMenuItems(menus);
    setCashiers(staff.map((x) => ({ id: x.id, name: x.nama, email: x.username, phone: x.no_telepon, status: x.status })));
    const mapped = sales.map(mapTransaction);
    setTransactions(mapped);
    setOrders(mapped.filter((x) => ['Menunggu', 'Diproses'].includes(x.status)));
  };

  const applySession = async (sessionData) => {
    if (!sessionData) { setUser(null); return; }
    const { user: authUser, profile } = sessionData;
    const normalizedRole = profile.role === 'owner' ? 'Owner' : 'Kasir';
    setUser({ id: authUser.id, email: authUser.email, name: profile.nama, nama: profile.nama, role: normalizedRole });
    setActiveTab(normalizedRole === 'Owner' ? 'dashboard' : 'Kasir');
    await loadReferenceData();
  };

  useEffect(() => {
    let mounted = true;
    getCurrentSession().then(async (session) => {
      if (mounted && session) await applySession(session);
    }).catch((error) => console.warn('Pemulihan sesi Supabase gagal:', error.message))
      .finally(() => { if (mounted) setInitializing(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) { setUser(null); setMenuItems([]); setCashiers([]); setOrders([]); setTransactions([]); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const login = async (email, password) => {
    const result = await signIn(email, password);
    await applySession(result);
    return result.profile;
  };
  const logout = async () => {
    await signOut();
    setUser(null); setCart([]); setOrders([]); setTransactions([]); setActiveTab('Kasir');
  };

  const addToCart = (item) => {
    if (!item?.id) return;
    const price = Number(item.harga ?? item.price);
    if (!Number.isFinite(price) || price < 0) return;
    setCart((prev) => {
      const found = prev.find((x) => x.id === item.id);
      return found ? prev.map((x) => x.id === item.id ? { ...x, qty: Number(x.qty || 1) + 1 } : x)
        : [...prev, { ...item, harga: price, qty: 1 }];
    });
  };
  const updateCartQty = (id, delta) => setCart((prev) => prev.map((x) => x.id === id ? { ...x, qty: Number(x.qty || 1) + Number(delta) } : x).filter((x) => x.qty > 0));
  const removeFromCart = (id) => setCart((prev) => prev.filter((x) => x.id !== id));
  const resetCart = () => { setCart([]); setSelectedKuah(DEFAULT_KUAH); setSelectedLevel(DEFAULT_LEVEL); setSelectedOrderType(DEFAULT_ORDER_TYPE); setCatatan(''); };
  const getTotalPrice = () => cart.reduce((sum, x) => sum + Number(x.harga ?? x.price ?? 0) * Number(x.qty || 1), 0);
  const getTotalItemsCount = () => cart.reduce((sum, x) => sum + Number(x.qty || 1), 0);

  const checkoutOrder = async (paymentMethod, cashAmount = 0, customData = null) => {
    if (!user?.id) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
    const sourceItems = Array.isArray(customData?.items) && customData.items.length ? customData.items : cart;
    if (!sourceItems.length) throw new Error('Keranjang masih kosong.');
    const total = sourceItems.reduce((sum, x) => sum + Number(x.harga ?? x.price ?? 0) * Number(x.qty || 1), 0);
    const isCash = ['tunai', 'cash'].includes(String(paymentMethod).toLowerCase());
    if (isCash && Number(cashAmount) < total) throw new Error('Uang pembayaran masih kurang.');
    const profileIsCashier = user.role === 'Kasir';
    const saved = await createTransaction({
      items: sourceItems, nomor_transaksi: customData?.orderNo,
      tipe_pesanan: customData?.orderType || selectedOrderType,
      kuah: customData?.kuah ?? selectedKuah,
      level_pedas: customData?.pedas ?? selectedLevel,
      catatan: customData?.catatan ?? catatan,
      metode_pembayaran: paymentMethod,
      uang_diterima: isCash ? Number(cashAmount) : total,
    }, profileIsCashier ? user.id : null, user.name);
    const mapped = mapTransaction(saved);
    setTransactions((prev) => [mapped, ...prev]);
    resetCart();
    return mapped;
  };
  const updateOrderStatus = async (id, status) => {
    const row = await updateTransactionStatus(id, status);
    const mapped = mapTransaction({ ...row, detail_transaksi: [] });
    setOrders((prev) => prev.map((x) => x.id === id ? { ...x, status } : x));
    setTransactions((prev) => prev.map((x) => x.id === id ? { ...x, status } : x));
    return mapped;
  };

  const refreshData = loadReferenceData;
  const addCashier = async (values) => { const { createCashierAccount } = await import('../services/kasirService'); const row = await createCashierAccount(values); await refreshData(); return row; };
  const updateCashier = async (id, values) => { const { updateCashier: update } = await import('../services/kasirService'); const row = await update(id, values); await refreshData(); return row; };
  const deleteCashier = async (id) => { const { deleteCashier: remove } = await import('../services/kasirService'); await remove(id); await refreshData(); };

  const value = useMemo(() => ({ user, login, logout, initializing, refreshData, activeTab, setActiveTab,
    cashiers, addCashier, updateCashier, deleteCashier, menuItems, setMenuItems,
    cart, setCart, addToCart, updateCartQty, removeFromCart, resetCart, getTotalPrice, getTotalItemsCount,
    selectedKuah, setSelectedKuah, selectedLevel, setSelectedLevel, selectedOrderType, setSelectedOrderType,
    catatan, setCatatan, activeCategory, setActiveCategory, orders, setOrders, transactions, setTransactions,
    checkoutOrder, updateOrderStatus }), [user, initializing, activeTab, cashiers, menuItems, cart, selectedKuah, selectedLevel,
      selectedOrderType, catatan, activeCategory, orders, transactions]);
  return <KasirContext.Provider value={value}>{children}</KasirContext.Provider>;
}
export function useKasir() { const context = useContext(KasirContext); if (!context) throw new Error('useKasir harus digunakan di dalam KasirProvider'); return context; }
