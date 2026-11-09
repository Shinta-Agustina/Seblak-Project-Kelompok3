import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';

// Data dummy pendukung untuk monitoring shift
const MOCK_SHIFT_MONITORING = [
  {
    kasirId: 'KSR001',
    namaKasir: 'Siti Aisyah',
    statusShift: 'BUKA',
    modalAwal: 150000,
    omsetKotorSementara: 450000,
    totalTransaksi: 8,
    estimasiUangFisik: 600000,
    selisihFisik: 0,
    waktuMulai: new Date(),
  },
];

const formatRupiah = (angka) => `Rp ${Number(angka || 0).toLocaleString('id-ID')}`;

export default function KelolaKasirScreen() {
  const { cashiers, addCashier, updateCashier, deleteCashier, user } = useKasir();

  const [activeTab, setActiveTab] = useState('akun');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCashierSession, setActiveCashierSession] = useState(null);

  // State untuk modal (Tambah / Edit Kasir)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKasir, setEditingKasir] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Cek sesi aktif dari localStorage
  const checkActiveSession = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedSession = localStorage.getItem('activeCashierLogin');
      const savedUser = localStorage.getItem('kedaiSeblakUser');

      if (savedSession) {
        setActiveCashierSession(savedSession);
      } else if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setActiveCashierSession(parsed?.role === 'Kasir' ? parsed.name : null);
        } catch (e) {
          setActiveCashierSession(null);
        }
      } else {
        setActiveCashierSession(null);
      }
    }
  };

    useEffect(() => {
    // Jalankan pengecekan sesi pertama kali
    checkActiveSession();

    // Pastikan interval dideklarasikan dengan aman
    const intervalId = setInterval(() => {
      checkActiveSession();
    }, 500);

    // Handler untuk web (jika kamu running di React Native Web)
    const handleStorageChange = (event) => {
      if (event.key === 'activeCashierLogin' || event.key === 'kedaiSeblakUser') {
        checkActiveSession();
      }
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('storage', handleStorageChange);
    }

    // FUNGSI CLEANUP: Pastikan mengembalikan fungsi bersih tanpa celah undefined
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [user]);

  // Statistik Kasir
  const totalKasir = cashiers.length;
  const totalAktif = cashiers.filter((item) => String(item.status || 'Aktif').toLowerCase() === 'aktif').length;
  const totalNonaktif = totalKasir - totalAktif;

  // Filter pencarian kasir
  const filteredKasir = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return cashiers;
    return cashiers.filter(
      (item) =>
        String(item.name || '').toLowerCase().includes(keyword) ||
        String(item.email || '').toLowerCase().includes(keyword)
    );
  }, [cashiers, searchQuery]);

  // Buka modal untuk tambah kasir baru
  const openAddModal = () => {
    setEditingKasir(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setModalVisible(true);
  };

  // Buka modal untuk edit kasir
  const openEditModal = (item) => {
    setEditingKasir(item);
    setName(item.name || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setPassword(item.password || '');
    setModalVisible(true);
  };

  // Simpan data (Tambah atau Edit)
  const handleSaveCashier = async () => {
    if (!name || !email) {
      Alert.alert('Peringatan', 'Nama dan Email/Username wajib diisi!');
      return;
    }

    try {
      if (editingKasir) {
        await updateCashier(editingKasir.id, { name, email, phone, password: password || undefined });
        Alert.alert('Sukses', 'Data kasir berhasil diperbarui!');
      } else {
        if (!password) {
          Alert.alert('Peringatan', 'Password wajib diisi untuk kasir baru!');
          return;
        }
        await addCashier({ name, email, phone, password });
        Alert.alert('Sukses', 'Akun kasir baru berhasil ditambahkan!');
      }

      setModalVisible(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setEditingKasir(null);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (item) => {
    const currentStatus = String(item.status || 'Aktif').toLowerCase();
    const newStatus = currentStatus === 'aktif' ? 'Nonaktif' : 'Aktif';

    try {
      await updateCashier(item.id, { status: newStatus });
    } catch (error) {
      Alert.alert('Gagal', error.message || 'Status kasir gagal diperbarui.');
    }
  };

  const handleDeleteCashier = (id, cashierName) => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`Apakah Anda yakin ingin menghapus akses kasir ${cashierName}?`)) {
        deleteCashier(id);
      }
      return;
    }

    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus akses kasir ${cashierName}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteCashier(id) },
    ]);
  };

  const renderKasirItem = ({ item }) => {
    const isAktif = String(item.status || 'Aktif').toLowerCase() === 'aktif';
    const isCurrentLoggedIn =
      (user && user.role === 'Kasir' && user.name && user.name.trim().toLowerCase() === item.name.trim().toLowerCase()) ||
      (activeCashierSession && activeCashierSession.trim().toLowerCase() === item.name.trim().toLowerCase());

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardLeft}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={20} color="#C62828" />
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.cashierName}>{item.name}</Text>
            <Text style={styles.cashierDetail}>{item.email}</Text>
            <Text style={styles.cashierDetail}>Telp: {item.phone || '-'}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={[styles.statusBadge, isCurrentLoggedIn ? styles.badgeActive : styles.badgeOffline]}>
              <Text style={[styles.statusText, isCurrentLoggedIn ? styles.textActive : styles.textOffline]}>
                {isCurrentLoggedIn ? 'Sedang Login' : isAktif ? 'Aktif' : 'Nonaktif'}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={16} color="#0284C7" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.toggleBtn} activeOpacity={0.7}>
              <Ionicons name={isAktif ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={isAktif ? '#D97706' : '#168653'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteCashier(item.id, item.name)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Manajemen Kasir</Text>
            <Text style={styles.headerSubtitle}>Kelola akun, edit profil, dan pantau aktivitas staf kasir</Text>
          </View>
        </View>

        {/* Statistik Ringkas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalKasir}</Text>
            <Text style={styles.statLabel}>Total Kasir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#168653' }]}>{totalAktif}</Text>
            <Text style={styles.statLabel}>Kasir Aktif</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{totalNonaktif}</Text>
            <Text style={styles.statLabel}>Nonaktif</Text>
          </View>
        </View>

        {/* Tab Navigasi */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'akun' && styles.activeTab]}
            onPress={() => setActiveTab('akun')}
          >
            <Text style={[styles.tabText, activeTab === 'akun' && styles.activeTabText]}>Daftar Akun</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shift' && styles.activeTab]}
            onPress={() => setActiveTab('shift')}
          >
            <Text style={[styles.tabText, activeTab === 'shift' && styles.activeTabText]}>Monitoring Shift</Text>
          </TouchableOpacity>
        </View>

        {/* Konten Tab Akun */}
        {activeTab === 'akun' && (
          <View>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Daftar Akun Kasir</Text>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.8}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Tambah Kasir</Text>
              </TouchableOpacity>
            </View>

            {/* Kotak Pencarian */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#A89A92" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama atau email kasir..."
                placeholderTextColor="#A89A92"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredKasir}
              keyExtractor={(item) => item.id}
              renderItem={renderKasirItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="account-off-outline" size={40} color="#B0A097" />
                  <Text style={styles.emptyText}>Belum ada akun kasir terdaftar.</Text>
                </View>
              }
            />
          </View>
        )}

        {/* Konten Tab Shift */}
        {activeTab === 'shift' && (
          <View>
            <Text style={styles.sectionTitle}>Monitoring Shift Laci Kasir</Text>
            {MOCK_SHIFT_MONITORING.map((item, index) => (
              <View key={index} style={styles.shiftCard}>
                <Text style={styles.cashierName}>{item.namaKasir}</Text>
                <Text style={styles.cashierDetail}>Modal Awal: {formatRupiah(item.modalAwal)}</Text>
                <Text style={styles.cashierDetail}>Omzet Sementara: {formatRupiah(item.omsetKotorSementara)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Tambah / Edit Kasir */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingKasir ? 'Edit Data Kasir' : 'Tambah Kasir Baru'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A3028" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput style={styles.textInput} placeholder="Contoh: Siti Aisyah" value={name} onChangeText={setName} />

              <Text style={styles.inputLabel}>Email / Username Login</Text>
              <TextInput style={styles.textInput} placeholder="Contoh: siti@kedaiseblak.com" value={email} onChangeText={setEmail} autoCapitalize="none" />

              <Text style={styles.inputLabel}>Nomor Telepon</Text>
              <TextInput style={styles.textInput} placeholder="081234567890" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

              <Text style={styles.inputLabel}>Password {editingKasir ? '(Kosongkan jika tidak diubah)' : ''}</Text>
              <TextInput style={styles.textInput} placeholder="Minimal 6 karakter" secureTextEntry value={password} onChangeText={setPassword} />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelModalText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveCashier}>
                  <Text style={styles.saveModalText}>{editingKasir ? 'Simpan Perubahan' : 'Simpan Kasir'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5F2' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  header: { marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#2C1810' },
  headerSubtitle: { fontSize: 11, color: '#8D7B70', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFE7E2' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#52141D' },
  statLabel: { fontSize: 10, color: '#78665E', marginTop: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#EFE7E2', borderRadius: 10, padding: 4, marginBottom: 15 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#C62828' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#78665E' },
  activeTabText: { color: '#FFFFFF' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#2C1810' },
  addButton: { flexDirection: 'row', backgroundColor: '#C62828', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center', gap: 4 },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E2', borderRadius: 9, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, height: 38, fontSize: 11, color: '#2C1810' },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EFE7E2' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarBox: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#FDECEC', justifyContent: 'center', alignItems: 'center' },
  infoBox: { flex: 1 },
  cashierName: { fontSize: 13, fontWeight: '800', color: '#2C1810' },
  cashierDetail: { fontSize: 10, color: '#8D7B70', marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeActive: { backgroundColor: '#E8F5E9' },
  badgeOffline: { backgroundColor: '#F3ECE7' },
  statusText: { fontSize: 9, fontWeight: '700' },
  textActive: { color: '#2E7D32' },
  textOffline: { color: '#8D7B70' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  editBtn: { padding: 6, borderRadius: 6, backgroundColor: '#E0F2FE' },
  toggleBtn: { padding: 6, borderRadius: 6, backgroundColor: '#FEF3C7' },
  deleteBtn: { padding: 6, borderRadius: 6, backgroundColor: '#FDECEC' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 8 },
  emptyText: { color: '#8D7B70', fontSize: 12, fontWeight: '600' },
  shiftCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EFE7E2', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(25, 10, 8, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EFE7E2' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#2C1810' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#4A3028', marginBottom: 4, marginTop: 8 },
  textInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2D5CC', borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 12, color: '#2C1810' },
  modalButtonRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  cancelModalBtn: { flex: 1, backgroundColor: '#F3ECE7', height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelModalText: { color: '#4A3028', fontWeight: '700', fontSize: 11 },
  saveModalBtn: { flex: 1, backgroundColor: '#C62828', height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  saveModalText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
});