import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../../utils/formatCurrency';

export default function DetailTransaksiScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const transaction = route?.params?.transaction || {};
  const items = Array.isArray(transaction.items)
    ? transaction.items
    : Array.isArray(transaction.details)
      ? transaction.details
      : [];

  const orderNumber = transaction.orderNo || transaction.no || transaction.id || '-';
  const total = Number(transaction.total || 0);
  const method = transaction.method || transaction.metode || transaction.paymentMethod || '-';
  const isCash = ['tunai', 'cash'].includes(String(method).toLowerCase());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke daftar"
        >
          <Ionicons name="arrow-back" size={21} color="#C62828" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Detail Transaksi</Text>
          <Text style={styles.subtitle}>Rincian pesanan dan pembayaran</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="receipt-outline" size={25} color="#C62828" />
          </View>
          <Text style={styles.summaryLabel}>Nomor Transaksi</Text>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
          <Text style={styles.totalLabel}>Total Pembayaran</Text>
          <Text style={styles.total}>{formatCurrency(total)}</Text>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={15} color="#217A43" />
            <Text style={styles.statusText}>{transaction.status || 'Transaksi tercatat'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
          <InfoRow label="Meja" value={transaction.tableNo || transaction.meja || transaction.table || '-'} />
          <InfoRow label="Tanggal" value={transaction.date || transaction.tanggal || '-'} />
          <InfoRow label="Waktu" value={transaction.time || transaction.waktu || '-'} />
          <InfoRow label="Kasir" value={transaction.kasir || '-'} />
          <InfoRow label="Kuah" value={transaction.kuah || 'Original'} />
          <InfoRow label="Level pedas" value={`Level ${transaction.pedas ?? 3}`} />
          {!!transaction.catatan && <InfoRow label="Catatan" value={transaction.catatan} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rincian Item</Text>
          {items.length > 0 ? items.map((item, index) => {
            const name = item.name || item.nama || 'Item';
            const qty = Number(item.qty ?? item.quantity ?? 1);
            const price = Number(item.price ?? item.harga ?? 0);
            return (
              <View key={String(item.id ?? `${name}-${index}`)} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{name}</Text>
                  <Text style={styles.itemMeta}>{qty} × {formatCurrency(price)}</Text>
                </View>
                <Text style={styles.itemSubtotal}>{formatCurrency(qty * price)}</Text>
              </View>
            );
          }) : (
            <Text style={styles.emptyText}>Rincian item tidak tersedia untuk data contoh ini.</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Total</Text>
            <Text style={styles.totalRowValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pembayaran</Text>
          <InfoRow label="Metode" value={method} />
          {isCash && <InfoRow label="Uang diterima" value={formatCurrency(Number(transaction.cashPaid ?? transaction.cashAmount ?? 0))} />}
          {isCash && <InfoRow label="Kembalian" value={formatCurrency(Number(transaction.change || 0))} />}
        </View>

        <TouchableOpacity
          style={styles.backToListButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backToListText}>Kembali ke daftar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value ?? '-')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5F2' },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5DF',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 19, fontWeight: '900', color: '#2C1810' },
  subtitle: { marginTop: 3, fontSize: 12, color: '#8D7B70' },
  content: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 20, paddingBottom: 36, gap: 14 },
  contentMobile: { padding: 12, paddingBottom: 28, gap: 12 },
  summaryCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, borderWidth: 1, borderColor: '#EFE7E2' },
  summaryIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 12, color: '#8D7B70', fontWeight: '600' },
  orderNumber: { marginTop: 4, fontSize: 17, fontWeight: '900', color: '#2C1810' },
  totalLabel: { marginTop: 18, fontSize: 12, color: '#8D7B70' },
  total: { marginTop: 3, fontSize: 28, fontWeight: '900', color: '#C62828' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF7EE', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, marginTop: 12 },
  statusText: { fontSize: 11, color: '#217A43', fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EFE7E2' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#2C1810', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F4ECE7' },
  infoLabel: { flex: 1, fontSize: 12, color: '#8D7B70' },
  infoValue: { flex: 1.4, fontSize: 12, color: '#2C1810', fontWeight: '700', textAlign: 'right' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F4ECE7' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 13, fontWeight: '800', color: '#2C1810' },
  itemMeta: { fontSize: 11, color: '#8D7B70', marginTop: 3 },
  itemSubtotal: { fontSize: 13, fontWeight: '800', color: '#2C1810', textAlign: 'right' },
  emptyText: { fontSize: 12, color: '#8D7B70', paddingVertical: 8 },
  divider: { height: 1, backgroundColor: '#EDE5DF', marginVertical: 12 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  totalRowLabel: { fontSize: 14, fontWeight: '800', color: '#2C1810' },
  totalRowValue: { fontSize: 16, fontWeight: '900', color: '#C62828' },
  backToListButton: { minHeight: 48, borderRadius: 12, backgroundColor: '#C62828', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  backToListText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
