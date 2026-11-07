
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  MOCK_KASIR,
  MOCK_SHIFT_MONITORING,
} from '../../data/mockDataGlobal';

const formatRupiah = (angka) => {
  const nilai = Number(angka || 0);

  return `Rp ${nilai.toLocaleString('id-ID')}`;
};

const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatWaktu = (tanggal) => {
  if (!tanggal) return '-';

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeUsername = (username) =>
  String(username || '').trim().toLowerCase();

export default function ManajemenKasirScreen() {
  const [kasirList, setKasirList] = useState(
    Array.isArray(MOCK_KASIR) ? MOCK_KASIR : []
  );

  const [shiftData] = useState(
    Array.isArray(MOCK_SHIFT_MONITORING)
      ? MOCK_SHIFT_MONITORING
      : []
  );

  const [activeTab, setActiveTab] = useState('akun');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editKasir, setEditKasir] = useState(null);

  const [newNama, setNewNama] = useState('');
  const [newUsername, setNewUsername] = useState('');

  // Statistik akun kasir
  const totalKasir = kasirList.length;

  const totalAktif = kasirList.filter(
    (item) => String(item.status).toLowerCase() === 'aktif'
  ).length;

  const totalNonaktif = totalKasir - totalAktif;

  // Pencarian kasir
  const filteredKasir = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) return kasirList;

    return kasirList.filter((item) => {
      return (
        String(item.nama || '').toLowerCase().includes(keyword) ||
        String(item.username || '').toLowerCase().includes(keyword) ||
        String(item.id || '').toLowerCase().includes(keyword)
      );
    });
  }, [kasirList, searchQuery]);

  // Membuka modal tambah
  const openAddModal = () => {
    setEditKasir(null);
    setNewNama('');
    setNewUsername('');
    setModalVisible(true);
  };

  // Membuka modal edit
  const openEditModal = (item) => {
    setEditKasir(item);
    setNewNama(item.nama || '');
    setNewUsername(item.username || '');
    setModalVisible(true);
  };

  // Menutup modal
  const closeModal = () => {
    setModalVisible(false);
    setEditKasir(null);
    setNewNama('');
    setNewUsername('');
  };

  // Membuat ID kasir baru
  const generateKasirId = () => {
    let nomorTerbesar = 0;

    kasirList.forEach((item) => {
      const match = String(item.id || '').match(/(\d+)$/);

      if (match) {
        nomorTerbesar = Math.max(
          nomorTerbesar,
          Number(match[1])
        );
      }
    });

    return `KSR${String(nomorTerbesar + 1).padStart(3, '0')}`;
  };

  // Simpan tambah atau edit kasir
  const handleSaveKasir = () => {
    const nama = newNama.trim();
    const username = normalizeUsername(newUsername);

    if (!nama || !username) {
      Alert.alert(
        'Data belum lengkap',
        'Nama dan username wajib diisi.'
      );
      return;
    }

    const usernameSudahAda = kasirList.some((item) => {
      const usernameSama =
        normalizeUsername(item.username) === username;

      const bukanAkunYangDiedit =
        !editKasir || item.id !== editKasir.id;

      return usernameSama && bukanAkunYangDiedit;
    });

    if (usernameSudahAda) {
      Alert.alert(
        'Username sudah digunakan',
        'Gunakan username lain untuk akun kasir.'
      );
      return;
    }

    if (editKasir) {
      setKasirList((prev) =>
        prev.map((item) =>
          item.id === editKasir.id
            ? {
                ...item,
                nama,
                username,
              }
            : item
        )
      );

      Alert.alert('Berhasil', 'Data kasir berhasil diperbarui.');
    } else {
      const newKasir = {
        id: generateKasirId(),
        nama,
        username,
        status: 'aktif',
        pin: '',
      };

      setKasirList((prev) => [...prev, newKasir]);

      Alert.alert(
        'Berhasil',
        'Akun kasir berhasil ditambahkan.'
      );
    }

    closeModal();
  };

  // Aktifkan / nonaktifkan akun
  const handleToggleStatus = (item) => {
    const sedangAktif =
      String(item.status).toLowerCase() === 'aktif';

    const statusBaru = sedangAktif ? 'nonaktif' : 'aktif';

    Alert.alert(
      sedangAktif ? 'Nonaktifkan Kasir?' : 'Aktifkan Kasir?',
      sedangAktif
        ? `Akun ${item.nama} tidak dapat digunakan untuk login setelah dinonaktifkan.`
        : `Akun ${item.nama} akan diaktifkan kembali.`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Ya, lanjutkan',
          onPress: () => {
            setKasirList((prev) =>
              prev.map((kasir) =>
                kasir.id === item.id
                  ? { ...kasir, status: statusBaru }
                  : kasir
              )
            );
          },
        },
      ]
    );
  };

  // Monitoring shift
  const renderShiftMonitor = (item, index) => {
    const statusShift = String(
      item.statusShift || ''
    ).toUpperCase();

    const isBuka = statusShift === 'BUKA';
    const selisih = Number(item.selisihFisik || 0);

    const waktuMulai = item.waktuMulai;

    return (
      <View
        key={`${item.kasirId || 'shift'}-${index}`}
        style={styles.shiftCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.kasirIdentity}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={20}
                color="#8D3D2E"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.kasirName}>
                {item.namaKasir || 'Kasir'}
              </Text>

              <Text style={styles.kasirId}>
                {item.kasirId || '-'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isBuka
                  ? '#DCFCE7'
                  : '#F3F4F6',
              },
            ]}
          >
            <Ionicons
              name={
                isBuka
                  ? 'lock-open-outline'
                  : 'lock-closed-outline'
              }
              size={12}
              color={isBuka ? '#168653' : '#6B7280'}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: isBuka ? '#168653' : '#6B7280',
                },
              ]}
            >
              {statusShift || 'TIDAK DIKETAHUI'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text style={styles.dataLabel}>Modal Awal</Text>
            <Text style={styles.dataValue}>
              {formatRupiah(item.modalAwal)}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.dataLabel}>
              Omzet di Laci (Sistem)
            </Text>

            <Text style={styles.omzetValue}>
              {formatRupiah(item.omsetKotorSementara)}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.dataLabel}>
              Total Transaksi
            </Text>

            <Text style={styles.dataValue}>
              {Number(item.totalTransaksi || 0)} Struk
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>
              Estimasi Uang Fisik
            </Text>

            <Text
              style={[
                styles.totalFisik,
                {
                  color:
                    selisih < 0 ? '#C62828' : '#2C1810',
                },
              ]}
            >
              {formatRupiah(item.estimasiUangFisik)}
            </Text>
          </View>

          {!isBuka && selisih !== 0 && (
            <View
              style={[
                styles.selisihBox,
                {
                  backgroundColor:
                    selisih < 0 ? '#FEF2F2' : '#ECFDF5',
                },
              ]}
            >
              <Ionicons
                name={
                  selisih < 0
                    ? 'alert-circle'
                    : 'checkmark-circle'
                }
                size={15}
                color={selisih < 0 ? '#B91C1C' : '#059669'}
              />

              <Text
                style={[
                  styles.selisihText,
                  {
                    color:
                      selisih < 0 ? '#B91C1C' : '#059669',
                  },
                ]}
              >
                Selisih fisik: {formatRupiah(selisih)} (
                {selisih < 0 ? 'TEKOR' : 'LEBIH'})
              </Text>
            </View>
          )}

          {!isBuka && selisih === 0 && (
            <View
              style={[
                styles.selisihBox,
                { backgroundColor: '#F3F4F6' },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={15}
                color="#6B7280"
              />

              <Text
                style={[
                  styles.selisihText,
                  { color: '#6B7280' },
                ]}
              >
                Shift ditutup tanpa selisih tercatat.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Ionicons
            name="time-outline"
            size={12}
            color="#A89A92"
          />

          <Text style={styles.shiftTime}>
            Mulai: {formatTanggal(waktuMulai)} ·{' '}
            {formatWaktu(waktuMulai)}
          </Text>
        </View>
      </View>
    );
  };

  // Tampilan akun kasir
  const renderKasir = (item) => {
    const isAktif =
      String(item.status).toLowerCase() === 'aktif';

    return (
      <View key={item.id} style={styles.kasirCard}>
        <View style={styles.kasirCardTop}>
          <View style={styles.kasirIdentity}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={21}
                color="#8D3D2E"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.kasirName}>
                {item.nama || 'Tanpa nama'}
              </Text>

              <Text style={styles.kasirUsername}>
                @{item.username || '-'}
              </Text>

              <Text style={styles.kasirId}>
                ID: {item.id || '-'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isAktif
                  ? '#DCFCE7'
                  : '#F3F4F6',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isAktif
                    ? '#168653'
                    : '#9CA3AF',
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: isAktif ? '#168653' : '#6B7280',
                },
              ]}
            >
              {isAktif ? 'Aktif' : 'Nonaktif'}
            </Text>
          </View>
        </View>

        <View style={styles.kasirCardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color="#8D3D2E"
            />

            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isAktif
                  ? '#FEF2F2'
                  : '#ECFDF5',
              },
            ]}
            onPress={() => handleToggleStatus(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                isAktif
                  ? 'person-remove-outline'
                  : 'person-add-outline'
              }
              size={16}
              color={isAktif ? '#C62828' : '#168653'}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: isAktif ? '#C62828' : '#168653',
                },
              ]}
            >
              {isAktif ? 'Nonaktifkan' : 'Aktifkan'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>
              Manajemen Kasir
            </Text>

            <Text style={styles.pageSubtitle}>
              Kelola akun dan pantau aktivitas kasir.
            </Text>
          </View>
        </View>

        {/* Statistik */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="people-outline"
                size={19}
                color="#8D3D2E"
              />
            </View>

            <Text style={styles.statValue}>{totalKasir}</Text>
            <Text style={styles.statLabel}>Total Kasir</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#EAF6EE' },
              ]}
            >
              <Ionicons
                name="person-check-outline"
                size={19}
                color="#168653"
              />
            </View>

            <Text style={[styles.statValue, { color: '#168653' }]}>
              {totalAktif}
            </Text>

            <Text style={styles.statLabel}>Kasir Aktif</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#F3F4F6' },
              ]}
            >
              <Ionicons
                name="person-remove-outline"
                size={19}
                color="#6B7280"
              />
            </View>

            <Text style={[styles.statValue, { color: '#6B7280' }]}>
              {totalNonaktif}
            </Text>

            <Text style={styles.statLabel}>Nonaktif</Text>
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
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'akun' ? '#FFFFFF' : '#78665E'}
            />

            <Text
              style={[
                styles.tabText,
                activeTab === 'akun' && styles.activeTabText,
              ]}
            >
              Daftar Kasir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'shift' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('shift')}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={activeTab === 'shift' ? '#FFFFFF' : '#78665E'}
            />

            <Text
              style={[
                styles.tabText,
                activeTab === 'shift' && styles.activeTabText,
              ]}
            >
              Monitoring Shift
            </Text>
          </TouchableOpacity>
        </View>

        {/* Konten Daftar Kasir */}
        {activeTab === 'akun' && (
          <View>
            <View style={styles.sectionHeading}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Daftar Akun Kasir
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Kelola akun yang digunakan untuk login.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={18}
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
                size={18}
                color="#A89A92"
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama, username, atau ID kasir..."
                placeholderTextColor="#A89A92"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="#A89A92"
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.resultText}>
              Menampilkan {filteredKasir.length} dari {totalKasir} kasir
            </Text>

            {filteredKasir.length > 0 ? (
              filteredKasir.map(renderKasir)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={35}
                  color="#B6A9A1"
                />

                <Text style={styles.emptyTitle}>
                  Kasir tidak ditemukan
                </Text>

                <Text style={styles.emptyDescription}>
                  Coba gunakan kata kunci pencarian lain.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Konten Monitoring Shift */}
        {activeTab === 'shift' && (
          <View>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  Monitoring Shift Laci Kasir
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Pantau ringkasan aktivitas dan kondisi kas.
                </Text>
              </View>
            </View>

            {shiftData.length > 0 ? (
              shiftData.map(renderShiftMonitor)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cash-outline"
                  size={35}
                  color="#B6A9A1"
                />

                <Text style={styles.emptyTitle}>
                  Belum ada data shift
                </Text>

                <Text style={styles.emptyDescription}>
                  Data monitoring akan muncul ketika tersedia.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Tambah / Edit Kasir */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editKasir ? 'Edit Data Kasir' : 'Tambah Akun Kasir'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Lengkapi informasi akun kasir.
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#78665E"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nama Lengkap</Text>

            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="#A89A92"
              value={newNama}
              onChangeText={setNewNama}
            />

            <Text style={styles.inputLabel}>Username</Text>

            <TextInput
              style={styles.input}
              placeholder="Masukkan username untuk login"
              placeholderTextColor="#A89A92"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!editKasir && (
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color="#95651B"
                />

                <Text style={styles.infoText}>
                  Pembuatan akun pada versi ini masih menggunakan data
                  sementara. Pengaturan password atau PIN perlu
                  dihubungkan ke sistem autentikasi.
                </Text>
              </View>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveKasir}
              >
                <Ionicons
                  name="checkmark"
                  size={17}
                  color="#FFFFFF"
                />

                <Text style={styles.saveButtonText}>
                  {editKasir ? 'Simpan Perubahan' : 'Simpan Kasir'}
                </Text>
              </TouchableOpacity>
            </View>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 4,
  },

  // Statistik
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 11,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8EDEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 21,
    fontWeight: '900',
    color: '#52141D',
  },
  statLabel: {
    fontSize: 9,
    color: '#78665E',
    marginTop: 3,
  },

  // Tab
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE7E2',
    borderRadius: 11,
    padding: 4,
    marginBottom: 19,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#C62828',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78665E',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Heading
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#8D7B70',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#C62828',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },

  // Pencarian
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 9,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 11,
    color: '#2C1810',
  },
  resultText: {
    fontSize: 9,
    color: '#A89A92',
    marginBottom: 10,
  },

  // Kartu akun
  kasirCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    marginBottom: 11,
    padding: 13,
  },
  kasirCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  kasirIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F8EDEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kasirName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
  },
  kasirUsername: {
    fontSize: 10,
    color: '#8D3D2E',
    marginTop: 3,
  },
  kasirId: {
    fontSize: 9,
    color: '#A89A92',
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  kasirCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0E7E1',
    marginTop: 12,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8D3D2E',
  },

  // Monitoring shift
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#EFE7E2',
  },
  cardBody: {
    padding: 14,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dataLabel: {
    fontSize: 10,
    color: '#78665E',
  },
  dataValue: {
    fontSize: 10,
    color: '#2C1810',
    fontWeight: '600',
  },
  omzetValue: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E7E1',
    marginVertical: 3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },
  totalFisik: {
    fontSize: 14,
    fontWeight: '900',
  },
  selisihBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 9,
    borderRadius: 8,
    marginTop: 3,
  },
  selisihText: {
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8F5F2',
    padding: 10,
    paddingHorizontal: 14,
  },
  shiftTime: {
    fontSize: 9,
    color: '#A89A92',
    fontStyle: 'italic',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 13,
    padding: 25,
    marginTop: 5,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78665E',
    marginTop: 9,
  },
  emptyDescription: {
    fontSize: 10,
    color: '#A89A92',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 15, 18, 0.52)',
    padding: 18,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#52141D',
  },
  modalSubtitle: {
    fontSize: 10,
    color: '#8D7B70',
    marginTop: 4,
  },
  closeButton: {
    padding: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#523C34',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 11,
    marginBottom: 13,
    color: '#2C1810',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FFF5DE',
    padding: 10,
    borderRadius: 9,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: '#795B25',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: '#C62828',
  },
  saveButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
