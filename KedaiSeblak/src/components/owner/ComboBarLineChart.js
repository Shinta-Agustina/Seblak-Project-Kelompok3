import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import formatCurrency from '../../utils/formatCurrency';

// Palet Warna Brand Seblak Prasmanan
const WARNA_OMZET = '#52141D';        // Omzet (Deep Maroon)
const WARNA_PENGELUARAN = '#DC2626';   // Pengeluaran (Merah Jreng)
const WARNA_LABA = '#168653';          // Laba Bersih (Hijau Emerald)

/**
 * Format nominal jutaan / ribuan singkat untuk floating callout badge
 * Contoh: 3.420.000 -> "3,42 jt", 1.060.000 -> "1,06 jt", 2.360.000 -> "2,36 jt"
 */
function formatShortMillion(val) {
  if (val === undefined || val === null) return '0';
  if (val >= 1000000000) {
    const m = val / 1000000000;
    return `${m.toFixed(2).replace('.', ',')} M`;
  }
  if (val >= 1000000) {
    const jt = val / 1000000;
    const str = Number.isInteger(jt)
      ? `${jt} jt`
      : `${jt.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} jt`;
    return str;
  }
  if (val >= 1000) {
    const rb = val / 1000;
    const str = Number.isInteger(rb)
      ? `${rb} rb`
      : `${rb.toFixed(1).replace(/\.?0+$/, '').replace('.', ',')} rb`;
    return str;
  }
  return `${val}`;
}

/**
 * Helper untuk menghitung skala sumbu Y yang rapi dan bulat (kelipatan 1 jt, 2 jt, 10 jt)
 */
function calculateScale(rawMax) {
  if (rawMax <= 0) {
    return {
      chartMax: 1000000,
      ticks: [1000000, 750000, 500000, 250000, 0],
      numSteps: 4,
    };
  }

  const niceSteps = [
    50000, 100000, 200000, 250000, 500000,
    1000000, 2000000, 2500000, 5000000,
    10000000, 20000000, 25000000, 50000000, 100000000,
  ];

  let chosenStep = 1000000;
  for (const step of niceSteps) {
    const count = rawMax / step;
    if (count <= 5) {
      chosenStep = step;
      break;
    }
  }

  const chartMax = Math.ceil(rawMax / chosenStep) * chosenStep;
  const numSteps = Math.max(2, Math.round(chartMax / chosenStep));
  const ticks = [];
  for (let i = numSteps; i >= 0; i--) {
    ticks.push(i * chosenStep);
  }

  return { chartMax, ticks, numSteps };
}

/**
 * Format label nominal sumbu Y
 */
function formatYAxisLabel(val) {
  if (val === 0) return '0';
  if (val >= 1000000000) {
    const m = val / 1000000000;
    return Number.isInteger(m) ? `${m} M` : `${m.toFixed(1)} M`;
  }
  if (val >= 1000000) {
    const jt = val / 1000000;
    return Number.isInteger(jt) ? `${jt} jt` : `${jt.toFixed(1)} jt`;
  }
  if (val >= 1000) {
    const rb = val / 1000;
    return Number.isInteger(rb) ? `${rb} rb` : `${rb.toFixed(0)} rb`;
  }
  return `${val}`;
}

