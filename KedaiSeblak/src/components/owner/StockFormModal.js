
import React, { useEffect, useState } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const WARNA = {
  merah: '#C62828',
  merahTua: '#52141D',
  merahMuda: '#FBEAEC',
  latar: '#F8F5F2',
  putih: '#FFFFFF',
  teks: '#2C1810',
  sekunder: '#78665E',
  garis: '#EFE7E2',
  hijau: '#168653',
};

const KATEGORI_TOPPING = [
  'Kerupuk & Makaroni',
  'Seafood',
  'Bakso & Sosis',
  'Sayuran',
  'Jamur',
  'Telur',
  'Lainnya',
];

const KATEGORI_BUMBU = [
  'Bumbu',
  'Bumbu & Kuah',
  'Bahan Dasar',
  'Lainnya',
];

const SATUAN_OPTIONS = [
  'kg',
  'gram',
  'pcs',
  'liter',
  'ml',
  'ikat',
];

const parseAngka = (value) => {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }

  return Number(String(value).trim().replace(',', '.'));
};

export default function StockFormModal({
  visible,
  isEdit = false,
  initialData = null,
  onClose,
  onSubmit,
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
  const [errors, setErrors] = useState({});

  const kategoriOptions =
    jenisStok === 'Bumbu'
      ? KATEGORI_BUMBU
      : KATEGORI_TOPPING;

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      const kategoriAwal = initialData.kategori || '';

      const jenisAwal =
        initialData.jenisStok ||
        (
          ['Bumbu', 'Bumbu & Kuah', 'Bahan Dasar'].includes(
            kategoriAwal
          ) ||
          String(initialData.id || '').startsWith('STK-BAHAN-')
            ? 'Bumbu'
            : 'Topping'
        );

      setNama(initialData.nama || '');
      setJenisStok(jenisAwal);
      setKategori(
        kategoriAwal ||
          (jenisAwal === 'Bumbu'
            ? 'Bumbu'
            : 'Kerupuk & Makaroni')
      );
      setSatuan(initialData.satuan || 'kg');
      setSisa(String(initialData.sisa ?? ''));
      setMinimum(String(initialData.minimum ?? ''));
      setSupplier(initialData.supplier || '');
      setHargaBeli(
        initialData.hargaBeli
          ? String(initialData.hargaBeli)
          : ''
      );
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
  }, [visible, initialData]);

  const handleJenisStok = (jenis) => {
    setJenisStok(jenis);

    if (jenis === 'Bumbu') {
      setKategori('Bumbu');
      setSatuan('kg');
    } else {
      setKategori('Kerupuk & Makaroni');
      setSatuan('kg');
    }
  };

  const handlePilihFoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Izin diperlukan',
          'Izinkan akses galeri untuk memilih foto bahan.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets?.length > 0) {
        setFoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Gagal', 'Foto tidak dapat dipilih.');
    }
  };

  const validasi = () => {
    const errorBaru = {};

    const sisaNum = parseAngka(sisa);
    const minimumNum = parseAngka(minimum);
    const hargaNum = hargaBeli
      ? parseAngka(hargaBeli)
      : 0;

    if (!nama.trim()) {
      errorBaru.nama = 'Nama bahan harus diisi.';
    }

    if (sisa === '' || !Number.isFinite(sisaNum) || sisaNum < 0) {
      errorBaru.sisa = 'Masukkan jumlah stok yang valid.';
    }

    if (
      minimum === '' ||
      !Number.isFinite(minimumNum) ||
      minimumNum <= 0
    ) {
      errorBaru.minimum = 'Stok minimum harus lebih dari 0.';
    }

    if (!supplier.trim()) {
      errorBaru.supplier = 'Nama supplier harus diisi.';
    }

    if (
      hargaBeli &&
      (!Number.isFinite(hargaNum) || hargaNum < 0)
    ) {
      errorBaru.hargaBeli = 'Harga beli tidak valid.';
    }

    setErrors(errorBaru);

    return Object.keys(errorBaru).length === 0;
  };

  const handleSimpan = () => {
    if (!validasi()) return;

    const sisaNum = parseAngka(sisa);
    const minimumNum = parseAngka(minimum);
    const hargaNum = hargaBeli
      ? parseAngka(hargaBeli)
      : 0;

    const kategoriFinal =
      jenisStok === 'Bumbu'
        ? kategori
        : kategori;

    const payload = {
      ...(initialData || {}),

      id:
        initialData?.id ||
        `STK-${Date.now()}`,

      nama: nama.trim(),
      jenisStok,
      kategori: kategoriFinal,
      satuan,
      sisa: sisaNum,
      minimum: minimumNum,

      stokAwal:
        initialData?.stokAwal ??
        sisaNum,

      terpakaiHariIni:
        initialData?.terpakaiHariIni ?? 0,

      estimasiHabisHari:
        initialData?.estimasiHabisHari ?? 0,

      supplier: supplier.trim(),
      hargaBeli: hargaNum,
      foto,

      // Jangan membuat transaksi restok palsu.
      // Riwayat hanya ditambahkan melalui RestockModal.
      riwayatRestok:
        initialData?.riwayatRestok || [],

      riwayatOpname:
        initialData?.riwayatOpname || [],
    };

    onSubmit?.(payload);
  };

  const renderInput = (
    label,
    value,
    setter,
    placeholder,
    error,
    options = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#A99A93"
        keyboardType={options.numeric ? 'decimal-pad' : 'default'}
        style={[
          styles.input,
          error && styles.inputError,
        ]}
      />

      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isEdit ? 'Edit Bahan' : 'Tambah Bahan'}
              </Text>
              <Text style={styles.subtitle}>
                Lengkapi informasi bahan stok.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={22}
                color={WARNA.teks}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Foto Bahan</Text>

            <TouchableOpacity
              style={styles.photoContainer}
              onPress={handlePilihFoto}
              activeOpacity={0.8}
            >
              {foto ? (
                <Image
                  source={
                    typeof foto === 'string'
                      ? { uri: foto }
                      : foto
                  }
                  style={styles.photo}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color={WARNA.sekunder}
                  />
                  <Text style={styles.photoText}>
                    Pilih Foto
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.field}>
              <Text style={styles.label}>Jenis Stok</Text>

              <View style={styles.optionRow}>
                {['Topping', 'Bumbu'].map((jenis) => (
                  <TouchableOpacity
                    key={jenis}
                    onPress={() => handleJenisStok(jenis)}
                    style={[
                      styles.optionButton,
                      jenisStok === jenis &&
                        styles.optionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        jenisStok === jenis &&
                          styles.optionTextActive,
                      ]}
                    >
                      {jenis}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderInput(
              'Nama Bahan',
              nama,
              setNama,
              'Contoh: Kerupuk Mawar',
              errors.nama
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Kategori</Text>

              <View style={styles.categoryGrid}>
                {kategoriOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setKategori(item)}
                    style={[
                      styles.categoryButton,
                      kategori === item &&
                        styles.categoryActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        kategori === item &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Satuan</Text>

              <View style={styles.categoryGrid}>
                {SATUAN_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setSatuan(item)}
                    style={[
                      styles.unitButton,
                      satuan === item && styles.categoryActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        satuan === item &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderInput(
              'Jumlah Stok',
              sisa,
              setSisa,
              'Contoh: 2 atau 0,5',
              errors.sisa,
              { numeric: true }
            )}

            {renderInput(
              'Stok Minimum',
              minimum,
              setMinimum,
              'Contoh: 0,5',
              errors.minimum,
              { numeric: true }
            )}

            {renderInput(
              'Supplier',
              supplier,
              setSupplier,
              'Nama supplier',
              errors.supplier
            )}

            {renderInput(
              'Harga Beli per Satuan',
              hargaBeli,
              setHargaBeli,
              'Contoh: 15000',
              errors.hargaBeli,
              { numeric: true }
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSimpan}
            >
              <Text style={styles.saveText}>
                {isEdit ? 'Simpan Perubahan' : 'Tambah Bahan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: WARNA.latar,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WARNA.teks,
  },
  subtitle: {
    fontSize: 12,
    color: WARNA.sekunder,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WARNA.putih,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: WARNA.teks,
    marginBottom: 8,
  },
  field: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: WARNA.teks,
  },
  inputError: {
    borderColor: WARNA.merah,
  },
  errorText: {
    color: WARNA.merah,
    fontSize: 11,
    marginTop: 5,
  },
  photoContainer: {
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 11,
    color: WARNA.sekunder,
    marginTop: 5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: WARNA.garis,
    backgroundColor: WARNA.putih,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: WARNA.merahMuda,
    borderColor: WARNA.merah,
  },
  optionText: {
    color: WARNA.sekunder,
    fontWeight: '600',
  },
  optionTextActive: {
    color: WARNA.merah,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  unitButton: {
    minWidth: 55,
    alignItems: 'center',
    backgroundColor: WARNA.putih,
    borderWidth: 1,
    borderColor: WARNA.garis,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  categoryActive: {
    backgroundColor: WARNA.merahMuda,
    borderColor: WARNA.merah,
  },
  categoryText: {
    color: WARNA.sekunder,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: WARNA.merah,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: WARNA.garis,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: WARNA.garis,
    backgroundColor: WARNA.putih,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: WARNA.teks,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: WARNA.merah,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: WARNA.putih,
    fontWeight: 'bold',
  },
});
