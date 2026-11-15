import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';
import { getCategoryBadge } from '../utils/categoryUtils';
import { getFallbackPhotoForItem } from './DetailPengeluaranModal';

const DEFAULT_RECEIPT_PHOTO =
  'https://images.unsplash.com/photo-1554415707-9e4466bfe0dc?w=500&auto=format&fit=crop&q=80';

const ACTION_BUTTON_WIDTH = 60;
const TOTAL_ACTIONS_WIDTH = ACTION_BUTTON_WIDTH * 2; // 120px

export default function SwipeableExpenseRow({
  item,
  index,
  isLast = false,
  onEdit,
  onDelete,
  onViewDetail,
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

  const handleToggleRow = () => {
    if (isOpen) {
      closeSwipe();
    } else {
      openSwipe();
    }
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

  const catBadge = getCategoryBadge(item.kategori, item.keterangan || item.nama);

  // Waktu jam di hari itu (misal: "06:54", "08:30")
  const waktuFormatted = item.waktu ? item.waktu.replace(/\s*wib/i, '') : '06:54';

  const fotoItemUri = item.fotoItem || getFallbackPhotoForItem(item.keterangan || item.nama);
  const fotoStrukUri = item.fotoStruk || DEFAULT_RECEIPT_PHOTO;

  return (
    <View style={[styles.container, isLast && styles.containerLast]}>
      {/* Tombol Aksi di Belakang Baris (Edit & Hapus yang muncul saat baris ditekan/digeser) */}
      <View style={styles.actionsContainer}>
        {/* Tombol Edit */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.editSwipeBtn]}
          onPress={() => {
            closeSwipe();
            if (onEdit) onEdit(item);
          }}
          activeOpacity={0.8}
          accessibilityLabel="Edit pengeluaran"
        >
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>

        {/* Tombol Hapus */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteSwipeBtn]}
          onPress={() => {
            closeSwipe();
            if (onDelete) onDelete(item);
          }}
          activeOpacity={0.8}
          accessibilityLabel="Hapus pengeluaran"
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Hapus</Text>
        </TouchableOpacity>
      </View>

      {/* Konten Utama Baris Tabel (Dapat ditekan untuk menggeser baris & menampilkan tombol edit/hapus) */}
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
          activeOpacity={0.92}
          onPress={handleToggleRow}
        >
          {/* Kolom 1: Waktu (Jam di hari itu, misal 06:54) */}
          <Text style={[styles.cellTextWaktu, styles.colWaktu]}>
            {waktuFormatted}
          </Text>

          {/* Kolom 2: Keterangan (Nama Bahan) */}
          <Text style={[styles.cellTextBold, styles.colKet]} numberOfLines={1}>
            {item.keterangan || item.nama || '-'}
          </Text>

          {/* Kolom 3: Kategori (Badge Topping / Bumbu) */}
          <View style={styles.colKategori}>
            <View style={[styles.categoryBadge, { backgroundColor: catBadge.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: catBadge.color }]}>
                {catBadge.label}
              </Text>
            </View>
          </View>

          {/* Kolom 4: Jumlah (Warna Hijau Sesuai Tabel Mingguan & Bulanan) */}
          <Text style={[styles.cellJumlahText, styles.colJumlah]}>
            {item.jumlah} {item.satuan || 'kg'}
          </Text>

          {/* Kolom 5: Total Nominal */}
          <Text style={[styles.cellTextTotal, styles.colTotal]}>
            {formatCurrency(item.total != null ? item.total : item.nominal || 0)}
          </Text>

          {/* Kolom 6: Foto Item */}
          <View style={styles.colFotoItem}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => {
                e.stopPropagation && e.stopPropagation();
              }}
              accessibilityLabel="Foto item"
            >
              <Image
                source={{ uri: fotoItemUri }}
                style={styles.thumbnailImg}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>

          {/* Kolom 7: Foto Struk */}
          <View style={styles.colFotoStruk}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => {
                e.stopPropagation && e.stopPropagation();
              }}
              accessibilityLabel="Foto struk"
            >
              <Image
                source={{ uri: fotoStrukUri }}
                style={styles.thumbnailImg}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>

          {/* Kolom 8: Aksi (Tombol Lihat Detail & Panah Kecil untuk Geser Edit/Hapus) */}
          <View style={styles.colAksi}>
            <TouchableOpacity
              style={styles.btnLihat}
              onPress={(e) => {
                e.stopPropagation && e.stopPropagation();
                if (onViewDetail) onViewDetail(item);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Lihat detail pengeluaran"
            >
              <Ionicons
                name="eye-outline"
                size={13}
                color="#52141D"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.btnLihatText}>Lihat</Text>
            </TouchableOpacity>

            {/* Panah kecil untuk geser dan menampilkan tombol Edit & Hapus */}
            <TouchableOpacity
              style={[styles.btnSwipeArrow, isOpen && styles.btnSwipeArrowActive]}
              onPress={(e) => {
                e.stopPropagation && e.stopPropagation();
                handleToggleRow();
              }}
              activeOpacity={0.7}
              accessibilityLabel={isOpen ? 'Tutup aksi edit dan hapus' : 'Geser untuk edit dan hapus'}
            >
              <Ionicons
                name={isOpen ? 'chevron-forward' : 'chevron-back'}
                size={14}
                color={isOpen ? '#52141D' : '#78665E'}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minWidth: 796,
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
    gap: 3,
  },
  editSwipeBtn: {
    backgroundColor: '#2563EB',
  },
  deleteSwipeBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  rowContent: {
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  rowContentAlt: {
    backgroundColor: '#FAF7F5',
  },
  innerTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 796,
  },
  cellTextWaktu: {
    fontSize: 12.5,
    color: '#55453E',
    fontWeight: '600',
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  colWaktu: {
    width: 75,
    textAlign: 'center',
  },
  colKet: {
    flex: 1,
    minWidth: 140,
    paddingHorizontal: 6,
  },
  colKategori: {
    width: 95,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colJumlah: {
    width: 75,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  cellJumlahText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#168653', // Warna hijau elegan identik tabel mingguan & bulanan
  },
  colTotal: {
    width: 110,
    paddingHorizontal: 6,
  },
  cellTextTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  colFotoItem: {
    width: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colFotoStruk: {
    width: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImg: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EDE5E0',
    backgroundColor: '#F5EFEB',
  },
  colAksi: {
    width: 115,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  btnLihat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4B4AD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  btnLihatText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#52141D',
  },
  btnSwipeArrow: {
    width: 24,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3F0',
    borderWidth: 1,
    borderColor: '#D8CBC4',
    borderRadius: 6,
  },
  btnSwipeArrowActive: {
    backgroundColor: '#FBEAEC',
    borderColor: '#52141D',
  },
});
