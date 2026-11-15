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
import { hariIniIndo } from '../services/pengeluaranService';

const WARNA_PRIMARY = '#52141D';

const VALID_TOPPING_CATEGORIES = (
  Array.isArray(TOPPING_CATEGORIES)
    ? TOPPING_CATEGORIES.filter((item) => item !== 'Semua')
    : [
      'Kerupuk & Makaroni',
      'Seafood & Olahan',
      'Daging & Jeroan',
      'Mie & Bihun',
      'Telur & Tahu',
      'Sayur & Jamur',
    ]
);

const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function formatTanggalIndo(value) {
  if (!value) return hariIniIndo();

  const text = String(value);

  // Format database YYYY-MM-DD.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);

    if (month >= 1 && month <= 12) {
      return `${day} ${BULAN_ID[month - 1]} ${year}`;
    }
  }

  // Format 15 November 2026.
  const indo = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(text);

  if (indo) {
    return `${indo[1]} ${indo[2]} ${indo[3]}`;
  }

  return text;
}

function parseNominal(value) {
  if (typeof value === 'number') return value;

  const clean = String(value || '').replace(/[^0-9]/g, '');
  return clean ? Number(clean) : 0;
}

function formatNominal(value) {
  const number = parseNominal(value);
  return number > 0 ? number.toLocaleString('id-ID') : '';
}

