import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const NAMA_BULAN_PENDEK = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const HARI_HEADER = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const WARNA_PRIMARY = '#C62828'; // Login Primary / Brand Crimson Red
const TAHUN_LIST = [2024, 2025, 2026, 2027];

export default function LaporanDatePickerModal({
  visible,
  onClose,
  mode = 'harian', // 'harian' | 'bulanan' | 'tahunan'
  currentValue = '',
  onSelectDate,
}) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // 9 = Oktober
  const [selectedDay, setSelectedDay] = useState(16);

  useEffect(() => {
    if (visible) {
      if (mode === 'harian') {
        setSelectedYear(2026);
        setSelectedMonth(9);
        setSelectedDay(16);
      } else if (mode === 'bulanan') {
        setSelectedYear(2026);
        setSelectedMonth(9);
      } else if (mode === 'tahunan') {
        setSelectedYear(2026);
      }
    }
  }, [visible, mode]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  const handleApply = () => {
    let result = '';
    if (mode === 'harian') {
      result = `${selectedDay} ${NAMA_BULAN[selectedMonth]} ${selectedYear}`;
    } else if (mode === 'bulanan') {
      result = `${NAMA_BULAN[selectedMonth]} ${selectedYear}`;
    } else {
      result = `${selectedYear}`;
    }
    onSelectDate(result);
    onClose();
  };

  const handleResetDefault = () => {
    if (mode === 'harian') {
      setSelectedYear(2026);
      setSelectedMonth(9);
      setSelectedDay(16);
    } else if (mode === 'bulanan') {
      setSelectedYear(2026);
      setSelectedMonth(9);
    } else {
      setSelectedYear(2026);
    }
  };

  // Render Kalender Harian
  const renderHarianCalendar = () => {
    const totalDays = getDaysInMonth(selectedYear, selectedMonth);
    const startDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);
    const emptySlots = Array.from({ length: startDayIndex });
    const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
      <View style={styles.calendarContainer}>
        {/* Header Nama Hari */}
        <View style={styles.hariHeaderRow}>
          {HARI_HEADER.map((hari, idx) => (
            <Text
              key={idx}
              style={[
                styles.hariHeaderText,
                idx === 0 && styles.hariHeaderMinggu,
              ]}
            >
              {hari}
            </Text>
          ))}
        </View>

        {/* Grid Tanggal */}
        <View style={styles.daysGrid}>
          {emptySlots.map((_, idx) => (
            <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
          ))}

          {dayNumbers.map((day) => {
            const isSelected =
              selectedDay === day &&
              selectedMonth === 9 &&
              selectedYear === 2026;

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render Pilihan Bulanan (12 Bulan Grid)
  const renderBulananSelector = () => {
    return (
      <View style={styles.bulananContainer}>
        <View style={styles.yearNavigator}>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handlePrevYear}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.navYearTitle}>{selectedYear}</Text>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handleNextYear}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color="#2C1810" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthsGrid}>
          {NAMA_BULAN.map((m, idx) => {
            const isSelected = selectedMonth === idx && selectedYear === 2026;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.monthGridCell,
                  isSelected && styles.monthGridCellSelected,
                ]}
                onPress={() => setSelectedMonth(idx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.monthGridText,
                    isSelected && styles.monthGridTextSelected,
                  ]}
                >
                  {NAMA_BULAN_PENDEK[idx]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Bulan Terpilih:</Text>
          <Text style={styles.previewValue}>
            {NAMA_BULAN[selectedMonth]} {selectedYear}
          </Text>
        </View>
      </View>
    );
  };

  // Render Pilihan Tahunan (Grid Tahun)
  const renderTahunanSelector = () => {
    return (
      <View style={styles.tahunanContainer}>
        <Text style={styles.sectionNotice}>Pilih Tahun Laporan Keuangan:</Text>
        <View style={styles.yearsGrid}>
          {TAHUN_LIST.map((th) => {
            const isSelected = selectedYear === th;
            return (
              <TouchableOpacity
                key={th}
                style={[
                  styles.yearGridCell,
                  isSelected && styles.yearGridCellSelected,
                ]}
                onPress={() => setSelectedYear(th)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isSelected ? '#FFFFFF' : '#8D7B70'}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={[
                    styles.yearGridText,
                    isSelected && styles.yearGridTextSelected,
                  ]}
                >
                  {th}
                </Text>
                {th === 2026 && (
                  <View
                    style={[
                      styles.currentYearTag,
                      isSelected && styles.currentYearTagActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currentYearTagText,
                        isSelected && styles.currentYearTagTextActive,
                      ]}
                    >
                      Tahun Berjalan
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const modalTitle =
    mode === 'harian'
      ? 'Pilih Tanggal Laporan'
      : mode === 'bulanan'
      ? 'Pilih Bulan Laporan'
      : 'Pilih Tahun Laporan';

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
            <View style={styles.modalCard}>
              {/* Header Modal */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={WARNA_PRIMARY}
                    style={styles.modalHeaderIcon}
                  />
                  <Text style={styles.modalTitle}>{modalTitle}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Tutup modal kalender"
                >
                  <Ionicons name="close" size={20} color="#8D7B70" />
                </TouchableOpacity>
              </View>

              {/* Month/Year Navigasi Bar (Hanya untuk Harian) */}
              {mode === 'harian' && (
                <View style={styles.monthNavigatorBar}>
                  <TouchableOpacity
                    style={styles.navArrowBtn}
                    onPress={handlePrevMonth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={20} color="#2C1810" />
                  </TouchableOpacity>

                  <View style={styles.monthYearDisplay}>
                    <Text style={styles.monthYearText}>
                      {NAMA_BULAN[selectedMonth]} {selectedYear}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.navArrowBtn}
                    onPress={handleNextMonth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#2C1810" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Konten Berdasarkan Mode */}
              <View style={styles.modalBody}>
                {mode === 'harian' && renderHarianCalendar()}
                {mode === 'bulanan' && renderBulananSelector()}
                {mode === 'tahunan' && renderTahunanSelector()}
              </View>

              {/* Footer Tombol Aksi */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.btnBatal}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnBatalText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnTerapkan}
                  onPress={handleApply}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnTerapkanText}>Terapkan</Text>
                </TouchableOpacity>
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E3',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F7F3F0',
  },
  monthNavigatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F1ED',
  },
  navArrowBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7F2EE',
  },
  monthYearDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FBF8F6',
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
  },
  modalBody: {
    paddingVertical: 14,
  },
  calendarContainer: {},
  hariHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  hariHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#8D7B70',
  },
  hariHeaderMinggu: {
    color: '#C62828',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: WARNA_PRIMARY,
  },
  dayCellDefault: {
    borderWidth: 1.5,
    borderColor: WARNA_PRIMARY,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextDefault: {
    color: WARNA_PRIMARY,
    fontWeight: '800',
  },
  bulananContainer: {},
  yearNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  navYearTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2C1810',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthGridCell: {
    width: '23%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F8F4F0',
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    marginBottom: 4,
  },
  monthGridCellSelected: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
  },
  monthGridText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  monthGridTextSelected: {
    color: '#FFFFFF',
  },
  previewBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FAF5F3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE5E0',
  },
  previewLabel: {
    fontSize: 12,
    color: '#78665E',
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '800',
    color: WARNA_PRIMARY,
  },
  tahunanContainer: {},
  sectionNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D7B70',
    marginBottom: 12,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearGridCell: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8F4F0',
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    marginBottom: 6,
  },
  yearGridCellSelected: {
    backgroundColor: WARNA_PRIMARY,
    borderColor: WARNA_PRIMARY,
  },
  yearGridText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2C1810',
  },
  yearGridTextSelected: {
    color: '#FFFFFF',
  },
  currentYearTag: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E8DCD4',
  },
  currentYearTagActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  currentYearTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#55433B',
  },
  currentYearTagTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E3',
  },
  btnReset: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  btnResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8D7B70',
  },
  footerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnBatal: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F4ECE7',
  },
  btnBatalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#55433B',
  },
  btnTerapkan: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: WARNA_PRIMARY,
  },
  btnTerapkanText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
