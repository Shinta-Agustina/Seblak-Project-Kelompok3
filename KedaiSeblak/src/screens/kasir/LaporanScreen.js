import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';
import formatCurrency from '../../utils/formatCurrency';

function SimpleBarChart({ data, maxValue }) {
  return (
    <View style={styles.chartContainer}>
      {data.map((item, idx) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <View key={idx} style={styles.chartRow}>
            <Text style={styles.chartLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartBar, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.chartVal}>{item.display}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function LaporanScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { transactions, user } = useKasir();
  const isOwner = user?.role === 'Owner';

  const totalOmzet = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const totalTunai = transactions
    .filter((t) => t.metode === 'Tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);
  const totalQRIS = transactions
    .filter((t) => t.metode === 'QRIS')
    .reduce((acc, t) => acc + (t.total || 0), 0);
  const totalEWallet = transactions
    .filter((t) => t.metode === 'E-Wallet')
    .reduce((acc, t) => acc + (t.total || 0), 0);

  const avgPerTrx =
    transactions.length > 0 ? totalOmzet / transactions.length : 0;

  // Breakdown payment data
  const paymentBreakdown = [
    { label: 'Tunai', value: totalTunai, display: formatCurrency(totalTunai) },
    { label: 'QRIS', value: totalQRIS, display: formatCurrency(totalQRIS) },
    {
      label: 'E-Wallet',
      value: totalEWallet,
      display: formatCurrency(totalEWallet),
    },
  ];
  const maxPayment = Math.max(totalTunai, totalQRIS, totalEWallet, 1);

  // Top toppings data
  const toppingRankings = [
    { label: 'Kerupuk', value: 38, display: '38 porsi' },
    { label: 'Makaroni', value: 32, display: '32 porsi' },
    { label: 'Bakso', value: 29, display: '29 porsi' },
    { label: 'Sosis', value: 24, display: '24 porsi' },
    { label: 'Ceker', value: 20, display: '20 porsi' },
    { label: 'Telur', value: 18, display: '18 butir' },
  ];
  const maxTopping = 40;

  const handleExport = () => {
    Alert.alert(
      'Ekspor Laporan Berhasil',
      'Data rekap transaksi dan omzet kasir telah diunduh dalam format rekap Excel/PDF.'
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Title & Role Badge */}
      <View style={styles.headerSection}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>
            {isOwner ? 'Dashboard Owner - Laporan Penjualan' : 'Laporan Penjualan'}
          </Text>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>👑 Akses Pemilik (Owner)</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          {isOwner
            ? 'Monitoring menyeluruh performa omzet harian, kinerja kasir, dan analitik menu terlaris.'
            : 'Ringkasan omzet, statistik transaksi harian, dan topping terlaris.'}
        </Text>
      </View>

      {/* Special Owner Analytics Banner */}
      {isOwner && (
        <View style={styles.ownerCard}>
          <View style={styles.ownerCardHeader}>
            <View style={styles.ownerCardIcon}>
              <Ionicons name="analytics" size={20} color="#E65100" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerCardTitle}>
                Ringkasan Bisnis Kedai Seblak
              </Text>
              <Text style={styles.ownerCardSub}>
                Kasir Bertugas: Siti Aisyah • Sesi: Pagi/Siang • Status: 100% Lunas
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExport}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={14} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Ekspor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ownerStatsGrid}>
            <View style={styles.ownerStatItem}>
              <Text style={styles.ownerStatLabel}>Omzet Hari Ini</Text>
              <Text style={styles.ownerStatVal}>
                {formatCurrency(totalOmzet)}
              </Text>
            </View>
            <View style={styles.ownerStatItem}>
              <Text style={styles.ownerStatLabel}>Estimasi Omzet 30 Hari</Text>
              <Text style={[styles.ownerStatVal, { color: '#2E7D32' }]}>
                {formatCurrency(totalOmzet * 30)}
              </Text>
            </View>
            <View style={styles.ownerStatItem}>
              <Text style={styles.ownerStatLabel}>Margin Non-Tunai</Text>
              <Text style={[styles.ownerStatVal, { color: '#1565C0' }]}>
                {Math.round(((totalQRIS + totalEWallet) / (totalOmzet || 1)) * 100)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 3 Metric Cards */}
      <View
        style={[
          styles.metricsRow,
          isMobile && { flexDirection: 'column', gap: 10 },
        ]}
      >
        <View style={[styles.metricCard, { borderTopColor: '#C62828' }]}>
          <Ionicons name="trending-up-outline" size={20} color="#C62828" />
          <Text style={styles.metricLabel}>Total Omzet Hari Ini</Text>
          <Text style={styles.metricValue}>{formatCurrency(totalOmzet)}</Text>
          <Text style={styles.metricSub}>{transactions.length} Transaksi</Text>
        </View>

        <View style={[styles.metricCard, { borderTopColor: '#2E7D32' }]}>
          <Ionicons name="receipt-outline" size={20} color="#2E7D32" />
          <Text style={styles.metricLabel}>Rata-Rata per Transaksi</Text>
          <Text style={[styles.metricValue, { color: '#2E7D32' }]}>
            {formatCurrency(avgPerTrx)}
          </Text>
          <Text style={styles.metricSub}>Nilai rata-rata</Text>
        </View>

        <View style={[styles.metricCard, { borderTopColor: '#1565C0' }]}>
          <Ionicons name="people-outline" size={20} color="#1565C0" />
          <Text style={styles.metricLabel}>Total Pelanggan</Text>
          <Text style={[styles.metricValue, { color: '#1565C0' }]}>
            {transactions.length}
          </Text>
          <Text style={styles.metricSub}>Pesanan selesai</Text>
        </View>
      </View>

      {/* Metode Pembayaran Card */}
      <View style={styles.cardBox}>
        <View style={styles.cardBoxHeader}>
          <Ionicons name="pie-chart-outline" size={17} color="#C62828" />
          <Text style={styles.cardBoxTitle}>
            Breakdown Metode Pembayaran
          </Text>
        </View>
        <SimpleBarChart data={paymentBreakdown} maxValue={maxPayment} />
      </View>

      {/* Topping Terlaris Card */}
      <View style={[styles.cardBox, { marginTop: 14 }]}>
        <View style={styles.cardBoxHeader}>
          <Ionicons name="flame-outline" size={17} color="#C62828" />
          <Text style={styles.cardBoxTitle}>Topping Terlaris</Text>
        </View>
        <SimpleBarChart data={toppingRankings} maxValue={maxTopping} />
      </View>

      {/* Slogan & Branding Card matching Reference Image */}
      <View style={styles.sloganCard}>
        <View style={styles.sloganLeft}>
          <View style={styles.sloganChefIcon}>
            <MaterialCommunityIcons name="chef-hat" size={26} color="#C62828" />
          </View>
          <View style={styles.sloganTextCol}>
            <Text style={styles.sloganTitle}>Mudah · Cepat · Akurat</Text>
            <Text style={styles.sloganDesc}>
              Sistem kasir Seblak Prasmanan membantu pencatatan pesanan,
              perhitungan harga otomatis, dan laporan transaksi harian dengan
              mudah.
            </Text>
          </View>
        </View>
        <View style={styles.sloganRight}>
          <Text style={styles.sloganChiliEmoji}>🌶️</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
  },
  ownerBadge: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ownerBadgeText: {
    color: '#E65100',
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: '#8D7B70',
    marginTop: 3,
  },
  ownerCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFDDB3',
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  ownerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  ownerCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFE8D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
  },
  ownerCardSub: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E65100',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ownerStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE3',
  },
  ownerStatItem: {
    flex: 1,
  },
  ownerStatLabel: {
    fontSize: 10,
    color: '#8D7B70',
    fontWeight: '600',
  },
  ownerStatVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2C1810',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    gap: 2,
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C62828',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#A09088',
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE5DF',
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
  },
  chartContainer: {
    gap: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartLabel: {
    width: 90,
    fontSize: 11,
    color: '#4A3028',
    fontWeight: '600',
  },
  chartTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#F5EFEB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    backgroundColor: '#C62828',
    borderRadius: 5,
  },
  chartVal: {
    width: 80,
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
    textAlign: 'right',
  },
  sloganCard: {
    marginTop: 20,
    backgroundColor: '#FFF5F4',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F8D2D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sloganLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sloganChefIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sloganTextCol: {
    flex: 1,
  },
  sloganTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.3,
  },
  sloganDesc: {
    fontSize: 11,
    color: '#6F5C53',
    marginTop: 3,
    lineHeight: 16,
  },
  sloganRight: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sloganChiliEmoji: {
    fontSize: 28,
  },
});
