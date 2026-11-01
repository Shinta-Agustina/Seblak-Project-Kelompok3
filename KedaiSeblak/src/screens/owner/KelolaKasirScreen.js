import React, { useState, useEffect } from 'react';
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
import { useKasir } from '../../context/KasirContext'; // Terhubung ke state global

export default function KelolaKasirScreen() {
  // Mengambil data, fungsi, dan user yang sedang login dari KasirContext
  const { cashiers, addCashier, deleteCashier, user } = useKasir();

  // State lokal untuk mendeteksi kasir aktif lintas tab browser
  const [activeCashierSession, setActiveCashierSession] = useState(null);

  // Fungsi untuk mengecek sesi aktif dari localStorage
  const checkActiveSession = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedSession = localStorage.getItem('activeCashierLogin');
      const savedUser = localStorage.getItem('kedaiSeblakUser');
      
      if (savedSession) {
        setActiveCashierSession(savedSession);
      } else if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.role === 'Kasir') {
            setActiveCashierSession(parsed.name);
          } else {
            setActiveCashierSession(null);
          }
        } catch (e) {
          setActiveCashierSession(null);
        }
      } else {
        setActiveCashierSession(null);
      }
    }
  };

  // Efek untuk memantau perubahan localStorage lintas tab secara real-time
  useEffect(() => {
    checkActiveSession();

    // Listener khusus untuk mendeteksi perubahan storage dari tab browser lain
    const handleStorageChange = (event) => {
      if (event.key === 'activeCashierLogin' || event.key === 'kedaiSeblakUser') {
        checkActiveSession();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    // Interval cadangan untuk memastikan sinkronisasi mulus
    const interval = setInterval(checkActiveSession, 500);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      clearInterval(interval);
    };
  }, [user]);

  // State untuk modal tambah kasir
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Fungsi untuk menambah kasir baru ke state global
  const handleSaveCashier = () => {
    if (!name || !email || !password) {
      Alert.alert('Peringatan', 'Nama, Email, dan Password wajib diisi!');
      return;
    }

    try {
      addCashier({ name, email, phone, password });
      
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setModalVisible(false);
      
      Alert.alert('Sukses', 'Akun kasir baru berhasil ditambahkan!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Fungsi untuk menghapus kasir (Mendukung Web & Mobile secara otomatis)
  const handleDeleteCashier = (id, cashierName) => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus akses kasir ${cashierName}?`);
      if (isConfirmed) {
        deleteCashier(id);
      }
      return;
    }

    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus akses kasir ${cashierName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteCashier(id);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    // Pencocokan apakah kasir ini sedang aktif login di tab manapun
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
            <Text style={styles.cashierDetail}>Telp: {item.phone}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          {/* Badge Status Berubah Dinamis */}
          <View style={[styles.statusBadge, isCurrentLoggedIn ? styles.badgeActive : styles.badgeOffline]}>
            <Text style={[styles.statusText, isCurrentLoggedIn ? styles.textActive : styles.textOffline]}>
              {isCurrentLoggedIn ? 'Sedang Login' : 'Offline'}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleDeleteCashier(item.id, item.name)}
            style={styles.deleteBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Halaman */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kelola Akun Kasir</Text>
          <Text style={styles.headerSubtitle}>Tambah dan pantau akses staf kasir Kedai Seblak</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Tambah Kasir</Text>
        </TouchableOpacity>
      </View>

      {/* List Daftar Kasir */}
      <FlatList
        data={cashiers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="account-off-outline" size={48} color="#B0A097" />
            <Text style={styles.emptyText}>Belum ada akun kasir terdaftar.</Text>
          </View>
        }
      />

      {/* Modal Form Tambah Kasir */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Kasir Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A3028" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Siti Aisyah"
                placeholderTextColor="#B0A097"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Email / Username Login</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: siti@kedaiseblak.com"
                placeholderTextColor="#B0A097"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Nomor Telepon / WhatsApp</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 081234567890"
                placeholderTextColor="#B0A097"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>Password Sementara</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#B0A097"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelModalText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveModalBtn}
                  onPress={handleSaveCashier}
                >
                  <Text style={styles.saveModalText}>Simpan Kasir</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2C1810',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8D7B70',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#C62828',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flex: 1,
  },
  cashierName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },
  cashierDetail: {
    fontSize: 12,
    color: '#8D7B70',
    marginTop: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: '#E8F5E9',
  },
  badgeOffline: {
    backgroundColor: '#F3ECE7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textActive: {
    color: '#2E7D32',
  },
  textOffline: {
    color: '#8D7B70',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
    cursor: 'pointer',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    color: '#8D7B70',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 10, 8, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3028',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#2C1810',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F3ECE7',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#4A3028',
    fontWeight: '700',
    fontSize: 13,
  },
  saveModalBtn: {
    flex: 1,
    backgroundColor: '#C62828',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});