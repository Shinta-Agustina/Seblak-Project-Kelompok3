import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';

// Pilihan preset foto seblak berkualitas tinggi untuk pengujian cepat
const PRESET_PHOTOS = [
  { nama: 'Kerupuk', uri: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=300&auto=format&fit=crop&q=80' },
  { nama: 'Makaroni', uri: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80' },
  { nama: 'Sosis', uri: 'https://images.unsplash.com/photo-1585325701165-351af916e581?w=300&auto=format&fit=crop&q=80' },
  { nama: 'Bakso', uri: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&auto=format&fit=crop&q=80' },
  { nama: 'Ceker', uri: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=300&auto=format&fit=crop&q=80' },
  { nama: 'Tahu', uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80' },
  { nama: 'Telur', uri: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80' },
];

export default function MenuFormModal({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) {
  const isEdit = Boolean(initialData);

  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [status, setStatus] = useState('Aktif');
  const [image, setImage] = useState('');
  const [errors, setErrors] = useState({});
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama || '');
      setHarga(initialData.harga !== undefined ? String(initialData.harga) : '');
      setStok(initialData.stok !== undefined ? String(initialData.stok) : '');
      setStatus(initialData.status || 'Aktif');
      setImage(initialData.image || '');
    } else {
      resetForm();
    }
    setErrors({});
    setShowPresetPicker(false);
  }, [initialData, visible]);

  const resetForm = () => {
    setNama('');
    setHarga('');
    setStok('');
    setStatus('Aktif');
    setImage('');
    setErrors({});
    setShowPresetPicker(false);
  };

  // Handler pemilihan foto dari perangkat atau Web File Dialog
  const handlePickPhoto = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/jpeg, image/jpg';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            Alert.alert('Ukuran Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            setImage(event.target.result);
            if (errors.image) {
              setErrors((prev) => ({ ...prev, image: null }));
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Pada lingkungan mobile/fallback: buka pemilih preset foto seblak
      setShowPresetPicker(true);
    }
  };

  const validate = () => {
    const newErrors = {};

    // 1. Validasi Nama Menu
    if (!nama || !nama.trim()) {
      newErrors.nama = 'Nama menu wajib diisi.';
    }

    // 2. Validasi Harga
    if (!harga || !String(harga).trim()) {
      newErrors.harga = 'Harga menu wajib diisi.';
    } else {
      const numHarga = Number(harga);
      if (isNaN(numHarga) || numHarga < 0) {
        newErrors.harga = 'Harga harus berupa angka dan tidak boleh negatif.';
      }
    }

    // 3. Validasi Stok
    if (stok === '' || stok === null || stok === undefined || !String(stok).trim()) {
      newErrors.stok = 'Stok menu wajib diisi.';
    } else {
      const numStok = Number(stok);
      if (isNaN(numStok) || numStok < 0) {
        newErrors.stok = 'Stok harus berupa angka dan tidak boleh negatif.';
      }
    }

    // 4. Validasi Foto Menu
    if (!image || !String(image).trim()) {
      newErrors.image = 'Foto menu wajib dipilih.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSubmit({
      nama: nama.trim(),
      harga: Number(harga),
      stok: Number(stok),
      status: status,
      image: image.trim(),
      kategori: 'Topping',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalSheet}
            >
              {/* Handle Bar Sesuai Wireframe */}
              <View style={styles.handleBarWrapper}>
                <View style={styles.handleBar} />
              </View>

              {/* Modal Header: Judul & Tombol Close X */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEdit ? 'Edit Menu' : 'Tambah Menu'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Tutup formulir"
                >
                  <Ionicons name="close" size={22} color="#2C1810" />
                </TouchableOpacity>
              </View>

              {/* Form Content Scrollable */}
              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Field Nama Menu */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Nama Menu <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.nama && styles.inputErrorBorder,
                    ]}
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={18}
                      color="#78665E"
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Masukkan nama menu"
                      placeholderTextColor="#A69A90"
                      value={nama}
                      onChangeText={(text) => {
                        setNama(text);
                        if (errors.nama) {
                          setErrors((prev) => ({ ...prev, nama: null }));
                        }
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.nama && (
                    <Text style={styles.errorText}>{errors.nama}</Text>
                  )}
                </View>

                {/* 2. Field Harga (dengan Suffix Rp) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Harga <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainerWithSuffix,
                      errors.harga && styles.inputErrorBorder,
                    ]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color="#78665E"
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Masukkan harga"
                      placeholderTextColor="#A69A90"
                      value={harga}
                      onChangeText={(text) => {
                        const clean = text.replace(/[^0-9]/g, '');
                        setHarga(clean);
                        if (errors.harga) {
                          setErrors((prev) => ({ ...prev, harga: null }));
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <View style={styles.suffixBox}>
                      <Text style={styles.suffixText}>Rp</Text>
                    </View>
                  </View>
                  {errors.harga && (
                    <Text style={styles.errorText}>{errors.harga}</Text>
                  )}
                </View>

                {/* 3. Field Stok (dengan Suffix pcs) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Stok <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainerWithSuffix,
                      errors.stok && styles.inputErrorBorder,
                    ]}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color="#78665E"
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Masukkan stok"
                      placeholderTextColor="#A69A90"
                      value={stok}
                      onChangeText={(text) => {
                        const clean = text.replace(/[^0-9]/g, '');
                        setStok(clean);
                        if (errors.stok) {
                          setErrors((prev) => ({ ...prev, stok: null }));
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <View style={styles.suffixBox}>
                      <Text style={styles.suffixText}>pcs</Text>
                    </View>
                  </View>
                  {errors.stok && (
                    <Text style={styles.errorText}>{errors.stok}</Text>
                  )}
                </View>

                {/* 4. Field Status (Radio Buttons: Aktif & Nonaktif) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Status <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.radioRow}>
                    {/* Radio Aktif */}
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setStatus('Aktif')}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          status === 'Aktif' && styles.radioCircleSelected,
                        ]}
                      >
                        {status === 'Aktif' && (
                          <View style={styles.radioInnerDot} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          status === 'Aktif' && styles.radioLabelActive,
                        ]}
                      >
                        Aktif
                      </Text>
                    </TouchableOpacity>

                    {/* Radio Nonaktif */}
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setStatus('Nonaktif')}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          status === 'Nonaktif' && styles.radioCircleSelected,
                        ]}
                      >
                        {status === 'Nonaktif' && (
                          <View style={styles.radioInnerDot} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          status === 'Nonaktif' && styles.radioLabelActive,
                        ]}
                      >
                        Nonaktif
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 5. Field Foto Menu (Sesuai Mockup 2 & 3) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Foto Menu <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>

                  {!image ? (
                    /* TAMPILAN TAMBAH MENU: Box Besar Dashed "Pilih Foto" */
                    <TouchableOpacity
                      style={[
                        styles.photoUploadBox,
                        errors.image && styles.inputErrorBorder,
                      ]}
                      onPress={handlePickPhoto}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cameraIconCircle}>
                        <Ionicons name="camera" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.photoUploadTitle}>Pilih Foto</Text>
                      <Text style={styles.photoUploadSubtitle}>
                        JPG, PNG (maks. 2MB)
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    /* TAMPILAN EDIT MENU: Thumbnail Kotak + Tombol "Ganti Foto" */
                    <View style={styles.photoRowContainer}>
                      <View style={styles.photoThumbnailBox}>
                        <Image
                          source={{ uri: image }}
                          style={styles.photoThumbnailImage}
                          resizeMode="cover"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.changePhotoBtn}
                        onPress={handlePickPhoto}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="camera-outline" size={18} color="#2C1810" />
                        <Text style={styles.changePhotoBtnText}>Ganti Foto</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {errors.image && (
                    <Text style={styles.errorText}>{errors.image}</Text>
                  )}
                </View>
              </ScrollView>

              {/* Action Buttons Footer: Batal & Simpan Menu / Simpan Perubahan */}
              <View style={styles.modalFooter}>
                <CustomButton
                  title="Batal"
                  variant="outline"
                  onPress={onClose}
                  style={styles.footerBtn}
                />
                <CustomButton
                  title={isEdit ? 'Simpan Perubahan' : 'Simpan Menu'}
                  variant="primary"
                  loading={loading}
                  onPress={handleSave}
                  style={[styles.footerBtn, styles.saveBtn]}
                />
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  handleBarWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1C7C1',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
    letterSpacing: 0.2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
  },
  formScroll: {
    maxHeight: 460,
  },
  formContent: {
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#C62828',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8CDC7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputContainerWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8CDC7',
    borderRadius: 10,
    height: 46,
    overflow: 'hidden',
    paddingLeft: 12,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    paddingHorizontal: 4,
    height: '100%',
  },
  suffixBox: {
    backgroundColor: '#F4ECE7',
    borderLeftWidth: 1.5,
    borderLeftColor: '#D8CDC7',
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suffixText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78665E',
  },
  inputErrorBorder: {
    borderColor: '#C62828',
    backgroundColor: '#FFF8F8',
  },
  errorText: {
    fontSize: 11,
    color: '#C62828',
    marginTop: 4,
    fontWeight: '600',
  },

  // Radio Buttons Sesuai Wireframe
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 6,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8D7B70',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#52141D',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#52141D',
  },
  radioLabel: {
    fontSize: 14,
    color: '#55453E',
    fontWeight: '500',
  },
  radioLabelActive: {
    color: '#2C1810',
    fontWeight: '700',
  },

  // Foto Menu Tambah (Dashed Box)
  photoUploadBox: {
    borderWidth: 1.5,
    borderColor: '#D8CDC7',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FDFBF9',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#52141D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoUploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 2,
  },
  photoUploadSubtitle: {
    fontSize: 11,
    color: '#8D7B70',
  },

  // Foto Menu Edit (Thumbnail + Tombol Ganti Foto)
  photoRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoThumbnailBox: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D8CDC7',
    overflow: 'hidden',
    backgroundColor: '#F5ECE7',
  },
  photoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D8CDC7',
    backgroundColor: '#FFFFFF',
  },
  changePhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },

  // Preset Selector
  presetToggleRow: {
    marginTop: 10,
  },
  presetToggleText: {
    fontSize: 12,
    color: '#52141D',
    fontWeight: '600',
  },
  presetScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  presetCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#FAF7F5',
  },
  presetCardActive: {
    borderColor: '#52141D',
    backgroundColor: '#FBEAEC',
  },
  presetThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 11,
    color: '#2C1810',
    fontWeight: '600',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE6',
    backgroundColor: '#FFFFFF',
  },
  footerBtn: {
    flex: 1,
    height: 46,
  },
  saveBtn: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
});
