// Lokasi: src/components/owner/StockEditModal.js
//
// Modal "Edit Detail Stok Bahan":
//   - Harga Jual per pcs        -> stok_bahan.harga_jual
//   - Pemakaian Bahan per pcs   -> resep_menu.jumlah_per_porsi (dalam satuan stok)
//   - Perkiraan ketersediaan    -> dihitung langsung: stok / pemakaian
//
// Props sama dengan StockDetailModal:
//   visible, item, onClose, onSavePengaturan(item, { hargaJual, jumlahPerPorsi })
//
// Field item yang dibaca: nama, sisa, minimum, satuan, hargaJual,
//   jumlahPerPorsi (dalam satuan stok, mis. 0.05 untuk 50 gram dari stok kg),
//   foto / image.

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7B1522',
  primaryDark: '#5E0F1A',
  backdrop: 'rgba(30, 10, 14, 0.55)',
  card: '#FFFFFF',
  text: '#1F1A1A',
  muted: '#4A4244',
  line: '#F1E2DE',
  inputBorder: '#E6D8D4',
  addonBg: '#F7F2F0',
  addonText: '#6B6163',
  photoBg: '#FCE8E4',
  green: '#1E9B4B',
  amber: '#D97A1B',
  red: '#C62828',
  tipBg: '#FFF0E2',
  error: '#C62828',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(
    typeof value === 'string' ? value.replace(',', '.') : value
  );

  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatJumlah = (value) =>
  toNumber(value).toLocaleString('id-ID', { maximumFractionDigits: 2 });

// Satuan yang diketik pemilik vs satuan stok.
// Stok kg  -> pemakaian dalam gram (dibagi 1000 saat disimpan).
// Stok liter -> pemakaian dalam ml.
// Lainnya -> satuan yang sama dengan stok.
const getSatuanPakai = (satuanStok) => {
  const satuan = String(satuanStok || 'pcs').trim().toLowerCase();

  if (['kg', 'kilogram'].includes(satuan)) {
    return { label: 'gram', faktor: 1000 };
  }

  if (['liter', 'l'].includes(satuan)) {
    return { label: 'ml', faktor: 1000 };
  }

  return { label: satuan || 'pcs', faktor: 1 };
};

const getImageSource = (foto) => {
  if (!foto) return null;
  if (typeof foto === 'number') return foto;

  if (typeof foto === 'string') {
    return foto.trim() ? { uri: foto } : null;
  }

  if (typeof foto === 'object' && foto.uri) return foto;

  return null;
};

