import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StockProgressBar({
  current = 0,
  max = 10,
  status = 'Aman',
  height = 8,
  showPercentage = false,
  style,
}) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.max(0, Math.min(1, current / safeMax));
  const percentage = Math.round(ratio * 100);

  const normalized = (status || '').toLowerCase();
  let barColor = '#168653'; // Hijau Aman

  if (normalized === 'habis' || current <= 0) {
    barColor = '#DC2626'; // Merah Habis
  } else if (normalized === 'menipis' || ratio <= 0.4) {
    barColor = '#D97706'; // Kuning/Oranye Menipis
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.percentText, { color: barColor }]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: '#EFE7E2',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
