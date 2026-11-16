
import { Alert } from '../../utils/dialog';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import StockProgressBar from './StockProgressBar';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(
    typeof value === 'string' ? value.replace(',', '.') : value
  );

  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatRupiah = (value) =>
  `Rp ${toNumber(value).toLocaleString('id-ID')}`;

const formatJumlah = (value) =>
  toNumber(value).toLocaleString('id-ID', {
    maximumFractionDigits: 2,
  });

const getJenisStok = (item) => {
  const jenis = String(item?.jenisStok || '').toLowerCase();
  const kategori = String(item?.kategori || '').toLowerCase();
  const id = String(item?.id || '').toUpperCase();

  if (
    jenis === 'bumbu' ||
    kategori.includes('bumbu') ||
    kategori.includes('bahan dasar') ||
    id.startsWith('STK-BAHAN-')
  ) {
    return 'Bumbu';
  }

  return 'Topping';
};

const getTimestamp = (record) => {
  if (record.timestamp) {
    const timestamp = Number(record.timestamp);
    if (Number.isFinite(timestamp)) return timestamp;
  }

  if (record.createdAt) {
    const timestamp = new Date(record.createdAt).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }

  return 0;
};

const getImageSource = (foto) => {
  if (!foto) return null;

  if (typeof foto === 'number') return foto;

  if (typeof foto === 'string') {
    return foto.trim() ? { uri: foto } : null;
  }

  if (typeof foto === 'object' && foto.uri) {
    return foto;
  }

  return null;
};

