import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function FilterChips({
  options = [],
  selectedId,
  onSelect,
  accentColor = '#C62828',
  style,
  scrollable = false,
}) {
  const content = options.map((opt) => {
    const id = typeof opt === 'string' ? opt : opt.id;
    const label = typeof opt === 'string' ? opt : opt.label;
    const count = typeof opt === 'object' ? opt.count : undefined;
    const isSelected = selectedId === id;

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.chip,
          isSelected && { backgroundColor: accentColor, borderColor: accentColor },
        ]}
        onPress={() => onSelect(id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            isSelected && styles.chipTextSelected,
          ]}
        >
          {label}
        </Text>
        {count !== undefined && (
          <View
            style={[
              styles.countBadge,
              isSelected ? styles.countBadgeSelected : styles.countBadgeDefault,
            ]}
          >
            <Text
              style={[
                styles.countText,
                isSelected ? { color: accentColor } : { color: '#78665E' },
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, style]}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  scrollContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7E2',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#523C34',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeDefault: {
    backgroundColor: '#F3EDE9',
  },
  countBadgeSelected: {
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