export default function ExpenseFormModal({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  selectedDateStr = '',
}) {
  const isEdit = !!initialData;

  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Bumbu');
  const [kategoriTopping, setKategoriTopping] = useState(
    VALID_TOPPING_CATEGORIES[0] || 'Kerupuk & Makaroni'
  );
  const [toppingDropdownOpen, setToppingDropdownOpen] = useState(false);
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('kg');
  const [supplier, setSupplier] = useState('');
  const [total, setTotal] = useState('');
  const [fotoItem, setFotoItem] = useState('');
  const [fotoStruk, setFotoStruk] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setTanggal(
        formatTanggalIndo(
          initialData.tanggalStr ||
          initialData.tanggal ||
          selectedDateStr
        )
      );

      setJam(
        String(initialData.waktu || '00:00')
          .replace(/\s*wib/i, '')
          .slice(0, 5)
      );

      setKeterangan(
        initialData.keterangan ||
        initialData.nama ||
        initialData.nama_pengeluaran ||
        ''
      );

      const kat = String(initialData.kategori || '');
      const isBumbu = kat.toLowerCase().includes('bumbu');

      setKategori(isBumbu ? 'Bumbu' : 'Topping');

      setKategoriTopping(
        initialData.kategoriTopping ||
        (
          VALID_TOPPING_CATEGORIES.includes(kat)
            ? kat
            : VALID_TOPPING_CATEGORIES[0]
        )
      );

      setJumlah(
        initialData.jumlah != null
          ? String(initialData.jumlah)
          : ''
      );

      setSatuan(initialData.satuan || 'kg');
      setSupplier(initialData.supplier || '');

      const nominal =
        initialData.nominal ??
        initialData.total ??
        0;

      setTotal(formatNominal(nominal));
      setFotoItem(initialData.fotoItem || initialData.foto_item || '');
      setFotoStruk(initialData.fotoStruk || initialData.foto_struk || '');
    } else {
      const now = new Date();

      setTanggal(
        formatTanggalIndo(selectedDateStr || hariIniIndo())
      );

      setJam(
        `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`
      );

      setKeterangan('');
      setKategori('Bumbu');
      setKategoriTopping(
        VALID_TOPPING_CATEGORIES[0] || 'Kerupuk & Makaroni'
      );
      setJumlah('');
      setSatuan('kg');
      setSupplier('');
      setTotal('');
      setFotoItem('');
      setFotoStruk('');
    }

    setToppingDropdownOpen(false);
    setErrorMsg('');
    setSaving(false);
  }, [visible, initialData, selectedDateStr]);

  const handlePickImage = async (type) => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');

        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/webp';

        input.onchange = (event) => {
          const file = event.target.files?.[0];

          if (!file) return;

          if (file.size > 5 * 1024 * 1024) {
            Alert.alert(
              'Ukuran Terlalu Besar',
              'Maksimal ukuran foto adalah 5 MB.'
            );
            return;
          }

          const reader = new FileReader();

          reader.onload = (result) => {
            if (type === 'item') {
              setFotoItem(result.target.result);
            } else {
              setFotoStruk(result.target.result);
            }
          };

          reader.readAsDataURL(file);
        };

        input.click();
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Izin Dibutuhkan',
          'Izinkan aplikasi mengakses galeri foto.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          'Ukuran Terlalu Besar',
          'Maksimal ukuran foto adalah 5 MB.'
        );
        return;
      }

      if (type === 'item') {
        setFotoItem(asset.uri);
      } else {
        setFotoStruk(asset.uri);
      }
    } catch (error) {
      console.error('Gagal memilih foto:', error);
      Alert.alert('Gagal', 'Foto tidak dapat dipilih.');
    }
  };

  const handleSubmit = async () => {
    if (saving) return;

    if (!tanggal.trim()) {
      setErrorMsg('Tanggal pembelian wajib diisi.');
      return;
    }

    if (!jam.trim() || !/^\d{2}:\d{2}$/.test(jam.trim())) {
      setErrorMsg('Jam harus menggunakan format HH:MM.');
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg('Nama bahan wajib diisi.');
      return;
    }

    if (!jumlah.trim()) {
      setErrorMsg('Jumlah pembelian wajib diisi.');
      return;
    }

    const jumlahAngka = Number(jumlah.replace(',', '.'));

    if (!Number.isFinite(jumlahAngka) || jumlahAngka <= 0) {
      setErrorMsg('Jumlah harus lebih besar dari 0.');
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

    const parsedTotal = parseNominal(total);

    if (!parsedTotal || parsedTotal <= 0) {
      setErrorMsg('Total pembelian harus lebih dari Rp 0.');
      return;
    }

    const payload = {
      ...(initialData || {}),

      // Nilai tanggal tetap berupa teks Indonesia di form.
      tanggalStr: tanggal.trim(),
      waktu: jam.trim(),

      keterangan: keterangan.trim(),
      nama: keterangan.trim(),

      kategori: kategori.trim(),
      kategoriTopping:
        kategori === 'Topping'
          ? kategoriTopping
          : null,

      jumlah: String(jumlahAngka),
      satuan: satuan.trim(),
      supplier: supplier.trim(),

      // Total disimpan sebagai angka, bukan string Rupiah.
      total: parsedTotal,
      nominal: parsedTotal,

      fotoItem: fotoItem || null,
      fotoStruk: fotoStruk || null,
    };

    try {
      setSaving(true);
      setErrorMsg('');

      await onSubmit(payload);

      onClose();
    } catch (error) {
      console.error('Gagal menyimpan pengeluaran:', error);

      setErrorMsg(
        error?.message ||
        'Gagal menyimpan perubahan pengeluaran.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderPhotoField = (type, photo, title, subtitle) => (
    <View style={styles.docCard}>
      {photo ? (
        <View style={styles.previewBox}>
          <Image
            source={{ uri: photo }}
            style={styles.previewImage}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.removePhotoBtn}
            onPress={() =>
              type === 'item'
                ? setFotoItem('')
                : setFotoStruk('')
            }
          >
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={() => handlePickImage(type)}
          >
            <Text style={styles.changePhotoBtnText}>Ganti Foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyUploadBox}>
          <Ionicons
            name={type === 'item' ? 'cube-outline' : 'receipt-outline'}
            size={25}
            color="#78665E"
          />

          <Text style={styles.uploadTitle}>{title}</Text>
          <Text style={styles.uploadSub}>{subtitle}</Text>

          <TouchableOpacity
            style={styles.uploadActionButton}
            onPress={() => handlePickImage(type)}
          >
            <Text style={styles.uploadActionButtonText}>
              Upload Foto
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.iconBadge}>
                      <Ionicons
                        name={isEdit ? 'create-outline' : 'receipt-outline'}
                        size={19}
                        color="#FFFFFF"
                      />
                    </View>

                    <View>
                      <Text style={styles.modalTitle}>
                        {isEdit ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        Data pembelian bahan dari supplier
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={22} color="#78665E" />
                  </TouchableOpacity>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  <View style={styles.rowTwoCols}>
                    <View style={[styles.colFlex, { flex: 1.5 }]}>
                      <Text style={styles.fieldLabel}>Tanggal Pembelian *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={WARNA_PRIMARY}
                        />
                        <TextInput
                          style={styles.textInput}
                          value={tanggal}
                          onChangeText={setTanggal}
                          placeholder="15 November 2026"
                        />
                      </View>
                    </View>

                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Jam (WIB) *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={WARNA_PRIMARY}
                        />
                        <TextInput
                          style={styles.textInput}
                          value={jam}
                          onChangeText={setJam}
                          placeholder="21:24"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nama Bahan *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="restaurant-outline"
                        size={16}
                        color={WARNA_PRIMARY}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={keterangan}
                        onChangeText={setKeterangan}
                        placeholder="Contoh: Dumpling Keju"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Kategori *</Text>

                    <View style={styles.kategoriPillsRow}>
                      <TouchableOpacity
                        style={[
                          styles.kategoriPill,
                          kategori === 'Bumbu' && styles.kategoriPillActive,
                        ]}
                        onPress={() => {
                          setKategori('Bumbu');
                          setToppingDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.kategoriPillText,
                            kategori === 'Bumbu' && styles.kategoriPillTextActive,
                          ]}
                        >
                          Bumbu
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.kategoriPill,
                          kategori === 'Topping' && styles.kategoriPillActive,
                        ]}
                        onPress={() => {
                          setKategori('Topping');
                          setToppingDropdownOpen((prev) => !prev);
                        }}
                      >
                        <Text
                          style={[
                            styles.kategoriPillText,
                            kategori === 'Topping' && styles.kategoriPillTextActive,
                          ]}
                        >
                          Topping
                        </Text>

                        <Ionicons
                          name="chevron-down"
                          size={14}
                          color={kategori === 'Topping' ? '#FFFFFF' : WARNA_PRIMARY}
                        />
                      </TouchableOpacity>
                    </View>

                    {kategori === 'Topping' && toppingDropdownOpen && (
                      <View style={styles.dropdownContainer}>
                        {VALID_TOPPING_CATEGORIES.map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={styles.dropdownOptionItem}
                            onPress={() => {
                              setKategoriTopping(item);
                              setToppingDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>
                              {item}
                            </Text>

                            {kategoriTopping === item && (
                              <Ionicons
                                name="checkmark-circle"
                                size={17}
                                color={WARNA_PRIMARY}
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {kategori === 'Topping' && (
                      <Text style={styles.selectedCategory}>
                        Subkategori: {kategoriTopping}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rowTwoCols}>
                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Jumlah *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={jumlah}
                          onChangeText={setJumlah}
                          placeholder="Contoh: 3 atau 1,5"
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Satuan *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={satuan}
                          onChangeText={setSatuan}
                          placeholder="kg / pcs"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Supplier *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="storefront-outline"
                        size={16}
                        color={WARNA_PRIMARY}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={supplier}
                        onChangeText={setSupplier}
                        placeholder="Nama supplier"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Total Pembelian *</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.rpPrefixText}>Rp</Text>
                      <TextInput
                        style={[styles.textInput, styles.totalInput]}
                        value={total}
                        onChangeText={(value) => {
                          const clean = value.replace(/[^0-9]/g, '');
                          setTotal(
                            clean
                              ? Number(clean).toLocaleString('id-ID')
                              : ''
                          );
                        }}
                        placeholder="Contoh: 70.000"
                        keyboardType="numeric"
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Total pembelian dapat diubah saat mengedit data.
                    </Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Dokumentasi Pembelian
                    </Text>
                    <Text style={styles.docSubtitle}>
                      Foto barang dan nota pembelian dari supplier.
                    </Text>

                    <View style={styles.docCardsRow}>
                      {renderPhotoField(
                        'item',
                        fotoItem,
                        'Foto Item',
                        'Foto bahan yang dibeli'
                      )}

                      {renderPhotoField(
                        'struk',
                        fotoStruk,
                        'Foto Nota',
                        'Nota dari supplier'
                      )}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={saving}
                  >
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>

                  <CustomButton
                    title={
                      saving
                        ? 'Menyimpan...'
                        : isEdit
                          ? 'Simpan Perubahan'
                          : 'Catat Pengeluaran'
                    }
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={saving}
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
  },
  modalCard: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
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
    fontSize: 11,
    color: '#78665E',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    margin: 12,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12,
  },
  formScroll: {
    flexGrow: 0,
    paddingHorizontal: 17,
  },
  formScrollContent: {
    paddingVertical: 13,
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 13,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 13,
  },
  colFlex: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B3830',
    marginBottom: 5,
  },
  inputWrapper: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
    paddingVertical: 8,
    minWidth: 0,
  },
  totalInput: {
    fontSize: 15,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  rpPrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  helperText: {
    fontSize: 10,
    color: '#78665E',
    marginTop: 4,
  },
  kategoriPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kategoriPill: {
    flex: 1,
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: WARNA_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  kategoriPillActive: {
    backgroundColor: WARNA_PRIMARY,
  },
  kategoriPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  kategoriPillTextActive: {
    color: '#FFFFFF',
  },
  dropdownContainer: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 8,
    padding: 5,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 9,
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#4B3830',
  },
  selectedCategory: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 5,
  },
  docSubtitle: {
    fontSize: 11,
    color: '#78665E',
    marginBottom: 8,
  },
  docCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  docCard: {
    flex: 1,
    minHeight: 130,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 9,
    padding: 8,
    backgroundColor: '#FAFAF9',
  },
  emptyUploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    marginTop: 5,
  },
  uploadSub: {
    fontSize: 10,
    color: '#78665E',
    textAlign: 'center',
    marginVertical: 5,
  },
  uploadActionButton: {
    borderWidth: 1,
    borderColor: WARNA_PRIMARY,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  uploadActionButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  previewBox: {
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 85,
    borderRadius: 7,
    backgroundColor: '#EDE5E0',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    marginTop: 5,
    padding: 5,
    backgroundColor: '#EDE5E0',
    borderRadius: 5,
  },
  changePhotoBtnText: {
    fontSize: 10,
    color: '#4B3830',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
  },
  cancelBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 7,
    backgroundColor: '#F3ECE8',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78665E',
  },
  submitBtn: {
    minWidth: 135,
    height: 39,
    borderRadius: 7,
  },
});
