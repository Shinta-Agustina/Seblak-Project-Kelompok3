import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';

export default function ToppingCard({ item, quantity = 0, onAdd, onRemove }) {
  const [imageError, setImageError] = useState(false);

  const imageSource =
    typeof item.image === 'string' ? { uri: item.image } : item.image;

  return (
    <View style={[styles.card, quantity > 0 && styles.cardSelected]}>
      {/* Clickable Image & Title Area to add item */}
      <TouchableOpacity
        style={styles.cardHeaderArea}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <View style={styles.imageWrapper}>
          {!imageError && item.image ? (
            <Image
              source={imageSource}
              style={styles.image}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emojiFallback}>
              <Text style={styles.emojiText}>{item.emoji || '🍲'}</Text>
            </View>
          )}

          {/* Quantity Badge on Top Right */}
          {quantity > 0 && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{quantity}x</Text>
            </View>
          )}
        </View>

        {/* Item Info */}
        <View style={styles.infoWrapper}>
          <Text style={styles.name} numberOfLines={1}>
            {item.nama}
          </Text>
          {item.berat && <Text style={styles.weight}>{item.berat}</Text>}
        </View>
      </TouchableOpacity>

      {/* Action / Counter Area */}
      {quantity === 0 ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.price}>{formatCurrency(item.harga)}</Text>
          <View style={styles.plusIconCircle}>
            <Ionicons name="add" size={14} color="#C62828" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtnMinus}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={14} color="#C62828" />
          </TouchableOpacity>

          <View style={styles.counterNumberBox}>
            <Text style={styles.counterNumberText}>{quantity}</Text>
            <Text style={styles.counterPriceSub}>
              {formatCurrency(item.harga * quantity)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.counterBtnPlus}
            onPress={onAdd}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#ECE3DE',
    elevation: 2,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    justifyContent: 'space-between',
    minWidth: 130,
    maxWidth: 180,
    flex: 1,
    margin: 6,
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
