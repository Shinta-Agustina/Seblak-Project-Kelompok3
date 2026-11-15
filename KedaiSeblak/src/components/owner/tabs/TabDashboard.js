import React, { useMemo, useEffect, useState } from 'react';
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
import { getSalesForecast } from '../../../services/forecastService';

import {
  normalisasiTransaksiKasir,
  hitungToppingTerjual,
  tanggalAcuan,
} from '../../../data/salesDataUtils';

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

  // Prediksi penjualan 7 hari ke depan (dihitung dari riwayat transaksi di Supabase)
  const [forecast, setForecast] = useState(null);
  const [forecastError, setForecastError] = useState('');
  useEffect(() => {
    let aktif = true;
    getSalesForecast(7)
      .then((r) => { if (aktif) setForecast(r); })
      .catch((e) => { if (aktif) setForecastError(e.message || 'Gagal menghitung prediksi.'); });
    return () => { aktif = false; };
  }, []);

  // Acuan = hari ini bila ada transaksi, selain itu hari transaksi terakhir.
  const hariIni = useMemo(
    () => awalHari(tanggalAcuan(transaksi)),
    [transaksi]
  );

  const adalahHariIniAsli =
    hariIni.getTime() === awalHari(new Date()).getTime();

  const labelHari = adalahHariIniAsli
    ? 'hari ini'
    : hariIni.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const awalMinggu = useMemo(() => {
    const tanggal = new Date(hariIni);
    tanggal.setDate(hariIni.getDate() - 6);
    return tanggal;
  }, [hariIni]);

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
  // Mengubah tanggal pengeluaran menjadi format YYYY-MM-DD
  const getTanggalKey = (tanggal) => {
    if (!tanggal) return null;

    // Jika tanggal berupa objek Date
    if (tanggal instanceof Date) {
      const tahun = tanggal.getFullYear();
      const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
      const hari = String(tanggal.getDate()).padStart(2, '0');

      return `${tahun}-${bulan}-${hari}`;
    }

    const tanggalString = String(tanggal).trim();

    // Jika format tanggal sudah ISO, misalnya 2026-11-01
    if (/^\d{4}-\d{2}-\d{2}/.test(tanggalString)) {
      return tanggalString.substring(0, 10);
    }

    // Jika format tanggal berupa tanggal lokal
    const parsedDate = new Date(tanggalString);

    if (!Number.isNaN(parsedDate.getTime())) {
      const tahun = parsedDate.getFullYear();
      const bulan = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const hari = String(parsedDate.getDate()).padStart(2, '0');

      return `${tahun}-${bulan}-${hari}`;
    }

    return null;
  };

  // Total pengeluaran khusus hari ini
  const pengeluaranHariIni = useMemo(() => {
    const hariIniKey = getTanggalKey(hariIni);

    return (expenses || []).reduce((sum, item) => {
      const tanggalPengeluaran =
        getTanggalKey(item.tanggal) ||
        getTanggalKey(item.tanggalStr);

      if (tanggalPengeluaran === hariIniKey) {
        const nominal = Number(
          item.nominal ?? item.total ?? item.jumlah ?? 0
        );

        return sum + nominal;
      }

      return sum;
    }, 0);
  }, [expenses, hariIni]);


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
    () => hitungToppingTerjual(transaksiMingguIni).slice(0, 5),
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
            {hariIni.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {adalahHariIniAsli ? '' : ' · data transaksi terakhir'}
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
          subtitle={`Penjualan ${labelHari}`}
          iconName="wallet-outline"
          iconColor="#168653"
          iconBg="#DCFCE7"
          onPress={() => setActiveTab('penjualan')}
        />

        <StatCard
          title="Jumlah Transaksi"
          value={`${transaksiHariIni.length} transaksi`}
          subtitle={`Transaksi lunas ${labelHari}`}
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

          subtitle={`Belanja bahan & operasional ${labelHari}`}

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
                7 hari terakhir{adalahHariIniAsli ? '' : ` s.d. ${labelHari}`}
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
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.topLine}>
                    <Text style={styles.topName} numberOfLines={1}>{item.nama}</Text>
                    <Text style={styles.topQty}>{item.jumlah}x</Text>
                  </View>
                  <View style={styles.topBarBg}>
                    <View style={[styles.topBarFill, { width: `${Math.max(6, Math.round((item.jumlah / (topToppings[0].jumlah || 1)) * 100))}%` }]} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Belum ada data topping.
            </Text>
          )}
        </View>
      </View>

      {/* Prediksi penjualan */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Prediksi Penjualan 7 Hari</Text>
            <Text style={styles.sectionSubtitle}>
              {forecast && forecast.prediksi.length
                ? `Metode: ${forecast.metode} · dari ${forecast.jumlahHari} hari data`
                : 'Estimasi omzet harian berdasarkan riwayat transaksi'}
            </Text>
          </View>
          {forecast && forecast.prediksi.length ? (
            <View style={{ backgroundColor: forecast.keyakinan === 'tinggi' ? '#E3F6EC' : forecast.keyakinan === 'sedang' ? '#FFF3D6' : '#FBEAEC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: forecast.keyakinan === 'tinggi' ? '#168653' : forecast.keyakinan === 'sedang' ? '#B7791F' : '#C62828' }}>
                Keyakinan {forecast.keyakinan}{forecast.mape != null ? ` · MAPE ${forecast.mape.toFixed(1)}%` : ''}
              </Text>
            </View>
          ) : null}
        </View>
        {forecastError ? (
          <Text style={styles.emptyText}>Prediksi belum tersedia: {forecastError}</Text>
        ) : !forecast ? (
          <Text style={styles.emptyText}>Menghitung prediksi...</Text>
        ) : !forecast.prediksi.length ? (
          <Text style={styles.emptyText}>Belum ada riwayat transaksi untuk diprediksi.</Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {forecast.prediksi.map((p) => (
              <View key={p.tanggal} style={{ flexGrow: 1, flexBasis: 110, backgroundColor: '#FBF7F4', borderRadius: 12, borderWidth: 1, borderColor: '#EFE7E2', padding: 10 }}>
                <Text style={{ fontSize: 11, color: '#8D7B70', fontWeight: '700' }}>{p.hari} · {p.tanggal.slice(8, 10)}/{p.tanggal.slice(5, 7)}</Text>
                <Text style={{ fontSize: 14, color: '#52141D', fontWeight: '800', marginTop: 4 }}>{rupiah(p.prediksi)}</Text>
              </View>
            ))}
          </View>
        )}
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
    maxWidth: 1680,
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
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  topBarBg: { height: 5, borderRadius: 3, backgroundColor: '#F4EFEB', marginTop: 6, overflow: 'hidden' },
  topBarFill: { height: 5, borderRadius: 3, backgroundColor: '#C62828' },
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