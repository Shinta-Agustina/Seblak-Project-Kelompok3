
import React, {
  useState,
  useMemo,
} from 'react';

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
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useKasir } from '../../context/KasirContext';

import {
  updateCashierPassword,
} from '../../services/kasirService';

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

const formatRupiah = (angka) =>
  `Rp ${Number(angka || 0).toLocaleString('id-ID')}`;

export default function KelolaKasirScreen() {
  const {
    cashiers,
    addCashier,
    updateCashier,
    deleteCashier,
    user,
  } = useKasir();

  const { width, height } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState('akun');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingKasir, setEditingKasir] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [saving, setSaving] = useState(false);

  const totalKasir = cashiers.length;

  const totalAktif = cashiers.filter(
    (item) =>
      String(item.status || 'aktif').toLowerCase() === 'aktif'
  ).length;

  const totalNonaktif = totalKasir - totalAktif;

  // Pencarian nama dan email sesuai kolom database
  const filteredKasir = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) return cashiers;

    return cashiers.filter((item) => {
      const nama = String(
        item.nama || item.name || ''
      ).toLowerCase();

      const email = String(
        item.username || item.email || ''
      ).toLowerCase();

      const kode = String(
        item.kode_kasir || ''
      ).toLowerCase();

      return (
        nama.includes(keyword) ||
        email.includes(keyword) ||
        kode.includes(keyword)
      );
    });
  }, [cashiers, searchQuery]);

  // Membuka modal tambah kasir
  const openAddModal = () => {
    setEditingKasir(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);
    setModalVisible(true);
  };

  // Membuka modal edit kasir
  const openEditModal = (item) => {
    setEditingKasir(item);

    setName(item.nama || item.name || '');
    setEmail(item.username || item.email || '');
    setPhone(item.no_telepon || item.phone || '');

    // Password tidak diambil dari database.
    setPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);

    setModalVisible(true);
  };

  // Menutup modal
  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingKasir(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);
  };

  // Simpan tambah atau edit kasir
  const handleSaveCashier = async () => {
    if (saving) return;

    if (!name.trim() || (!editingKasir && !email.trim())) {
      Alert.alert(
        'Peringatan',
        'Nama dan email wajib diisi.'
      );
      return;
    }

    if (!editingKasir && !password.trim()) {
      Alert.alert(
        'Peringatan',
        'Password wajib diisi untuk kasir baru.'
      );
      return;
    }

    if (password && password.length < 6) {
      Alert.alert(
        'Peringatan',
        'Password minimal 6 karakter.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Peringatan',
        'Konfirmasi password tidak sama.'
      );
      return;
    }

    try {
      setSaving(true);

      if (editingKasir) {
        // Simpan data profil kasir
        await updateCashier(editingKasir.id, {
          nama: name.trim(),
          no_telepon: phone.trim(),
        });

        // Ganti password jika kolom diisi
        if (password.trim()) {
          await updateCashierPassword(
            editingKasir.id,
            password
          );
        }

        Alert.alert(
          'Berhasil',
          password.trim()
            ? 'Data dan password kasir berhasil diperbarui.'
            : 'Data kasir berhasil diperbarui.'
        );
      } else {
        // Tambah akun kasir baru
        await addCashier({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });

        Alert.alert(
          'Berhasil',
          'Akun kasir berhasil ditambahkan.'
        );
      }

      setModalVisible(false);
      setEditingKasir(null);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
    } catch (error) {
      console.log('Error menyimpan kasir:', error);

      Alert.alert(
        'Gagal',
        error.message || 'Data kasir gagal disimpan.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Toggle status aktif dan nonaktif
  const handleToggleStatus = async (item) => {
    const currentStatus = String(
      item.status || 'aktif'
    ).toLowerCase();

    const newStatus =
      currentStatus === 'aktif' ? 'nonaktif' : 'aktif';

    try {
      await updateCashier(item.id, {
        status: newStatus,
      });
    } catch (error) {
      Alert.alert(
        'Gagal',
        error.message || 'Status kasir gagal diperbarui.'
      );
    }
  };

  // Menonaktifkan akun kasir
  const handleDeleteCashier = (id, cashierName) => {
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin menonaktifkan akun ${cashierName}?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Nonaktifkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCashier(id);

              Alert.alert(
                'Berhasil',
                `Akun kasir ${cashierName} berhasil dinonaktifkan.`
              );
            } catch (error) {
              Alert.alert(
                'Gagal',
                error.message || 'Kasir gagal dinonaktifkan.'
              );
            }
          },
        },
      ]
    );
  };

  // Tampilan setiap kartu kasir
  const renderKasirItem = ({ item }) => {
    const cashierName = item.nama || item.name || '-';
    const cashierEmail =
      item.username || item.email || '-';

    const cashierPhone =
      item.no_telepon || item.phone || '-';

    const isAktif =
      String(item.status || 'aktif').toLowerCase() === 'aktif';

    const isCurrentLoggedIn = Boolean(
      String(user?.role || '').toLowerCase() === 'kasir' &&
      user?.id &&
      String(user.id) === String(item.id)
    );

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardLeft}>
          <View style={styles.avatarBox}>
            <Ionicons
              name="person"
              size={21}
              color="#C62828"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.cashierName}>
              {cashierName}
            </Text>

            <Text style={styles.cashierDetail}>
              {cashierEmail}
            </Text>

            <Text style={styles.cashierDetail}>
              Telp: {cashierPhone}
            </Text>

            <Text style={styles.cashierCode}>
              {item.kode_kasir || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View
            style={[
              styles.statusBadge,
              isAktif
                ? styles.badgeActive
                : styles.badgeOffline,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isAktif
                  ? styles.textActive
                  : styles.textOffline,
              ]}
            >
              {isCurrentLoggedIn
                ? 'Sedang Login'
                : isAktif
                  ? 'Aktif'
                  : 'Nonaktif'}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color="#0284C7"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleToggleStatus(item)}
              style={styles.toggleBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  isAktif
                    ? 'ban-outline'
                    : 'checkmark-circle-outline'
                }
                size={19}
                color={isAktif ? '#D97706' : '#168653'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleDeleteCashier(item.id, cashierName)
              }
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color="#DC2626"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Manajemen Kasir
          </Text>

          <Text style={styles.headerSubtitle}>
            Kelola akun dan aktivitas staf kasir
          </Text>
        </View>

        {/* Statistik */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalKasir}
            </Text>
            <Text style={styles.statLabel}>
              Total Kasir
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                { color: '#168653' },
              ]}
            >
              {totalAktif}
            </Text>
            <Text style={styles.statLabel}>
              Kasir Aktif
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                { color: '#6B7280' },
              ]}
            >
              {totalNonaktif}
            </Text>
            <Text style={styles.statLabel}>
              Nonaktif
            </Text>
          </View>
        </View>

        {/* Tab */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'akun' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('akun')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'akun' &&
                  styles.activeTabText,
              ]}
            >
              Daftar Akun
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'shift' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('shift')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'shift' &&
                  styles.activeTabText,
              ]}
            >
              Monitoring Shift
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Akun */}
        {activeTab === 'akun' && (
          <View>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                Daftar Akun Kasir
              </Text>

              <TouchableOpacity
                style={styles.addButton}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.addButtonText}>
                  Tambah
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pencarian */}
            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={19}
                color="#A89A92"
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama, email, atau kode..."
                placeholderTextColor="#A89A92"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={filteredKasir}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderKasirItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons
                    name="account-off-outline"
                    size={42}
                    color="#B0A097"
                  />

                  <Text style={styles.emptyText}>
                    Belum ada akun kasir terdaftar.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* Tab Monitoring Shift */}
        {activeTab === 'shift' && (
          <View>
            <Text style={styles.sectionTitle}>
              Monitoring Shift Laci Kasir
            </Text>

            {MOCK_SHIFT_MONITORING.map((item, index) => (
              <View
                key={index}
                style={styles.shiftCard}
              >
                <Text style={styles.cashierName}>
                  {item.namaKasir}
                </Text>

                <Text style={styles.cashierDetail}>
                  Status Shift: {item.statusShift}
                </Text>

                <Text style={styles.cashierDetail}>
                  Modal Awal: {formatRupiah(item.modalAwal)}
                </Text>

                <Text style={styles.cashierDetail}>
                  Omzet Sementara:{' '}
                  {formatRupiah(item.omsetKotorSementara)}
                </Text>

                <Text style={styles.cashierDetail}>
                  Total Transaksi: {item.totalTransaksi}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Tambah dan Edit */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios' ? 'padding' : undefined
          }
        >
          <View
            style={[
              styles.modalCard,
              {
                width: Math.min(width - 48, 420),
                maxHeight: height * (editingKasir ? 0.68 : 0.78),
              },
            ]}
          >
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingKasir
                  ? 'Edit Data Kasir'
                  : 'Tambah Kasir Baru'}
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                disabled={saving}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#4A3028"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingBottom: 12,
              }}
            >
              <Text style={styles.inputLabel}>
                Nama Lengkap
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Siti Aisyah"
                placeholderTextColor="#A89A92"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>
                Email / Username Login
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  editingKasir && styles.disabledInput,
                ]}
                placeholder="Contoh: siti@email.com"
                placeholderTextColor="#A89A92"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!editingKasir}
                selectTextOnFocus={!editingKasir}
              />

              {editingKasir && (
                <Text style={styles.helperText}>
                  Email login ditampilkan sebagai informasi dan tidak dapat diubah di halaman ini.
                </Text>
              )}

              <Text style={styles.inputLabel}>
                Nomor Telepon
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="081234567890"
                placeholderTextColor="#A89A92"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {editingKasir && (
                <TouchableOpacity
                  style={styles.changePasswordToggle}
                  onPress={() => {
                    setShowPasswordFields((previous) => !previous);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color="#C62828"
                  />

                  <Text style={styles.changePasswordText}>
                    {showPasswordFields
                      ? 'Batal ganti password'
                      : 'Ganti password'}
                  </Text>

                  <Ionicons
                    name={
                      showPasswordFields
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={16}
                    color="#C62828"
                  />
                </TouchableOpacity>
              )}

              {(!editingKasir || showPasswordFields) && (
                <>
                  {!editingKasir && (
                    <View style={styles.passwordInfo}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={17}
                        color="#168653"
                      />

                      <Text style={styles.passwordInfoText}>
                        Buat password minimal 6 karakter untuk akun kasir.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>
                    {editingKasir ? 'Password Baru' : 'Password'}
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#A89A92"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>
                    Konfirmasi Password
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan ulang password"
                    placeholderTextColor="#A89A92"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}

              {/* Tombol */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={closeModal}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelModalText}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveModalBtn,
                    saving && { opacity: 0.6 },
                  ]}
                  onPress={handleSaveCashier}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveModalText}>
                    {saving
                      ? 'Menyimpan...'
                      : editingKasir
                        ? 'Simpan Perubahan'
                        : 'Simpan Kasir'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 35,
  },

  header: {
    marginBottom: 18,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#2C1810',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#8D7B70',
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },

  statValue: {
    fontSize: 21,
    fontWeight: '900',
    color: '#52141D',
  },

  statLabel: {
    fontSize: 10,
    color: '#78665E',
    marginTop: 3,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE7E2',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 8,
  },

  activeTab: {
    backgroundColor: '#C62828',
  },

  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
    flexShrink: 1,
  },

  addButton: {
    flexDirection: 'row',
    backgroundColor: '#C62828',
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: 46,
  },

  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
    color: '#2C1810',
  },

  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
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
    minWidth: 0,
  },

  cashierName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
  },

  cashierDetail: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 3,
  },

  cashierCode: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '700',
    marginTop: 4,
  },

  cardRight: {
    alignItems: 'flex-end',
    gap: 7,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },

  badgeActive: {
    backgroundColor: '#E8F5E9',
  },

  badgeOffline: {
    backgroundColor: '#F3ECE7',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },

  textActive: {
    color: '#2E7D32',
  },

  textOffline: {
    color: '#8D7B70',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 7,
  },

  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    gap: 9,
  },

  emptyText: {
    color: '#8D7B70',
    fontSize: 12,
    fontWeight: '600',
  },

  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    marginTop: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 10, 8, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2C1810',
    flex: 1,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3028',
    marginBottom: 4,
    marginTop: 8,
  },

  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    borderRadius: 9,
    paddingHorizontal: 12,
    minHeight: 40,
    paddingVertical: 7,
    fontSize: 13,
    color: '#2C1810',
  },

  disabledInput: {
    backgroundColor: '#F3ECE7',
    color: '#8D7B70',
  },

  helperText: {
    fontSize: 10,
    color: '#8D7B70',
    marginTop: 5,
  },

  changePasswordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
  },

  changePasswordText: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: '800',
  },

  passwordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    marginTop: 9,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
  },

  passwordInfoText: {
    flex: 1,
    color: '#356B3A',
    fontSize: 11,
    lineHeight: 16,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },

  cancelModalBtn: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#F3ECE7',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelModalText: {
    color: '#4A3028',
    fontWeight: '700',
    fontSize: 12,
  },

  saveModalBtn: {
    flex: 1.5,
    minHeight: 40,
    backgroundColor: '#C62828',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveModalText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
