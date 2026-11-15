import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendPositive = true,
  iconName = 'wallet-outline',
  iconColor = '#C62828',
  iconBg = '#FBEAEC',
  onPress,
  badgeText,
  style,
}) {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badgeText && (
            <View style={styles.topBadge}>
              <Text style={styles.topBadgeText}>{badgeText}</Text>
            </View>
          )}
        </View>

        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
      </View>

      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>

      <View style={styles.footerRow}>
        {trend !== undefined && (
          <View
            style={[
              styles.trendPill,
              trendPositive ? styles.trendUp : styles.trendDown,
            ]}
          >
            <Ionicons
              name={trendPositive ? 'arrow-up' : 'arrow-down'}
              size={11}
              color={trendPositive ? '#15803D' : '#B91C1C'}
            />
            <Text
              style={[
                styles.trendText,
                { color: trendPositive ? '#15803D' : '#B91C1C' },
              ]}
            >
              {trend}
            </Text>
          </View>
        )}

        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}

        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#A89A92"
            style={styles.forwardIcon}
          />
        )}
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    minWidth: 140,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    shadowColor: '#3D2922',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78665E',
    letterSpacing: 0.2,
  },
  topBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendUp: {
    backgroundColor: '#DCFCE7',
  },
  trendDown: {
    backgroundColor: '#FEE2E2',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    color: '#8D7B70',
    flex: 1,
  },
  forwardIcon: {
    marginLeft: 'auto',
  },
});