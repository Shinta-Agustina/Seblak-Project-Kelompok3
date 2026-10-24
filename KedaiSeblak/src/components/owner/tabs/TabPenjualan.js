import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '../StatCard';
import FilterChips from '../FilterChips';
import {
  PERIOD_SUMMARY,
  TOP_PRODUCTS,
  HOURLY_SALES_DATA,
  PAYMENT_METHODS_DATA,
  ORDER_TYPES_DATA,
  SEBLAK_PREFERENCES,
} from '../../../data/ownerData';

export default function TabPenjualan() {
  const [selectedPeriod, setSelectedPeriod] = useState('Hari ini');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const periodOptions = [
    { id: 'Hari ini', label: 'Hari ini' },
    { id: '7 Hari', label: '7 Hari Terakhir' },
    { id: 'Bulan ini', label: 'Bulan ini (Okt)' },
  ];

  const categoryOptions = [
    { id: 'Semua', label: 'Semua Menu' },
    { id: 'Topping', label: 'Topping Prasmanan' },
    { id: 'Kuah', label: 'Varian Kuah' },
    { id: 'Minuman', label: 'Minuman Dingin' },
  ];

  const summary = PERIOD_SUMMARY[selectedPeriod] || PERIOD_SUMMARY['Hari ini'];
  const products = TOP_PRODUCTS[selectedCategory] || TOP_PRODUCTS.Semua;

  // Max value untuk chart per jam
  const maxHourlyCount = Math.max(...HOURLY_SALES_DATA.map((h) => h.jumlah));

  return (
    <View style={styles.container}>
      {/* Header & Filter Periode */}
      <View style={styles.headerArea}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Analisis Penjualan Kedai</Text>
          <Text style={styles.pageSubtitle}>
            Pantau menu terlaris, jam ramai kedai, dan preferensi pelanggan seblak
          </Text>
        </View>

        {/* Filter Periode: Hari ini, 7 Hari, Bulan ini */}
        <View style={styles.periodSelectorWrap}>
          <Text style={styles.periodFilterLabel}>Periode Laporan:</Text>
          <FilterChips
            options={periodOptions}
            selectedId={selectedPeriod}
            onSelect={setSelectedPeriod}
            accentColor="#C62828"
          />
        </View>
      </View>

      {/* 3 KARTU RINGKASAN PENJUALAN PERIODE */}
      <View style={styles.summaryGrid}>
        <StatCard
          title="Total Porsi Terjual"
          value={`${summary.porsi.toLocaleString('id-ID')} Porsi`}
          subtitle={`Periode: ${summary.labelPeriode}`}
          iconName="restaurant-outline"
          iconColor="#C62828"
          iconBg="#FBEAEC"
        />

        <StatCard
          title="Jumlah Transaksi"
          value={`${summary.transaksi.toLocaleString('id-ID')} Trx`}
          subtitle={`Rata-rata Rp ${Math.round(summary.rataRata).toLocaleString('id-ID')}/trx`}
          iconName="receipt-outline"
          iconColor="#0284C7"
          iconBg="#E0F2FE"
        />

        <StatCard
          title="Omzet Periode Ini"
          value={`Rp ${summary.omzet.toLocaleString('id-ID')}`}
          subtitle="Total pemasukan kotor"
          iconName="cash-outline"
          iconColor="#168653"
          iconBg="#DCFCE7"
        />
      </View>

      {/* PENJUALAN PER JAM & JAM RAMAI (PEAK HOUR) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Penjualan per Jam Buka Kedai</Text>
            <Text style={styles.cardSubtitle}>
              Distribusi transaksi dari jam 10.00 hingga kedai tutup (22.00)
            </Text>
          </View>

          <View style={styles.peakTag}>
            <Ionicons name="flame" size={14} color="#C62828" />
            <Text style={styles.peakTagText}>Jam Ramai Ditandai Merah</Text>
          </View>
        </View>

        {/* Bar Chart Jam Buka */}
        <View style={styles.hourlyChartContainer}>
          {HOURLY_SALES_DATA.map((item) => {
            const heightPercent = Math.round((item.jumlah / maxHourlyCount) * 100);
            return (
              <View key={item.jam} style={styles.barColumn}>
                {item.peak && (
                  <View style={styles.peakFlameBubble}>
                    <Ionicons name="flame" size={12} color="#C62828" />
                  </View>
                )}

                <Text style={[styles.barCountText, item.peak && styles.barCountTextPeak]}>
                  {item.jumlah}
                </Text>

                <View style={styles.barPillarTrack}>
                  <View
                    style={[
                      styles.barPillar,
                      {
                        height: `${heightPercent}%`,
                        backgroundColor: item.peak ? '#C62828' : '#D1C7BD',
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.barHourText, item.peak && styles.barHourTextPeak]}>
                  {item.jam}
                </Text>
                <Text style={styles.barLabelDesc}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartTipBox}>
          <Ionicons name="bulb-outline" size={16} color="#B45309" />
          <Text style={styles.chartTipText}>
            <Text style={{ fontWeight: '700' }}>Rekomendasi Dapur:</Text> Jam sibuk kedai terjadi pada{' '}
            <Text style={{ fontWeight: '800', color: '#C62828' }}>12.00–14.00 (Makan Siang)</Text> dan{' '}
            <Text style={{ fontWeight: '800', color: '#C62828' }}>18.00–20.00 (Makan Malam)</Text>. Pastikan bumbu kencur dan kuah jeletot siap sebelum jam tersebut.
          </Text>
        </View>
      </View>

      {/* PRODUK TERLARIS (DENGAN FILTER KATEGORI) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Peringkat Produk Terlaris</Text>
            <Text style={styles.cardSubtitle}>
              Urutan menu paling diminati pelanggan seblak pada periode {selectedPeriod.toLowerCase()}
            </Text>
          </View>
        </View>

        {/* Filter Kategori: Semua, Topping, Kuah, Minuman */}
        <View style={styles.categoryFilterRow}>
          <FilterChips
            options={categoryOptions}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
            accentColor="#52141D"
            scrollable={true}
          />
        </View>

        {/* Daftar Peringkat Produk */}
        <View style={styles.rankingList}>
          {products.map((item) => {
            const isTop3 = item.rank <= 3;
            return (
              <View key={item.nama} style={styles.productRow}>
                <View
                  style={[
                    styles.rankNumberCircle,
                    isTop3 ? styles.rankNumberTop : styles.rankNumberRegular,
                  ]}
                >
                  <Text
                    style={[
                      styles.rankNumberText,
                      isTop3 ? styles.rankNumberTextTop : styles.rankNumberTextRegular,
                    ]}
                  >
                    {item.rank}
                  </Text>
                </View>

                <View style={styles.productInfoCol}>
                  <View style={styles.productNameRow}>
                    <Text style={styles.productName}>{item.nama}</Text>
                    <View style={styles.productQtyBadge}>
                      <Text style={styles.productQtyText}>
                        {item.porsi} {item.unit}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar Proporsi */}
                  <View style={styles.proportionBarTrack}>
                    <View
                      style={[
                        styles.proportionBarFill,
                        {
                          width: `${item.proporsi}%`,
                          backgroundColor:
                            item.rank === 1 ? '#C62828' : item.rank === 2 ? '#EA580C' : '#78665E',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.productBottomRow}>
                    <Text style={styles.productCategoryLabel}>
                      Kategori: {item.kategori}
                    </Text>
                    <Text style={styles.productRevenueText}>
                      Omzet: Rp {item.omzet.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2 GRID: METODE PEMBAYARAN & TIPE PESANAN */}
      <View style={styles.twoColumnGrid}>
        {/* Metode Pembayaran */}
        <View style={[styles.card, { flex: 1, minWidth: 280 }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Metode Pembayaran</Text>
              <Text style={styles.cardSubtitle}>Tunai, QRIS, dan E-Wallet</Text>
            </View>
          </View>

          <View style={styles.paymentMethodsList}>
            {PAYMENT_METHODS_DATA.map((pm) => (
              <View key={pm.nama} style={styles.paymentMethodItem}>
                <View style={styles.pmHeaderRow}>
                  <View style={styles.pmLeft}>
                    <View style={[styles.pmIconBox, { backgroundColor: `${pm.warna}15` }]}>
                      <Ionicons name={pm.icon} size={18} color={pm.warna} />
                    </View>
                    <View>
                      <Text style={styles.pmName}>{pm.nama}</Text>
                      <Text style={styles.pmSub}>
                        {pm.jumlah} Transaksi · Rp {pm.nominal.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.pmPercent, { color: pm.warna }]}>{pm.persen}%</Text>
                </View>

                <View style={styles.pmBarTrack}>
                  <View
                    style={[
                      styles.pmBarFill,
                      { width: `${pm.persen}%`, backgroundColor: pm.warna },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tipe Pesanan: Dine-in vs Bungkus */}
        <View style={[styles.card, { flex: 1, minWidth: 280 }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Tipe Pesanan</Text>
              <Text style={styles.cardSubtitle}>Makan di tempat vs Bungkus</Text>
            </View>
          </View>

          <View style={styles.orderTypesList}>
            {ORDER_TYPES_DATA.map((ot) => (
              <View key={ot.nama} style={styles.orderTypeItem}>
                <View style={styles.otHeader}>
                  <View style={styles.otTitleRow}>
                    <Ionicons name={ot.icon} size={18} color={ot.warna} />
                    <Text style={styles.otName}>{ot.nama}</Text>
                  </View>
                  <Text style={[styles.otPercent, { color: ot.warna }]}>{ot.persen}%</Text>
                </View>

                <View style={styles.otBarTrack}>
                  <View
                    style={[
                      styles.otBarFill,
                      { width: `${ot.persen}%`, backgroundColor: ot.warna },
                    ]}
                  />
                </View>

                <Text style={styles.otDetails}>
                  {ot.jumlah} Transaksi ({ot.porsi} porsi seblak)
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.dineInNote}>
            <Ionicons name="information-circle-outline" size={16} color="#78665E" />
            <Text style={styles.dineInNoteText}>
              Mayoritas pelanggan memilih makan di tempat (dine-in) untuk menikmati kuah panas mendidih.
            </Text>
          </View>
        </View>
      </View>

      {/* KHAS SEBLAK: KUAH & LEVEL PEDAS FAVORIT */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.seblakBrandBadge}>
              <Ionicons name="flame" size={13} color="#C62828" />
              <Text style={styles.seblakBrandBadgeText}>Karakter Kuliner Nusantara</Text>
            </View>
            <Text style={styles.cardTitle}>Preferensi Kuah & Tingkat Kepedasan</Text>
            <Text style={styles.cardSubtitle}>
              Khas kedai seblak: racikan kuah kencur dan level cabai rawit yang paling disukai
            </Text>
          </View>
        </View>

        <View style={styles.preferencesGrid}>
          {/* Kuah Favorit */}
          <View style={styles.prefSection}>
            <Text style={styles.prefSectionTitle}>🥣 Varian Kuah Favorit Pelanggan</Text>
            <View style={styles.prefList}>
              {SEBLAK_PREFERENCES.kuah.map((k) => (
                <View key={k.nama} style={styles.prefItem}>
                  <View style={styles.prefTopRow}>
                    <Text style={styles.prefName}>{k.nama}</Text>
                    <Text style={[styles.prefPercent, { color: k.warna }]}>{k.persen}%</Text>
                  </View>
                  <View style={styles.prefBarTrack}>
                    <View
                      style={[
                        styles.prefBarFill,
                        { width: `${k.persen}%`, backgroundColor: k.warna },
                      ]}
                    />
                  </View>
                  <Text style={styles.prefCatatan}>{k.catatan}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Level Pedas Favorit */}
          <View style={styles.prefSection}>
            <Text style={styles.prefSectionTitle}>🌶️ Sebaran Level Kepedasan</Text>
            <View style={styles.pedasList}>
              {SEBLAK_PREFERENCES.pedas.map((p) => (
                <View key={p.level} style={styles.pedasItem}>
                  <View style={styles.pedasTopRow}>
                    <View style={styles.pedasLabelRow}>
                      <Text style={[styles.pedasLabel, p.favorite && styles.pedasLabelFav]}>
                        {p.label}
                      </Text>
                      {p.favorite && (
                        <View style={styles.favBadge}>
                          <Text style={styles.favBadgeText}>TERFAVORIT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.pedasPercent, { color: p.warna }]}>{p.persen}%</Text>
                  </View>

                  <View style={styles.pedasBarTrack}>
                    <View
                      style={[
                        styles.pedasBarFill,
                        { width: `${p.persen}%`, backgroundColor: p.warna },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerArea: {
    marginBottom: 20,
    gap: 14,
  },
  headerTitles: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#78665E',
  },
  periodSelectorWrap: {
    gap: 8,
  },
  periodFilterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  card: {
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
  cardHeader: {
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
    marginTop: 2,
  },
  peakTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBEAEC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  peakTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },
  hourlyChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2',
    marginBottom: 14,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
  },
  peakFlameBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBEAEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  barCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78665E',
    marginBottom: 6,
  },
  barCountTextPeak: {
    color: '#C62828',
    fontWeight: '900',
  },
  barPillarTrack: {
    width: '55%',
    height: 100,
    backgroundColor: '#F4EFEB',
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barPillar: {
    width: '100%',
    borderRadius: 6,
  },
  barHourText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78665E',
    marginTop: 8,
    textAlign: 'center',
  },
  barHourTextPeak: {
    color: '#C62828',
    fontWeight: '800',
  },
  barLabelDesc: {
    fontSize: 9,
    color: '#A89A92',
    textAlign: 'center',
    marginTop: 2,
  },
  chartTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chartTipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  categoryFilterRow: {
    marginBottom: 16,
  },
  rankingList: {
    gap: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F2',
  },
  rankNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberTop: {
    backgroundColor: '#C62828',
  },
  rankNumberRegular: {
    backgroundColor: '#F4EFEB',
  },
  rankNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  rankNumberTextTop: {
    color: '#FFFFFF',
  },
  rankNumberTextRegular: {
    color: '#78665E',
  },
  productInfoCol: {
    flex: 1,
  },
  productNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  productQtyBadge: {
    backgroundColor: '#F8F5F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#52141D',
  },
  proportionBarTrack: {
    height: 7,
    backgroundColor: '#F4EFEB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  proportionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategoryLabel: {
    fontSize: 11,
    color: '#8D7B70',
  },
  productRevenueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C1810',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  paymentMethodsList: {
    gap: 14,
  },
  paymentMethodItem: {
    gap: 6,
  },
  pmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pmLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pmIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pmName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  pmSub: {
    fontSize: 11,
    color: '#78665E',
    marginTop: 1,
  },
  pmPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  pmBarTrack: {
    height: 7,
    backgroundColor: '#F4EFEB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pmBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  orderTypesList: {
    gap: 14,
  },
  orderTypeItem: {
    gap: 6,
  },
  otHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  otPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  otBarTrack: {
    height: 7,
    backgroundColor: '#F4EFEB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  otBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  otDetails: {
    fontSize: 11,
    color: '#78665E',
  },
  dineInNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8F5F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  dineInNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#78665E',
    lineHeight: 16,
  },
  seblakBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBEAEC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  seblakBrandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C62828',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  prefSection: {
    flex: 1,
    minWidth: 260,
  },
  prefSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 12,
  },
  prefList: {
    gap: 12,
  },
  prefItem: {
    gap: 4,
  },
  prefTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  prefPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  prefBarTrack: {
    height: 6,
    backgroundColor: '#F4EFEB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  prefBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  prefCatatan: {
    fontSize: 10,
    color: '#8D7B70',
    marginTop: 2,
  },
  pedasList: {
    gap: 10,
  },
  pedasItem: {
    gap: 4,
  },
  pedasTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pedasLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pedasLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#523C34',
  },
  pedasLabelFav: {
    fontWeight: '800',
    color: '#C62828',
  },
  favBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  favBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
  },
  pedasPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  pedasBarTrack: {
    height: 6,
    backgroundColor: '#F4EFEB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pedasBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
