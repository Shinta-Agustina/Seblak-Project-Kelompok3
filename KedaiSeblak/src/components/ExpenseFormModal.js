import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import formatCurrency from '../utils/formatCurrency';
import { getCategoryBadge } from '../screens/owner/MenuHargaScreen';

const KATEGORI_OPTIONS = [
  'Kerupuk & Makaroni',
  'Seafood & Olahan',
  'Daging & Jeroan',
  'Mie & Bihun',
  'Telur & Tahu',
  'Sayur & Jamur',
];

const EXPENSE_SATUAN_OPTIONS = ['kg', 'pack'];
const WARNA_PRIMARY = '#52141D'; // Deep Maroon Project

export default function ExpenseFormModal({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  selectedDateStr = '16 Oktober 2026',
}) {
  const isEdit = !!initialData;

  const [tanggal, setTanggal] = useState(selectedDateStr);
  const [waktu, setWaktu] = useState('08:30');
  const [keterangan, setKeterangan] = useState(''); // Jenis Topping
  const [kategori, setKategori] = useState('Seafood & Olahan');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('kg');
  const [satuanDropdownOpen, setSatuanDropdownOpen] = useState(false);
  const [total, setTotal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const totalInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTanggal(initialData.tanggalStr || selectedDateStr);
        setWaktu(initialData.waktu || '08:30');
        setKeterangan(initialData.keterangan || '');
        const autoBadge = getCategoryBadge(initialData.kategori, initialData.keterangan);
        const mapBadgeToCat = {
          'Seafood': 'Seafood & Olahan',
          'Kerupuk': 'Kerupuk & Makaroni',
          'Daging': 'Daging & Jeroan',
          'Telur & Tahu': 'Telur & Tahu',
          'Sayur & Jamur': 'Sayur & Jamur',
          'Mie & Bihun': 'Mie & Bihun',
        };
        setKategori(initialData.kategori || mapBadgeToCat[autoBadge.label] || 'Seafood & Olahan');
        setJumlah(initialData.jumlah ? String(initialData.jumlah) : '');
        const rawSat = (initialData.satuan || 'kg').toLowerCase();
        setSatuan(rawSat === 'pack' ? 'pack' : 'kg');
        setTotal(initialData.total ? Number(initialData.total).toLocaleString('id-ID') : '');
      } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTanggal(selectedDateStr);
        setWaktu(`${hh}:${mm}`);
        setKeterangan('');
        setKategori('Seafood & Olahan');
        setJumlah('');
        setSatuan('kg');
        setTotal('');
      }
      setCategoryDropdownOpen(false);
      setSatuanDropdownOpen(false);
      setErrorMsg('');
    }
  }, [visible, initialData, selectedDateStr]);

  const handleSubmit = () => {
    if (!tanggal.trim()) {
      setErrorMsg('Tanggal pengeluaran wajib diisi.');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Jenis topping wajib diisi atau dipilih.');
      return;
    }
    const parsedJumlah = parseFloat(jumlah.replace(',', '.'));
    if (!jumlah || isNaN(parsedJumlah) || parsedJumlah <= 0) {
      setErrorMsg('Jumlah harus berupa angka valid lebih dari 0.');
      return;
    }
    const cleanTotal = total.replace(/[^0-9]/g, '');
    const parsedTotal = parseInt(cleanTotal, 10);
    if (!cleanTotal || isNaN(parsedTotal) || parsedTotal <= 0) {
      setErrorMsg('Nominal pengeluaran harus diisi lebih dari 0.');
      return;
    }

    const payload = {
      ...(initialData || {}),
      tanggalStr: tanggal.trim(),
      waktu: waktu.trim() || '08:00',
      keterangan: keterangan.trim(),
      kategori: kategori,
      jumlah: parsedJumlah,
      satuan: satuan,
      total: parsedTotal,
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
                {/* Header Modal */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.iconBadge}>
                      <Ionicons
                        name={isEdit ? 'create-outline' : 'add-circle-outline'}
                        size={22}
                        color="#FFFFFF"
                      />
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>
                        {isEdit ? 'Edit Pengeluaran Topping' : 'Catat Pengeluaran Topping'}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {isEdit ? 'Ubah rincian pembelian topping' : 'Tambahkan stok pembelian topping seblak'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
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
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Field 1: Tanggal & Waktu (Tanggal sekarang bisa dipilih & diedit) */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Tanggal Pembelian *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={WARNA_PRIMARY}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="16 Oktober 2026"
                          placeholderTextColor="#A69A90"
                          value={tanggal}
                          onChangeText={setTanggal}
                        />
                      </View>
                    </View>

                    <View style={[styles.colFlex, { maxWidth: 110 }]}>
                      <Text style={styles.fieldLabel}>Waktu (WIB)</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#78665E"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="08:30"
                          value={waktu}
                          onChangeText={setWaktu}
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Field 2: Jenis Topping */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Jenis Topping *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="restaurant-outline"
                        size={16}
                        color="#78665E"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Ketik jenis topping (misal: Dumpling Keju)"
                        placeholderTextColor="#A69A90"
                        value={keterangan}
                        onChangeText={setKeterangan}
                      />
                    </View>
                  </View>

                  {/* Field Kategori Topping Sesuai Kasir (Dropdown) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Kategori Topping *</Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        categoryDropdownOpen && styles.dropdownTriggerActive,
                      ]}
                      onPress={() => {
                        setCategoryDropdownOpen((prev) => !prev);
                        setSatuanDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownTriggerLeft}>
                        <Ionicons
                          name="grid-outline"
                          size={16}
                          color="#78665E"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.dropdownSelectedText}>
                          {kategori || 'Pilih Kategori'}
                        </Text>
                      </View>
                      <Ionicons
                        name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#78665E"
                      />
                    </TouchableOpacity>

                    {categoryDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        {KATEGORI_OPTIONS.map((cat) => {
                          const isSelected = kategori === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.dropdownItem,
                                isSelected && styles.dropdownItemActive,
                              ]}
                              onPress={() => {
                                setKategori(cat);
                                setCategoryDropdownOpen(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemText,
                                  isSelected && styles.dropdownItemTextActive,
                                ]}
                              >
                                {cat}
                              </Text>
                              {isSelected && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color={WARNA_PRIMARY}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Field 3: Jumlah & Satuan (Dropdown) */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Jumlah *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Contoh: 2 atau 5"
                          placeholderTextColor="#A69A90"
                          value={jumlah}
                          onChangeText={setJumlah}
                          keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                          inputMode="decimal"
                          editable={true}
                        />
                      </View>
                    </View>

                    <View style={[styles.colFlex, { maxWidth: 130 }]}>
                      <Text style={styles.fieldLabel}>Satuan *</Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownTrigger,
                          satuanDropdownOpen && styles.dropdownTriggerActive,
                        ]}
                        onPress={() => {
                          setSatuanDropdownOpen((prev) => !prev);
                          setCategoryDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownSelectedText}>{satuan}</Text>
                        <Ionicons
                          name={satuanDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#78665E"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {satuanDropdownOpen && (
                    <View style={[styles.dropdownMenu, { marginTop: -6, marginBottom: 14 }]}>
                      {EXPENSE_SATUAN_OPTIONS.map((item) => {
                        const isSelected = satuan.toLowerCase() === item;
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.dropdownItem,
                              isSelected && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setSatuan(item);
                              setSatuanDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isSelected && styles.dropdownItemTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={WARNA_PRIMARY}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Field 4: Nominal / Total Pembelian Topping */}
                  
                {/* Field 4: Nominal / Total Pembelian Topping */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Total Pembelian (Rp) *</Text>

                  <View style={[styles.inputWrapper, styles.moneyInputWrapper]}>
                    <Text style={styles.rpPrefix}>Rp</Text>

                    <TextInput
                      ref={totalInputRef}
                      style={[styles.textInput, styles.moneyTextInput]}
                      placeholder="Masukkan nominal"
                      placeholderTextColor="#A69A90"
                      value={total}
                      onChangeText={(txt) => {
                        const num = txt.replace(/[^0-9]/g, '');
                        setTotal(num ? Number(num).toLocaleString('id-ID') : '');
                      }}
                      keyboardType="numeric"
                      inputMode="numeric"
                      editable={true}
                      selectTextOnFocus={true}
                    />
                  </View>

                  {total !== '' ? (
                    <Text style={styles.helperMoney}>
                      Terbaca: {formatCurrency(
                        parseInt(total.replace(/[^0-9]/g, ''), 10) || 0
                      )}
                    </Text>
                  ) : null}
                </View>

                </ScrollView>

                {/* Footer Action Buttons */}
                <View style={styles.modalFooter}>
                  <CustomButton
                    title="Batal"
                    variant="outline"
                    onPress={onClose}
                    style={styles.footerBtn}
                  />
                  <CustomButton
                    title={isEdit ? 'Simpan Perubahan' : 'Simpan Topping'}
                    variant="primary"
                    onPress={handleSubmit}
                    style={[styles.footerBtn, styles.saveBtn]}
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
    padding: 16,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
    backgroundColor: '#FAF7F5',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: WARNA_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  formScroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  colFlex: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#2C1810',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownTriggerActive: {
    borderColor: WARNA_PRIMARY,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DCD4',
    borderRadius: 10,
    marginTop: 6,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F2',
  },
  dropdownItemActive: {
    backgroundColor: '#FAF7F5',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#55453E',
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: WARNA_PRIMARY,
    fontWeight: '800',
  },
  moneyInputWrapper: {
    borderColor: '#C62828',
    backgroundColor: '#FFFDFD',
  },
  rpPrefix: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    marginRight: 6,
  },
  moneyTextInput: {
    height: '100%',
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  helperMoney: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 4,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EDE5E0',
    backgroundColor: '#FAF7F5',
  },
  footerBtn: {
    flex: 1,
    height: 44,
  },
  saveBtn: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
});
