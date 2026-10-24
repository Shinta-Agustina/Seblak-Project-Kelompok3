import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import {
  DASHBOARD_METRICS,
  WEEKLY_SALES_DATA,
} from '../../../data/ownerData';

export default function TabDashboard({
  setActiveTab,
  stockItems = [],
  expenses = [],
  onNavigateToStockFilter,
}) {
  // Ambil maksimal 3 bahan yang menipis atau habis
  const lowStockItems = stockItems
    .filter((item) => item.sisa <= item.minimum)
    .sort((a, b) => (a.sisa / a.minimum) - (b.sisa / b.minimum))
    .slice(0, 3);

  // Top 3 topping hari ini
  const topToppings = [
    { rank: 1, nama: 'Kerupuk Mawar Pedas', porsi: 142, proporsi: 100 },
    { rank: 2, nama: 'Dumpling Keju Mozzarella', porsi: 98, proporsi: 69 },
    { rank: 3, nama: 'Ceker Jeletot Mercon', porsi: 85, proporsi: 60 },
  ];

  const totalOmzet7Hari = WEEKLY_SALES_DATA.reduce((acc, curr) => acc + curr.omzet, 0);

  // 1. Pemasukan Kasir (Penjualan Hari Ini)
  const pemasukanKasir = DASHBOARD_METRICS.omzetHariIni.nilai; // Rp 2.450.000

  // 2. Pengeluaran Owner (Modal Belanja Topping & Bahan Hari Ini)
  const pengeluaranModalHariIni = useMemo(() => {
    return expenses
      .filter((e) => e.tanggal === '24 Okt 2026')
      .reduce((sum, e) => sum + (e.nominal || 0), 0);
  }, [expenses]);

  // 3. Laba Bersih Hari Ini = Pemasukan (Kasir) - Pengeluaran Modal (Owner)
  const labaBersihHariIni = pemasukanKasir - pengeluaranModalHariIni;
  const persentaseMargin = pemasukanKasir > 0 ? Math.round((labaBersihHariIni / pemasukanKasir) * 100) : 0;

  // 3 Catatan Pengeluaran Modal Terbaru
  const recentExpenses = (expenses || []).slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Greeting Header */}
      <View style={styles.greetingHeader}>
        <View style={styles.greetingTextGroup}>
          <View style={styles.badgeStore}>
            <Ionicons name="flame" size={14} color="#C62828" />
            <Text style={styles.badgeStoreText}>Kedai Seblak Prasmanan</Text>
          </View>
          <Text style={styles.welcomeTitle}>Kondisi Kedai Hari Ini</Text>
          <Text style={styles.welcomeSubtitle}>
            Sabtu, 24 Oktober 2026 · Evaluasi kesehatan kedai, pemasukan, modal bahan, dan laba
          </Text>
        </View>

        <View style={styles.statusLivePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusLiveText}>Kedai Buka</Text>
        </View>
      </View>

      {/* 4 KARTU ANGKA UTAMA (STAT CARDS) */}
      <View style={styles.statCardsGrid}>
        {/* 1. Pemasukan Kasir (Omzet) */}
        <StatCard
          title="Pemasukan Kasir (Omzet)"
          value={`Rp ${pemasukanKasir.toLocaleString('id-ID')}`}
          trend={`+${DASHBOARD_METRICS.omzetHariIni.persenKemarin}%`}
          trendPositive={true}
          subtitle="86 transaksi pembeli"
          iconName="cash-outline"
          iconColor="#168653"
          iconBg="#DCFCE7"
          badgeText="Kasir"
          onPress={() => setActiveTab('penjualan')}
        />

        {/* 2. Pengeluaran Modal Belanja Bahan (Topping) */}
        <StatCard
          title="Modal Belanja Topping"
          value={`Rp ${pengeluaranModalHariIni.toLocaleString('id-ID')}`}
          trend="Uang Modal"
          trendPositive={false}
          subtitle={`${recentExpenses.length} nota belanja bahan`}
          iconName="cart-outline"
          iconColor="#DC2626"
          iconBg="#FEE2E2"
          badgeText="Owner"
          onPress={() => setActiveTab('pengeluaran')}
        />

        {/* 3. Laba Bersih Hari Ini (Pemasukan - Modal) */}
        <StatCard
          title="Laba Bersih Hari Ini"
          value={`Rp ${labaBersihHariIni.toLocaleString('id-ID')}`}
          trend={`Margin ${persentaseMargin}%`}
          trendPositive={true}
          subtitle="Pemasukan minus modal bahan"
          iconName="trending-up-outline"
          iconColor="#0284C7"
          iconBg="#E0F2FE"
          badgeText="Laba"
          onPress={() => setActiveTab('pengeluaran')}
        />

        {/* 4. Bahan Perlu Restok */}
        <StatCard
          title="Bahan Perlu Restok"
          value={`${lowStockItems.length} Bahan`}
          trend={lowStockItems.length > 0 ? "Perhatian" : "Aman"}
          trendPositive={lowStockItems.length === 0}
          subtitle={lowStockItems.length > 0 ? "1 habis, 2 menipis" : "Semua stok aman"}
          iconName="alert-circle-outline"
          iconColor="#C62828"
          iconBg="#FBEAEC"
          badgeText="Stok"
          onPress={() => onNavigateToStockFilter ? onNavigateToStockFilter('Menipis') : setActiveTab('stok')}
        />
      </View>

      {/* KOTAK KALKULASI KESEHATAN KEDAI (LABA BERSIH) */}
      <View style={styles.profitCalculationCard}>
        <View style={styles.profitHeaderRow}>
          <View style={styles.profitHeaderLeft}>
            <Ionicons name="calculator" size={20} color="#166534" />
            <Text style={styles.profitTitle}>Kalkulasi Kesehatan Keuangan Hari Ini</Text>
          </View>
          <View style={styles.healthyPill}>
            <Text style={styles.healthyPillText}>Kedai Sangat Sehat</Text>
          </View>
        </View>

        <View style={styles.profitCalculationBody}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>
              (+) Total Pemasukan Kasir <Text style={styles.calcDesc}>(Transaksi Pembeli)</Text>
            </Text>
            <Text style={[styles.calcValue, { color: '#168653' }]}>
              Rp {pemasukanKasir.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>
              (-) Modal Belanja Bahan Baku <Text style={styles.calcDesc}>(Restok Topping & Bumbu)</Text>
            </Text>
            <Text style={[styles.calcValue, { color: '#DC2626' }]}>
              -Rp {pengeluaranModalHariIni.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.calcDivider} />

          <View style={styles.calcRowTotal}>
            <View>
              <Text style={styles.calcTotalLabel}>(=) Estimasi Keuntungan Bersih</Text>
              <Text style={styles.calcTotalSub}>Uang bersih yang masuk ke kas pemilik</Text>
            </View>
            <Text style={styles.calcTotalValue}>
              Rp {labaBersihHariIni.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {/* PERINGATAN STOK (LOW STOCK ALERT) - MAKSIMAL 3 BAHAN */}
      <View style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="warning" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.alertTitle}>Peringatan Stok Bahan</Text>
              <Text style={styles.alertSubtitle}>
                {lowStockItems.length} bahan mendesak perlu modal restok sebelum jam ramai
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.seeStockBtn}
            onPress={() => {
              if (onNavigateToStockFilter) {
                onNavigateToStockFilter('Menipis');
              } else {
                setActiveTab('stok');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.seeStockText}>Lihat Stok</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {lowStockItems.length > 0 ? (
          <View style={styles.lowStockList}>
            {lowStockItems.map((item) => {
              const isZero = item.sisa <= 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.lowStockItem}
                  onPress={() => {
                    if (onNavigateToStockFilter) onNavigateToStockFilter('Menipis');
                    else setActiveTab('stok');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.lowStockLeft}>
                    <Text style={styles.lowStockName}>{item.nama}</Text>
                    <Text style={styles.lowStockDetails}>
                      Sisa:{' '}
                      <Text style={{ fontWeight: '800', color: isZero ? '#DC2626' : '#B45309' }}>
                        {item.sisa} {item.satuan}
                      </Text>{' '}
                      (Batas min: {item.minimum} {item.satuan})
                    </Text>
                  </View>

                  <StatusBadge status={isZero ? 'Habis' : 'Menipis'} size="sm" />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.stockAllGood}>
            <Ionicons name="checkmark-circle" size={18} color="#168653" />
            <Text style={styles.stockAllGoodText}>Semua persediaan bahan dalam batas aman.</Text>
          </View>
        )}
      </View>

      {/* GRAFIK OMZET 7 HARI TERAKHIR */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Grafik Pemasukan 7 Hari Terakhir</Text>
            <Text style={styles.cardSubtitle}>
              Total Periode: Rp {totalOmzet7Hari.toLocaleString('id-ID')} · Rata-rata: Rp{' '}
              {Math.round(totalOmzet7Hari / 7).toLocaleString('id-ID')}/hari
            </Text>
          </View>

          <View style={styles.peakIndicatorBadge}>
            <Ionicons name="flame" size={13} color="#C62828" />
            <Text style={styles.peakBadgeText}>Sabtu Paling Ramai</Text>
          </View>
        </View>

        {/* Visual Bar Chart */}
        <View style={styles.chartBarsContainer}>
          {WEEKLY_SALES_DATA.map((item) => (
            <View key={item.hari} style={styles.chartRow}>
              <Text style={[styles.chartDayText, item.peak && styles.chartDayPeak]}>
                {item.hari}
              </Text>

              <View style={styles.chartTrack}>
                <View
                  style={[
                    styles.chartFill,
                    {
                      width: `${item.persenMax}%`,
                      backgroundColor: item.peak ? '#C62828' : '#78665E',
                    },
                  ]}
                />
              </View>

              <Text style={[styles.chartValueText, item.peak && styles.chartValuePeak]}>
                Rp {(item.omzet / 1000000).toFixed(2)} jt
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* TOP 3 TOPPING HARI INI */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Top 3 Topping Terlaris Hari Ini</Text>
            <Text style={styles.cardSubtitle}>Pilihan favorit pelanggan seblak prasmanan</Text>
          </View>

          <TouchableOpacity
            style={styles.textLinkBtn}
            onPress={() => setActiveTab('penjualan')}
            activeOpacity={0.7}
          >
            <Text style={styles.textLink}>Versi Lengkap di Penjualan →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topToppingsList}>
          {topToppings.map((item) => {
            const medalColors = ['#F59E0B', '#94A3B8', '#D97706'];
            return (
              <View key={item.rank} style={styles.toppingItem}>
                <View style={[styles.rankMedal, { backgroundColor: medalColors[item.rank - 1] }]}>
                  <Text style={styles.rankMedalText}>{item.rank}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.toppingHeader}>
                    <Text style={styles.toppingName}>{item.nama}</Text>
                    <Text style={styles.toppingQty}>{item.porsi} porsi terjual</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${item.proporsi}%`,
                          backgroundColor: item.rank === 1 ? '#C62828' : '#EA580C',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* CATATAN PENGELUARAN MODAL BELANJA HARI INI */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Modal Belanja Topping Hari Ini</Text>
            <Text style={styles.cardSubtitle}>Riwayat uang keluar owner untuk restok bahan baku seblak</Text>
          </View>

          <TouchableOpacity
            style={styles.textLinkBtn}
            onPress={() => setActiveTab('pengeluaran')}
            activeOpacity={0.7}
          >
            <Text style={styles.textLink}>Lihat Semua Belanja Bahan →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentExpensesList}>
          {recentExpenses.map((exp) => (
            <View key={exp.id} style={styles.expenseRow}>
              <View style={styles.expenseLeft}>
                <View style={styles.expenseBadgeRow}>
                  <Text style={styles.expenseCategoryBadge}>{exp.kategori}</Text>
                  <Text style={styles.expenseTime}>{exp.waktu}</Text>
                </View>
                <Text style={styles.expenseKeterangan} numberOfLines={1}>
                  {exp.keterangan}
                </Text>
                <Text style={styles.expenseSupplierText}>
                  Supplier: {exp.supplier || 'Pasar Induk'}
                </Text>
              </View>

              <View style={styles.expenseRight}>
                <Text style={styles.expenseNominal}>
                  -Rp {(exp.nominal || 0).toLocaleString('id-ID')}
                </Text>
                <Text style={styles.expenseMethod}>{exp.metode}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  greetingTextGroup: {
    flex: 1,
  },
  badgeStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FBEAEC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeStoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#78665E',
    marginTop: 4,
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#168653',
  },
  statusLiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  statCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  profitCalculationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: 18,
  },
  profitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  profitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  healthyPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  healthyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  profitCalculationBody: {
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 13,
    color: '#2C1810',
    fontWeight: '600',
  },
  calcDesc: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: 'normal',
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 4,
  },
  calcRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  calcTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#166534',
  },
  calcTotalSub: {
    fontSize: 11,
    color: '#15803D',
  },
  calcTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#166534',
  },
  alertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 18,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  alertTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  seeStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C62828',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  seeStockText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lowStockList: {
    gap: 8,
  },
  lowStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lowStockLeft: {
    flex: 1,
    marginRight: 8,
  },
  lowStockName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  lowStockDetails: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 3,
  },
  stockAllGood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  stockAllGoodText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    marginBottom: 18,
    shadowColor: '#3D2922',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#78665E',
    marginTop: 3,
  },
  peakIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBEAEC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  peakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },
  chartBarsContainer: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartDayText: {
    width: 54,
    fontSize: 12,
    fontWeight: '600',
    color: '#78665E',
  },
  chartDayPeak: {
    color: '#C62828',
    fontWeight: '800',
  },
  chartTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#F4EFEB',
    borderRadius: 7,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 7,
  },
  chartValueText: {
    width: 68,
    fontSize: 11,
    fontWeight: '700',
    color: '#523C34',
    textAlign: 'right',
  },
  chartValuePeak: {
    color: '#C62828',
    fontWeight: '900',
  },
  textLinkBtn: {
    paddingVertical: 4,
  },
  textLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C62828',
  },
  topToppingsList: {
    gap: 14,
  },
  toppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankMedal: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankMedalText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  toppingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toppingName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  toppingQty: {
    fontSize: 12,
    color: '#78665E',
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F4EFEB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  recentExpensesList: {
    gap: 10,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEB',
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
  },
  expenseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  expenseCategoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C62828',
    backgroundColor: '#FBEAEC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expenseTime: {
    fontSize: 11,
    color: '#8D7B70',
  },
  expenseKeterangan: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  expenseSupplierText: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  expenseNominal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
  },
  expenseMethod: {
    fontSize: 10,
    color: '#78665E',
  },
});
