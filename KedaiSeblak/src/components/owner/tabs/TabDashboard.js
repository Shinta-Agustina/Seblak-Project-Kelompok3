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
import SalesChart from '../SalesChart';

import {
  normalisasiTransaksiKasir,
  hitungToppingTerjual,
} from '../../../data/ownerSalesSimulation';

const rupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const awalHari = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function TabDashboard({
  setActiveTab,
  stockItems = [],
  expenses = [],
  transactions = [],
  onNavigateToStockFilter,
}) {
  const transaksi = useMemo(
    () => normalisasiTransaksiKasir(transactions),
    [transactions]
  );

  const hasKasirDetail = transaksi.length > 0;

  const hariIni = awalHari(new Date());

  const awalMinggu = new Date(hariIni);
  awalMinggu.setDate(hariIni.getDate() - 6);

  const transaksiHariIni = useMemo(
    () =>
      transaksi.filter((item) => {
        const tanggal =
          item.tanggal instanceof Date
            ? item.tanggal
            : new Date(item.tanggal);

        return (
          item.status === 'Lunas' &&
          awalHari(tanggal).getTime() === hariIni.getTime()
        );
      }),
    [transaksi, hariIni.getTime()]
  );

  const transaksiMingguIni = useMemo(
    () =>
      transaksi.filter((item) => {
        const tanggal =
          item.tanggal instanceof Date
            ? item.tanggal
            : new Date(item.tanggal);

        const tanggalHari = awalHari(tanggal);

        return (
          item.status === 'Lunas' &&
          tanggalHari >= awalMinggu &&
          tanggalHari <= hariIni
        );
      }),
    [transaksi, awalMinggu.getTime(), hariIni.getTime()]
  );

  const omzetHariIni = transaksiHariIni.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  // Sesuai aturan kedai: satu checkout lunas dihitung satu porsi.
  const jumlahPorsiTerjual = transaksiHariIni.length;

  // TERHUBUNG & FILTER PER HARI: Menghitung total pengeluaran khusus hari ini
  const pengeluaranHariIni = useMemo(() => {
    // Format tanggal string standar yang dicocokkan (misal: "24 Okt 2026" atau sesuai format sistem)
    const tanggalHariIniStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (expenses || []).reduce((sum, item) => {
      const isHariIni =
        !item.tanggal ||
        item.tanggal === tanggalHariIniStr ||
        item.tanggal === 'Hari ini' ||
        item.tanggal === 'Baru saja';

      if (isHariIni) {
        return sum + Number(item.nominal || item.total || 0);
      }
      return sum;
    }, 0);
  }, [expenses]);

  const lowStockItems = useMemo(
    () =>
      (stockItems || [])
        .filter(
          (item) =>
            Number(item.sisa || 0) <= Number(item.minimum ?? 1)
        )
        .sort(
          (a, b) =>
            Number(a.sisa || 0) - Number(b.sisa || 0)
        )
        .slice(0, 4),
    [stockItems]
  );

  const topToppings = useMemo(
    () => hitungToppingTerjual(transaksiMingguIni).slice(0, 3),
    [transaksiMingguIni]
  );

  const grafikMingguan = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const tanggal = new Date(awalMinggu);
        tanggal.setDate(awalMinggu.getDate() + index);

        const total = transaksiMingguIni
          .filter(
            (trx) =>
              awalHari(trx.tanggal).getTime() === tanggal.getTime()
          )
          .reduce(
            (sum, trx) => sum + Number(trx.total || 0),
            0
          );

        return {
          label: tanggal.toLocaleDateString('id-ID', {
            weekday: 'short',
          }),
          total,
        };
      }),
    [transaksiMingguIni, awalMinggu.getTime()]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.eyebrow}>
            SEBLAK PRASMANAN · OWNER
          </Text>

          <Text style={styles.title}>Ringkasan Kedai</Text>

          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="storefront-outline"
            size={23}
            color="#C62828"
          />
        </View>
      </View>

      {/* Ringkasan */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Omzet"
          value={rupiah(omzetHariIni)}
          subtitle="Penjualan hari ini"
          iconName="wallet-outline"
          iconColor="#168653"
          iconBg="#DCFCE7"
          onPress={() => setActiveTab('penjualan')}
        />

        <StatCard
          title="Jumlah Transaksi"
          value={`${transaksiHariIni.length} transaksi`}
          subtitle="Transaksi lunas hari ini"
          iconName="receipt-outline"
          iconColor="#C62828"
          iconBg="#FEE2E2"
          onPress={() => setActiveTab('penjualan')}
        />

        <StatCard
          title="Porsi Terjual"
          value={`${jumlahPorsiTerjual} porsi`}
          subtitle="1 checkout lunas = 1 porsi"
          iconName="fast-food-outline"
          iconColor="#0284C7"
          iconBg="#E0F2FE"
          onPress={() => setActiveTab('penjualan')}
        />

        <StatCard
          title="Pengeluaran"
          value={rupiah(pengeluaranHariIni)}
          subtitle="Belanja bahan & operasional hari ini"
          iconName="cash-outline"
          iconColor="#D97706"
          iconBg="#FEF3C7"
          onPress={() => setActiveTab('pengeluaran')}
        />
      </View>

      {/* Grafik dan topping terlaris */}
      <View style={styles.mainGrid}>
        <View style={[styles.card, styles.chartCard]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Grafik Penjualan
              </Text>
              <Text style={styles.sectionSubtitle}>
                7 hari terakhir
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setActiveTab('penjualan')}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Lihat laporan</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color="#C62828"
              />
            </TouchableOpacity>
          </View>

          <SalesChart
            title=""
            subtitle=""
            data={grafikMingguan}
          />
        </View>

        <View style={[styles.card, styles.sideCard]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Topping Terlaris
            </Text>

            <Ionicons
              name="trophy-outline"
              size={19}
              color="#D97706"
            />
          </View>

          {topToppings.length > 0 ? (
            topToppings.map((item, index) => (
              <View style={styles.topRow} key={item.nama}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>
                    {index + 1}
                  </Text>
                </View>

                <Text
                  style={styles.topName}
                  numberOfLines={1}
                >
                  {item.nama}
                </Text>

                <Text style={styles.topQty}>
                  {item.jumlah}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Belum ada data topping.
            </Text>
          )}
        </View>
      </View>

      {/* Stok menipis */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Stok Menipis
            </Text>

            <Text style={styles.sectionSubtitle}>
              Bahan yang perlu diperiksa atau direstok
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setActiveTab('stok')}
          >
            <Text style={styles.linkText}>Lihat semua →</Text>
          </TouchableOpacity>
        </View>

        {lowStockItems.length > 0 ? (
          lowStockItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.stockRow}
              onPress={() =>
                onNavigateToStockFilter?.(
                  Number(item.sisa || 0) <= 0
                    ? 'Habis'
                    : 'Menipis'
                )
              }
            >
              <View style={styles.stockIcon}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color="#C62828"
                />
              </View>

              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>
                  {item.nama}
                </Text>

                <Text style={styles.stockMeta}>
                  Sisa {item.sisa} {item.satuan} · Minimum{' '}
                  {item.minimum} {item.satuan}
                </Text>
              </View>

              <StatusBadge
                status={
                  Number(item.sisa || 0) <= 0
                    ? 'Habis'
                    : 'Menipis'
                }
                size="sm"
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.safeRow}>
            <Ionicons
              name="checkmark-circle"
              size={19}
              color="#168653"
            />

            <Text style={styles.safeText}>
              Semua stok dalam kondisi aman.
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.note}>
        {hasKasirDetail
          ? 'Data dihitung dari transaksi Kasir yang memiliki detail dan tanggal.'
          : 'Belum ada transaksi Kasir dengan detail dan tanggal untuk ditampilkan.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  content: {
    padding: 18,
    paddingBottom: 34,
    gap: 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  eyebrow: {
    color: '#C62828',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#52141D',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 3,
  },
  subtitle: {
    color: '#78665E',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 15,
    padding: 16,
  },
  chartCard: {
    flex: 2,
    minWidth: 280,
  },
  sideCard: {
    flex: 1,
    minWidth: 240,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    color: '#52141D',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8D7B70',
    fontSize: 11,
    marginTop: 3,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: '700',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFEB',
  },
  rank: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: '800',
  },
  topName: {
    flex: 1,
    color: '#2C1810',
    fontSize: 12,
    fontWeight: '600',
  },
  topQty: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '800',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEB',
  },
  stockIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    color: '#2C1810',
    fontSize: 12,
    fontWeight: '700',
  },
  stockMeta: {
    color: '#8D7B70',
    fontSize: 10,
    marginTop: 3,
  },
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  safeText: {
    color: '#168653',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#8D7B70',
    fontSize: 12,
    paddingVertical: 12,
  },
  note: {
    color: '#9A8B83',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});