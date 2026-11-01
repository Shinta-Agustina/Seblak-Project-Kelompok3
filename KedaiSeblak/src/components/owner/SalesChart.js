import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const formatCompact = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace('.', ',')} jt`;
  }

  if (amount >= 1000) {
    return `${Math.round(amount / 1000)} rb`;
  }

  return String(Math.round(amount));
};

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export default function SalesChart({
  title = 'Grafik Penjualan',
  subtitle = '',
  data = [],
  style,
}) {
  const chartInfo = useMemo(() => {
    const safeData = Array.isArray(data)
      ? data.map((item, index) => ({
          label: String(item?.label ?? index + 1),
          total: Math.max(0, Number(item?.total) || 0),
        }))
      : [];

    const max = Math.max(
      0,
      ...safeData.map((item) => item.total)
    );

    const total = safeData.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const highest = safeData.reduce(
      (best, item) =>
        item.total > best.total ? item : best,
      { label: '-', total: 0 }
    );

    return { data: safeData, max, total, highest };
  }, [data]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalCaption}>Total periode</Text>
          <Text style={styles.totalValue}>
            {formatRupiah(chartInfo.total)}
          </Text>
        </View>
      </View>

      {chartInfo.data.length > 0 ? (
        <View style={styles.chartArea}>
          <View pointerEvents="none" style={styles.gridLines}>
            {[0, 1, 2, 3].map((line) => (
              <View key={line} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.columns}>
            {chartInfo.data.map((item, index) => {
              const percentage =
                chartInfo.max > 0
                  ? (item.total / chartInfo.max) * 100
                  : 0;

              const isHighest =
                item.total > 0 &&
                item.total === chartInfo.highest.total;

              return (
                <View
                  key={`${item.label}-${index}`}
                  style={styles.column}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.value,
                      isHighest && styles.highestValue,
                    ]}
                  >
                    {formatCompact(item.total)}
                  </Text>

                  <View style={styles.barArea}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${percentage}%`,
                          minHeight: item.total > 0 ? 5 : 0,
                        },
                        isHighest && styles.highestBar,
                      ]}
                    />
                  </View>

                  <Text
                    numberOfLines={1}
                    style={styles.label}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Belum ada data penjualan pada periode ini.
          </Text>
        </View>
      )}

      {chartInfo.highest.total > 0 && (
        <View style={styles.footer}>
          <View style={styles.legendDot} />
          <Text style={styles.footerText}>
            Tertinggi: {chartInfo.highest.label} ·{' '}
            {formatRupiah(chartInfo.highest.total)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    borderRadius: 15,
    padding: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 18,
  },
  heading: { flex: 1 },
  title: {
    color: '#52141D',
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8D7B70',
    fontSize: 11,
    marginTop: 4,
  },
  totalBox: {
    alignItems: 'flex-end',
    maxWidth: '48%',
  },
  totalCaption: {
    color: '#8D7B70',
    fontSize: 10,
  },
  totalValue: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  chartArea: {
    height: 174,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    bottom: 25,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1E9E5',
    borderStyle: 'dashed',
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 3,
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  value: {
    height: 19,
    color: '#8D7B70',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  highestValue: {
    color: '#C62828',
    fontWeight: '800',
  },
  barArea: {
    height: 126,
    width: '70%',
    maxWidth: 42,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#FBEAEC',
  },
  bar: {
    width: '100%',
    backgroundColor: '#D98A91',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  highestBar: {
    backgroundColor: '#C62828',
  },
  label: {
    height: 20,
    marginTop: 7,
    color: '#78665E',
    fontSize: 9,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  empty: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8D7B70',
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEB',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C62828',
  },
  footerText: {
    color: '#78665E',
    fontSize: 10,
    flexShrink: 1,
  },
});