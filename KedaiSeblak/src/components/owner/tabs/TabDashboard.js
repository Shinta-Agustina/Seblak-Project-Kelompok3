import React, { useMemo } from 'react';
import { buatDataPenjualanDummy } from '../../../data/ownerSalesSimulation';
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

  // Dashboard memakai sumber data simulasi yang sama dengan halaman Penjualan.
  // Data simulasi tidak masuk ke transaksi kasir dan bukan laporan keuangan resmi.
  const dummyTransactions = useMemo(() => buatDataPenjualanDummy(), []);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const parseDate = (value) => {
    if (!value) return null;
    const text = String(value).trim();
    const match = text.match(/^(\d{1,2})[\/ -](\d{1,2}|[A-Za-z]+)[\/ -](\d{4})$/);
    if (match) {
      const months = { jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3, mei: 4, may: 4, jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agustus: 7, sep: 8, september: 8, okt: 9, oktober: 9, nov: 10, november: 10, des: 11, desember: 11 };
      const month = Number.isFinite(Number(match[2])) ? Number(match[2]) - 1 : months[match[2].toLowerCase()];
      if (month !== undefined && month >= 0 && month <= 11) return new Date(Number(match[3]), month, Number(match[1]));
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const transactionsToday = dummyTransactions.filter((trx) => {
    const date = parseDate(trx.date);
    if (!date || trx.status !== 'Lunas') return false;
    date.setHours(0, 0, 0, 0);
    return date.getTime() === startToday.getTime();
  });
  const pemasukanSimulasiHariIni = transactionsToday.reduce((sum, trx) => sum + Number(trx.total || 0), 0);
  const previousDay = new Date(startToday);
  previousDay.setDate(previousDay.getDate() - 1);
  const transactionsYesterday = dummyTransactions.filter((trx) => {
    const date = parseDate(trx.date);
    if (!date || trx.status !== 'Lunas') return false;
    date.setHours(0, 0, 0, 0);
    return date.getTime() === previousDay.getTime();
  });
  const omzetYesterday = transactionsYesterday.reduce((sum, trx) => sum + Number(trx.total || 0), 0);
  const persenOmzet = omzetYesterday > 0 ? Math.round((pemasukanSimulasiHariIni - omzetYesterday) / omzetYesterday * 100) : 0;

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startToday);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const WEEKLY_SALES_DATA = last7Days.map((date) => {
    const dayTransactions = dummyTransactions.filter((trx) => {
      const d = parseDate(trx.date);
      if (!d || trx.status !== 'Lunas') return false;
      d.setHours(0, 0, 0, 0);
      return d.getTime() === date.getTime();
    });
    return {
      hari: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      omzet: dayTransactions.reduce((sum, trx) => sum + Number(trx.total || 0), 0),
      peak: false,
      persenMax: 0,
    };
  });
  const maxOmzet = Math.max(1, ...WEEKLY_SALES_DATA.map((item) => item.omzet));
  WEEKLY_SALES_DATA.forEach((item) => {
    item.persenMax = Math.round((item.omzet / maxOmzet) * 100);
    item.peak = item.omzet === maxOmzet && item.omzet > 0;
  });
  const totalOmzet7Hari = WEEKLY_SALES_DATA.reduce((sum, item) => sum + item.omzet, 0);
  const peakDay = WEEKLY_SALES_DATA.find((item) => item.peak)?.hari || '-';

  const toppingMap = {};
  transactionsToday.forEach((trx) => (trx.items || []).forEach((item) => {
    const nama = item.name || item.nama || 'Item';
    const kategori = String(item.kategori || item.category || '').toLowerCase();
    if (kategori !== 'topping' && !/kerupuk|makaroni|sosis|bakso|ceker|seafood|dumpling|crab stick|fish roll|chikuwa|telur|tahu|cuanki|siomay|otak-otak|kwetiau|mie|sawi|jamur/i.test(nama)) return;
    const qty = Number(item.qty || 0);
    if (!toppingMap[nama]) toppingMap[nama] = { nama, porsi: 0 };
    toppingMap[nama].porsi += qty;
  }));
  const topToppingsRaw = Object.values(toppingMap).sort((a, b) => b.porsi - a.porsi).slice(0, 3);
  const maxTop = Math.max(1, ...topToppingsRaw.map((item) => item.porsi));
  const topToppings = topToppingsRaw.map((item, index) => ({ ...item, rank: index + 1, proporsi: Math.round((item.porsi / maxTop) * 100) }));

  // Pengeluaran mengikuti catatan di fitur Pengeluaran Owner; tidak diambil dari kasir.
  const totalPengeluaranTercatat = (expenses || []).reduce((sum, expense) => sum + Number(expense.nominal || 0), 0);
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
            {`${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Ringkasan simulasi penjualan, catatan pengeluaran, dan persediaan`}
          </Text>
        </View>

        <View style={styles.statusLivePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusLiveText}>Ringkasan Owner</Text>
        </View>
      </View>

      {/* 4 KARTU ANGKA UTAMA (STAT CARDS) */}
      <View style={styles.statCardsGrid}>
        {/* 1. Omzet simulasi dari sumber laporan Penjualan */}
        <StatCard
          title="Omzet Simulasi Hari Ini"
          value={`Rp ${pemasukanSimulasiHariIni.toLocaleString('id-ID')}`}
          trend={`${persenOmzet >= 0 ? '+' : ''}${persenOmzet}%`}
          trendPositive={true}
          subtitle={`${transactionsToday.length} transaksi simulasi`}
          iconName="cash-outline"
          iconColor="#168653"
          iconBg="#DCFCE7"
          badgeText="Simulasi"
          onPress={() => setActiveTab('penjualan')}
        />

        {/* 2. Total pengeluaran dari fitur Owner */}
        <StatCard
          title="Total Pengeluaran Tercatat"
          value={`Rp ${totalPengeluaranTercatat.toLocaleString('id-ID')}`}
          trend="Uang Modal"
          trendPositive={false}
          subtitle={`${(expenses || []).length} catatan di fitur Pengeluaran`}
          iconName="cart-outline"
          iconColor="#DC2626"
          iconBg="#FEE2E2"
          badgeText="Owner"
          onPress={() => setActiveTab('pengeluaran')}
        />

        {/* 3. Pengeluaran hari ini dari catatan Owner */}
        <StatCard
          title="Catatan Pengeluaran"
          value={`${(expenses || []).length} Catatan`}
          trend="Owner"
          trendPositive={true}
          subtitle="Semua catatan pada fitur Pengeluaran"
          iconName="receipt-outline"
          iconColor="#0284C7"
          iconBg="#E0F2FE"
          badgeText="Pengeluaran"
          onPress={() => setActiveTab('pengeluaran')}
        />

        {/* 4. Bahan Perlu Restok */}
        <StatCard
          title="Bahan Perlu Restok"
          value={`${lowStockItems.length} Bahan`}
          trend={lowStockItems.length > 0 ? "Perhatian" : "Aman"}
          trendPositive={lowStockItems.length === 0}
          subtitle={lowStockItems.length > 0 ? `${lowStockItems.filter((item) => item.sisa <= 0).length} habis, ${lowStockItems.filter((item) => item.sisa > 0).length} menipis` : "Semua stok aman"}
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
            <Text style={styles.profitTitle}>Ringkasan Penjualan & Pengeluaran</Text>
          </View>
          <View style={styles.healthyPill}>
            <Text style={styles.healthyPillText}>Data Terpisah</Text>
          </View>
        </View>

        <View style={styles.profitCalculationBody}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>
              Omzet simulasi hari ini <Text style={styles.calcDesc}>(Halaman Penjualan)</Text>
            </Text>
            <Text style={[styles.calcValue, { color: '#168653' }]}>
              Rp {pemasukanSimulasiHariIni.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>
              Total pengeluaran tercatat <Text style={styles.calcDesc}>(Fitur Pengeluaran Owner)</Text>
            </Text>
            <Text style={[styles.calcValue, { color: '#DC2626' }]}>
              Rp {totalPengeluaranTercatat.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.calcDivider} />

          <View style={styles.calcRowTotal}>
            <View style={styles.calcTotalLeft}>
              <Text style={styles.calcTotalLabel}>Catatan ringkasan</Text>
              <Text style={styles.calcTotalSub}>Penjualan simulasi dan pengeluaran ditampilkan terpisah</Text>
            </View>
            <Text style={styles.calcTotalValue}>
              {transactionsToday.length} transaksi
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
            <View style={styles.alertTextWrap}>
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
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Grafik Pemasukan 7 Hari Terakhir</Text>
            <Text style={styles.cardSubtitle}>
              Total Periode: Rp {totalOmzet7Hari.toLocaleString('id-ID')} · Rata-rata: Rp{' '}
              {Math.round(totalOmzet7Hari / 7).toLocaleString('id-ID')}/hari
            </Text>
          </View>

          <View style={styles.peakIndicatorBadge}>
            <Ionicons name="flame" size={13} color="#C62828" />
            <Text style={styles.peakBadgeText}>{peakDay === '-' ? 'Belum ada data' : `${peakDay} tertinggi`}</Text>
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
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Top 3 Topping Terlaris</Text>
            <Text style={styles.cardSubtitle}>Berdasarkan data simulasi pada laporan penjualan</Text>
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
          {topToppings.length === 0 ? (
            <Text style={styles.stockAllGoodText}>Belum ada data topping simulasi untuk hari ini.</Text>
          ) : topToppings.map((item) => {
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
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Pengeluaran Terbaru</Text>
            <Text style={styles.cardSubtitle}>Mengikuti catatan pada fitur Pengeluaran Owner</Text>
          </View>

          <TouchableOpacity
            style={styles.textLinkBtn}
            onPress={() => setActiveTab('pengeluaran')}
            activeOpacity={0.7}
          >
            <Text style={styles.textLink}>Lihat Semua Pengeluaran →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentExpensesList}>
          {recentExpenses.length === 0 ? (
            <Text style={styles.stockAllGoodText}>Belum ada catatan pengeluaran.</Text>
          ) : recentExpenses.map((exp) => (
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
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  greetingTextGroup: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    minWidth: 0,
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
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 8,
  },
  profitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  profitTitle: {
    flexShrink: 1,
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
    alignItems: 'flex-start',
    gap: 10,
  },
  calcLabel: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
    textAlign: 'right',
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
    gap: 10,
  },
  calcTotalLeft: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
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
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 10,
  },
  alertTitleRow: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    minWidth: 0,
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
  alertTextWrap: {
    flex: 1,
    minWidth: 0,
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
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  cardHeaderText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    minWidth: 0,
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
    width: 50,
    flexShrink: 0,
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
    width: 76,
    flexShrink: 0,
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
    gap: 8,
  },
  toppingName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  toppingQty: {
    flexShrink: 0,
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
    minWidth: 0,
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
    flexShrink: 0,
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