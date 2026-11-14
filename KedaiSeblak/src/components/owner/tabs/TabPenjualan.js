import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import SalesChart from '../SalesChart';

import {
  normalisasiTransaksiKasir,
  hitungToppingTerjual,
  tanggalAcuan,
} from '../../../data/salesDataUtils';

const rupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

function SummaryCard({ title, value, icon, tint, color }) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[styles.summaryIcon, { backgroundColor: tint }]}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function TabPenjualan({ transactions = [] }) {
  const [period, setPeriod] = useState('Harian');

  const semuaTransaksi = useMemo(
    () => normalisasiTransaksiKasir(transactions),
    [transactions]
  );

  const hasKasirDetail = semuaTransaksi.length > 0;

  // Acuan = hari ini bila ada transaksi, selain itu hari transaksi terakhir.
  const today = useMemo(
    () => startOfDay(tanggalAcuan(semuaTransaksi)),
    [semuaTransaksi]
  );

  const transaksiPeriode = useMemo(() => {
    let start = new Date(today);

    if (period === 'Mingguan') {
      start.setDate(start.getDate() - 6);
    }

    if (period === 'Bulanan') {
      start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    }

    return semuaTransaksi
      .filter((trx) => {
        const date = startOfDay(trx.tanggal);

        return (
          trx.status === 'Lunas' &&
          date >= start &&
          date <= today
        );
      })
      .sort(
        (a, b) =>
          b.tanggal - a.tanggal ||
          b.waktu.localeCompare(a.waktu)
      );
  }, [semuaTransaksi, period, today.getTime()]);

  const summary = useMemo(() => {
    const omzet = transaksiPeriode.reduce(
      (sum, trx) => sum + Number(trx.total || 0),
      0
    );

    // Satu checkout lunas dihitung satu porsi.
    const porsiTerjual = transaksiPeriode.length;

    const toppingTerjual = transaksiPeriode.reduce(
      (sum, trx) =>
        sum +
        trx.items
          .filter((item) => item.kategori !== 'Lainnya')
          .reduce(
            (sub, item) => sub + Number(item.qty || 0),
            0
          ),
      0
    );

    return {
      omzet,
      transaksi: transaksiPeriode.length,
      porsiTerjual,
      toppingTerjual,
    };
  }, [transaksiPeriode]);

  const toppingTerlaris = useMemo(
    () => hitungToppingTerjual(transaksiPeriode).slice(0, 5),
    [transaksiPeriode]
  );

  const chartData = useMemo(() => {
    // Grafik harian berdasarkan rentang jam.
    if (period === 'Harian') {
      return Array.from({ length: 7 }, (_, index) => {
        const hour = 10 + index * 2;

        const total = transaksiPeriode
          .filter((trx) => {
            const jam = Number(
              String(trx.waktu || '00:00').slice(0, 2)
            );

            return jam >= hour && jam < hour + 2;
          })
          .reduce(
            (sum, trx) => sum + Number(trx.total || 0),
            0
          );

        return {
          label: `${String(hour).padStart(2, '0')}.00`,
          total,
        };
      });
    }

    // Grafik mingguan berdasarkan hari.
    if (period === 'Mingguan') {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);

        date.setDate(today.getDate() - (6 - index));

        const total = transaksiPeriode
          .filter(
            (trx) =>
              startOfDay(trx.tanggal).getTime() ===
              date.getTime()
          )
          .reduce(
            (sum, trx) => sum + Number(trx.total || 0),
            0
          );

        return {
          label: date.toLocaleDateString('id-ID', {
            weekday: 'short',
          }),
          total,
        };
      });
    }

    // Grafik bulanan berdasarkan minggu.
    const weeks = [1, 2, 3, 4, 5];

    return weeks
      .map((week) => {
        const total = transaksiPeriode
          .filter(
            (trx) =>
              Math.ceil(trx.tanggal.getDate() / 7) === week
          )
          .reduce(
            (sum, trx) => sum + Number(trx.total || 0),
            0
          );

        return {
          label: `M${week}`,
          total,
        };
      })
      .filter(
        (item, index) =>
          index < Math.ceil(today.getDate() / 7)
      );
  }, [period, transaksiPeriode, today.getTime()]);

  const periodLabel =
    period === 'Harian'
      ? today.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      : period === 'Mingguan'
        ? `${new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6
        ).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        })} – ${today.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`
        : today.toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>OWNER PORTAL</Text>
          <Text style={styles.title}>Laporan Penjualan</Text>
          <Text style={styles.subtitle}>
            Pantau hasil penjualan berdasarkan periode.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="bar-chart-outline"
            size={23}
            color="#C62828"
          />
        </View>
      </View>

      {/* Filter periode */}
      <View style={styles.periodRow}>
        {['Harian', 'Mingguan', 'Bulanan'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setPeriod(item)}
            style={[
              styles.periodButton,
              period === item && styles.periodButtonActive,
            ]}
          >
            <Ionicons
              name={
                item === 'Harian'
                  ? 'today-outline'
                  : item === 'Mingguan'
                    ? 'calendar-outline'
                    : 'calendar-number-outline'
              }
              size={15}
              color={period === item ? '#FFFFFF' : '#78665E'}
            />

            <Text
              style={[
                styles.periodText,
                period === item && styles.periodTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.periodLabel}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color="#78665E"
        />
        <Text style={styles.periodLabelText}>
          {periodLabel}
        </Text>
      </View>

      {/* Ringkasan penjualan */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Total Penjualan"
          value={rupiah(summary.omzet)}
          icon="wallet-outline"
          tint="#FBEAEC"
          color="#C62828"
        />

        <SummaryCard
          title="Jumlah Transaksi"
          value={`${summary.transaksi} transaksi`}
          icon="receipt-outline"
          tint="#E5F3E8"
          color="#168653"
        />

        <SummaryCard
          title="Porsi Terjual"
          value={`${summary.porsiTerjual} porsi`}
          icon="restaurant-outline"
          tint="#E0F2FE"
          color="#0284C7"
        />

        <SummaryCard
          title="Topping Terjual"
          value={`${summary.toppingTerjual} item`}
          icon="fast-food-outline"
          tint="#F3E8FF"
          color="#7E22CE"
        />
      </View>

      {/* Grafik */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Grafik Penjualan ({period})
            </Text>

            <Text style={styles.sectionSubtitle}>
              Total omzet per{' '}
              {period === 'Harian'
                ? 'rentang jam'
                : period === 'Mingguan'
                  ? 'hari'
                  : 'minggu'}
            </Text>
          </View>

          <Ionicons
            name="stats-chart"
            size={19}
            color="#C62828"
          />
        </View>

        <SalesChart
          title=""
          subtitle=""
          data={chartData}
        />
      </View>

      {/* Topping terlaris */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Topping Terlaris
            </Text>

            <Text style={styles.sectionSubtitle}>
              Berdasarkan jumlah topping terjual
            </Text>
          </View>

          <Ionicons
            name="trophy-outline"
            size={19}
            color="#D97706"
          />
        </View>

        {toppingTerlaris.length > 0 ? (
          toppingTerlaris.map((item, index) => (
            <View
              key={item.nama}
              style={styles.topRow}
            >
              <View
                style={[
                  styles.rank,
                  index === 0 && styles.rankFirst,
                ]}
              >
                <Text
                  style={[
                    styles.rankText,
                    index === 0 && styles.rankTextFirst,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <View style={styles.topInfo}>
                <Text style={styles.topName}>
                  {item.nama}
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(item.jumlah /
                            toppingTerlaris[0].jumlah) *
                          100
                          }%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.topQty}>
                {item.jumlah}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Belum ada data topping pada periode ini.
          </Text>
        )}
      </View>

      {/* Detail transaksi */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Detail Transaksi
            </Text>

            <Text style={styles.sectionSubtitle}>
              Transaksi lunas pada periode terpilih
            </Text>
          </View>

          <Text style={styles.countText}>
            {transaksiPeriode.length} data
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
        >
          <View style={styles.table}>
            <View
              style={[styles.tableRow, styles.tableHead]}
            >
              <Text style={[styles.cell, styles.colId]}>
                No. Transaksi
              </Text>

              <Text style={[styles.cell, styles.colDate]}>
                Tanggal
              </Text>

              <Text style={[styles.cell, styles.colTime]}>
                Waktu
              </Text>

              <Text style={[styles.cell, styles.colCashier]}>
                Kasir
              </Text>

              <Text style={[styles.cell, styles.colTotal]}>
                Total
              </Text>
            </View>

            {transaksiPeriode.slice(0, 12).map((trx) => (
              <View
                key={trx.id}
                style={styles.tableRow}
              >
                <Text style={[styles.cell, styles.colId]}>
                  {trx.id}
                </Text>

                <Text style={[styles.cell, styles.colDate]}>
                  {trx.tanggal.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>

                <Text style={[styles.cell, styles.colTime]}>
                  {trx.waktu}
                </Text>

                <Text
                  style={[styles.cell, styles.colCashier]}
                >
                  {trx.kasir}
                </Text>

                <Text
                  style={[
                    styles.cell,
                    styles.colTotal,
                    styles.money,
                  ]}
                >
                  {rupiah(trx.total)}
                </Text>
              </View>
            ))}

            {transaksiPeriode.length === 0 && (
              <Text style={styles.emptyText}>
                Belum ada transaksi pada periode ini.
              </Text>
            )}
          </View>
        </ScrollView>

        {transaksiPeriode.length > 12 && (
          <Text style={styles.tableFoot}>
            Menampilkan 12 dari {transaksiPeriode.length}{' '}
            transaksi.
          </Text>
        )}
      </View>

      <Text style={styles.disclaimer}>
        {hasKasirDetail
          ? 'Satu transaksi checkout lunas dihitung sebagai satu porsi. Topping dihitung terpisah berdasarkan qty item.'
          : 'Belum ada transaksi Kasir dengan detail dan tanggal pada periode ini.'}
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
    paddingBottom: 36,
    gap: 14,
    width: '100%',
    maxWidth: 1680,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    color: '#52141D',
    fontWeight: '900',
    marginTop: 3,
  },
  subtitle: {
    fontSize: 12,
    color: '#78665E',
    marginTop: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7DAD2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  periodText: {
    color: '#78665E',
    fontSize: 12,
    fontWeight: '700',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  periodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  periodLabelText: {
    color: '#78665E',
    fontSize: 11,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: 170,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 13,
    padding: 13,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  summaryTitle: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 17,
    color: '#52141D',
    fontWeight: '900',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 14,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#52141D',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8D7B70',
    fontSize: 10,
    marginTop: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEB',
  },
  rank: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#F4EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankFirst: {
    backgroundColor: '#C62828',
  },
  rankText: {
    color: '#78665E',
    fontSize: 11,
    fontWeight: '800',
  },
  rankTextFirst: {
    color: '#FFFFFF',
  },
  topInfo: {
    flex: 1,
    gap: 5,
  },
  topName: {
    color: '#2C1810',
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 5,
    backgroundColor: '#FBEAEC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#D94A55',
  },
  topQty: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'right',
  },
  countText: {
    color: '#8D7B70',
    fontSize: 10,
  },
  table: {
    minWidth: 650,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 39,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E9E4',
  },
  tableHead: {
    backgroundColor: '#FBEAEC',
    borderRadius: 6,
  },
  cell: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    color: '#49342B',
    fontSize: 10,
  },
  colId: {
    width: 135,
  },
  colDate: {
    width: 90,
  },
  colTime: {
    width: 70,
  },
  colCashier: {
    width: 145,
  },
  colTotal: {
    width: 125,
    textAlign: 'right',
  },
  money: {
    color: '#C62828',
    fontWeight: '800',
  },
  tableFoot: {
    color: '#8D7B70',
    fontSize: 10,
    marginTop: 9,
  },
  emptyText: {
    color: '#8D7B70',
    fontSize: 11,
    paddingVertical: 12,
  },
  disclaimer: {
    color: '#9A8B83',
    fontSize: 10,
    textAlign: 'center',
  },
});