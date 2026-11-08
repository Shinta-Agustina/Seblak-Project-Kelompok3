import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CustomButton from './CustomButton';
import { TOPPING_CATEGORIES } from '../data/mockData';

// Kategori Topping riil sesuai dengan data master di dalam proyek Kedai Seblak
const VALID_TOPPING_CATEGORIES = (
  Array.isArray(TOPPING_CATEGORIES)
    ? TOPPING_CATEGORIES.filter((c) => c !== 'Semua')
    : [
        'Kerupuk & Makaroni',
        'Seafood & Olahan',
        'Daging & Jeroan',
        'Mie & Bihun',
        'Telur & Tahu',
        'Sayur & Jamur',
      ]
);

const WARNA_PRIMARY = '#52141D'; // Deep Maroon Project

export default function ExpenseFormModal({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  selectedDateStr = '17 Oktober 2026',
}) {
  const isEdit = !!initialData;

  // Waktu: jam dan tanggal/bulan/tahun
  const [tanggal, setTanggal] = useState(selectedDateStr);
  const [jam, setJam] = useState('06:54');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Bumbu');
  const [kategoriTopping, setKategoriTopping] = useState('Kerupuk & Makaroni');
  const [toppingDropdownOpen, setToppingDropdownOpen] = useState(false);
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('kg');
  const [supplier, setSupplier] = useState('');
  const [total, setTotal] = useState('');
  const [fotoItem, setFotoItem] = useState('');
  const [fotoStruk, setFotoStruk] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTanggal(initialData.tanggalStr || selectedDateStr);
        setJam(initialData.waktu ? initialData.waktu.replace(/\s*wib/i, '') : '06:54');
        setKeterangan(initialData.keterangan || initialData.nama || '');
        const kat = (initialData.kategori || '').toLowerCase();
        const isBumbu = kat.includes('bumbu');
        setKategori(isBumbu ? 'Bumbu' : 'Topping');
        setKategoriTopping(
          initialData.kategoriTopping ||
            (VALID_TOPPING_CATEGORIES.includes(initialData.kategori)
              ? initialData.kategori
              : 'Seafood & Olahan')
        );
        setJumlah(initialData.jumlah != null ? String(initialData.jumlah) : '');
        setSatuan(initialData.satuan || 'kg');
        setSupplier(initialData.supplier || '');
        const rawNom =
          initialData.nominal != null ? initialData.nominal : initialData.total || 0;
        setTotal(rawNom ? Number(rawNom).toLocaleString('id-ID') : '');
        setFotoItem(initialData.fotoItem || '');
        setFotoStruk(initialData.fotoStruk || '');
      } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTanggal(selectedDateStr || '17 Oktober 2026');
        setJam(`${hh}:${mm}`);
        setKeterangan('');
        setKategori('Bumbu');
        setKategoriTopping('Kerupuk & Makaroni');
        setJumlah('');
        setSatuan('kg');
        setSupplier('');
        setTotal('');
        setFotoItem('');
        setFotoStruk('');
      }
      setToppingDropdownOpen(false);
      setErrorMsg('');
    }
  }, [visible, initialData, selectedDateStr]);

  // Handler pemilihan foto (Web & Mobile Expo)
  const handlePickImage = async (type) => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg, image/jpg, image/webp';
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              Alert.alert('Ukuran Terlalu Besar', 'Maksimal ukuran file foto adalah 5MB.');
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              if (type === 'item') {
                setFotoItem(event.target.result);
              } else {
                setFotoStruk(event.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Izin Dibutuhkan', 'Mohon izinkan akses galeri foto untuk mengunggah.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const uri = result.assets[0].uri;
          if (type === 'item') {
            setFotoItem(uri);
          } else {
            setFotoStruk(uri);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memilih foto:', err);
    }
  };

  const handleSelectToppingButton = () => {
    // Saat tombol topping ditekan, buka dropdown kategori terlebih dahulu
    setToppingDropdownOpen((prev) => !prev);
  };

  const handleChooseToppingCategory = (cat) => {
    setKategori('Topping');
    setKategoriTopping(cat);
    setToppingDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (!tanggal.trim()) {
      setErrorMsg('Tanggal pengeluaran wajib diisi.');
      return;
    }
    if (!jam.trim()) {
      setErrorMsg('Jam pengeluaran wajib diisi.');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Nama bahan / keterangan wajib diisi (misal: Sosis atau Penyedap).');
      return;
    }
    if (!kategori.trim()) {
      setErrorMsg('Kategori wajib dipilih.');
      return;
    }
    if (!jumlah.trim()) {
      setErrorMsg('Jumlah wajib diisi.');
      return;
    }
    if (!satuan.trim()) {
      setErrorMsg('Satuan wajib diisi.');
      return;
    }
    if (!supplier.trim()) {
      setErrorMsg('Supplier wajib diisi.');
      return;
    }

    const cleanTotal = total.replace(/[^0-9]/g, '');
    const parsedTotal = parseInt(cleanTotal, 10);
    if (!cleanTotal || isNaN(parsedTotal) || parsedTotal <= 0) {
      setErrorMsg('Total pembelian harus berupa nominal lebih dari 0.');
      return;
    }

    const payload = {
      ...(initialData || {}),
      tanggalStr: tanggal.trim(),
      waktu: jam.trim(),
      keterangan: keterangan.trim(),
      kategori: kategori.trim(),
      kategoriTopping: kategori === 'Topping' ? kategoriTopping : null,
      jumlah: jumlah.trim(),
      satuan: satuan.trim(),
      supplier: supplier.trim(),
      total: parsedTotal,
      nominal: parsedTotal,
      fotoItem: fotoItem || null,
      fotoStruk: fotoStruk || null,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalCard}>
                {/* Header Modal - fixed at top, not cut off */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.iconBadge}>
                      <Ionicons
                        name={isEdit ? 'create-outline' : 'receipt-outline'}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>
                        {isEdit ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        Kelola pilihan bumbu dan topping
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color="#78665E" />
                  </TouchableOpacity>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={15} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Body Form dengan Scroll lancar */}
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formScrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Field 1: Waktu (Tanggal & Jam) */}
                  <View style={styles.rowTwoCols}>
                    <View style={[styles.colFlex, { flex: 1.5 }]}>
                      <Text style={styles.fieldLabel}>Tanggal (Tgl Bln Thn) *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="calendar-outline"
                          size={15}
                          color={WARNA_PRIMARY}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="17 Oktober 2026"
                          placeholderTextColor="#A69A90"
                          value={tanggal}
                          onChangeText={setTanggal}
                        />
                      </View>
                    </View>

                    <View style={[styles.colFlex, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Jam (WIB) *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color="#78665E"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="06:54"
                          placeholderTextColor="#A69A90"
                          value={jam}
                          onChangeText={setJam}
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Field 2: Keterangan (Nama Bahan) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Keterangan (Nama Bahan) *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="restaurant-outline"
                        size={15}
                        color="#78665E"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Contoh: Sosis, Penyedap Rasa, Cabai Rawit"
                        placeholderTextColor="#A69A90"
                        value={keterangan}
                        onChangeText={setKeterangan}
                      />
                    </View>
                  </View>

                  {/* Field 3: Kategori (Bumbu & Topping dengan Dropdown Pemilihan Kategori Topping) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Kategori *</Text>
                    <View style={styles.kategoriPillsRow}>
                      {/* Tombol Bumbu */}
                      <TouchableOpacity
                        style={[
                          styles.kategoriPill,
                          kategori === 'Bumbu' && styles.kategoriPillActive,
                        ]}
                        onPress={() => {
                          setKategori('Bumbu');
                          setToppingDropdownOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="leaf-outline"
                          size={15}
                          color={kategori === 'Bumbu' ? '#FFFFFF' : WARNA_PRIMARY}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.kategoriPillText,
                            kategori === 'Bumbu' && styles.kategoriPillTextActive,
                          ]}
                        >
                          Bumbu
                        </Text>
                      </TouchableOpacity>

                      {/* Tombol Topping (Memunculkan Dropdown Kategori Topping) */}
                      <TouchableOpacity
                        style={[
                          styles.kategoriPill,
                          kategori === 'Topping' && styles.kategoriPillActive,
                        ]}
                        onPress={handleSelectToppingButton}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={toppingDropdownOpen ? 'filter' : 'filter-outline'}
                          size={15}
                          color={kategori === 'Topping' ? '#FFFFFF' : WARNA_PRIMARY}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.kategoriPillText,
                            kategori === 'Topping' && styles.kategoriPillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {kategori === 'Topping' && kategoriTopping
                            ? `Topping (${kategoriTopping})`
                            : 'Topping'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Dropdown Kategori Topping Sesuai Data Proyek */}
                    {toppingDropdownOpen && (
                      <View style={styles.dropdownContainer}>
                        <View style={styles.dropdownHeaderRow}>
                          <Text style={styles.dropdownHeaderTitle}>
                            Pilih Kategori Topping:
                          </Text>
                          <TouchableOpacity
                            onPress={() => setToppingDropdownOpen(false)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close" size={15} color="#78665E" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.dropdownOptionsList}>
                          {VALID_TOPPING_CATEGORIES.map((catName) => {
                            const isSelected =
                              kategori === 'Topping' && kategoriTopping === catName;
                            return (
                              <TouchableOpacity
                                key={catName}
                                style={[
                                  styles.dropdownOptionItem,
                                  isSelected && styles.dropdownOptionItemActive,
                                ]}
                                onPress={() => handleChooseToppingCategory(catName)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.dropdownOptionText,
                                    isSelected && styles.dropdownOptionTextActive,
                                  ]}
                                >
                                  {catName}
                                </Text>
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={15}
                                    color={WARNA_PRIMARY}
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Field 4 & 5: Jumlah dan Satuan */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Jumlah *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Misal: 4 atau 1.5"
                          placeholderTextColor="#A69A90"
                          value={jumlah}
                          onChangeText={setJumlah}
                        />
                      </View>
                    </View>

                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Satuan *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="kg"
                          placeholderTextColor="#A69A90"
                          value={satuan}
                          onChangeText={setSatuan}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Field 6: Supplier */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Supplier *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="storefront-outline"
                        size={15}
                        color="#78665E"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Ketik nama supplier (misal: Toko Sembako Jaya)"
                        placeholderTextColor="#A69A90"
                        value={supplier}
                        onChangeText={setSupplier}
                      />
                    </View>
                  </View>

                  {/* Field 7: Total Pembelian */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Total Pembelian *</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.rpPrefixText}>Rp</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          { fontSize: 15, fontWeight: '700', color: WARNA_PRIMARY },
                        ]}
                        placeholder="Contoh: 190.000"
                        placeholderTextColor="#A69A90"
                        value={total}
                        onChangeText={(txt) => {
                          const clean = txt.replace(/[^0-9]/g, '');
                          if (!clean) {
                            setTotal('');
                          } else {
                            setTotal(Number(clean).toLocaleString('id-ID'));
                          }
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Field 8: Dokumentasi Pembelian (Foto Item & Foto Struk / Nota) */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.docHeaderRow}>
                      <Ionicons name="camera-outline" size={15} color="#78665E" />
                      <Text style={styles.docTitle}>Dokumentasi Pembelian</Text>
                    </View>
                    <Text style={styles.docSubtitle}>
                      Tambahkan foto barang dan bukti transaksi pembelian
                    </Text>

                    <View style={styles.docCardsRow}>
                      {/* Card Foto Item */}
                      <View style={styles.docCard}>
                        {fotoItem ? (
                          <View style={styles.previewBox}>
                            <Image
                              source={{ uri: fotoItem }}
                              style={styles.previewImage}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.removePhotoBtn}
                              onPress={() => setFotoItem('')}
                              activeOpacity={0.8}
                              accessibilityLabel="Hapus foto item"
                            >
                              <Ionicons name="close" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.changePhotoBtn}
                              onPress={() => handlePickImage('item')}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.changePhotoBtnText}>Ganti Foto</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.emptyUploadBox}>
                            <View style={styles.uploadIconBadge}>
                              <Ionicons name="cube-outline" size={22} color="#78665E" />
                            </View>
                            <Text style={styles.uploadTitle}>Foto Item</Text>
                            <Text style={styles.uploadSub}>
                              Unggah foto barang yang dibeli
                            </Text>
                            <TouchableOpacity
                              style={styles.uploadActionButton}
                              onPress={() => handlePickImage('item')}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="arrow-up-circle-outline"
                                size={13}
                                color={WARNA_PRIMARY}
                                style={{ marginRight: 3 }}
                              />
                              <Text style={styles.uploadActionButtonText}>
                                Upload Foto Item
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Card Foto Struk / Nota */}
                      <View style={styles.docCard}>
                        {fotoStruk ? (
                          <View style={styles.previewBox}>
                            <Image
                              source={{ uri: fotoStruk }}
                              style={styles.previewImage}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.removePhotoBtn}
                              onPress={() => setFotoStruk('')}
                              activeOpacity={0.8}
                              accessibilityLabel="Hapus foto struk"
                            >
                              <Ionicons name="close" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.changePhotoBtn}
                              onPress={() => handlePickImage('struk')}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.changePhotoBtnText}>Ganti Foto</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.emptyUploadBox}>
                            <View style={styles.uploadIconBadge}>
                              <Ionicons name="receipt-outline" size={22} color="#78665E" />
                            </View>
                            <Text style={styles.uploadTitle}>Foto Struk / Nota</Text>
                            <Text style={styles.uploadSub}>
                              Unggah foto struk sebagai bukti
                            </Text>
                            <TouchableOpacity
                              style={styles.uploadActionButton}
                              onPress={() => handlePickImage('struk')}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="arrow-up-circle-outline"
                                size={13}
                                color={WARNA_PRIMARY}
                                style={{ marginRight: 3 }}
                              />
                              <Text style={styles.uploadActionButtonText}>
                                Upload Foto Struk
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Footer Modal - fixed at bottom, not cut off */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>

                  <CustomButton
                    title={isEdit ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                    variant="primary"
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '84%',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
    flexShrink: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: WARNA_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#78665E',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 6,
    flexShrink: 0,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  formScrollContent: {
    paddingBottom: 16,
  },
  fieldGroup: {
    marginBottom: 11,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 11,
  },
  colFlex: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B3830',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#2C1810',
    paddingVertical: 0,
  },
  rpPrefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA_PRIMARY,
    marginRight: 6,
  },
  kategoriPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kategoriPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: WARNA_PRIMARY,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
  },
  kategoriPillActive: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
  },
  kategoriPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  kategoriPillTextActive: {
    color: '#FFFFFF',
  },
  dropdownContainer: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 9,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
    marginBottom: 3,
  },
  dropdownHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
  },
  dropdownOptionsList: {
    gap: 2,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  dropdownOptionItemActive: {
    backgroundColor: '#FBEAEC',
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#4B3830',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: WARNA_PRIMARY,
    fontWeight: '700',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  docSubtitle: {
    fontSize: 10.5,
    color: '#78665E',
    marginTop: 1,
    marginBottom: 8,
  },
  docCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  docCard: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 10,
    padding: 8,
    minHeight: 120,
    justifyContent: 'center',
  },
  emptyUploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  uploadIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#F0EAE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2C1810',
    textAlign: 'center',
  },
  uploadSub: {
    fontSize: 9.5,
    color: '#78665E',
    textAlign: 'center',
    marginTop: 1,
    marginBottom: 6,
    lineHeight: 12,
  },
  uploadActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WARNA_PRIMARY,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    backgroundColor: '#FFFFFF',
  },
  uploadActionButtonText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  previewBox: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 75,
    borderRadius: 7,
    backgroundColor: '#EDE5E0',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  changePhotoBtn: {
    marginTop: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: '#EDE5E0',
  },
  changePhotoBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B3830',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
    flexShrink: 0,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: '#F3ECE8',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#78665E',
  },
  submitBtn: {
    minWidth: 130,
    height: 38,
    borderRadius: 7,
  },
});
