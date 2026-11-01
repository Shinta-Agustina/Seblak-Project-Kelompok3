// src/screens/Owner/PengeluaranScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INITIAL_EXPENSES, INITIAL_STOCK_ITEMS } from '../../data/mockDataOwner';
import RestockModal from '../../components/owner/RestockModal';

export default function PengeluaranScreen() {
  // STATE APLIKASI (TIRUAN DATABASE)
  const [stockItems, setStockItems] = useState(INITIAL_STOCK_ITEMS);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter State (Demo: kita set default ke 16 Oktober 2026 sesuai dummy data kita)
  const [currentFilterDate, setCurrentFilterDate] = useState('2026-10-16');

  // --- LOGIKA BISNIS DI FRONTEND ---

  // 1. Hitung Total Pengeluaran Harian (HPP + Operasional)
  const totalHarian = useMemo(() => {
    return expenses
      .filter(item => item.tanggal === currentFilterDate)
      .reduce((sum, item) => sum + item.total, 0);
  }, [expenses, currentFilterDate]);

  // 2. Ambil daftar expense untuk ditampilkan
  const displayedExpenses = useMemo(() => {
      return expenses
        .filter(item => item.tanggal === currentFilterDate)
        .sort((a,b) => b.waktu.localeCompare(a.waktu)); // Urutkan waktu terbaru
  }, [expenses, currentFilterDate]);

  // 3. Callback: Simpan Expense Baru ke State
  const handleAddNewExpense = (newExpense) => {
    setExpenses(prev => [newExpense, ...prev]);
  };

  // 4. Callback: Update Stok Saat Restock (Dipanggil oleh RestockModal)
  const handleUpdateStockAfterRestock = (bahanId, newSisa, newModal, newHargaRata) => {
      setStockItems(prev => prev.map(item => {
          if(item.id === bahanId) {
              return {
                  ...item,
                  sisa: newSisa,
                  modalTertanam: newModal,
                  hargaBeliSatuanTerakhir: newHargaRata // Update harga rata-rata
              };
          }
          return item;
      }));
  };

  // --- RENDER ITEM (Baris Pengeluaran) ---
  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, { backgroundColor: item.kategori === 'Operasional' ? '#FEF3C7' : '#DCFCE7' }]}>
          <Ionicons name={item.kategori === 'Operasional' ? 'briefcase-outline' : 'cart-outline'} size={20} color={item.kategori === 'Operasional' ? '#D97706' : '#168653'} />
        </View>
        <View>
          <Text style={styles.itemKeterangan}>{item.keterangan}</Text>
          <Text style={styles.itemMeta}>{item.waktu} WIB • {item.pic}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.itemTotal}>-Rp {item.total.toLocaleString('id-ID')}</Text>
        <Text style={styles.itemJumlah}>{item.jumlah} {item.satuan}</Text>
      </View>
    </View>
  );

  // --- TAMPILAN ---
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
            <Text style={styles.pageTitle}>Arus Kas Keluar</Text>
            {/* Simulasi Date Picker (di real app pakai library calendar) */}
            <Text style={styles.pageSubtitle}>Data Harian: 16 Oktober 2026 (Dummy)</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Restock / Biaya</Text>
        </TouchableOpacity>
      </View>

      {/* Total Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Pengeluaran Hari Ini</Text>
        <Text style={styles.totalValue}>Rp {totalHarian.toLocaleString('id-ID')}</Text>
      </View>

      {/* Daftar Pengeluaran */}
      <FlatList
        data={displayedExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingBottom: 20}}
        ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
                <Ionicons name="document-text-outline" size={40} color="#D1C7BD" />
                <Text style={styles.emptyText}>Tidak ada pengeluaran tercatat pada tanggal ini.</Text>
            </View>
        )}
      />

      {/* Modal Input Restock/Expense */}
      <RestockModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaveExpense={handleAddNewExpense}
        onRestockSuccess={handleUpdateStockAfterRestock}
        currentStockItems={stockItems}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5F2', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 },
  pageTitle: { fontSize: 20, fontWeight: '900', color: '#2C1810', letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 11, color: '#78665E', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#C62828', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, elevation: 3 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  totalCard: { backgroundColor: '#52141D', padding: 16, borderRadius: 16, marginBottom: 16, alignItems: 'center', elevation: 4 },
  totalLabel: { fontSize: 12, color: '#FBEAEC', marginBottom: 4, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  expenseCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EFE7E2' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  itemKeterangan: { fontSize: 13, fontWeight: '700', color: '#2C1810', marginBottom: 2 },
  itemMeta: { fontSize: 10, color: '#78665E' },
  cardRight: { alignItems: 'flex-end' },
  itemTotal: { fontSize: 13, fontWeight: '700', color: '#C62828' },
  itemJumlah: { fontSize: 10, color: '#78665E', marginTop: 1 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 10 },
  emptyText: { color: '#A89A92', fontSize: 12, fontStyle: 'italic' },
});