import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import * as ImagePicker from 'expo-image-picker';

const KATEGORI_OPTIONS = [
  // Kategori topping disamakan dengan TOPPING_CATEGORIES di halaman kasir.
  'Kerupuk & Makaroni',
  'Seafood & Olahan',
  'Daging & Jeroan',
  'Mie & Bihun',
  'Telur & Tahu',
  'Sayur & Jamur',
  'Extra & Taburan',
  // Bahan dasar yang tidak dijual sebagai topping.
  'Bumbu & Kuah',
  'Bahan Dasar',
  'Minuman',
  'Lainnya',
];

const JENIS_STOK_OPTIONS = ['Topping', 'Bumbu'];
const SATUAN_OPTIONS = ['kg', 'gram', 'pcs', 'butir', 'bungkus', 'pack', 'ikat', 'liter', 'ml', 'unit', 'porsi'];

export default function StockFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}) {
  const [nama, setNama] = useState('');
  const [jenisStok, setJenisStok] = useState('Topping');
  const [kategori, setKategori] = useState('Kerupuk & Makaroni');
  const [satuan, setSatuan] = useState('kg');
  const [sisa, setSisa] = useState('');
  const [minimum, setMinimum] = useState('');
  const [supplier, setSupplier] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [foto, setFoto] = useState(null);

  // Visual Focus States
  const [focusedField, setFocusedField] = useState(null);

  // Error States
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setNama(initialData.nama || '');
        setJenisStok(initialData.jenisStok || (['Bumbu & Kuah', 'Bahan Dasar'].includes(initialData.kategori) ? 'Bumbu' : 'Topping'));
        setKategori(initialData.kategori || 'Kerupuk & Makaroni');
        setSatuan(initialData.satuan || 'kg');
        setSisa(String(initialData.sisa ?? ''));
        setMinimum(String(initialData.minimum ?? ''));
        setSupplier(initialData.supplier || '');
        setHargaBeli(String(initialData.hargaBeli ?? ''));
        setFoto(initialData.foto || initialData.image || null);
      } else {
        setNama('');
        setJenisStok('Topping');
        setKategori('Kerupuk & Makaroni');
        setSatuan('kg');
        setSisa('');
        setMinimum('');
        setSupplier('');
        setHargaBeli('');
        setFoto(null);
      }
      setErrors({});
      setFocusedField(null);
    }
  }, [visible, initialData]);

  const handlePilihFoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Izin galeri diperlukan untuk memilih foto bahan.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) setFoto(result.assets[0].uri);
    } catch (error) {
      console.error('Gagal memilih foto bahan:', error);
      alert('Foto gagal dipilih. Silakan coba kembali.');
    }
  };

  // Hitung status preview otomatis
  const sisaNum = parseFloat(sisa) || 0;
  const minNum = parseFloat(minimum) || 0;
  let statusPreview = 'Aman';
  if (sisaNum <= 0) {
    statusPreview = 'Habis';
  } else if (sisaNum <= minNum) {
    statusPreview = 'Menipis';
  }

  const validate = () => {
    const newErrors = {};
    if (!nama.trim()) {
      newErrors.nama = 'Nama bahan wajib diisi!';
    }
    if (sisa === '' || isNaN(sisaNum)) {
      newErrors.sisa = 'Jumlah stok harus angka valid!';
    }
    if (minimum === '' || isNaN(minNum) || minNum <= 0) {
      newErrors.minimum = 'Batas minimum harus angka > 0!';
    }
    if (!supplier.trim()) {
      newErrors.supplier = 'Nama supplier wajib dicatat!';
    }
    if (hargaBeli !== '' && isNaN(parseFloat(hargaBeli))) {
      newErrors.hargaBeli = 'Harga beli harus berupa angka!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const payload = {
      ...(initialData || {}),
      id: initialData?.id || `STK-${Date.now().toString().slice(-4)}`,
      nama: nama.trim(),
      jenisStok,
      kategori: jenisStok === 'Bumbu' && !['Bumbu & Kuah', 'Bahan Dasar', 'Lainnya'].includes(kategori) ? 'Bumbu & Kuah' : kategori,
      satuan,
      sisa: sisaNum,
      minimum: minNum,
      stokAwal: initialData?.stokAwal || sisaNum,
      terpakaiHariIni: initialData?.terpakaiHariIni || 0,
      estimasiHabisHari: minNum > 0 ? Number((sisaNum / (minNum * 0.8 || 1)).toFixed(1)) : 2.0,
      supplier: supplier.trim(),
      hargaBeli: parseFloat(hargaBeli) || 0,
      foto: foto || null,
      riwayatRestok: initialData?.riwayatRestok || [
        {
          tanggal: '24 Okt 2026',
          jumlah: sisaNum,
          supplier: supplier.trim(),
          hargaBeli: parseFloat(hargaBeli) || 0,
          pic: 'Dewi (Owner)',
        },
      ],
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEdit ? 'Ubah Data Bahan' : 'Tambah Bahan Baku Baru'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Manajemen stok prasmanan kedai seblak
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#78665E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Live Status Indicator Box */}
            <View style={styles.previewBox}>
              <View>
                <Text style={styles.previewLabel}>Status Otomatis Sistem:</Text>
                <Text style={styles.previewSub}>
                  Sisa: {sisa || '0'} {satuan} · Min: {minimum || '0'} {satuan}
                </Text>
              </View>
              <StatusBadge status={statusPreview} size="md" />
            </View>

            {/* Field 1: Nama Bahan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Nama Bahan Baku <Text style={styles.req}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'nama' && styles.inputFocused,
                  errors.nama && styles.inputError,
                ]}
              >
                <Ionicons name="fast-food-outline" size={18} color="#8D7B70" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Kerupuk Mawar Pedas / Dumpling Keju"
                  placeholderTextColor="#A89A92"
                  value={nama}
                  onChangeText={(val) => {
                    setNama(val);
                    if (errors.nama) setErrors({ ...errors, nama: null });
                  }}
                  onFocus={() => setFocusedField('nama')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.nama && <Text style={styles.errorText}>{errors.nama}</Text>}
            </View>

            {/* Jenis stok: Topping atau Bumbu */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Jenis Stok</Text>
              <View style={styles.pillsRow}>
                {JENIS_STOK_OPTIONS.map((jenis) => (
                  <TouchableOpacity
                    key={jenis}
                    style={[styles.pill, jenisStok === jenis && styles.pillActive]}
                    onPress={() => {
                      setJenisStok(jenis);
                      setKategori(jenis === 'Bumbu' ? 'Bumbu & Kuah' : 'Kerupuk & Makaroni');
                      setSatuan(jenis === 'Bumbu' ? 'kg' : 'pcs');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, jenisStok === jenis && styles.pillTextActive]}>{jenis}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Field 2: Kategori */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kategori Bahan</Text>
              <View style={styles.pillsRow}>
                {KATEGORI_OPTIONS.filter((kat) => jenisStok === 'Bumbu' ? ['Bumbu & Kuah', 'Bahan Dasar', 'Lainnya'].includes(kat) : !['Bumbu & Kuah', 'Bahan Dasar', 'Minuman'].includes(kat)).map((kat) => (
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

            {/* Foto bahan: upload dari galeri perangkat */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Foto Bahan</Text>
              <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePilihFoto} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={18} color="#8D3D2E" />
                <Text style={styles.photoPickerText}>{foto ? 'Ganti Foto Bahan' : 'Pilih Foto dari Galeri'}</Text>
              </TouchableOpacity>
              {foto ? <Image source={{ uri: foto }} style={styles.photoPreview} resizeMode="cover" /> : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image-outline" size={26} color="#A89A92" />
                  <Text style={styles.photoPlaceholderText}>Belum ada foto bahan</Text>
                </View>
              )}
              {foto ? <TouchableOpacity onPress={() => setFoto(null)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <Text style={{ color: '#C62828', fontWeight: '700' }}>Hapus Foto</Text>
              </TouchableOpacity> : null}
            </View>

            {/* Field 3: Satuan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Satuan Takaran</Text>
              <View style={styles.pillsRow}>
                {SATUAN_OPTIONS.map((sat) => (
                  <TouchableOpacity
                    key={sat}
                    style={[
                      styles.satuanPill,
                      satuan === sat && styles.satuanPillActive,
                    ]}
                    onPress={() => setSatuan(sat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.satuanText,
                        satuan === sat && styles.satuanTextActive,
                      ]}
                    >
                      {sat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Field 4 & 5: Sisa & Batas Minimum (Grid 2 Kolom) */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Sisa Stok ({satuan}) <Text style={styles.req}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'sisa' && styles.inputFocused,
                    errors.sisa && styles.inputError,
                  ]}
                >
                  <Ionicons name="cube-outline" size={18} color="#8D7B70" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#A89A92"
                    keyboardType="numeric"
                    value={sisa}
                    onChangeText={(val) => {
                      setSisa(val);
                      if (errors.sisa) setErrors({ ...errors, sisa: null });
                    }}
                    onFocus={() => setFocusedField('sisa')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.sisa && <Text style={styles.errorText}>{errors.sisa}</Text>}
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Batas Minimum ({satuan}) <Text style={styles.req}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'minimum' && styles.inputFocused,
                    errors.minimum && styles.inputError,
                  ]}
                >
                  <Ionicons name="alert-circle-outline" size={18} color="#8D7B70" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 5"
                    placeholderTextColor="#A89A92"
                    keyboardType="numeric"
                    value={minimum}
                    onChangeText={(val) => {
                      setMinimum(val);
                      if (errors.minimum) setErrors({ ...errors, minimum: null });
                    }}
                    onFocus={() => setFocusedField('minimum')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.minimum && <Text style={styles.errorText}>{errors.minimum}</Text>}
              </View>
            </View>

            {/* Field 6: Supplier */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Supplier Utama <Text style={styles.req}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'supplier' && styles.inputFocused,
                  errors.supplier && styles.inputError,
                ]}
              >
                <Ionicons name="storefront-outline" size={18} color="#8D7B70" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Juragan Kerupuk Barokah / Pasar Induk"
                  placeholderTextColor="#A89A92"
                  value={supplier}
                  onChangeText={(val) => {
                    setSupplier(val);
                    if (errors.supplier) setErrors({ ...errors, supplier: null });
                  }}
                  onFocus={() => setFocusedField('supplier')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.supplier && <Text style={styles.errorText}>{errors.supplier}</Text>}
            </View>

            {/* Field 7: Harga Beli */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Harga Beli / Satuan (Rp)</Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'hargaBeli' && styles.inputFocused,
                  errors.hargaBeli && styles.inputError,
                ]}
              >
                <Ionicons name="cash-outline" size={18} color="#8D7B70" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 22000"
                  placeholderTextColor="#A89A92"
                  keyboardType="numeric"
                  value={hargaBeli}
                  onChangeText={(val) => {
                    setHargaBeli(val);
                    if (errors.hargaBeli) setErrors({ ...errors, hargaBeli: null });
                  }}
                  onFocus={() => setFocusedField('hargaBeli')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.hargaBeli && <Text style={styles.errorText}>{errors.hargaBeli}</Text>}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveText}>
                {isEdit ? 'Perbarui Bahan' : 'Simpan Bahan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
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
  formScroll: {
    maxHeight: 460,
  },
  previewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE7DF',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  previewSub: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  photoPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#E5D8D0', borderRadius: 10, padding: 12, backgroundColor: '#FFF9F5' },
  photoPickerText: { color: '#8D3D2E', fontWeight: '700', fontSize: 12 },
  photoPreview: { width: 120, height: 120, borderRadius: 12, marginTop: 12, backgroundColor: '#F8F5F2' },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 12, marginTop: 12, backgroundColor: '#F8F5F2', borderWidth: 1, borderColor: '#EFE7E2', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoPlaceholderText: { color: '#A89A92', fontSize: 10 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 6,
  },
  req: {
    color: '#C62828',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  inputFocused: {
    borderColor: '#C62828',
    backgroundColor: '#FFFFFF',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '600',
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
    paddingVertical: 5,
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
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFE7E2',
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F4EFEB',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#C62828',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
