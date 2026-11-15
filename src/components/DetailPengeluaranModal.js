import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '../utils/formatCurrency';
import { getCategoryBadge } from '../utils/categoryUtils';

const DEFAULT_SOSIS_PHOTO =
  'https://images.unsplash.com/photo-1585325701165-351af916e581?w=500&auto=format&fit=crop&q=80';
const DEFAULT_CABE_PHOTO =
  'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80';
const DEFAULT_BAWANG_PHOTO =
  'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&auto=format&fit=crop&q=80';
const DEFAULT_RECEIPT_PHOTO =
  'https://images.unsplash.com/photo-1554415707-9e4466bfe0dc?w=500&auto=format&fit=crop&q=80';

export const getFallbackPhotoForItem = (keterangan = '') => {
  const text = (keterangan || '').toLowerCase();
  if (text.includes('cabe') || text.includes('cabai')) return DEFAULT_CABE_PHOTO;
  if (text.includes('bawang')) return DEFAULT_BAWANG_PHOTO;
  if (text.includes('sosis')) return DEFAULT_SOSIS_PHOTO;
  if (text.includes('bakso')) return 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=80';
  if (text.includes('ceker')) return 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=80';
  if (text.includes('kerupuk')) return 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=80';
  if (text.includes('makaroni')) return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80';
  return DEFAULT_SOSIS_PHOTO;
};

export default function DetailPengeluaranModal({ visible, item, onClose }) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  const [previewImage, setPreviewImage] = useState(null);

  if (!item) return null;

  const catBadge = getCategoryBadge(item.kategori, item.keterangan);
  const fotoItemUri = item.fotoItem || getFallbackPhotoForItem(item.keterangan);
  const fotoStrukUri = item.fotoStruk || DEFAULT_RECEIPT_PHOTO;

  const displayTime = item.waktu
    ? item.waktu.toLowerCase().includes('wib')
      ? item.waktu
      : `${item.waktu} WIB`
    : '06:54 WIB';

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalCard, isSmallScreen && styles.modalCardSmall]}>
                {/* Header Modal */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.iconBadge}>
                      <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.modalTitle}>Detail Pengeluaran</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityLabel="Tutup detail"
                  >
                    <Ionicons name="close" size={22} color="#78665E" />
                  </TouchableOpacity>
                </View>

                {/* Content Modal */}
                <ScrollView
                  style={styles.contentScroll}
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={true}
                >
                  <View
                    style={[
                      styles.twoColumnsLayout,
                      isSmallScreen && styles.twoColumnsLayoutStacked,
                    ]}
                  >
                    {/* Kolom Kiri: Informasi Transaksi */}
                    <View style={[styles.leftColumn, isSmallScreen && styles.fullWidth]}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tanggal Pembelian</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <Text style={styles.infoValue}>
                          {item.tanggalStr || item.tanggal || '17 Oktober 2026'}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Jam Pembelian</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <Text style={styles.infoValue}>{displayTime}</Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Keterangan</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <Text style={styles.infoValue}>
                          {item.keterangan || item.nama || '-'}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Kategori</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <View style={styles.categoryBadgeWrapper}>
                          <View
                            style={[
                              styles.catBadge,
                              { backgroundColor: catBadge.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.catBadgeText,
                                { color: catBadge.color },
                              ]}
                            >
                              {catBadge.label}
                            </Text>
                          </View>
                          {item.kategoriTopping ? (
                            <Text style={styles.subCategoryText}>
                              ({item.kategoriTopping})
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Jumlah</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <Text style={styles.infoValue}>
                          {item.jumlah} {item.satuan || 'kg'}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Supplier</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <Text style={styles.infoValue}>
                          {item.supplier || 'Toko Sembako Jaya'}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Total Pembelian</Text>
                        <Text style={styles.infoColon}>:</Text>
                        <Text style={[styles.infoValue, styles.infoValueTotal]}>
                          {formatCurrency(item.total != null ? item.total : item.nominal || 0)}
                        </Text>
                      </View>
                    </View>

                    {/* Kolom Kanan: Dokumentasi Pembelian (Foto Item & Foto Struk) */}
                    <View style={[styles.rightColumn, isSmallScreen && styles.fullWidth]}>
                      <Text style={styles.sectionHeaderTitle}>Dokumentasi Pembelian</Text>
                      <View style={styles.photosRow}>
                        {/* Card 1: Foto Item */}
                        <View style={styles.photoCard}>
                          <View style={styles.photoImageWrapper}>
                            <Image
                              source={{ uri: fotoItemUri }}
                              style={styles.photoImage}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.photoOverlayBtn}
                              activeOpacity={0.8}
                              onPress={() => setPreviewImage(fotoItemUri)}
                              accessibilityLabel="Perbesar foto item"
                            >
                              <Ionicons name="scan-outline" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.photoCardFooter}>
                            <Text style={styles.photoCardFooterText}>Foto Item</Text>
                          </View>
                        </View>

                        {/* Card 2: Foto Struk / Nota */}
                        <View style={styles.photoCard}>
                          <View style={styles.photoImageWrapper}>
                            <Image
                              source={{ uri: fotoStrukUri }}
                              style={styles.photoImage}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.photoOverlayBtn}
                              activeOpacity={0.8}
                              onPress={() => setPreviewImage(fotoStrukUri)}
                              accessibilityLabel="Perbesar foto struk"
                            >
                              <Ionicons name="scan-outline" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.photoCardFooter}>
                            <Text style={styles.photoCardFooterText}>Foto Struk / Nota</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Footer Modal */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.tutupBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tutupBtnText}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Zoom / Preview Full Foto */}
      {previewImage ? (
        <Modal
          visible={!!previewImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <TouchableWithoutFeedback onPress={() => setPreviewImage(null)}>
            <View style={styles.zoomOverlay}>
              <View style={styles.zoomContainer}>
                <Image
                  source={{ uri: previewImage }}
                  style={styles.zoomImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.zoomCloseBtn}
                  onPress={() => setPreviewImage(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 9,
    maxHeight: '92%',
  },
  modalCardSmall: {
    maxWidth: 440,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#52141D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
  },
  closeBtn: {
    padding: 4,
  },
  contentScroll: {
    maxHeight: 460,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  twoColumnsLayout: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  twoColumnsLayoutStacked: {
    flexDirection: 'column',
    gap: 18,
  },
  leftColumn: {
    flex: 1.1,
  },
  rightColumn: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  infoLabel: {
    width: 125,
    fontSize: 13,
    color: '#4B3830',
    fontWeight: '500',
  },
  infoColon: {
    width: 14,
    fontSize: 13,
    color: '#4B3830',
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
    fontWeight: '600',
  },
  infoValueTotal: {
    fontWeight: '800',
    color: '#2C1810',
    fontSize: 13.5,
  },
  categoryBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subCategoryText: {
    fontSize: 11,
    color: '#78665E',
    fontWeight: '500',
  },
  sectionHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 10,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE5E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 115,
    backgroundColor: '#F7F4F2',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlayBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCardFooter: {
    backgroundColor: '#FDFBF9',
    borderTopWidth: 1,
    borderTopColor: '#EDE5E0',
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardFooterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2C1810',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E4',
    backgroundColor: '#FDFBF9',
  },
  tutupBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#EDE5E0',
  },
  tutupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B3830',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  zoomContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 550,
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

