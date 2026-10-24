import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

export default function RestockModal({
  visible,
  item,
  onClose,
  onSubmitRestock,
}) {
  const [jumlah, setJumlah] = useState('');
  const [supplier, setSupplier] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && item) {
      setJumlah('10');
      setSupplier(item.supplier || 'Pasar Induk Kramat Jati');
      setHargaBeli(String(item.hargaBeli || ''));
      setError('');
    }
  }, [visible, item]);

  if (!item) return null;

  const currentSisa = item.sisa || 0;
  const jumlahNum = parseFloat(jumlah) || 0;
  const newSisa = currentSisa + jumlahNum;
  const hargaBeliNum = parseFloat(hargaBeli) || 0;
  const totalBiaya = jumlahNum * hargaBeliNum;

  let newStatus = 'Aman';
  if (newSisa <= 0) newStatus = 'Habis';
  else if (newSisa <= item.minimum) newStatus = 'Menipis';

  const handleConfirm = () => {
    if (!jumlah.trim() || isNaN(jumlahNum) || jumlahNum <= 0) {
      setError('Masukkan jumlah restok yang valid (angka > 0)!');
      return;
    }

    const restockRecord = {
      tanggal: '24 Okt 2026',
      jumlah: jumlahNum,
      supplier: supplier.trim() || item.supplier || 'Supplier Langganan',
      hargaBeli: hargaBeliNum,
      pic: 'Dewi (Owner)',
    };

    onSubmitRestock(item.id, jumlahNum, restockRecord);
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
        style={styles.backdrop}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="add-circle" size={24} color="#C62828" />
              </View>
              <View>
                <Text style={styles.title}>Aksi Restok Bahan</Text>
                <Text style={styles.subtitle}>{item.nama}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#78665E" />
            </TouchableOpacity>
          </View>

          {/* Current vs After Restock Banner */}
          <View style={styles.compareBanner}>
            <View style={styles.compareCol}>
              <Text style={styles.compareLabel}>Stok Saat Ini</Text>
              <Text style={styles.compareVal}>
                {currentSisa} {item.satuan}
              </Text>
              <StatusBadge status={item.sisa <= 0 ? 'Habis' : item.sisa <= item.minimum ? 'Menipis' : 'Aman'} size="sm" />
            </View>

            <Ionicons name="arrow-forward" size={20} color="#A89A92" style={{ marginTop: 12 }} />

            <View style={styles.compareCol}>
              <Text style={styles.compareLabel}>Setelah Restok</Text>
              <Text style={[styles.compareVal, { color: '#168653' }]}>
                {newSisa} {item.satuan}
              </Text>
              <StatusBadge status={newStatus} size="sm" />
            </View>
          </View>

          {/* Input Form */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Jumlah Restok Masuk ({item.satuan}) <Text style={{ color: '#C62828' }}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="cube-outline" size={18} color="#8D7B70" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: 10"
                placeholderTextColor="#A89A92"
                keyboardType="numeric"
                value={jumlah}
                onChangeText={(val) => {
                  setJumlah(val);
                  setError('');
                }}
              />
              <Text style={styles.unitSuffix}>{item.satuan}</Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Supplier Pengirim</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="storefront-outline" size={18} color="#8D7B70" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Nama Toko/Supplier"
                placeholderTextColor="#A89A92"
                value={supplier}
                onChangeText={setSupplier}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Harga Beli / Satuan (Rp)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="cash-outline" size={18} color="#8D7B70" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#A89A92"
                keyboardType="numeric"
                value={hargaBeli}
                onChangeText={setHargaBeli}
              />
            </View>
          </View>

          {/* Total Cost Summary */}
          {totalBiaya > 0 && (
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Estimasi Total Belanja Bahan:</Text>
              <Text style={styles.totalValue}>
                Rp {totalBiaya.toLocaleString('id-ID')}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm} activeOpacity={0.8}>
              <Ionicons name="bag-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitText}>Simpan Stok Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FBEAEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C1810',
  },
  subtitle: {
    fontSize: 12,
    color: '#78665E',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
  },
  compareBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8F5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCE7DF',
    marginBottom: 16,
  },
  compareCol: {
    alignItems: 'center',
    gap: 4,
  },
  compareLabel: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: '600',
  },
  compareVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 5,
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
  input: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
  },
  unitSuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8D7B70',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '600',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#166534',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE7E2',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F4EFEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78665E',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#C62828',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
