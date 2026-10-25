import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import StockProgressBar from './StockProgressBar';

export default function StockDetailModal({
  visible,
  item,
  onClose,
  onOpenRestock,
  onEdit,
  onDelete,
}) {
  if (!item) return null;

  const sisa = item.sisa || 0;
  const minimum = item.minimum || 1;
  const status = sisa <= 0 ? 'Habis' : sisa <= minimum ? 'Menipis' : 'Aman';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.nama}
                </Text>
                <StatusBadge status={status} size="sm" />
              </View>
              <Text style={styles.subtitle}>
                ID: {item.id} · Kategori: {item.kategori}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#78665E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Progress Bar Sisa Stok */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Rasio Ketersediaan Bahan:</Text>
                <Text style={styles.progressValue}>
                  {sisa} / {item.stokAwal || minimum * 2} {item.satuan}
                </Text>
              </View>
              <StockProgressBar
                current={sisa}
                max={item.stokAwal || minimum * 2}
                status={status}
                height={10}
                showPercentage={true}
              />
              <Text style={styles.progressHint}>
                Batas minimum kedai: {minimum} {item.satuan}
              </Text>
            </View>

            {/* 4 Kartu Metrik Rincian */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Stok Awal Hari Ini</Text>
                <Text style={styles.metricVal}>
                  {item.stokAwal || sisa} <Text style={styles.metricUnit}>{item.satuan}</Text>
                </Text>
                <Text style={styles.metricDesc}>Saat kedai buka (09.00)</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Terpakai Hari Ini</Text>
                <Text style={[styles.metricVal, { color: '#C62828' }]}>
                  {item.terpakaiHariIni ?? 0} <Text style={styles.metricUnit}>{item.satuan}</Text>
                </Text>
                <Text style={styles.metricDesc}>Berdasarkan pesanan POS</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Sisa Stok Sekarang</Text>
                <Text style={[styles.metricVal, { color: status === 'Habis' ? '#DC2626' : '#2C1810' }]}>
                  {sisa} <Text style={styles.metricUnit}>{item.satuan}</Text>
                </Text>
                <Text style={styles.metricDesc}>Status fisik di etalase</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Perkiraan Habis</Text>
                <Text style={[styles.metricVal, { color: '#D97706' }]}>
                  {item.estimasiHabisHari ?? 1.5} <Text style={styles.metricUnit}>Hari</Text>
                </Text>
                <Text style={styles.metricDesc}>Analisis laju konsumsi</Text>
              </View>
            </View>

            {/* Info Supplier & Harga Beli */}
            <View style={styles.infoRowCard}>
              <View style={styles.infoItem}>
                <Ionicons name="storefront" size={16} color="#78665E" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Supplier Utama</Text>
                  <Text style={styles.infoValue}>{item.supplier || 'Pasar Tradisional'}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="pricetag" size={16} color="#78665E" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Harga Beli Terakhir</Text>
                  <Text style={styles.infoValue}>
                    Rp {(item.hargaBeli || 0).toLocaleString('id-ID')} / {item.satuan}
                  </Text>
                </View>
              </View>
            </View>

            {/* Riwayat Restok */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Ionicons name="time-outline" size={18} color="#C62828" />
                <Text style={styles.historyTitle}>Riwayat Restok Bahan</Text>
              </View>

              {item.riwayatRestok && item.riwayatRestok.length > 0 ? (
                item.riwayatRestok.map((log, index) => (
                  <View key={index} style={styles.logCard}>
                    <View style={styles.logTop}>
                      <View style={styles.logDateRow}>
                        <Ionicons name="calendar-outline" size={13} color="#8D7B70" />
                        <Text style={styles.logDate}>{log.tanggal}</Text>
                      </View>
                      <Text style={styles.logQty}>
                        +{log.jumlah} {item.satuan}
                      </Text>
                    </View>

                    <View style={styles.logBottom}>
                      <Text style={styles.logSupplier}>
                        {log.supplier} · Rp {(log.hargaBeli || item.hargaBeli || 0).toLocaleString('id-ID')}
                      </Text>
                      <Text style={styles.logPic}>{log.pic || 'Owner'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyLog}>Belum ada riwayat restok tercatat.</Text>
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color="#523C34" />
              <Text style={styles.editText}>Ubah</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restockBtn}
              onPress={() => onOpenRestock(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.restockText}>Restok Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#78665E',
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8F5F2',
  },
  contentScroll: {
    maxHeight: 460,
  },
  progressCard: {
    backgroundColor: '#FFF8F5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCE7DF',
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C62828',
  },
  progressHint: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FAFAF9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  metricLabel: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78665E',
  },
  metricDesc: {
    fontSize: 10,
    color: '#8D7B70',
    marginTop: 4,
  },
  infoRowCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F8F5F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: '#78665E',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    marginTop: 2,
  },
  historySection: {
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  logQty: {
    fontSize: 13,
    fontWeight: '900',
    color: '#168653',
  },
  logBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logSupplier: {
    fontSize: 11,
    color: '#78665E',
  },
  logPic: {
    fontSize: 10,
    color: '#8D7B70',
    backgroundColor: '#F4EFEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyLog: {
    fontSize: 12,
    color: '#8D7B70',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EFE7E2',
    marginTop: 6,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F4EFEB',
    height: 44,
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#523C34',
  },
  restockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#C62828',
    height: 44,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  restockText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});