export default function StockEditModal({
  visible,
  item,
  onClose,
  onSavePengaturan,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 480;

  const [hargaDigits, setHargaDigits] = useState('');
  const [pemakaian, setPemakaian] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const satuanStok = item?.satuan || 'pcs';
  const { label: satuanPakai, faktor } = getSatuanPakai(satuanStok);

  // Isi form setiap kali modal dibuka atau item berganti.
  useEffect(() => {
    if (!visible || !item) return;

    const harga = Number(item.hargaJual);

    setHargaDigits(harga > 0 ? String(Math.round(harga)) : '');

    const perPorsi = Number(item.jumlahPerPorsi);

    setPemakaian(
      perPorsi > 0 ? String(Number((perPorsi * faktor).toFixed(4))) : ''
    );

    setError('');
    setSaving(false);
  }, [visible, item?.id, item?.hargaJual, item?.jumlahPerPorsi, faktor]);

  if (!item) return null;

  const sisa = Math.max(0, toNumber(item.sisa));
  const minimum = Math.max(0, toNumber(item.minimum));
  const imageSource = getImageSource(item.foto || item.image);

  const warnaStok =
    sisa <= 0 ? COLORS.red : sisa <= minimum ? COLORS.amber : COLORS.green;

  const pemakaianAngka = toNumber(pemakaian);
  const pemakaianStok = pemakaianAngka / faktor;

  // +1e-9 menghindari 39,9999999 akibat pecahan desimal
  const estimasi =
    pemakaianStok > 0 ? Math.floor(sisa / pemakaianStok + 1e-9) : 0;

  const hargaTampil = hargaDigits
    ? Number(hargaDigits).toLocaleString('id-ID')
    : '';

  const handleSimpan = async () => {
    setError('');

    const harga = Number(hargaDigits);

    if (!Number.isFinite(harga) || harga <= 0) {
      setError('Harga jual harus lebih dari 0.');
      return;
    }

    if (!Number.isFinite(pemakaianAngka) || pemakaianAngka <= 0) {
      setError('Pemakaian bahan per pcs harus lebih dari 0.');
      return;
    }

    if (typeof onSavePengaturan !== 'function') {
      setError('Penyimpanan belum dihubungkan ke halaman Stok Bahan.');
      return;
    }

    setSaving(true);

    try {
      await onSavePengaturan(item, {
        hargaJual: harga,
        // dibulatkan agar 50 gram menjadi tepat 0.05 kg
        jumlahPerPorsi: Number(pemakaianStok.toFixed(6)),
      });

      if (typeof onClose === 'function') onClose();
    } catch (e) {
      setError(e?.message || 'Pengaturan gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />

            <Text style={styles.headerTitle}>Edit Detail Stok Bahan</Text>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityLabel="Tutup"
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Identitas bahan */}
            <View
              style={[
                styles.identity,
                compact && { flexDirection: 'column', alignItems: 'center' },
              ]}
            >
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.photo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}>
                  <Ionicons name="cube-outline" size={44} color="#C9A9A3" />
                </View>
              )}

              <View
                style={[
                  styles.identityInfo,
                  compact && { alignItems: 'center' },
                ]}
              >
                <Text style={styles.smallLabel}>Nama Bahan</Text>

                <Text style={styles.itemName} numberOfLines={2}>
                  {item.nama || 'Tanpa nama'}
                </Text>

                <Text style={[styles.smallLabel, { marginTop: 12 }]}>
                  Stok Tersedia
                </Text>

                <Text style={[styles.stockValue, { color: warnaStok }]}>
                  {formatJumlah(sisa)} {satuanStok}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Harga jual per pcs */}
            <View style={styles.fieldHeader}>
              <Ionicons
                name="pricetag-outline"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.fieldLabel}>Harga Jual per pcs</Text>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Text style={styles.prefix}>Rp</Text>

                <TextInput
                  style={styles.input}
                  value={hargaTampil}
                  onChangeText={(text) =>
                    setHargaDigits(text.replace(/\D/g, ''))
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#B9ACA8"
                  editable={!saving}
                />
              </View>

              <View style={styles.addon}>
                <Text style={styles.addonText}>/ pcs</Text>
              </View>
            </View>

            {/* Pemakaian bahan per pcs */}
            <View style={[styles.fieldHeader, { marginTop: 18 }]}>
              <Ionicons
                name="scale-outline"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.fieldLabel}>Pemakaian Bahan per pcs</Text>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={pemakaian}
                  onChangeText={(text) =>
                    setPemakaian(text.replace(/[^0-9.,]/g, ''))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#B9ACA8"
                  editable={!saving}
                />
              </View>

              <View style={styles.addon}>
                <Text style={styles.addonText}>{satuanPakai}</Text>
              </View>
            </View>

            {/* Perkiraan ketersediaan */}
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={22} color={COLORS.amber} />

              {pemakaianAngka > 0 ? (
                <Text style={styles.tipText}>
                  Dengan {formatJumlah(sisa)} {satuanStok} stok dan pemakaian{' '}
                  {formatJumlah(pemakaianAngka)} {satuanPakai}/pcs, perkiraan
                  ketersediaan:{' '}
                  <Text style={styles.tipStrong}>
                    {formatJumlah(estimasi)} pcs
                  </Text>
                </Text>
              ) : (
                <Text style={styles.tipText}>
                  Isi pemakaian bahan per pcs untuk melihat perkiraan
                  ketersediaan.
                </Text>
              )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Tombol */}
            <View style={[styles.actions, compact && { gap: 10 }]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  compact && { flex: 1 },
                  saving && { opacity: 0.6 },
                ]}
                onPress={onClose}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  compact && { flex: 1 },
                  saving && { opacity: 0.6 },
                ]}
                onPress={handleSimpan}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveText}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  card: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },

  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  closeButton: {
    padding: 4,
  },

  // Isi
  body: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
  },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  photo: {
    width: 160,
    height: 148,
    borderRadius: 16,
    backgroundColor: COLORS.photoBg,
  },

  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityInfo: {
    flex: 1,
  },

  smallLabel: {
    fontSize: 16,
    color: COLORS.muted,
  },

  itemName: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },

  stockValue: {
    fontSize: 38,
    fontWeight: '900',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 22,
  },

  // Field
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  fieldLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  prefix: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },

  addon: {
    minWidth: 78,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.addonBg,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.inputBorder,
  },

  addonText: {
    fontSize: 18,
    color: COLORS.addonText,
  },

  // Perkiraan
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.tipBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 18,
  },

  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.text,
  },

  tipStrong: {
    fontWeight: '900',
    fontSize: 18,
    color: COLORS.amber,
  },

  error: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },

  // Tombol
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
  },

  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#EBCFC9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  saveText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});