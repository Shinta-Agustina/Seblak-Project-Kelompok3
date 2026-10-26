import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FilterChips from '../FilterChips';

const WARNA = {
  merah: '#C62828',
  merahGelap: '#52141D',
  merahMuda: '#FBEAEC',
  hijau: '#168653',
  biru: '#0284C7',
  oranye: '#D97706',
  ungu: '#7C3AED',
  teks: '#2C1810',
  sekunder: '#78665E',
  garis: '#EFE7E2',
  latar: '#F8F6F4',
  putih: '#FFFFFF',
};

const MENU = [
  { nama: 'Seblak Original', kategori: 'Menu Utama', harga: 12000 },
  { nama: 'Seblak Seafood', kategori: 'Menu Utama', harga: 18000 },
  { nama: 'Seblak Komplit', kategori: 'Menu Utama', harga: 20000 },
  { nama: 'Kerupuk', kategori: 'Topping', harga: 2000 },
  { nama: 'Makaroni', kategori: 'Topping', harga: 2000 },
  { nama: 'Bakso', kategori: 'Topping', harga: 3000 },
  { nama: 'Sosis', kategori: 'Topping', harga: 3000 },
  { nama: 'Seafood', kategori: 'Topping', harga: 5000 },
  { nama: 'Es Teh', kategori: 'Minuman', harga: 5000 },
  { nama: 'Es Jeruk', kategori: 'Minuman', harga: 6000 },
];

const METODE = ['Tunai', 'QRIS', 'E-Wallet'];
const VARIAN_KUAH = [
  'Kuah Original',
  'Kuah Mentai',
  'Kuah Suki',
  'Kuah Kari',
];

const rupiah = (angka) =>
  `Rp ${Number(angka || 0).toLocaleString('id-ID')}`;

const buatTransaksi = () => {
  const hasil = [];
  const sekarang = new Date();

  for (let mundur = 30; mundur >= 0; mundur--) {
    const tanggal = new Date(sekarang);
    tanggal.setDate(sekarang.getDate() - mundur);
    tanggal.setHours(0, 0, 0, 0);

    const jumlah = 5 + (
      (tanggal.getDate() + tanggal.getMonth()) % 7
    );

    for (let i = 0; i < jumlah; i++) {
      const seed =
        tanggal.getDate() * 13 +
        tanggal.getMonth() * 7 +
        i * 11;

      const menuUtama = MENU[seed % 3];
      const topping = MENU[3 + (seed % 5)];
      const minuman = MENU[8 + (seed % 2)];

      const items = [
        { ...menuUtama, qty: 1 + (seed % 2) },
        { ...topping, qty: 1 + (i % 3) },
      ];

      if (i % 2 === 0) {
        items.push({ ...minuman, qty: 1 });
      }

      if (i % 3 === 0) {
        items.push({
          nama: VARIAN_KUAH[seed % VARIAN_KUAH.length],
          kategori: 'Kuah',
          harga: 3000,
          qty: 1,
        });
      }

      const total = items.reduce(
        (sum, item) => sum + item.harga * item.qty,
        0
      );

      const jam = 10 + ((i * 2 + tanggal.getDate()) % 13);
      const menit = [0, 10, 15, 20, 30, 40, 45, 50][
        (i + seed) % 8
      ];

      hasil.push({
        id: `TRX-${tanggal.getFullYear()}${String(
          tanggal.getMonth() + 1
        ).padStart(2, '0')}${String(
          tanggal.getDate()
        ).padStart(2, '0')}-${i + 1}`,
        tanggal,
        waktu: `${String(jam).padStart(2, '0')}:${String(
          menit
        ).padStart(2, '0')}`,
        status: 'Lunas',
        items,
        total,
        metode: METODE[seed % METODE.length],
        tipe: (i + seed) % 4 === 0 ? 'Bungkus' : 'Makan di Tempat',
        kuah: VARIAN_KUAH[seed % VARIAN_KUAH.length],
        pedas: String(seed % 5),
      });
    }
  }

  return hasil;
};

