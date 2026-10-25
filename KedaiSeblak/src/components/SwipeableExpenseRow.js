import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';
import { getCategoryBadge } from '../screens/owner/MenuHargaScreen';

const ACTION_BUTTON_WIDTH = 58;
const TOTAL_ACTIONS_WIDTH = ACTION_BUTTON_WIDTH * 2; // 116px

export default function SwipeableExpenseRow({
  item,
  index,
  isLast = false,
  onEdit,
  onDelete,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const openSwipe = () => {
    Animated.spring(translateX, {
      toValue: -TOTAL_ACTIONS_WIDTH,
      useNativeDriver: true,
      bounciness: 4,
    }).start(() => setIsOpen(true));
  };

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start(() => setIsOpen(false));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const newX = isOpen
            ? -TOTAL_ACTIONS_WIDTH + gestureState.dx
            : gestureState.dx;
          translateX.setValue(Math.max(newX, -TOTAL_ACTIONS_WIDTH - 20));
        } else if (isOpen && gestureState.dx > 0) {
          translateX.setValue(-TOTAL_ACTIONS_WIDTH + gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35 || (isOpen && gestureState.dx < 20)) {
          openSwipe();
        } else {
          closeSwipe();
        }
      },
      onPanResponderTerminate: () => {
        closeSwipe();
      },
    })
  ).current;

  const catBadge = getCategoryBadge(item.kategori, item.keterangan);

  return (
    <View style={[styles.container, isLast && styles.containerLast]}>
      {/* Tombol Aksi di Belakang Baris (Edit & Hapus) */}
      <View style={styles.actionsContainer}>
        {/* Tombol Edit */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => {
            closeSwipe();
            onEdit(item);
          }}
          activeOpacity={0.8}
          accessibilityLabel="Edit pengeluaran"
        >
          <Ionicons name="create-outline" size={17} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>

        {/* Tombol Hapus */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => {
            closeSwipe();
            onDelete(item);
          }}
          activeOpacity={0.8}
          accessibilityLabel="Hapus pengeluaran"
        >
          <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Hapus</Text>
        </TouchableOpacity>
      </View>

      {/* Konten Utama Baris Tabel yang Dapat Di-Swipe */}
      <Animated.View
        style={[
          styles.rowContent,
          index % 2 === 1 && styles.rowContentAlt,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.innerTouch}
          activeOpacity={0.9}
          onPress={() => {
            if (isOpen) {
              closeSwipe();
            } else {
              openSwipe();
            }
          }}
        >
          {/* Kolom 1: No */}
          <Text style={[styles.cellText, styles.colNo]}>{index + 1}</Text>

          {/* Kolom 2: Waktu */}
          <Text style={[styles.cellText, styles.colWaktu]}>{item.waktu}</Text>

          {/* Kolom 3: List Topping: Nama Topping Dulu, Baru Seudahnya Labelnya */}
          <View style={styles.colToppingWrapper}>
            <Text style={styles.toppingNameText}>
              {item.keterangan}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: catBadge.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: catBadge.color }]}>
                {catBadge.label}
              </Text>
            </View>
          </View>

          {/* Kolom 4: Jumlah (kg / pack / pcs) */}
          <Text style={[styles.cellJumlahText, styles.colJumlah]}>
            {item.jumlah} {item.satuan || 'kg'}
          </Text>

          {/* Kolom 5: Total Rupiah */}
          <Text style={[styles.cellTextTotal, styles.colTotal]}>
            {formatCurrency(item.total)}
          </Text>

          {/* Swipe Indicator */}
          <View style={styles.swipeHintIndicator}>
            <Ionicons
              name={isOpen ? 'chevron-forward' : 'chevron-back'}
              size={12}
              color="#B3A39B"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE6',
    overflow: 'hidden',
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: TOTAL_ACTIONS_WIDTH,
    flexDirection: 'row',
    zIndex: 1,
  },
  actionBtn: {
    width: ACTION_BUTTON_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  editBtn: {
    backgroundColor: '#2563EB', // Blue
  },
  deleteBtn: {
    backgroundColor: '#EA580C', // Orange muda
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  rowContent: {
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  rowContentAlt: {
    backgroundColor: '#FAF7F5', // Soft alternating tint
  },
  innerTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 540,
  },
  cellText: {
    fontSize: 12,
    color: '#55453E',
  },
  colNo: {
    width: 28,
    textAlign: 'center',
    color: '#8D7B70',
    fontWeight: '600',
  },
  colWaktu: {
    width: 50,
    textAlign: 'center',
    color: '#60646C',
  },
  colToppingWrapper: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toppingNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    flexShrink: 0,
  },
  colJumlah: {
    width: 75,
    textAlign: 'center',
  },
  cellJumlahText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#168653', // Subtle green for quantity
  },
  colTotal: {
    width: 90,
    textAlign: 'right',
    paddingRight: 4,
  },
  cellTextTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626', // Merah jreng
  },
  swipeHintIndicator: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
