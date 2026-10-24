import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '../StatCard';
import FilterChips from '../FilterChips';

const KATEGORI_BAHAN = [
  'Kerupuk & Makaroni',
  'Frozen & Daging',
  'Bumbu & Cabe',
  'Telur',
];

export default function TabPengeluaran({
  expenses = [],
  onAddExpense,
  onDeleteExpense,
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Kerupuk & Makaroni');
  const [supplier, setSupplier] = useState('');
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState('Tunai');
  const [errorMsg, setErrorMsg] = useState('');

  // Hitung Ringkasan Modal Belanja
  const totalModalHariIni = useMemo(() => {
    return expenses
      .filter((e) => e.tanggal === '24 Okt 2026')
      .reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  }, [expenses]);

  const totalItemHariIni = useMemo(() => {
    return expenses.filter((e) => e.tanggal === '24 Okt 2026').length;
  }, [expenses]);

  const rataRataBelanja = totalItemHariIni > 0 ? Math.round(totalModalHariIni / totalItemHariIni) : 0;

  // Filter Data
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchCategory =
        selectedCategory === 'Semua' || item.kategori === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.keterangan.toLowerCase().includes(query) ||
        (item.supplier && item.supplier.toLowerCase().includes(query)) ||
        (item.metode && item.metode.toLowerCase().includes(query));

      return matchCategory && matchSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  const categoryOptions = [
    { id: 'Semua', label: 'Semua Topping' },
    { id: 'Kerupuk & Makaroni', label: 'Kerupuk & Makaroni' },
    { id: 'Frozen & Daging', label: 'Frozen & Daging' },
    { id: 'Bumbu & Cabe', label: 'Bumbu & Cabe' },
    { id: 'Telur', label: 'Telur' },
  ];

  // Simpan Pengeluaran Belanja Topping Baru
  const handleSave = () => {
    if (!keterangan.trim()) {
      setErrorMsg('Nama bahan / topping wajib diisi!');
      return;
    }
    const nominalNum = parseFloat(nominal);
    if (!nominal || isNaN(nominalNum) || nominalNum <= 0) {
      setErrorMsg('Masukkan nominal modal belanja yang valid!');
      return;
    }

    const newExpense = {
      id: `MODAL-${Date.now().toString().slice(-4)}`,
      tanggal: '24 Okt 2026',
      waktu: 'Baru saja',
      keterangan: keterangan.trim(),
      kategori,
      supplier: supplier.trim() || 'Pasar Tradisional',
      nominal: nominalNum,
      metode,
      pic: 'Dewi (Owner)',
    };

    onAddExpense(newExpense);
    setKeterangan('');
    setSupplier('');
    setNominal('');
    setErrorMsg('');
    setIsModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Halaman */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Modal Belanja Bahan Baku (Topping)</Text>
          <Text style={styles.pageSubtitle}>
            Catatan modal uang keluar owner untuk belanja stok topping, ceker, bumbu, dan kuah
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="cart" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>+ Catat Belanja Bahan</Text>
        </TouchableOpacity>
      </View>

      {/* 3 KARTU RINGKASAN MODAL BELANJA */}
      <View style={styles.summaryGrid}>
        <StatCard
          title="Modal Belanja Hari Ini"
          value={`Rp ${totalModalHariIni.toLocaleString('id-ID')}`}
          subtitle={`${totalItemHariIni} kali transaksi belanja bahan`}
          iconName="cash-outline"
          iconColor="#DC2626"
          iconBg="#FEE2E2"
        />

        <StatCard
          title="Bahan Terbelanja"
          value={`${totalItemHariIni} Item`}
          subtitle="Restok topping & bumbu hari ini"
          iconName="cube-outline"
          iconColor="#C62828"
          iconBg="#FBEAEC"
        />

        <StatCard
          title="Rata-rata / Belanja"
          value={`Rp ${rataRataBelanja.toLocaleString('id-ID')}`}
          subtitle="Rata-rata per nota supplier"
          iconName="calculator-outline"
          iconColor="#D97706"
          iconBg="#FEF3C7"
        />
      </View>

      {/* PENCARIAN & FILTER KATEGORI */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#8D7B70" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama topping, bahan, atau supplier..."
            placeholderTextColor="#A89A92"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#A89A92" />
            </TouchableOpacity>
          )}
        </View>

        <FilterChips
          options={categoryOptions}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          accentColor="#C62828"
          scrollable={true}
        />
      </View>

      {/* DAFTAR RIWAYAT MODAL BELANJA BAHAN */}
      <View style={styles.listCard}>
        <View style={styles.listMetaRow}>
          <Text style={styles.listCount}>
            Menampilkan <Text style={{ fontWeight: '800' }}>{filteredExpenses.length}</Text> nota belanja bahan baku
          </Text>
          <Text style={styles.listDate}>Data riil modal seblak</Text>
        </View>

        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              <View style={styles.itemLeft}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemKategoriBadge}>{item.kategori}</Text>
                  <Text style={styles.itemDate}>
                    {item.tanggal} · {item.waktu}
                  </Text>
                </View>

                <Text style={styles.itemKeterangan}>{item.keterangan}</Text>

                <View style={styles.itemFooterRow}>
                  <Text style={styles.itemSupplier}>
                    Supplier: <Text style={{ fontWeight: '700', color: '#2C1810' }}>{item.supplier || 'Pasar Tradisional'}</Text>
                  </Text>
                  <Text style={styles.itemPayment}>Metode: {item.metode}</Text>
                </View>
              </View>

              <View style={styles.itemRight}>
                <Text style={styles.itemNominal}>
                  -Rp {item.nominal.toLocaleString('id-ID')}
                </Text>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDeleteExpense(item.id)}
                  activeOpacity={0.7}
                  accessibilityLabel="Hapus catatan"
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={38} color="#C4B8B0" />
              <Text style={styles.emptyText}>Tidak ada catatan belanja bahan yang cocok.</Text>
            </View>
          }
        />
      </View>

      {/* MODAL CATAT BELANJA BAHAN BAKU BARU */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Catat Belanja Modal Bahan Baku</Text>
                <Text style={styles.modalSubtitle}>Uang keluar untuk belanja topping & bumbu seblak</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#78665E" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {errorMsg ? <Text style={styles.modalError}>{errorMsg}</Text> : null}

              {/* Keterangan Bahan */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nama Bahan / Topping yang Dibeli *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Belanja Kerupuk Mawar (15 kg) / Dumpling Keju"
                  placeholderTextColor="#A89A92"
                  value={keterangan}
                  onChangeText={(val) => {
                    setKeterangan(val);
                    setErrorMsg('');
                  }}
                />
              </View>

              {/* Kategori Bahan */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Kategori Bahan</Text>
                <View style={styles.pillsRow}>
                  {KATEGORI_BAHAN.map((kat) => (
                    <TouchableOpacity
                      key={kat}
                      style={[
                        styles.pill,
                        kategori === kat && styles.pillActive,
                      ]}
                      onPress={() => setKategori(kat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          kategori === kat && styles.pillTextActive,
                        ]}
                      >
                        {kat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Supplier */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nama Toko / Supplier</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Juragan Kerupuk Barokah / Pasar Induk"
                  placeholderTextColor="#A89A92"
                  value={supplier}
                  onChangeText={setSupplier}
                />
              </View>

              {/* Nominal Modal */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Total Modal yang Keluar (Rp) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 330000"
                  placeholderTextColor="#A89A92"
                  keyboardType="numeric"
                  value={nominal}
                  onChangeText={(val) => {
                    setNominal(val);
                    setErrorMsg('');
                  }}
                />
              </View>

              {/* Metode Bayar */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Metode Pembayaran</Text>
                <View style={styles.pillsRow}>
                  {['Tunai', 'Transfer', 'QRIS'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.satuanPill,
                        metode === m && styles.satuanPillActive,
                      ]}
                      onPress={() => setMetode(m)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.satuanText,
                          metode === m && styles.satuanTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveText}>Simpan Modal Belanja</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  headerTitles: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#78665E',
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C62828',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  filterSection: {
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    shadowColor: '#3D2922',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEB',
  },
  listCount: {
    fontSize: 12,
    color: '#78665E',
  },
  listDate: {
    fontSize: 11,
    color: '#A89A92',
    fontStyle: 'italic',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  itemLeft: {
    flex: 1,
    marginRight: 14,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemKategoriBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C62828',
    backgroundColor: '#FBEAEC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDate: {
    fontSize: 11,
    color: '#8D7B70',
  },
  itemKeterangan: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 6,
  },
  itemFooterRow: {
    flexDirection: 'row',
    gap: 14,
  },
  itemSupplier: {
    fontSize: 11,
    color: '#78665E',
  },
  itemPayment: {
    fontSize: 11,
    color: '#78665E',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemNominal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#8D7B70',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C1810',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#78665E',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
  },
  modalBody: {
    gap: 12,
  },
  modalError: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  fieldWrap: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  textInput: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#2C1810',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  pillActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#523C34',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  satuanPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  satuanPillActive: {
    backgroundColor: '#52141D',
    borderColor: '#52141D',
  },
  satuanText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#523C34',
  },
  satuanTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFE7E2',
    marginTop: 14,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F4EFEB',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78665E',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#C62828',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
