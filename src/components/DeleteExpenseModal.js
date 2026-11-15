import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import formatCurrency from '../utils/formatCurrency';

export default function DeleteExpenseModal({
  visible,
  item,
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialogCard}>
              {/* Trash Icon Circle */}
              <View style={styles.trashCircle}>
                <Ionicons name="trash-outline" size={32} color="#F59E0B" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Hapus Pengeluaran?</Text>

              {/* Confirmation Text */}
              <Text style={styles.description}>
                Apakah Anda yakin ingin menghapus data pengeluaran ini?
              </Text>

              {/* Item Info Card */}
              <View style={styles.itemBadgeCard}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.keterangan}
                </Text>
                <Text style={styles.itemDetail}>
                  {item.waktu} · {item.jumlah} {item.satuan} ·{' '}
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.total)}
                  </Text>
                </Text>
              </View>

              <Text style={styles.subWarning}>
                Data yang dihapus akan otomatis memperbarui total pengeluaran.
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <CustomButton
                  title="Batal"
                  variant="outline"
                  onPress={onClose}
                  style={styles.actionBtn}
                />
                <CustomButton
                  title="Hapus"
                  variant="primary"
                  loading={loading}
                  onPress={onConfirm}
                  style={[styles.actionBtn, styles.deleteBtn]}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  trashCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#78665E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  itemBadgeCard: {
    width: '100%',
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EDE5E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 3,
  },
  itemDetail: {
    fontSize: 12,
    color: '#78665E',
  },
  itemTotal: {
    fontWeight: '800',
    color: '#DC2626',
  },
  subWarning: {
    fontSize: 11,
    color: '#A69A90',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 44,
  },
  deleteBtn: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
});