export default function StockDetailModal({
  visible,
  item,
  onClose,
  onSavePengaturan,
}) {
  const [hargaJual, setHargaJual] = useState('');
  const [pemakaian, setPemakaian] = useState('');
  const [saving, setSaving] = useState(false);

  const satuan = String(item?.satuan || 'pcs').toLowerCase();
  const menggunakanKg = satuan === 'kg';

  useEffect(() => {
    if (!visible || !item) return;

    setHargaJual(
      item.hargaJual != null
        ? String(item.hargaJual)
        : ''
    );

    setPemakaian(
      item.jumlahPerPorsi != null
        ? menggunakanKg
          ? String(Number(item.jumlahPerPorsi) * 1000)
          : String(item.jumlahPerPorsi)
        : ''
    );
  }, [
    visible,
    item?.id,
    item?.hargaJual,
    item?.jumlahPerPorsi,
  ]);

  if (!item) return null;

  const sisa = Math.max(0, toNumber(item.sisa));
  const minimum = Math.max(0, toNumber(item.minimum, 1));
  const stokAwal = Math.max(0, toNumber(item.stokAwal, sisa));
  const hargaBeli = Math.max(0, toNumber(item.hargaBeli));
  const nilaiPersediaan = sisa * hargaBeli;

  const status =
    sisa <= 0
      ? 'Habis'
      : sisa <= minimum
        ? 'Menipis'
        : 'Aman';

  const jenisStok = getJenisStok(item);
  const imageSource = getImageSource(item.foto || item.image);

  const riwayatRestok = Array.isArray(item.riwayatRestok)
    ? item.riwayatRestok
    : [];

  const riwayatOpname = Array.isArray(item.riwayatOpname)
    ? item.riwayatOpname
    : [];

  const riwayatGabungan = [
    ...riwayatRestok.map((record, index) => ({
      ...record,
      id: record.id || `restok-${index}`,
      jenis: 'Stok Masuk',
      jumlahPerubahan: toNumber(record.jumlah),
      timestampUrut: getTimestamp(record),
    })),

    ...riwayatOpname.map((record, index) => ({
      ...record,
      id: record.id || `opname-${index}`,
      jenis: 'Stock Opname',
      jumlahPerubahan: toNumber(record.selisih),
      timestampUrut: getTimestamp(record),
    })),
  ].sort((a, b) => b.timestampUrut - a.timestampUrut);

  const nilaiPemakaian = toNumber(pemakaian);
  const hargaJualNumber = toNumber(hargaJual, NaN);

  const pemakaianDalamSatuanStok = menggunakanKg
    ? nilaiPemakaian / 1000
    : nilaiPemakaian;

  const estimasiPcs =
    pemakaianDalamSatuanStok > 0
      ? Math.floor(sisa / pemakaianDalamSatuanStok)
      : 0;

  const renderHistoryIcon = (jenis, jumlah) => {
    if (jenis === 'Stok Masuk') {
      return {
        icon: 'arrow-down-circle-outline',
        color: '#168653',
        background: '#EAF6EE',
      };
    }

    if (jumlah < 0) {
      return {
        icon: 'arrow-up-circle-outline',
        color: '#C62828',
        background: '#FBEAEC',
      };
    }

    return {
      icon: 'clipboard-outline',
      color: '#95651B',
      background: '#FFF5DE',
    };
  };

  const handleSavePengaturan = async () => {
    if (typeof onSavePengaturan !== 'function') {
      Alert.alert(
        'Belum terhubung',
        'Penyimpanan belum dihubungkan ke halaman Stok Bahan.'
      );
      return;
    }

    if (!Number.isFinite(hargaJualNumber) || hargaJualNumber <= 0) {
      Alert.alert(
        'Validasi',
        'Harga jual harus lebih dari 0.'
      );
      return;
    }

    if (
      !Number.isFinite(nilaiPemakaian) ||
      nilaiPemakaian <= 0
    ) {
      Alert.alert(
        'Validasi',
        'Pemakaian per pcs harus lebih dari 0.'
      );
      return;
    }

    setSaving(true);

    try {
      await onSavePengaturan(item, {
        hargaJual: Number(hargaJual),
        jumlahPerPorsi: Number(jumlahPerPorsi),
      });

      Alert.alert(
        'Berhasil',
        'Pengaturan topping berhasil disimpan.'
      );
    } catch (error) {
      Alert.alert(
        'Gagal menyimpan',
        error?.message || 'Pengaturan topping gagal disimpan.'
      );
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
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                Detail Persediaan
              </Text>

              <Text style={styles.headerSubtitle}>
                Informasi dan pergerakan stok bahan
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={21}
                color="#78665E"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Identitas bahan */}
            <View style={styles.identityCard}>
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.itemPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={27}
                    color="#A89A92"
                  />

                  <Text style={styles.photoPlaceholderText}>
                    Foto belum tersedia
                  </Text>
                </View>
              )}

              <View style={styles.identityInfo}>
                <Text style={styles.itemName}>
                  {item.nama || 'Tanpa nama'}
                </Text>

                <Text style={styles.itemCategory}>
                  {jenisStok} · {item.kategori || 'Tanpa kategori'}
                </Text>

                <Text style={styles.itemId}>
                  ID: {item.id || '-'}
                </Text>

                <View style={styles.badgeWrap}>
                  <StatusBadge status={status} size="sm" />
                </View>
              </View>
            </View>

            {/* Kondisi stok */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Kondisi Persediaan
              </Text>

              <View style={styles.stockMainCard}>
                <View style={styles.stockMainTop}>
                  <View>
                    <Text style={styles.stockMainLabel}>
                      Stok tersedia
                    </Text>

                    <View style={styles.stockNumberRow}>
                      <Text
                        style={[
                          styles.stockNumber,
                          status === 'Habis' && { color: '#DC2626' },
                          status === 'Menipis' && { color: '#B45309' },
                        ]}
                      >
                        {formatJumlah(sisa)}
                      </Text>

                      <Text style={styles.stockUnit}>
                        {satuan}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.minimumBox}>
                    <Text style={styles.minimumLabel}>
                      Batas minimum
                    </Text>

                    <Text style={styles.minimumValue}>
                      {formatJumlah(minimum)} {satuan}
                    </Text>
                  </View>
                </View>

                <StockProgressBar
                  current={sisa}
                  max={Math.max(stokAwal, minimum * 2, sisa, 1)}
                  status={status}
                  height={9}
                  showPercentage
                />

                <Text style={styles.stockHint}>
                  {status === 'Habis'
                    ? 'Stok bahan sudah habis. Segera lakukan pembelian.'
                    : status === 'Menipis'
                      ? 'Stok sudah mencapai batas minimum. Pertimbangkan untuk restok.'
                      : 'Jumlah stok masih berada di atas batas minimum.'}
                </Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Ionicons
                    name="wallet-outline"
                    size={17}
                    color="#8D3D2E"
                  />

                  <Text style={styles.metricLabel}>
                    Harga beli terakhir
                  </Text>

                  <Text style={styles.metricValue}>
                    {formatRupiah(hargaBeli)}
                  </Text>

                  <Text style={styles.metricUnit}>
                    per {satuan}
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Ionicons
                    name="cube-outline"
                    size={17}
                    color="#168653"
                  />

                  <Text style={styles.metricLabel}>
                    Nilai persediaan
                  </Text>

                  <Text style={styles.metricValue}>
                    {formatRupiah(nilaiPersediaan)}
                  </Text>

                  <Text style={styles.metricUnit}>
                    estimasi nilai stok
                  </Text>
                </View>
              </View>
            </View>

            {/* Informasi pembelian */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Informasi Pembelian
              </Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="storefront-outline"
                      size={17}
                      color="#8D7B70"
                    />
                  </View>

                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>
                      Supplier
                    </Text>

                    <Text style={styles.infoValue}>
                      {item.supplier || 'Belum dicatat'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="pricetag-outline"
                      size={17}
                      color="#8D7B70"
                    />
                  </View>

                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>
                      Harga perolehan terakhir
                    </Text>

                    <Text style={styles.infoValue}>
                      {formatRupiah(hargaBeli)} / {satuan}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Pengaturan penjualan */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Pengaturan Penjualan
              </Text>

              <View style={styles.infoCard}>
                <Text style={styles.inputLabel}>
                  Harga jual per pcs (Rp)
                </Text>

                <TextInput
                  style={styles.input}
                  value={hargaJual}
                  onChangeText={setHargaJual}
                  keyboardType="numeric"
                  placeholder="Contoh: 2000"
                  placeholderTextColor="#A89A92"
                />

                <Text style={styles.inputLabel}>
                  Pemakaian bahan per pcs ({menggunakanKg ? 'gram' : 'pcs'})
                </Text>

                <TextInput
                  style={styles.input}
                  value={pemakaian}
                  onChangeText={setPemakaian}
                  keyboardType="decimal-pad"
                  placeholder={menggunakanKg ? 'Contoh: 50' : 'Contoh: 1'}
                  placeholderTextColor="#A89A92"
                />

                <Text style={styles.stockHint}>
                  {menggunakanKg
                    ? 'Masukkan berat dalam gram. Sistem akan mengonversinya ke kg untuk pencatatan stok.'
                    : 'Masukkan jumlah pcs yang digunakan untuk satu porsi.'}
                </Text>

                <View style={styles.estimateBox}>
                  <Text style={styles.estimateLabel}>
                    Estimasi topping yang dapat dijual
                  </Text>

                  <Text style={styles.estimateValue}>
                    {formatJumlah(estimasiPcs)} pcs
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving && { opacity: 0.6 },
                  ]}
                  onPress={handleSavePengaturan}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="save-outline"
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Riwayat pergerakan stok */}
            <View style={styles.section}>
              <View style={styles.historyHeading}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Riwayat Pergerakan Stok
                  </Text>

                  <Text style={styles.historySubtitle}>
                    Catatan stok masuk dan penyesuaian
                  </Text>
                </View>

                <View style={styles.historyCount}>
                  <Text style={styles.historyCountText}>
                    {riwayatGabungan.length}
                  </Text>
                </View>
              </View>

              {riwayatGabungan.length > 0 ? (
                riwayatGabungan.map((record) => {
                  const iconStyle = renderHistoryIcon(
                    record.jenis,
                    record.jumlahPerubahan
                  );

                  const isRestok = record.jenis === 'Stok Masuk';
                  const isPositive = record.jumlahPerubahan > 0;

                  return (
                    <View
                      key={record.id}
                      style={styles.historyCard}
                    >
                      <View
                        style={[
                          styles.historyIcon,
                          {
                            backgroundColor: iconStyle.background,
                          },
                        ]}
                      >
                        <Ionicons
                          name={iconStyle.icon}
                          size={19}
                          color={iconStyle.color}
                        />
                      </View>

                      <View style={styles.historyContent}>
                        <Text style={styles.historyName}>
                          {record.jenis}
                        </Text>

                        <Text style={styles.historyDate}>
                          {record.tanggal || '-'}
                          {record.waktu ? ` · ${record.waktu}` : ''}
                        </Text>

                        {isRestok && record.supplier ? (
                          <Text style={styles.historyDescription}>
                            Supplier: {record.supplier}
                          </Text>
                        ) : null}

                        {!isRestok && record.catatan ? (
                          <Text style={styles.historyDescription}>
                            {record.catatan}
                          </Text>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.historyAmount,
                          {
                            color: isRestok
                              ? '#168653'
                              : isPositive
                                ? '#168653'
                                : '#C62828',
                          },
                        ]}
                      >
                        {isRestok || isPositive ? '+' : ''}
                        {formatJumlah(record.jumlahPerubahan)} {satuan}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyHistory}>
                  <Ionicons
                    name="time-outline"
                    size={25}
                    color="#B6A9A1"
                  />

                  <Text style={styles.emptyTitle}>
                    Belum ada riwayat stok
                  </Text>

                  <Text style={styles.emptyDescription}>
                    Aktivitas penerimaan dan penyesuaian stok akan muncul di sini.
                  </Text>
                </View>
              )}
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
    backgroundColor: 'rgba(35, 15, 18, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },

  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '93%',
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
    paddingBottom: 13,
    marginBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7E1',
  },

  headerText: { flex: 1 },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#52141D',
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 3,
  },

  closeButton: { padding: 6 },

  content: { flexGrow: 0 },

  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 17,
  },

  itemPhoto: {
    width: 92,
    height: 92,
    borderRadius: 13,
    backgroundColor: '#F4EFEB',
  },

  photoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 13,
    backgroundColor: '#F4EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPlaceholderText: {
    fontSize: 9,
    color: '#A89A92',
    marginTop: 5,
  },

  identityInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },

  itemName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2C1810',
  },

  itemCategory: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 4,
  },

  itemId: {
    fontSize: 9,
    color: '#A89A92',
    marginTop: 4,
  },

  badgeWrap: { marginTop: 7 },

  section: { marginBottom: 17 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#52141D',
  },

  stockMainCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#FAF6F2',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },

  stockMainTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  stockMainLabel: {
    fontSize: 10,
    color: '#78665E',
  },

  stockNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },

  stockNumber: {
    fontSize: 27,
    fontWeight: '900',
    color: '#168653',
  },

  stockUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78665E',
  },

  minimumBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 10,
    padding: 10,
  },

  minimumLabel: {
    fontSize: 9,
    color: '#8D7B70',
  },

  minimumValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
    marginTop: 4,
  },

  stockHint: {
    fontSize: 10,
    lineHeight: 15,
    color: '#78665E',
    marginTop: 9,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },

  metricCard: {
    flex: 1,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    backgroundColor: '#FFFFFF',
  },

  metricLabel: {
    fontSize: 9,
    color: '#8D7B70',
    marginTop: 7,
  },

  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2C1810',
    marginTop: 4,
  },

  metricUnit: {
    fontSize: 9,
    color: '#A89A92',
    marginTop: 3,
  },

  infoCard: {
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 9,
    backgroundColor: '#FFFFFF',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 10,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F8F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: { flex: 1 },

  infoLabel: {
    fontSize: 9,
    color: '#8D7B70',
  },

  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C1810',
    marginTop: 3,
  },

  infoDivider: {
    height: 1,
    backgroundColor: '#F0E7E1',
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52141D',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E8DAD3',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2C1810',
    backgroundColor: '#FFFFFF',
  },

  estimateBox: {
    backgroundColor: '#EAF6EE',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },

  estimateLabel: {
    fontSize: 10,
    color: '#47765A',
  },

  estimateValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#168653',
    marginTop: 4,
  },

  saveButton: {
    backgroundColor: '#8D3D2E',
    borderRadius: 10,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  historyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  historySubtitle: {
    fontSize: 9,
    color: '#A89A92',
    marginTop: 3,
  },

  historyCount: {
    minWidth: 27,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C62828',
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E9E4',
  },

  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyContent: { flex: 1 },

  historyName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C1810',
  },

  historyDate: {
    fontSize: 9,
    color: '#8D7B70',
    marginTop: 3,
  },

  historyDescription: {
    fontSize: 9,
    color: '#A89A92',
    marginTop: 3,
  },

  historyAmount: {
    fontSize: 11,
    fontWeight: '900',
  },

  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 15,
    backgroundColor: '#FAF8F6',
    borderRadius: 12,
  },

  emptyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78665E',
    marginTop: 7,
  },

  emptyDescription: {
    fontSize: 9,
    lineHeight: 14,
    color: '#A89A92',
    textAlign: 'center',
    marginTop: 4,
  },
});
