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

const TOPPING_OPTIONS = [
  'Kerupuk',
  'Sosis',
  'Bakso',
  'Ceker',
  'Tahu',
  'Makaroni',
  'Jamur Enoki',
  'Dumpling Keju',
  'Cuanki',
  'Telur',
];

const SATUAN_OPTIONS = ['kg', 'pcs', 'pack'];
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
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('kg');
  const [total, setTotal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const totalInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTanggal(initialData.tanggalStr || selectedDateStr);
        setWaktu(initialData.waktu || '08:30');
        setKeterangan(initialData.keterangan || '');
        setJumlah(initialData.jumlah ? String(initialData.jumlah) : '');
        setSatuan(initialData.satuan || 'kg');
        setTotal(initialData.total ? Number(initialData.total).toLocaleString('id-ID') : '');
      } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTanggal(selectedDateStr);
        setWaktu(`${hh}:${mm}`);
        setKeterangan('');
        setJumlah('');
        setSatuan('kg');
        setTotal('');
      }
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
                  showsVerticalScrollIndicator={false}
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

                  {/* Field 2: Jenis Topping (Pengganti Keterangan Pengeluaran) */}
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
                        placeholder="Ketik atau pilih jenis topping (misal: Bakso)"
                        placeholderTextColor="#A69A90"
                        value={keterangan}
                        onChangeText={setKeterangan}
                      />
                    </View>
                  </View>

                  {/* Field 3: Jumlah & Satuan */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colFlex}>
                      <Text style={styles.fieldLabel}>Jumlah (kg) *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Contoh: 2"
                          placeholderTextColor="#A69A90"
                          value={jumlah}
                          onChangeText={setJumlah}
                          keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                          inputMode="decimal"
                          editable={true}
                        />
                      </View>
                    </View>

                    <View style={[styles.colFlex, { maxWidth: 120 }]}>
                      <Text style={styles.fieldLabel}>Satuan</Text>
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

                  {/* Quick Satuan Chips */}
                  <View style={styles.satuanChipRow}>
                    {SATUAN_OPTIONS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.satuanChip,
                          satuan.toLowerCase() === item && styles.satuanChipActive,
                        ]}
                        onPress={() => setSatuan(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.satuanChipText,
                            satuan.toLowerCase() === item &&
                              styles.satuanChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

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
    maxWidth: 480,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 14,
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
  chipsHelperText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78665E',
    marginTop: 8,
    marginBottom: 6,
  },
  toppingChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toppingChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: '#E8DCD4',
  },
  toppingChipActive: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
  },
  toppingChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55453E',
  },
  toppingChipTextActive: {
    color: '#FFFFFF',
  },
  satuanChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: -6,
    marginBottom: 14,
  },
  satuanChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
    borderWidth: 1,
    borderColor: '#E8DCD4',
  },
  satuanChipActive: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
  },
  satuanChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
  },
  satuanChipTextActive: {
    color: '#FFFFFF',
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
