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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';

// Kategori HANYA Bumbu dan Topping sesuai instruksi user
const KATEGORI_OPTIONS = ['Bumbu', 'Topping'];

const WARNA_PRIMARY = '#52141D'; // Deep Maroon Project

export default function ExpenseFormModal({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  selectedDateStr = '16 Oktober 2026',
}) {
  const isEdit = !!initialData;

  // Waktu: jam dan tanggal/bulan/tahun
  const [tanggal, setTanggal] = useState(selectedDateStr);
  const [jam, setJam] = useState('09:30');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Bumbu');
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('kg');
  const [supplier, setSupplier] = useState('');
  const [total, setTotal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTanggal(initialData.tanggalStr || selectedDateStr);
        setJam(initialData.waktu || '09:30');
        setKeterangan(initialData.keterangan || '');
        const kat = (initialData.kategori || '').toLowerCase();
        setKategori(kat.includes('bumbu') ? 'Bumbu' : 'Topping');
        setJumlah(initialData.jumlah != null ? String(initialData.jumlah) : '');
        setSatuan(initialData.satuan || 'kg');
        setSupplier(initialData.supplier || '');
        const rawNom = initialData.nominal != null ? initialData.nominal : initialData.total || 0;
        setTotal(rawNom ? Number(rawNom).toLocaleString('id-ID') : '');
      } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTanggal(selectedDateStr);
        setJam(`${hh}:${mm}`);
        setKeterangan('');
        setKategori('Bumbu');
        setJumlah('');
        setSatuan('kg');
        setSupplier('');
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
      jumlah: jumlah.trim(),
      satuan: satuan.trim(),
      supplier: supplier.trim(),
      total: parsedTotal,
      nominal: parsedTotal,
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
                        name={isEdit ? 'create-outline' : 'receipt-outline'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>
                        {isEdit ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        Kategori bahan bumbu dan topping
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
                  {/* Field 1: Waktu (Tanggal, Bulan, Tahun & Jam) */}
                  <View style={styles.rowTwoCols}>
                    <View style={[styles.colFlex, { flex: 1.6 }]}>
                      <Text style={styles.fieldLabel}>Tanggal (Tgl Bln Thn) *</Text>
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

                    <View style={[styles.colFlex, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Jam (WIB) *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#78665E"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="09:30"
                          placeholderTextColor="#A69A90"
                          value={jam}
                          onChangeText={setJam}
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Field 2: Keterangan (Nama bahan seperti sosis atau penyedap) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Keterangan (Nama Bahan) *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="restaurant-outline"
                        size={16}
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

                  {/* Field 3: Kategori (Hanya Bumbu dan Topping) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Kategori *</Text>
                    <View style={styles.kategoriPillsRow}>
                      {KATEGORI_OPTIONS.map((cat) => {
                        const isSelected = kategori === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.kategoriPill,
                              isSelected && styles.kategoriPillActive,
                            ]}
                            onPress={() => setKategori(cat)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={cat === 'Bumbu' ? 'leaf-outline' : 'pizza-outline'}
                              size={16}
                              color={isSelected ? '#FFFFFF' : WARNA_PRIMARY}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[
                                styles.kategoriPillText,
                                isSelected && styles.kategoriPillTextActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Field 4 & 5: Jumlah dan Satuan (Tanpa tulisan manual pada label) */}
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
                          placeholder="kg, gram, bungkus, pack"
                          placeholderTextColor="#A69A90"
                          value={satuan}
                          onChangeText={setSatuan}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Field 6: Supplier (Input Manual Bebas) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Supplier *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="storefront-outline"
                        size={16}
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
                          { fontSize: 16, fontWeight: '700', color: WARNA_PRIMARY },
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
                </ScrollView>

                {/* Footer Modal */}
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
    padding: 16,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 480,
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
  },
  modalSubtitle: {
    fontSize: 12,
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
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  formScrollContent: {
    paddingBottom: 16,
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
    fontWeight: '600',
    color: '#4B3830',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E6DFDA',
    borderRadius: 9,
    paddingHorizontal: 12,
    height: 42,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
    paddingVertical: 0,
  },
  rpPrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: WARNA_PRIMARY,
    marginRight: 6,
  },
  kategoriPillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kategoriPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: WARNA_PRIMARY,
    backgroundColor: '#FFFFFF',
  },
  kategoriPillActive: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
  },
  kategoriPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA_PRIMARY,
  },
  kategoriPillTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F3ECE8',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78665E',
  },
  submitBtn: {
    minWidth: 140,
    height: 40,
    borderRadius: 8,
  },
});
