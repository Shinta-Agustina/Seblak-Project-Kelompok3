import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const parseNumber = (value) => {
  const normalized = String(value || '').trim().replace(',', '.');
  if (!normalized) return 0;
  return Number(normalized);
};

const getTanggalISO = (date) => {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, '0');
  const hari = String(date.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${hari}`;
};

export default function RestockModal({
  visible,
  item,
  onClose,
  onSubmitRestock,
}) {
  const [jumlah, setJumlah] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [supplier, setSupplier] = useState('');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setJumlah('');
    setHargaBeli(String(item?.hargaBeli || ''));
    setSupplier(item?.supplier || '');
    setCatatan('');
    setSaving(false);
  }, [visible, item]);

  const qty = parseNumber(jumlah);

  const price = Number(
    String(hargaBeli || '').replace(/[^0-9]/g, '')
  );

  const totalBiaya = useMemo(() => {
    if (!Number.isFinite(qty) || qty <= 0 || price <= 0) return 0;
    return Math.round(qty * price);
  }, [qty, price]);

  const stokSekarang = Number(item?.sisa || 0);
  const stokSetelahPembelian = stokSekarang + (qty > 0 ? qty : 0);

  const handleSave = async () => {
    if (saving) return;

    if (!item?.id) {
      Alert.alert('Bahan belum dipilih', 'Pilih bahan yang akan dibeli.');
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Jumlah belum valid', 'Masukkan jumlah bahan lebih dari 0.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Harga belum valid', 'Masukkan harga beli per satuan.');
      return;
    }

    if (!supplier.trim()) {
      Alert.alert('Supplier belum diisi', 'Masukkan nama supplier atau tempat pembelian.');
      return;
    }

    if (typeof onSubmitRestock !== 'function') {
      Alert.alert(
        'Fungsi belum tersedia',
        'Proses pembelian belum terhubung ke halaman Pengeluaran.'
      );
      return;
    }

    const now = new Date();
    const tanggalISO = getTanggalISO(now);

    const record = {
      id: `PEMBELIAN-${now.getTime()}`,
      tanggal: now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      tanggalISO,
      timestamp: now.toISOString(),
      waktu: now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),

      itemId: item.id,
      nama: item.nama,
      namaBahan: item.nama,
      kategori: item.kategori || 'Bahan',
      jenisStok: item.jenisStok || (
        String(item.id).startsWith('STK-BAHAN-') ? 'bumbu' : 'topping'
      ),

      jumlah: qty,
      satuan: item.satuan || 'pcs',
      hargaBeli: price,
      totalBiaya,
      nominal: totalBiaya,
      total: totalBiaya,

      supplier: supplier.trim(),
      catatan: catatan.trim(),
      keterangan: `Pembelian ${item.nama} (${qty} ${item.satuan || 'pcs'})`,

      jenis: 'Pembelian Persediaan',
      status: 'Selesai',
      sumber: 'Pengeluaran',
      pic: 'Owner',
      metode: 'Tunai',
    };

    try {
      setSaving(true);

      // Hanya satu callback. Parent yang mengurus penambahan stok
      // sekaligus pencatatan pengeluaran.
      await onSubmitRestock(item.id, qty, record);

      setSaving(false);
      onClose?.();
    } catch (error) {
      console.error('Gagal menyimpan pembelian:', error);
      setSaving(false);

      Alert.alert(
        'Gagal menyimpan',
        error?.message || 'Pembelian belum berhasil disimpan. Silakan coba kembali.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={saving ? () => {} : onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart-outline" size={22} color="#C62828" />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title}>Pembelian Bahan</Text>
              <Text style={styles.subtitle}>
                Catat pembelian dan penerimaan bahan satu kali
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Ionicons name="close" size={21} color="#78665E" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.itemInfo}>
              <View style={styles.itemIcon}>
                <Ionicons name="archive-outline" size={20} color="#8D3D2E" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item?.nama || 'Pilih bahan'}</Text>
                <Text style={styles.itemCategory}>
                  {item?.jenisStok || 'Bahan'} · {item?.kategori || 'Tanpa kategori'}
                </Text>
              </View>
            </View>

            <View style={styles.stockSummary}>
              <View style={styles.stockSummaryItem}>
                <Text style={styles.summaryLabel}>Stok saat ini</Text>
                <Text style={styles.summaryValue}>
                  {stokSekarang} {item?.satuan || ''}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.stockSummaryItem}>
                <Text style={styles.summaryLabel}>Setelah pembelian</Text>
                <Text style={[styles.summaryValue, { color: '#168653' }]}>
                  {stokSetelahPembelian} {item?.satuan || ''}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Detail Pembelian</Text>
              <Text style={styles.requiredText}>* Wajib diisi</Text>
            </View>

            <Text style={styles.label}>
              Jumlah bahan diterima ({item?.satuan || '-'}) *
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="scale-outline" size={18} color="#8D7B70" />
              <TextInput
                value={jumlah}
                onChangeText={setJumlah}
                keyboardType="decimal-pad"
                placeholder="Contoh: 5"
                placeholderTextColor="#A89A92"
                style={styles.input}
                editable={!saving}
              />
              <Text style={styles.unitText}>{item?.satuan || ''}</Text>
            </View>

            <Text style={styles.label}>
              Harga beli per {item?.satuan || 'satuan'} *
            </Text>
            <View style={styles.inputWrap}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                value={hargaBeli}
                onChangeText={setHargaBeli}
                keyboardType="numeric"
                placeholder="Contoh: 25000"
                placeholderTextColor="#A89A92"
                style={styles.input}
                editable={!saving}
              />
            </View>

            <Text style={styles.label}>Supplier / Tempat Pembelian *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="storefront-outline" size={18} color="#8D7B70" />
              <TextInput
                value={supplier}
                onChangeText={setSupplier}
                placeholder="Nama supplier atau pasar"
                placeholderTextColor="#A89A92"
                style={styles.input}
                editable={!saving}
              />
            </View>

            <Text style={styles.label}>Catatan Pembelian</Text>
            <TextInput
              value={catatan}
              onChangeText={setCatatan}
              placeholder="Catatan tambahan (opsional)"
              placeholderTextColor="#A89A92"
              style={[styles.input, styles.noteInput]}
              multiline
              textAlignVertical="top"
              editable={!saving}
            />

            <View style={styles.totalCard}>
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>Total nilai pembelian</Text>
                <Text style={styles.totalHint}>
                  Jumlah diterima × harga beli per satuan
                </Text>
              </View>
              <Text style={styles.totalValue}>{formatRupiah(totalBiaya)}</Text>
            </View>

            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={18} color="#95651B" />
              <Text style={styles.noticeText}>
                Pembelian hanya dicatat melalui halaman Pengeluaran.
                Setelah berhasil disimpan, stok akan bertambah otomatis.
                Jangan masukkan pembelian yang sama lagi dari halaman Stok.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveText}>
                {saving ? 'Menyimpan...' : 'Simpan Pembelian'}
              </Text>
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
    backgroundColor: 'rgba(35, 15, 18, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    backgroundColor: '#FFFDFC',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEDDD8',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7E1',
    gap: 10,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: '#52141D' },
  subtitle: { fontSize: 11, color: '#8D7B70', marginTop: 3 },
  closeButton: { padding: 6 },
  scroll: { flexGrow: 0 },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAF6F2',
    marginBottom: 12,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '800', color: '#2C1810' },
  itemCategory: { fontSize: 10, color: '#8D7B70', marginTop: 3 },
  stockSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  stockSummaryItem: { flex: 1, gap: 5 },
  summaryDivider: {
    width: 1,
    backgroundColor: '#EFE7E2',
    marginHorizontal: 12,
  },
  summaryLabel: { fontSize: 10, color: '#8D7B70' },
  summaryValue: { fontSize: 15, fontWeight: '800', color: '#2C1810' },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#52141D' },
  requiredText: { fontSize: 10, color: '#A89A92' },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
    marginBottom: 6,
    marginTop: 3,
  },
  inputWrap: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#E7DAD2',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 11,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: '#2C1810',
    fontSize: 12,
    paddingVertical: 10,
  },
  unitText: { fontSize: 11, color: '#8D7B70', fontWeight: '700' },
  currencyPrefix: { fontSize: 12, color: '#8D7B70', fontWeight: '700' },
  noteInput: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#E7DAD2',
    borderRadius: 9,
    paddingHorizontal: 11,
    backgroundColor: '#FFFFFF',
    marginBottom: 13,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 13,
    backgroundColor: '#F4F8F4',
    borderWidth: 1,
    borderColor: '#DCEBDD',
    borderRadius: 12,
    marginTop: 2,
  },
  totalInfo: { flex: 1 },
  totalLabel: { fontSize: 11, fontWeight: '800', color: '#315B3D' },
  totalHint: { fontSize: 9, color: '#6F8875', marginTop: 4 },
  totalValue: { fontSize: 16, fontWeight: '900', color: '#168653' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 10,
    backgroundColor: '#FFF8E8',
    marginTop: 12,
    marginBottom: 5,
  },
  noticeText: { flex: 1, fontSize: 10, lineHeight: 16, color: '#79591F' },
  footer: {
    flexDirection: 'row',
    gap: 9,
    paddingTop: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E7E1',
  },
  cancelButton: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7DAD2',
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelText: { color: '#78665E', fontSize: 12, fontWeight: '700' },
  saveButton: {
    flex: 1.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});