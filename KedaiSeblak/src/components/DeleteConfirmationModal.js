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

export default function DeleteConfirmationModal({
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
                <Ionicons name="trash-outline" size={30} color="#F59E0B" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Hapus Menu?</Text>

              {/* Confirmation Text */}
              <Text style={styles.description}>
                Yakin ingin menghapus menu{' '}
                <Text style={styles.highlightText}>{item.nama}</Text>?
                {'\n'}Menu yang dihapus tidak dapat dikembalikan.
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
                  title="Ya, Hapus"
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  trashCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#60646C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  highlightText: {
    fontWeight: '700',
    color: '#C62828',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 46,
  },
  deleteBtn: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
});