export default function ComboBarLineChart({
  data = [],
  height = 190,
  showLegend = true,
}) {
  const { width } = useWindowDimensions();
  const isSmall = width < 420;

  // Ukuran lebar plot area dinamis
  const [plotWidth, setPlotWidth] = useState(300);

  // Indeks bar yang sedang dipilih (default item aktif atau terakhir)
  const defaultIndex = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const curIdx = data.findIndex((d) => d.isCurrent);
    return curIdx >= 0 ? curIdx : data.length - 1;
  }, [data]);

  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  // Metrik yang sedang aktif dipencet: 'omzet' | 'pengeluaran' | 'laba'
  const [selectedMetric, setSelectedMetric] = useState('laba');

  useEffect(() => {
    setSelectedIndex(defaultIndex);
    setSelectedMetric('laba');
  }, [defaultIndex, data]);

  if (!data || data.length === 0) return null;

  // Nilai maksimum untuk skala
  const rawMax = Math.max(
    ...data.map((d) => Math.max(d.omzet || 0, d.pengeluaran || 0, d.laba || 0)),
    100000
  );

  const { chartMax, ticks: yTicks, numSteps } = calculateScale(rawMax);

  // Geometri Area Plot:
  // Seluruh elemen 100% berada di dalam card
  const totalPlotHeight = Math.max(140, height - 40);
  const topBuffer = 28; // Ruang aman di bagian atas agar callout badge tidak mentok card
  const usableHeight = totalPlotHeight - topBuffer;
  const colCount = data.length;

  // Lebar batang proporsional
  const barWidth = colCount <= 4 ? 18 : colCount <= 7 ? 12 : 7;
  const barGap = colCount <= 4 ? 4 : colCount <= 7 ? 3 : 2;

  // Titik koordinat garis laba bersih
  const points = useMemo(() => {
    return data.map((d, idx) => {
      const xPx = ((idx + 0.5) / colCount) * plotWidth;
      const clampedLaba = Math.max(d.laba || 0, 0);
      const yPx = topBuffer + usableHeight - (clampedLaba / chartMax) * usableHeight;
      return {
        idx,
        xPx,
        yPx: Math.max(topBuffer + 4, Math.min(totalPlotHeight - 4, yPx)),
        laba: d.laba,
        label: d.label,
      };
    });
  }, [data, colCount, plotWidth, totalPlotHeight, topBuffer, usableHeight, chartMax]);

  // Garis tren laba yang menghubungkan titik
  const lineSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dx = p2.xPx - p1.xPx;
      const dy = p2.yPx - p1.yPx;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const midX = (p1.xPx + p2.xPx) / 2;
      const midY = (p1.yPx + p2.yPx) / 2;

      segments.push({
        key: `seg-${i}`,
        left: midX - length / 2,
        top: midY - 1.25,
        width: length,
        angle,
      });
    }
    return segments;
  }, [points]);

  const activeItem = data[selectedIndex] || data[0];

  return (
    <View style={styles.container}>
      {/* 1. Interactive Detail Banner (Bisa Digeser Kanan untuk Melihat Laba Bersih) */}
      {activeItem && (
        <View style={styles.interactiveBanner}>
          <View style={styles.bannerTagBadge}>
            <Text style={styles.bannerTagText}>{activeItem.label}</Text>
          </View>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScrollView}
            contentContainerStyle={styles.bannerValuesScroll}
          >
            {/* Tombol Omzet */}
            <TouchableOpacity
              style={[
                styles.bannerValItem,
                selectedMetric === 'omzet' && styles.bannerValItemActiveOmzet,
              ]}
              onPress={() => setSelectedMetric('omzet')}
              activeOpacity={0.7}
            >
              <View style={[styles.dotSmall, { backgroundColor: WARNA_OMZET }]} />
              <Text style={styles.bannerValLabel}>Omzet:</Text>
              <Text style={[styles.bannerValText, { color: WARNA_OMZET }]}>
                {formatCurrency(activeItem.omzet)}
              </Text>
            </TouchableOpacity>

            {/* Tombol Pengeluaran */}
            <TouchableOpacity
              style={[
                styles.bannerValItem,
                selectedMetric === 'pengeluaran' && styles.bannerValItemActiveExpense,
              ]}
              onPress={() => setSelectedMetric('pengeluaran')}
              activeOpacity={0.7}
            >
              <View style={[styles.dotSmall, { backgroundColor: WARNA_PENGELUARAN }]} />
              <Text style={styles.bannerValLabel}>Pengeluaran:</Text>
              <Text style={[styles.bannerValText, { color: WARNA_PENGELUARAN }]}>
                {formatCurrency(activeItem.pengeluaran)}
              </Text>
            </TouchableOpacity>

            {/* Tombol Laba Bersih (Bisa Dipencet & Menampilkan Nominal) */}
            <TouchableOpacity
              style={[
                styles.bannerValItem,
                selectedMetric === 'laba' && styles.bannerValItemActiveLaba,
              ]}
              onPress={() => setSelectedMetric('laba')}
              activeOpacity={0.7}
            >
              <View style={[styles.dotSmall, { backgroundColor: WARNA_LABA }]} />
              <Text style={styles.bannerValLabel}>Laba Bersih:</Text>
              <Text style={[styles.bannerValText, { color: WARNA_LABA }]}>
                {formatCurrency(activeItem.laba)}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 2. Legend Chart Tanpa Tulisan "Batang" / "Garis" (Setiap Elemen Bisa Dipencet) */}
      {showLegend && (
        <View style={styles.legendRow}>
          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => setSelectedMetric('omzet')}
            activeOpacity={0.7}
          >
            <View style={[styles.legendBarBox, { backgroundColor: WARNA_OMZET }]} />
            <Text
              style={[
                styles.legendText,
                selectedMetric === 'omzet' && { color: WARNA_OMZET, fontWeight: '900' },
              ]}
            >
              Omzet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => setSelectedMetric('pengeluaran')}
            activeOpacity={0.7}
          >
            <View style={[styles.legendBarBox, { backgroundColor: WARNA_PENGELUARAN }]} />
            <Text
              style={[
                styles.legendText,
                selectedMetric === 'pengeluaran' && { color: WARNA_PENGELUARAN, fontWeight: '900' },
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>

          {/* Legend Laba Bersih (Bisa Dipencet) */}
          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => setSelectedMetric('laba')}
            activeOpacity={0.7}
          >
            <View style={styles.legendLineBox}>
              <View style={[styles.legendLineDash, { backgroundColor: WARNA_LABA }]} />
              <View style={[styles.legendLineDot, { backgroundColor: WARNA_LABA }]} />
            </View>
            <Text
              style={[
                styles.legendText,
                { color: WARNA_LABA, fontWeight: '800' },
                selectedMetric === 'laba' && { fontWeight: '900', textDecorationLine: 'underline' },
              ]}
            >
              Laba Bersih
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Area Utama Grafik: Sumbu Y (Kiri) + Plot Area (Kanan) */}
      <View style={[styles.chartMainRow, { height: totalPlotHeight }]}>
        {/* Kolom Sumbu Y (Hitungan Skala: misal 4 jt, 3 jt, 2 jt, 1 jt, 0) */}
        <View style={[styles.yAxisCol, { height: totalPlotHeight }]}>
          {yTicks.map((tickVal, idx) => {
            const topY = topBuffer + (idx / numSteps) * usableHeight;
            return (
              <View
                key={`ytick-${idx}`}
                style={[
                  styles.yTickLabelWrapper,
                  {
                    top: topY,
                    transform: [{ translateY: -7 }],
                  },
                ]}
              >
                <Text style={styles.yTickText}>{formatYAxisLabel(tickVal)}</Text>
              </View>
            );
          })}
        </View>

        {/* Plot Area Batang & Garis */}
        <View
          style={[styles.plotAreaWrapper, { height: totalPlotHeight }]}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - plotWidth) > 2) {
              setPlotWidth(w);
            }
          }}
        >
          {/* Garis Grid Horizontal Rapi */}
          {yTicks.map((_, idx) => {
            const topY = topBuffer + (idx / numSteps) * usableHeight;
            const isBottom = idx === yTicks.length - 1;
            return (
              <View
                key={`grid-${idx}`}
                style={[
                  styles.gridHorizontalLine,
                  {
                    top: topY,
                    borderTopColor: isBottom ? '#D8CDC7' : '#EDE5E0',
                    borderTopWidth: isBottom ? 1.5 : 1,
                    borderStyle: isBottom ? 'solid' : 'dashed',
                  },
                ]}
              />
            );
          })}

          {/* Kolom Batang (Omzet, Pengeluaran, & Laba Bisa Dipencet Masing-Masing) */}
          <View style={[styles.barsRow, { height: totalPlotHeight }]}>
            {data.map((item, idx) => {
              const omzetH = Math.max(4, (item.omzet / chartMax) * usableHeight);
              const expH = Math.max(4, (item.pengeluaran / chartMax) * usableHeight);
              const isColSelected = selectedIndex === idx;

              return (
                <View
                  key={`col-${idx}`}
                  style={[
                    styles.columnContainer,
                    isColSelected && styles.columnContainerSelected,
                  ]}
                >
                  {/* Area Atas Kolom (Bisa Dipencet Untuk Memilih Laba Bersih) */}
                  <TouchableOpacity
                    style={styles.upperLabaTouchArea}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedIndex(idx);
                      setSelectedMetric('laba');
                    }}
                  />

                  {/* Floating Callout Badge Pas di Atas Elemen yang Dipencet dengan Keterangan Jelas */}
                  {isColSelected && (
                    <View
                      style={[
                        styles.activeElementCallout,
                        selectedMetric === 'omzet' && {
                          backgroundColor: WARNA_OMZET,
                          bottom: omzetH + 4,
                        },
                        selectedMetric === 'pengeluaran' && {
                          backgroundColor: WARNA_PENGELUARAN,
                          bottom: expH + 4,
                        },
                        selectedMetric === 'laba' && {
                          backgroundColor: WARNA_LABA,
                          bottom: Math.min(
                            totalPlotHeight - 24,
                            Math.max(4, (Math.max(item.laba, 0) / chartMax) * usableHeight + 14)
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.activeElementCalloutText}>
                        {selectedMetric === 'omzet' && `Omzet: ${formatShortMillion(item.omzet)}`}
                        {selectedMetric === 'pengeluaran' && `Pengeluaran: ${formatShortMillion(item.pengeluaran)}`}
                        {selectedMetric === 'laba' && `Laba Bersih: ${formatShortMillion(item.laba)}`}
                      </Text>
                    </View>
                  )}

                  {/* Pasangan Batang Omzet & Pengeluaran */}
                  <View style={[styles.barsGroup, { gap: barGap }]}>
                    {/* 1. Batang Omzet (Bisa Dipencet) */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedIndex(idx);
                        setSelectedMetric('omzet');
                      }}
                      style={styles.barTouchWrapper}
                    >
                      <View
                        style={[
                          styles.barItem,
                          {
                            width: barWidth,
                            height: omzetH,
                            backgroundColor: WARNA_OMZET,
                            borderTopLeftRadius: colCount <= 7 ? 4 : 2,
                            borderTopRightRadius: colCount <= 7 ? 4 : 2,
                          },
                          isColSelected && selectedMetric === 'omzet' && styles.barHighlightActive,
                        ]}
                      />
                    </TouchableOpacity>

                    {/* 2. Batang Pengeluaran (Bisa Dipencet Menampilkan Nominal Jutaannya) */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedIndex(idx);
                        setSelectedMetric('pengeluaran');
                      }}
                      style={styles.barTouchWrapper}
                    >
                      <View
                        style={[
                          styles.barItem,
                          {
                            width: barWidth,
                            height: expH,
                            backgroundColor: WARNA_PENGELUARAN,
                            borderTopLeftRadius: colCount <= 7 ? 4 : 2,
                            borderTopRightRadius: colCount <= 7 ? 4 : 2,
                          },
                          isColSelected && selectedMetric === 'pengeluaran' && styles.barHighlightActive,
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Garis Tren Laba Bersih */}
          {lineSegments.map((seg) => (
            <View
              key={seg.key}
              pointerEvents="none"
              style={[
                styles.exactLineSegment,
                {
                  left: seg.left,
                  top: seg.top,
                  width: seg.width,
                  transform: [{ rotate: `${seg.angle}deg` }],
                },
              ]}
            />
          ))}

          {/* 3. Titik Node Laba Bersih (Dengan Area Sentuh 40x40 yang Sangat Mudah Dipencet) */}
          {points.map((pt) => {
            const isLabaActive = selectedIndex === pt.idx && selectedMetric === 'laba';
            return (
              <TouchableOpacity
                key={`dot-touch-${pt.idx}`}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedIndex(pt.idx);
                  setSelectedMetric('laba');
                }}
                style={[
                  styles.trendDotTouchContainer,
                  {
                    left: pt.xPx - 20,
                    top: pt.yPx - 20,
                  },
                ]}
              >
                <View
                  style={[
                    styles.trendDot,
                    {
                      width: isLabaActive ? 14 : 9,
                      height: isLabaActive ? 14 : 9,
                      borderRadius: isLabaActive ? 7 : 4.5,
                      borderWidth: isLabaActive ? 2.5 : 1.5,
                    },
                    isLabaActive && styles.trendDotSelected,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Sumbu X di Bawah Plot Area (Alur Flex Normal di Dalam Card, Tidak Keluar) */}
      <View style={styles.xAxisRow}>
        <View style={styles.xAxisSpacer} />
        <View style={styles.xAxisLabelsContainer}>
          {data.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <TouchableOpacity
                key={`xlabel-${idx}`}
                style={styles.xLabelCol}
                onPress={() => setSelectedIndex(idx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.xLabelText,
                    isSelected && styles.xLabelTextSelected,
                    isSmall && styles.xLabelTextSmall,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {isSelected && <View style={styles.xLabelActiveDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  // Interactive Banner Di Atas Grafik
  interactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFEB',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DED6',
    gap: 8,
  },
  bannerTagBadge: {
    backgroundColor: '#52141D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bannerScrollView: {
    flex: 1,
  },
  bannerValuesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  bannerValItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    flexShrink: 0,
  },
  bannerValItemActiveOmzet: {
    backgroundColor: '#FBEAEC',
    borderWidth: 1.5,
    borderColor: '#52141D',
  },
  bannerValItemActiveExpense: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  bannerValItemActiveLaba: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#168653',
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerValLabel: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: '600',
  },
  bannerValText: {
    fontSize: 11,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  legendBarBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLineBox: {
    width: 16,
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  legendLineDash: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1,
  },
  legendLineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55433B',
  },
  chartMainRow: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  yAxisCol: {
    width: 46,
    position: 'relative',
    marginRight: 6,
  },
  yTickLabelWrapper: {
    position: 'absolute',
    right: 4,
  },
  yTickText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E5D53',
    textAlign: 'right',
  },
  plotAreaWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gridHorizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 2,
    zIndex: 2,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    borderRadius: 6,
    position: 'relative',
  },
  columnContainerSelected: {
    backgroundColor: 'rgba(82, 20, 29, 0.035)',
  },
  upperLabaTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    zIndex: 5,
  },
  activeElementCallout: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  activeElementCalloutText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  barsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  barTouchWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barItem: {
    minHeight: 4,
  },
  barHighlightActive: {
    borderWidth: 1.5,
    borderColor: '#FDE047',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  exactLineSegment: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: WARNA_LABA,
    borderRadius: 1.25,
    zIndex: 6,
  },
  trendDotTouchContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 35,
  },
  trendDot: {
    backgroundColor: WARNA_LABA,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  trendDotSelected: {
    backgroundColor: '#168653',
    borderColor: '#FDE047',
    elevation: 4,
  },
  xAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 24,
    marginTop: 6,
  },
  xAxisSpacer: {
    width: 46,
    marginRight: 6,
  },
  xAxisLabelsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  xLabelCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8D7B70',
    textAlign: 'center',
  },
  xLabelTextSelected: {
    color: '#C62828',
    fontWeight: '800',
  },
  xLabelTextSmall: {
    fontSize: 9,
  },
  xLabelActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C62828',
    marginTop: 2,
  },
});
