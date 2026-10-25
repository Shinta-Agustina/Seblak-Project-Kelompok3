import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
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

// Warna tema login / tombol utama selaras dengan tema aplikasi
const WARNA_PRIMARY = '#C62828';

export default function DatePickerModal({
  visible,
  onClose,
  mode = 'harian', // 'harian' | 'mingguan' | 'bulanan'
  currentDateText = '',
  onSelectDate,
}) {
  // Calendar state: default to Oktober 2026 (index 9)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // 0-indexed (9 = Oktober)
  const [selectedDay, setSelectedDay] = useState(16);

  // Mingguan state: preset week
  // Default: '13 Oktober 2026 – 16 Oktober 2026'
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(2); // Week 3 (13-16 Okt)

  // Bulanan state: month & year
  const [selectedBulananMonth, setSelectedBulananMonth] = useState(9); // 9 = Oktober
  const [selectedBulananYear, setSelectedBulananYear] = useState(2026);

  // Sync state whenever modal opens or mode changes
  useEffect(() => {
    if (visible) {
      if (mode === 'harian') {
        setSelectedYear(2026);
        setSelectedMonth(9);
        setSelectedDay(16);
      } else if (mode === 'mingguan') {
        setSelectedYear(2026);
        setSelectedMonth(9);
        setSelectedWeekIndex(2);
      } else if (mode === 'bulanan') {
        setSelectedBulananYear(2026);
        setSelectedBulananMonth(9);
      }
    }
  }, [visible, mode]);

  // Hitung jumlah hari dalam bulan & hari pertama
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigasi Bulan untuk Mode Harian & Mingguan
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

  // Navigasi Tahun
  const handlePrevYear = () => {
    if (mode === 'bulanan') {
      setSelectedBulananYear((prev) => prev - 1);
    } else {
      setSelectedYear((prev) => prev - 1);
    }
  };

  const handleNextYear = () => {
    if (mode === 'bulanan') {
      setSelectedBulananYear((prev) => prev + 1);
    } else {
      setSelectedYear((prev) => prev + 1);
    }
  };

  // Konfirmasi Pilihan
  const handleApply = () => {
    if (mode === 'harian') {
      const formatted = `${selectedDay} ${NAMA_BULAN[selectedMonth]} ${selectedYear}`;
      const isDefault =
        selectedDay === 16 && selectedMonth === 9 && selectedYear === 2026;
      onSelectDate(formatted, isDefault);
    } else if (mode === 'mingguan') {
      const weeks = getWeeksForMonth(selectedYear, selectedMonth);
      const chosenWeek = weeks[selectedWeekIndex] || weeks[0];
      const isDefault =
        selectedWeekIndex === 2 && selectedMonth === 9 && selectedYear === 2026;
      onSelectDate(chosenWeek.label, isDefault);
    } else if (mode === 'bulanan') {
      const lastDay = getDaysInMonth(
        selectedBulananYear,
        selectedBulananMonth
      );
      const formatted = `1 ${NAMA_BULAN[selectedBulananMonth]} ${selectedBulananYear} – ${lastDay} ${NAMA_BULAN[selectedBulananMonth]} ${selectedBulananYear}`;
      const isDefault =
        selectedBulananMonth === 9 && selectedBulananYear === 2026;
      onSelectDate(formatted, isDefault);
    }
    onClose();
  };

  // Reset ke Default
  const handleResetDefault = () => {
    if (mode === 'harian') {
      setSelectedYear(2026);
      setSelectedMonth(9);
      setSelectedDay(16);
      onSelectDate('16 Oktober 2026', true);
    } else if (mode === 'mingguan') {
      setSelectedYear(2026);
      setSelectedMonth(9);
      setSelectedWeekIndex(2);
      onSelectDate('13 Oktober 2026 – 19 Oktober 2026', true);
    } else if (mode === 'bulanan') {
      setSelectedBulananYear(2026);
      setSelectedBulananMonth(9);
      onSelectDate('1 Oktober 2026 – 31 Oktober 2026', true);
    }
    onClose();
  };

  // Helper untuk daftar minggu pada bulan yang dipilih
  const getWeeksForMonth = (year, month) => {
    const monthName = NAMA_BULAN[month];
    const totalDays = getDaysInMonth(year, month);

    // Khusus Oktober 2026, sediakan opsi default persis sesuai spesifikasi
    if (year === 2026 && month === 9) {
      return [
        {
          id: 0,
          label: `1 ${monthName} ${year} – 5 ${monthName} ${year}`,
          desc: 'Minggu 1',
        },
        {
          id: 1,
          label: `6 ${monthName} ${year} – 12 ${monthName} ${year}`,
          desc: 'Minggu 2',
        },
        {
          id: 2,
          label: `13 ${monthName} ${year} – 19 ${monthName} ${year}`,
          desc: 'Minggu 3',
        },
        {
          id: 3,
          label: `20 ${monthName} ${year} – 26 ${monthName} ${year}`,
          desc: 'Minggu 4',
        },
        {
          id: 4,
          label: `27 ${monthName} ${year} – 31 ${monthName} ${year}`,
          desc: 'Minggu 5',
        },
      ];
    }

    // Bulan lainnya
    return [
      {
        id: 0,
        label: `1 ${monthName} ${year} – 7 ${monthName} ${year}`,
        desc: 'Minggu 1',
      },
      {
        id: 1,
        label: `8 ${monthName} ${year} – 14 ${monthName} ${year}`,
        desc: 'Minggu 2',
      },
      {
        id: 2,
        label: `15 ${monthName} ${year} – 21 ${monthName} ${year}`,
        desc: 'Minggu 3',
      },
      {
        id: 3,
        label: `22 ${monthName} ${year} – ${totalDays} ${monthName} ${year}`,
        desc: 'Minggu 4',
      },
    ];
  };

  // Render Grid Hari untuk Mode Harian
  const renderHarianCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <View style={styles.calendarContainer}>
        {/* Header Nama Hari */}
        <View style={styles.daysHeaderRow}>
          {HARI_HEADER.map((h, idx) => (
            <View key={idx} style={styles.dayHeaderCell}>
              <Text
                style={[
                  styles.dayHeaderText,
                  (idx === 0 || idx === 6) && styles.weekendText,
                ]}
              >
                {h}
              </Text>
            </View>
          ))}
        </View>

        {/* Grid Tanggal */}
        <View style={styles.daysGrid}>
          {blanks.map((b) => (
            <View key={`b-${b}`} style={styles.dayCellEmpty} />
          ))}

          {days.map((day) => {
            const isSelected =
              day === selectedDay &&
              selectedMonth === selectedMonth &&
              selectedYear === selectedYear;

            return (
              <TouchableOpacity
                key={`d-${day}`}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
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

  // Render Pilihan Periode Mingguan
  const renderMingguanList = () => {
    const weeks = getWeeksForMonth(selectedYear, selectedMonth);

    return (
      <View style={styles.mingguanContainer}>
        <Text style={styles.sectionNotice}>
          Pilih rentang minggu untuk bulan {NAMA_BULAN[selectedMonth]}{' '}
          {selectedYear}:
        </Text>
        <ScrollView style={styles.weeksScroll} showsVerticalScrollIndicator={false}>
          {weeks.map((week) => {
            const isSelected = selectedWeekIndex === week.id;
            const isDefaultWeek =
              week.id === 2 && selectedMonth === 9 && selectedYear === 2026;

            return (
              <TouchableOpacity
                key={week.id}
                style={[
                  styles.weekItemCard,
                  isSelected && styles.weekItemCardSelected,
                ]}
                onPress={() => setSelectedWeekIndex(week.id)}
                activeOpacity={0.7}
              >
                <View style={styles.weekItemLeft}>
                  <View
                    style={[
                      styles.weekRadioCircle,
                      isSelected && styles.weekRadioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.weekRadioInner} />}
                  </View>
                  <View style={styles.weekItemTextGroup}>
                    <Text
                      style={[
                        styles.weekItemLabel,
                        isSelected && styles.weekItemLabelSelected,
                      ]}
                    >
                      {week.label}
                    </Text>
                    <Text style={styles.weekItemDesc}>
                      {week.desc}
                    </Text>
                  </View>
                </View>

              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render Grid Bulan & Tahun untuk Mode Bulanan
  const renderBulananSelector = () => {
    return (
      <View style={styles.bulananContainer}>
        {/* Tahun Selector */}
        <View style={styles.yearNavigator}>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handlePrevYear}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.navYearTitle}>{selectedBulananYear}</Text>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handleNextYear}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color="#2C1810" />
          </TouchableOpacity>
        </View>

        {/* 12 Bulan Grid */}
        <View style={styles.monthsGrid}>
          {NAMA_BULAN.map((m, idx) => {
            const isSelected =
              selectedBulananMonth === idx && selectedBulananYear === 2026;
            const isDefaultMonth = idx === 9 && selectedBulananYear === 2026;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.monthGridCell,
                  isSelected && styles.monthGridCellSelected,
                ]}
                onPress={() => setSelectedBulananMonth(idx)}
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

        {/* Info rentang bulan yang terpilih */}
        <View style={styles.bulananPreviewBox}>
          <Text style={styles.bulananPreviewLabel}>Rentang Terpilih:</Text>
          <Text style={styles.bulananPreviewValue}>
            1 {NAMA_BULAN[selectedBulananMonth]} {selectedBulananYear} –{' '}
            {getDaysInMonth(selectedBulananYear, selectedBulananMonth)}{' '}
            {NAMA_BULAN[selectedBulananMonth]} {selectedBulananYear}
          </Text>
        </View>
      </View>
    );
  };

  const modalTitle =
    mode === 'harian'
      ? 'Pilih Tanggal Transaksi'
      : mode === 'mingguan'
      ? 'Pilih Periode Mingguan'
      : 'Pilih Periode Bulanan';

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

              {/* Month/Year Navigasi Bar (Hanya untuk Harian & Mingguan) */}
              {mode !== 'bulanan' && (
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
                {mode === 'mingguan' && renderMingguanList()}
                {mode === 'bulanan' && renderBulananSelector()}
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

  // Header Modal
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

  // Navigator Bulan / Tahun
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
    paddingVertical: 6,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },

  // Modal Body
  modalBody: {
    paddingVertical: 12,
  },

  // Calendar Harian
  calendarContainer: {},
  daysHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D7B70',
  },
  weekendText: {
    color: '#C62828',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    marginVertical: 2,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: WARNA_PRIMARY,
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
  dayTextDefaultMarker: {
    fontWeight: '800',
    color: WARNA_PRIMARY,
  },
  defaultDotIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: WARNA_PRIMARY,
  },

  // Mingguan
  mingguanContainer: {},
  sectionNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D7B70',
    marginBottom: 10,
  },
  weeksScroll: {
    maxHeight: 250,
  },
  weekItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7E2',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  weekItemCardSelected: {
    borderColor: WARNA_PRIMARY,
    backgroundColor: '#FAF4F4',
  },
  weekItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#C4B5AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  weekRadioCircleSelected: {
    borderColor: WARNA_PRIMARY,
  },
  weekRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WARNA_PRIMARY,
  },
  weekItemTextGroup: {
    flex: 1,
  },
  weekItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  weekItemLabelSelected: {
    color: WARNA_PRIMARY,
    fontWeight: '800',
  },
  weekItemDesc: {
    fontSize: 11,
    color: '#8D7B70',
    marginTop: 2,
  },
  badgeDataReady: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDataReadyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#137333',
  },

  // Bulanan
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
    justifyContent: 'space-between',
    gap: 8,
  },
  monthGridCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8F5F2',
    borderWidth: 1.5,
    borderColor: '#ECE4DF',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '800',
  },
  monthDataTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#137333',
    marginTop: 3,
  },
  monthDataTagSelected: {
    color: '#FBEAEC',
  },
  bulananPreviewBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FAF5F2',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  bulananPreviewLabel: {
    fontSize: 11,
    color: '#8D7B70',
    fontWeight: '600',
  },
  bulananPreviewValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
    marginTop: 2,
  },

  // Footer Modal
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