function KartuRingkasan({
  judul,
  nilai,
  keterangan,
  ikon,
  warna,
  latarIkon,
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <Text style={styles.summaryTitle}>{judul}</Text>
        <View
          style={[
            styles.summaryIcon,
            { backgroundColor: latarIkon },
          ]}
        >
          <Ionicons name={ikon} size={21} color={warna} />
        </View>
      </View>

      <Text style={styles.summaryValue}>{nilai}</Text>
      <Text style={styles.summaryCaption}>{keterangan}</Text>
    </View>
  );
}

function JudulBagian({ judul, deskripsi, kanan }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{judul}</Text>
        {!!deskripsi && (
          <Text style={styles.sectionSubtitle}>{deskripsi}</Text>
        )}
      </View>
      {kanan}
    </View>
  );
}

function KartuKosong({ pesan }) {
  return (
    <View style={styles.emptyBox}>
      <Ionicons
        name="bar-chart-outline"
        size={28}
        color="#B8AAA2"
      />
      <Text style={styles.emptyText}>{pesan}</Text>
    </View>
  );
}

export default function TabPenjualan() {
  const [selectedPeriod, setSelectedPeriod] = useState('Hari ini');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const semuaTransaksi = useMemo(() => buatTransaksi(), []);

  const periodOptions = [
    { id: 'Hari ini', label: 'Hari ini' },
    { id: '7 Hari', label: '7 Hari Terakhir' },
    { id: 'Bulan ini', label: 'Bulan ini' },
  ];

  const categoryOptions = [
    { id: 'Semua', label: 'Semua Menu' },
    { id: 'Menu Utama', label: 'Menu Utama' },
    { id: 'Topping', label: 'Topping' },
    { id: 'Kuah', label: 'Varian Kuah' },
    { id: 'Minuman', label: 'Minuman' },
  ];

  const transaksiPeriode = useMemo(() => {
    const sekarang = new Date();
    const awal = new Date(sekarang);
    awal.setHours(0, 0, 0, 0);

    if (selectedPeriod === '7 Hari') {
      awal.setDate(awal.getDate() - 6);
    } else if (selectedPeriod === 'Bulan ini') {
      awal.setDate(1);
    }

    const akhir = new Date(sekarang);
    akhir.setHours(23, 59, 59, 999);

    return semuaTransaksi.filter((trx) => (
      trx.tanggal >= awal &&
      trx.tanggal <= akhir &&
      trx.status === 'Lunas'
    ));
  }, [semuaTransaksi, selectedPeriod]);

  const ringkasan = useMemo(() => {
    const omzet = transaksiPeriode.reduce(
      (total, trx) => total + trx.total,
      0
    );

    const jumlahItem = transaksiPeriode.reduce(
      (total, trx) => total + trx.items.reduce(
        (subtotal, item) => subtotal + item.qty,
        0
      ),
      0
    );

    const transaksi = transaksiPeriode.length;

    return {
      omzet,
      jumlahItem,
      transaksi,
      rataRata: transaksi ? omzet / transaksi : 0,
    };
  }, [transaksiPeriode]);

  const produkTerlaris = useMemo(() => {
    const map = {};

    transaksiPeriode.forEach((trx) => {
      trx.items.forEach((item) => {
        const nama = item.nama;
        const kategori = item.kategori;

        const cocok =
          selectedCategory === 'Semua' ||
          kategori === selectedCategory ||
          (selectedCategory === 'Topping' &&
            kategori === 'Topping') ||
          (selectedCategory === 'Kuah' &&
            kategori === 'Kuah');

        if (!cocok) return;

        if (!map[nama]) {
          map[nama] = {
            nama,
            kategori,
            qty: 0,
            omzet: 0,
          };
        }

        map[nama].qty += item.qty;
        map[nama].omzet += item.harga * item.qty;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .map((item, index) => ({
        ...item,
        peringkat: index + 1,
      }));
  }, [transaksiPeriode, selectedCategory]);

  const dataPerJam = useMemo(() => {
    const data = Array.from({ length: 13 }, (_, index) => ({
      jam: index + 10,
      jumlah: 0,
      omzet: 0,
    }));

    transaksiPeriode.forEach((trx) => {
      const jam = Number(trx.waktu.split(':')[0]);

      if (jam >= 10 && jam <= 22) {
        data[jam - 10].jumlah += 1;
        data[jam - 10].omzet += trx.total;
      }
    });

    return data;
  }, [transaksiPeriode]);

  const jamMaksimum = Math.max(
    1,
    ...dataPerJam.map((item) => item.jumlah)
  );

  const jamRamai = dataPerJam.reduce(
    (terbaik, item) =>
      item.jumlah > terbaik.jumlah ? item : terbaik,
    dataPerJam[0]
  );

  const metodePembayaran = useMemo(() => {
    const map = {};

    transaksiPeriode.forEach((trx) => {
      const nama = trx.metode;

      if (!map[nama]) {
        map[nama] = {
          nama,
          jumlah: 0,
          omzet: 0,
        };
      }

      map[nama].jumlah += 1;
      map[nama].omzet += trx.total;
    });

    return Object.values(map).map((item) => ({
      ...item,
      persen: ringkasan.omzet
        ? Math.round(item.omzet / ringkasan.omzet * 100)
        : 0,
      warna:
        item.nama === 'Tunai'
          ? WARNA.hijau
          : item.nama === 'QRIS'
          ? WARNA.biru
          : WARNA.ungu,
      ikon:
        item.nama === 'Tunai'
          ? 'cash-outline'
          : item.nama === 'QRIS'
          ? 'qr-code-outline'
          : 'wallet-outline',
    }));
  }, [transaksiPeriode, ringkasan.omzet]);

  const jenisPesanan = useMemo(() => {
    const data = [
      {
        nama: 'Makan di Tempat',
        ikon: 'restaurant-outline',
        warna: WARNA.hijau,
        jumlah: 0,
        omzet: 0,
      },
      {
        nama: 'Bungkus',
        ikon: 'bag-handle-outline',
        warna: WARNA.oranye,
        jumlah: 0,
        omzet: 0,
      },
    ];

    transaksiPeriode.forEach((trx) => {
      const item = data.find((x) => x.nama === trx.tipe);
      if (item) {
        item.jumlah += 1;
        item.omzet += trx.total;
      }
    });

    return data.map((item) => ({
      ...item,
      persen: ringkasan.transaksi
        ? Math.round(item.jumlah / ringkasan.transaksi * 100)
        : 0,
    }));
  }, [transaksiPeriode, ringkasan.transaksi]);

  const preferensi = useMemo(() => {
    const hitung = (field) => {
      const map = {};

      transaksiPeriode.forEach((trx) => {
        const nilai = trx[field];
        map[nilai] = (map[nilai] || 0) + 1;
      });

      const total = Object.values(map).reduce(
        (sum, jumlah) => sum + jumlah,
        0
      );

      return Object.entries(map)
        .map(([nama, jumlah]) => ({
          nama,
          jumlah,
          persen: total ? Math.round(jumlah / total * 100) : 0,
        }))
        .sort((a, b) => b.jumlah - a.jumlah);
    };

    return {
      kuah: hitung('kuah'),
      pedas: hitung('pedas'),
    };
  }, [transaksiPeriode]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Ringkasan Penjualan</Text>
          <Text style={styles.pageDescription}>
            Pantau omzet, menu favorit, dan aktivitas kedai
          </Text>
        </View>

        <View style={styles.periodBox}>
          <Text style={styles.filterLabel}>Periode laporan</Text>
          <FilterChips
            options={periodOptions}
            selectedId={selectedPeriod}
            onSelect={setSelectedPeriod}
            accentColor={WARNA.merah}
          />
        </View>
      </View>

      {/* RINGKASAN */}
      <View style={styles.summaryGrid}>
        <KartuRingkasan
          judul="Total Omzet"
          nilai={rupiah(ringkasan.omzet)}
          keterangan="Pendapatan pada periode ini"
          ikon="wallet-outline"
          warna={WARNA.hijau}
          latarIkon="#E3F5EB"
        />

        <KartuRingkasan
          judul="Total Transaksi"
          nilai={ringkasan.transaksi.toLocaleString('id-ID')}
          keterangan={`Rata-rata ${rupiah(ringkasan.rataRata)} / transaksi`}
          ikon="receipt-outline"
          warna={WARNA.biru}
          latarIkon="#E3F3FC"
        />

        <KartuRingkasan
          judul="Item Terjual"
          nilai={ringkasan.jumlahItem.toLocaleString('id-ID')}
          keterangan="Jumlah item dari seluruh pesanan"
          ikon="fast-food-outline"
          warna={WARNA.merah}
          latarIkon={WARNA.merahMuda}
        />
      </View>

      {/* GRAFIK PER JAM */}
      <View style={styles.card}>
        <JudulBagian
          judul="Aktivitas Penjualan"
          deskripsi="Distribusi transaksi berdasarkan jam operasional"
          kanan={
            <View style={styles.peakBadge}>
              <Ionicons
                name="flame"
                size={15}
                color={WARNA.merah}
              />
              <Text style={styles.peakBadgeText}>
                Ramai {String(jamRamai.jam).padStart(2, '0')}.00
              </Text>
            </View>
          }
        />

        {ringkasan.transaksi === 0 ? (
          <KartuKosong pesan="Belum ada transaksi pada periode ini." />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartContent}
          >
            {dataPerJam.map((item) => {
              const tinggi = Math.max(
                item.jumlah > 0 ? 8 : 3,
                item.jumlah / jamMaksimum * 135
              );

              const puncak =
                item.jumlah > 0 &&
                item.jumlah === jamRamai.jumlah;

              return (
                <View key={item.jam} style={styles.barColumn}>
                  <Text
                    style={[
                      styles.barCount,
                      puncak && { color: WARNA.merah },
                    ]}
                  >
                    {item.jumlah}
                  </Text>

                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: tinggi,
                          backgroundColor: puncak
                            ? WARNA.merah
                            : '#D9CEC8',
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.barHour,
                      puncak && {
                        color: WARNA.merah,
                        fontWeight: '800',
                      },
                    ]}
                  >
                    {String(item.jam).padStart(2, '0')}.00
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.chartFooter}>
          <View style={styles.chartLegend}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: WARNA.merah },
              ]}
            />
            <Text style={styles.legendText}>Jam paling ramai</Text>
          </View>

          <Text style={styles.chartFooterText}>
            {ringkasan.transaksi} transaksi tercatat
          </Text>
        </View>
      </View>

      {/* MENU TERLARIS */}
      <View style={styles.card}>
        <JudulBagian
          judul="Menu Terlaris"
          deskripsi="Peringkat menu berdasarkan jumlah item terjual"
        />

        <View style={styles.categoryFilters}>
          <FilterChips
            options={categoryOptions}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
            accentColor={WARNA.merahGelap}
            scrollable
          />
        </View>

        {produkTerlaris.length === 0 ? (
          <KartuKosong pesan="Tidak ada menu untuk kategori ini." />
        ) : (
          <View style={styles.productList}>
            {produkTerlaris.map((item) => {
              const maksimum = Math.max(
                1,
                ...produkTerlaris.map((produk) => produk.qty)
              );

              const persen = Math.round(
                item.qty / maksimum * 100
              );

              return (
                <View key={item.nama} style={styles.productRow}>
                  <View
                    style={[
                      styles.rankCircle,
                      item.peringkat === 1
                        ? styles.rankFirst
                        : styles.rankOther,
                    ]}
                  >
                    {item.peringkat === 1 ? (
                      <Ionicons
                        name="trophy"
                        size={17}
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text style={styles.rankNumber}>
                        {item.peringkat}
                      </Text>
                    )}
                  </View>

                  <View style={styles.productMain}>
                    <View style={styles.productTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>
                          {item.nama}
                        </Text>
                        <Text style={styles.productCategory}>
                          {item.kategori}
                        </Text>
                      </View>

                      <Text style={styles.productQty}>
                        {item.qty} item
                      </Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${persen}%`,
                            backgroundColor:
                              item.peringkat === 1
                                ? WARNA.merah
                                : item.peringkat === 2
                                ? WARNA.oranye
                                : '#B8AAA2',
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.productRevenue}>
                      Omzet {rupiah(item.omzet)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* METODE PEMBAYARAN */}
      <View style={styles.twoColumns}>
        <View style={[styles.card, styles.columnCard]}>
          <JudulBagian
            judul="Metode Pembayaran"
            deskripsi="Rincian berdasarkan metode pembayaran"
          />

          {metodePembayaran.length === 0 ? (
            <KartuKosong pesan="Belum ada data pembayaran." />
          ) : (
            metodePembayaran.map((item) => (
              <View key={item.nama} style={styles.paymentRow}>
                <View
                  style={[
                    styles.paymentIcon,
                    { backgroundColor: `${item.warna}15` },
                  ]}
                >
                  <Ionicons
                    name={item.ikon}
                    size={20}
                    color={item.warna}
                  />
                </View>

                <View style={styles.paymentMain}>
                  <View style={styles.paymentNameRow}>
                    <Text style={styles.paymentName}>
                      {item.nama}
                    </Text>
                    <Text style={styles.paymentPercent}>
                      {item.persen}%
                    </Text>
                  </View>

                  <Text style={styles.paymentAmount}>
                    {rupiah(item.omzet)}
                  </Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.persen}%`,
                          backgroundColor: item.warna,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.paymentCount}>
                    {item.jumlah} transaksi
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* JENIS PESANAN */}
        <View style={[styles.card, styles.columnCard]}>
          <JudulBagian
            judul="Jenis Pesanan"
            deskripsi="Makan di tempat dan bungkus"
          />

          {jenisPesanan.map((item) => (
            <View key={item.nama} style={styles.orderCard}>
              <View
                style={[
                  styles.orderIcon,
                  { backgroundColor: `${item.warna}15` },
                ]}
              >
                <Ionicons
                  name={item.ikon}
                  size={23}
                  color={item.warna}
                />
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.orderName}>{item.nama}</Text>
                <Text style={styles.orderCount}>
                  {item.jumlah} pesanan
                </Text>
                <Text style={styles.orderRevenue}>
                  {rupiah(item.omzet)}
                </Text>
              </View>

              <Text style={styles.orderPercent}>
                {item.persen}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* PREFERENSI PELANGGAN */}
      <View style={styles.twoColumns}>
        <View style={[styles.card, styles.columnCard]}>
          <JudulBagian
            judul="Favorit Kuah"
            deskripsi="Varian kuah yang dipilih"
          />

          {preferensi.kuah.length === 0 ? (
            <KartuKosong pesan="Belum ada preferensi kuah." />
          ) : (
            preferensi.kuah.map((item, index) => (
              <View key={item.nama} style={styles.preferenceRow}>
                <View
                  style={[
                    styles.preferenceNumber,
                    index === 0 && {
                      backgroundColor: WARNA.merahMuda,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceNumberText,
                      index === 0 && { color: WARNA.merah },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.preferenceMain}>
                  <View style={styles.preferenceTop}>
                    <Text style={styles.preferenceName}>
                      {item.nama}
                    </Text>
                    <Text style={styles.preferencePercent}>
                      {item.persen}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.persen}%`,
                          backgroundColor: WARNA.merah,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.preferenceCount}>
                    {item.jumlah} pesanan
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, styles.columnCard]}>
          <JudulBagian
            judul="Level Pedas"
            deskripsi="Tingkat pedas yang dipilih"
          />

          {preferensi.pedas.length === 0 ? (
            <KartuKosong pesan="Belum ada preferensi level pedas." />
          ) : (
            preferensi.pedas.map((item, index) => (
              <View key={item.nama} style={styles.preferenceRow}>
                <View
                  style={[
                    styles.preferenceNumber,
                    index === 0 && {
                      backgroundColor: '#FEE2E2',
                    },
                  ]}
                >
                  <Ionicons
                    name="flame"
                    size={16}
                    color={index === 0 ? WARNA.merah : '#8D7B70'}
                  />
                </View>

                <View style={styles.preferenceMain}>
                  <View style={styles.preferenceTop}>
                    <Text style={styles.preferenceName}>
                      Level {item.nama}
                    </Text>
                    <Text style={styles.preferencePercent}>
                      {item.persen}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.persen}%`,
                          backgroundColor:
                            index === 0
                              ? WARNA.merah
                              : WARNA.oranye,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.preferenceCount}>
                    {item.jumlah} pesanan
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Ionicons
          name="calendar-outline"
          size={15}
          color={WARNA.sekunder}
        />
        <Text style={styles.footerText}>
          Periode laporan: {selectedPeriod}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARNA.latar,
  },
  pageContent: {
    padding: 22,
    paddingBottom: 36,
    gap: 18,
  },
  pageHeader: {
    gap: 18,
  },
  pageHeading: {
    gap: 5,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: WARNA.teks,
  },
  pageDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: WARNA.sekunder,
  },
  periodBox: {
    backgroundColor: WARNA.putih,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WARNA.garis,
    padding: 14,
    gap: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 210,
    minWidth: 0,
    backgroundColor: WARNA.putih,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WARNA.garis,
    padding: 18,
    gap: 10,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: WARNA.sekunder,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 23,
    fontWeight: '900',
    color: WARNA.teks,
  },
  summaryCaption: {
    fontSize: 11,
    color: WARNA.sekunder,
    lineHeight: 17,
  },
  card: {
    backgroundColor: WARNA.putih,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WARNA.garis,
    padding: 18,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: WARNA.teks,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: WARNA.sekunder,
    lineHeight: 17,
    marginTop: 4,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WARNA.merahMuda,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  peakBadgeText: {
    color: WARNA.merah,
    fontSize: 10,
    fontWeight: '800',
  },
  chartContent: {
    alignItems: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  barColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '800',
    color: WARNA.sekunder,
  },
  barTrack: {
    height: 145,
    width: 22,
    backgroundColor: '#F4EFEB',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barHour: {
    fontSize: 10,
    color: WARNA.sekunder,
  },
  chartFooter: {
    borderTopWidth: 1,
    borderTopColor: WARNA.garis,
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: WARNA.sekunder,
  },
  chartFooterText: {
    fontSize: 11,
    fontWeight: '700',
    color: WARNA.sekunder,
  },
  categoryFilters: {
    marginTop: -4,
  },
  productList: {
    gap: 17,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rankCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankFirst: {
    backgroundColor: WARNA.merah,
  },
  rankOther: {
    backgroundColor: '#F4EFEB',
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: WARNA.sekunder,
  },
  productMain: {
    flex: 1,
    gap: 8,
  },
  productTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    color: WARNA.teks,
  },
  productCategory: {
    fontSize: 10,
    color: WARNA.sekunder,
    marginTop: 3,
  },
  productQty: {
    fontSize: 11,
    fontWeight: '800',
    color: WARNA.merah,
  },
  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: '#F0EAE6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  productRevenue: {
    fontSize: 10,
    color: WARNA.sekunder,
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'stretch',
  },
  columnCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 0,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEEA',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMain: {
    flex: 1,
    gap: 6,
  },
  paymentNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  paymentName: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },
  paymentPercent: {
    fontSize: 11,
    fontWeight: '900',
    color: WARNA.teks,
  },
  paymentAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: WARNA.sekunder,
  },
  paymentCount: {
    fontSize: 10,
    color: WARNA.sekunder,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: WARNA.garis,
    borderRadius: 12,
  },
  orderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    gap: 4,
  },
  orderName: {
    fontSize: 12,
    fontWeight: '800',
    color: WARNA.teks,
  },
  orderCount: {
    fontSize: 10,
    color: WARNA.sekunder,
  },
  orderRevenue: {
    fontSize: 11,
    fontWeight: '800',
    color: WARNA.teks,
  },
  orderPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: WARNA.sekunder,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  preferenceNumber: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#F4EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: WARNA.sekunder,
  },
  preferenceMain: {
    flex: 1,
    gap: 7,
  },
  preferenceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  preferenceName: {
    fontSize: 12,
    fontWeight: '700',
    color: WARNA.teks,
  },
  preferencePercent: {
    fontSize: 11,
    fontWeight: '900',
    color: WARNA.sekunder,
  },
  preferenceCount: {
    fontSize: 10,
    color: WARNA.sekunder,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  emptyText: {
    textAlign: 'center',
    color: WARNA.sekunder,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
  },
  footerText: {
    fontSize: 11,
    color: WARNA.sekunder,
  },
});