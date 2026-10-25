import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatusBadge({ status, size = 'md', customLabel, style }) {
  const normalized = (status || '').toLowerCase();

  let config = {
    bg: '#F3EDE9',
    text: '#523C34',
    border: '#E8DCD4',
    icon: 'information-circle',
    label: customLabel || status,
  };

  if (normalized === 'aman') {
    config = {
      bg: '#DCFCE7',
      text: '#166534',
      border: '#BBF7D0',
      icon: 'shield-checkmark',
      label: customLabel || 'Aman',
    };
  } else if (normalized === 'menipis') {
    config = {
      bg: '#FEF3C7',
      text: '#92400E',
      border: '#FDE68A',
      icon: 'alert-circle',
      label: customLabel || 'Menipis',
    };
  } else if (normalized === 'habis') {
    config = {
      bg: '#FEE2E2',
      text: '#991B1B',
      border: '#FECACA',
      icon: 'flame',
      label: customLabel || 'Habis',
    };
  } else if (normalized === 'peak') {
    config = {
      bg: '#FFE4E6',
      text: '#BE123C',
      border: '#FDA4AF',
      icon: 'trending-up',
      label: customLabel || 'Jam Ramai',
    };
  } else if (normalized === 'lunas') {
    config = {
      bg: '#E0F2FE',
      text: '#0369A1',
      border: '#BAE6FD',
      icon: 'checkmark-circle',
      label: customLabel || 'Lunas',
    };
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 3 : isLarge ? 6 : 4,
          paddingHorizontal: isSmall ? 8 : isLarge ? 14 : 10,
        },
        style,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 11 : isLarge ? 15 : 13}
        color={config.text}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          styles.badgeText,
          {
            color: config.text,
            fontSize: isSmall ? 10 : isLarge ? 13 : 11,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
