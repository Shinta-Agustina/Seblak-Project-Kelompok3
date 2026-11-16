
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';

// =====================================================
// NORMALISASI SUMBER GAMBAR
// =====================================================

function normalisasiSumberGambar(value) {
  if (!value) return null;

  // Mendukung gambar lokal hasil require().
  if (typeof value === 'number') {
    return value;
  }

  // Mendukung format { uri: '...' }.
  if (typeof value === 'object') {
    if (value.uri) {
      return normalisasiSumberGambar(value.uri);
    }

    return null;
  }

  if (typeof value !== 'string') return null;

  let url = value.trim();

  // Mengatasi URL dalam format Markdown.
  const markdown = /^!?\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i.exec(url);

  if (markdown) {
    url = markdown[1].trim();
  }

  // Hanya menerima sumber gambar yang valid.
  const valid =
    /^(https?:\/\/|file:\/\/|content:\/\/|blob:|data:image\/)/i.test(url);

  return valid ? url : null;
}

// =====================================================
// KARTU MENU KASIR
// =====================================================

export default function ToppingCard({
  item,
  quantity = 0,
  onAdd,
  onRemove,
}) {
  const [imageIndex, setImageIndex] = useState(0);

  // Urutan prioritas sumber foto.
  const imageCandidates = useMemo(() => {
    const sources = [
      item?.foto_url,
      item?.image,
      item?.foto_item,
      item?.fotoItem,
    ]
      .map(normalisasiSumberGambar)
      .filter(Boolean);

    // Hilangkan sumber gambar yang duplikat.
    const unique = [];

    sources.forEach((source) => {
      const key =
        typeof source === 'number'
          ? `asset:${source}`
          : source;

      const alreadyExists = unique.some((item) => {
        const existingKey =
          typeof item === 'number'
            ? `asset:${item}`
            : item;

        return existingKey === key;
      });

      if (!alreadyExists) {
        unique.push(source);
      }
    });

    return unique;
  }, [
    item?.foto_url,
    item?.image,
    item?.foto_item,
    item?.fotoItem,
  ]);

  // Reset percobaan ketika sumber foto berubah.
  const imageKey = imageCandidates
    .map((source) =>
      typeof source === 'number'
        ? `asset:${source}`
        : source
    )
    .join('|');

  useEffect(() => {
    setImageIndex(0);
  }, [imageKey]);

  // Sumber gambar yang sedang dicoba.
  const currentImage = imageCandidates[imageIndex];

  const imageSource =
    typeof currentImage === 'number'
      ? currentImage
      : currentImage
        ? { uri: currentImage }
        : null;

  // Jika gambar gagal, lanjutkan ke sumber berikutnya.
  const handleImageError = (event) => {
    console.warn(
      'GAGAL MEMUAT FOTO MENU:',
      item?.nama,
      currentImage,
      event?.nativeEvent?.error
    );

    if (imageIndex < imageCandidates.length - 1) {
      setImageIndex((previous) => previous + 1);
    } else {
      console.warn(
        'SEMUA SUMBER FOTO GAGAL:',
        item?.nama
      );
    }
  };

  return (
    <View
      style={[
        styles.card,
        quantity > 0 && styles.cardSelected,
      ]}
    >
      <TouchableOpacity
        style={styles.cardHeaderArea}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        {/* FOTO MENU */}
        <View style={styles.imageWrapper}>
          {imageSource ? (
            <Image
              key={`${item?.id || item?.nama}-${imageIndex}`}
              source={imageSource}
              style={styles.image}
              onError={handleImageError}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emojiFallback}>
              <Text style={styles.emojiText}>
                {item?.emoji || '🍲'}
              </Text>
            </View>
          )}

          {quantity > 0 && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>
                {quantity}x
              </Text>
            </View>
          )}
        </View>

        {/* INFORMASI MENU */}
        <View style={styles.infoWrapper}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {item?.nama || 'Tanpa Nama'}
          </Text>

          <Text style={styles.weight}>
            pcs
          </Text>
        </View>
      </TouchableOpacity>

      {/* HARGA DAN TOMBOL TAMBAH */}
      {quantity === 0 ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.price}>
            {formatCurrency(item?.harga || 0)}
          </Text>

          <View style={styles.plusIconCircle}>
            <Ionicons
              name="add"
              size={14}
              color="#C62828"
            />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtnMinus}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Ionicons
              name="remove"
              size={14}
              color="#C62828"
            />
          </TouchableOpacity>

          <View style={styles.counterNumberBox}>
            <Text style={styles.counterNumberText}>
              {quantity}
            </Text>

            <Text style={styles.counterPriceSub}>
              {formatCurrency(
                (item?.harga || 0) * quantity
              )}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.counterBtnPlus}
            onPress={onAdd}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add"
              size={14}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// =====================================================
// STYLE
// =====================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#ECE3DE',
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    flexGrow: 1,
    margin: 0,
  },

  cardSelected: {
    borderColor: '#C62828',
    backgroundColor: '#FFFAFA',
  },

  cardHeaderArea: {
    width: '100%',
    alignItems: 'center',
  },

  imageWrapper: {
    width: '100%',
    height: 95,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8F1EB',
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  emojiFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
  },

  emojiText: {
    fontSize: 38,
  },

  qtyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#C62828',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  qtyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  infoWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    width: '100%',
  },

  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
    textAlign: 'center',
  },

  weight: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 1,
  },

  addButton: {
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FAF5F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  price: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7E6E67',
  },

  plusIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDECEC',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },

  counterBtnMinus: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },

  counterNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  counterNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#C62828',
  },

  counterPriceSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8D7B70',
  },

  counterBtnPlus: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
