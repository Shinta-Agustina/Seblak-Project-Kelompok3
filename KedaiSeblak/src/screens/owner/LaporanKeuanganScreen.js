// src/screens/Owner/LaporanKeuanganScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// --- IMPORT MOCK DATA ---
// Di aplikasi sungguhan, data ini berasal dari API/Database.
// Untuk skripsi, kita pakai data dummy yang sudah diselaraskan.
import {
    INITIAL_EXPENSES,
    DUMMY_SALES_ALL_OCT_2026
} from '../../data/mockDataOwner';

// Helper untuk mendapatkan tanggal hari ini (Format YYYY-MM-DD)
const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
};

// Helper untuk memformat angka ke Rupiah
const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return `Rp ${angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};


export default function LaporanKeuanganScreen() {
    // State Pilihan Periode Filter
    const [selectedPeriode, setSelectedPeriode] = useState('today');

    // --- LOGIKA UTAMA: PENGOLAHAN DATA (DATA JOINING & AGGREGATION) ---
    const reportData = useMemo(() => {
        // 1. Tentukan Rentang Tanggal Berdasarkan Filter UI
        // Untuk demo skripsi, kita "hardcode" datanya seolah-olah terjadi di Oktober 2026
        let salesInPeriode = [];
        let expensesInPeriode = [];
        let labelPeriode = '';

        // Simulasi Hari Ini (Kita anggap hari ini adalah tgl 16 Okt 2026 sesuai data dummy)
        const DEMO_TODAY = '2026-10-16';

        switch (selectedPeriode) {
            case 'today':
                labelPeriode = 'Hari Ini (16 Okt 2026)';
                salesInPeriode = DUMMY_SALES_ALL_OCT_2026.filter(s => s.tanggal === DEMO_TODAY);
                expensesInPeriode = INITIAL_EXPENSES.filter(e => e.tanggal === DEMO_TODAY);
                break;

            case 'yesterday':
                labelPeriode = 'Kemarin (15 Okt 2026)';
                const DEMO_YESTERDAY = '2026-10-15';
                salesInPeriode = DUMMY_SALES_ALL_OCT_2026.filter(s => s.tanggal === DEMO_YESTERDAY);
                expensesInPeriode = INITIAL_EXPENSES.filter(e => e.tanggal === DEMO_YESTERDAY);
                break;

            case 'this_month':
                labelPeriode = 'Oktober 2026';
                // Ambil semua data di bulan Oktober 2026 (YYYY-MM)
                salesInPeriode = DUMMY_SALES_ALL_OCT_2026.filter(s => s.tanggal.startsWith('2026-10'));
                expensesInPeriode = INITIAL_EXPENSES.filter(e => e.tanggal.startsWith('2026-10'));
                break;

            default:
                salesInPeriode = [];
                expensesInPeriode = [];
        }

        // 2. Hitung Total Omset (Pemasukan Kotor)
        const totalOmset = salesInPeriode.reduce((sum, sale) => sum + sale.total, 0);

        // 3. Hitung Total Pengeluaran Berdasarkan Kategori (HPP & Operasional)
        const totalHpp = expensesInPeriode
            .filter(exp => exp.kategori !== 'Operasional') // Asumsi selain operasional adalah modal bahan (HPP)
            .reduce((sum, exp) => sum + exp.total, 0);

        const totalBiayaOperasional = expensesInPeriode
            .filter(exp => exp.kategori === 'Operasional')
            .reduce((sum, exp) => sum + exp.total, 0);

        const totalPengeluaran = totalHpp + totalBiayaOperasional;

        // 4. RUMUS AKUNTANSI (LABA RUGI)
        // Laba Kotor = Omset - HPP (Modal Bahan Baku yg Terpakai/Dibeli)
        const labaKotor = totalOmset - totalHpp;

        // Laba Bersih = Laba Kotor - Biaya Operasional (Listrik, Gaji, dll)
        const labaBersih = labaKotor - totalBiayaOperasional;

        // Hitung Profit Margin Bersih (%)
        const profitMargin = totalOmset > 0 ? (labaBersih / totalOmset) * 100 : 0;

        return {
            labelPeriode,
            totalOmset,
            totalHpp,
            totalBiayaOperasional,
            totalPengeluaran,
            labaKotor,
            labaBersih,
            profitMargin: profitMargin.toFixed(1) // Dibulatkan 1 desimal
        };

    }, [selectedPeriode, INITIAL_EXPENSES, DUMMY_SALES_ALL_OCT_2026]); // Dependensi data master


    // --- KOMPONEN KARTU RINGKASAN ---
    const SummaryCard = ({ title, value, color = '#2C1810', isMain = false }) => (
        <View style={[styles.summaryCard, isMain && styles.mainSummaryCard]}>
            <Text style={[styles.summaryTitle, isMain && styles.mainSummaryTitle]}>{title}</Text>
            <Text style={[styles.summaryValue, isMain && styles.mainSummaryValue, { color: color }]}>
                {formatRupiah(value)}
            </Text>
        </View>
    );


    // --- TAMPILAN UI ---
    return (
        <View style={styles.rootContainer}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Laporan Keuangan</Text>
                <Text style={styles.headerSubtitle}>Analisis Laba Rugi Bisnis</Text>
            </View>

            {/* Filter Periode */}
            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Pilih Periode:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedPeriode}
                        onValueChange={(itemValue) => setSelectedPeriode(itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#52141D"
                    >
                        <Picker.Item label="Hari Ini (Simulasi 16 Okt)" value="today" />
                        <Picker.Item label="Kemarin (Simulasi 15 Okt)" value="yesterday" />
                        <Picker.Item label="Bulan Ini (Oktober 2026)" value="this_month" />
                    </Picker>
                </View>
            </View>

            {/* Konten Laporan (Scrollable) */}
            <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >

                {/* Info Periode Aktif */}
                <View style={styles.periodeInfoBox}>
                    <Ionicons name="calendar-outline" size={14} color="#78665E" />
                    <Text style={styles.periodeInfoText}>Menampilkan data: {reportData.labelPeriode}</Text>
                </View>

                {/* --- BAGIAN HASIL AKHIR (LABA BERSIH) --- */}
                <View style={styles.finalProfitBox}>
                    <Text style={styles.finalProfitLabel}>LABA BERSIH (NET INCOME)</Text>
                    <Text style={[
                        styles.finalProfitValue,
                        { color: reportData.labaBersih >= 0 ? '#168653' : '#C62828' }
                    ]}>
                        {formatRupiah(reportData.labaBersih)}
                    </Text>
                    <View style={styles.marginBadge}>
                        <Text style={styles.marginBadgeText}>Profit Margin: {reportData.profitMargin}%</Text>
                    </View>
                    <Text style={styles.disclaimerNote}>*Nilai Margin dihitung dari Laba Bersih dibagi Total Omset.</Text>
                </View>


                {/* --- BAGIAN DETAIL PERHITUNGAN (STEP-BY-STEP) --- */}
                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Detail Perhitungan</Text>

                    {/* 1. Pendapatan */}
                    <View style={styles.calculationBlock}>
                        <Text style={styles.calcBlockTitle}>1. Pendapatan (Omset)</Text>
                        <SummaryCard title="Total Omset Penjualan" value={reportData.totalOmset} color="#2C1810" />
                    </View>

                    <Ionicons name="remove" size={24} color="#D1C7BD" style={styles.operatorIcon} />

                    {/* 2. HPP (Harga Pokok Penjualan) */}
                    <View style={styles.calculationBlock}>
                        <Text style={styles.calcBlockTitle}>2. Harga Pokok (HPP)</Text>
                        <SummaryCard title="Total Modal Bahan Baku Terbeli" value={reportData.totalHpp} color="#C62828" />
                        <Text style={styles.subNote}>*HPP dicatat saat Owner melakukan Restock/Belanja.</Text>
                    </View>

                    {/* Garis Pemisah Laba Kotor */}
                    <View style={styles.calculationDivider} />

                    {/* Hasil Laba Kotor */}
                    <SummaryCard
                        title="LABA KOTOR (Gross Profit)"
                        value={reportData.labaKotor}
                        color={reportData.labaKotor >= 0 ? '#168653' : '#C62828'}
                        isMain={true}
                    />

                    <Ionicons name="remove" size={24} color="#D1C7BD" style={styles.operatorIcon} />

                    {/* 3. Biaya Operasional */}
                    <View style={styles.calculationBlock}>
                        <Text style={styles.calcBlockTitle}>3. Biaya Operasional</Text>
                        <SummaryCard title="Total Biaya Non-Bahan (Listrik, Gaji, dll)" value={reportData.totalBiayaOperasional} color="#D97706" />
                    </View>

                    {/* Garis Akhir */}
                    <View style={[styles.calculationDivider, { height: 2, backgroundColor: '#52141D' }]} />

                    {/* HASIL AKHIR LABA BERSIH (Diulang di bawah agar mudah dibaca) */}
                    <SummaryCard
                        title="LABA BERSIH FINAL"
                        value={reportData.labaBersih}
                        color={reportData.labaBersih >= 0 ? '#168653' : '#C62828'}
                        isMain={true}
                    />
                </View>

                {/* Catatan Kaki Skripsi */}
                <View style={styles.footerNoteBox}>
                    <Ionicons name="school-outline" size={18} color="#78665E" />
                    <Text style={styles.footerNoteText}>
                        Catatan Skripsi: Modul ini menyajikan laporan laba rugi berbasis metode Cash Basis yang disesuaikan dengan pencatatan inventaris (Cash-to-Cash Cycle).
                        Data Omset diambil secara otomatis dari transaksi Kasir, dan data HPP diambil dari pencatatan pengeluaran Owner saat restock bahan baku.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: { flex: 1, backgroundColor: '#F8F5F2' },
    headerContainer: { padding: 16, paddingBottom: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EFE7E2' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#2C1810', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 11, color: '#78665E', marginTop: 2 },

    filterSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFFFFF', zIndex: 1, borderBottomWidth: 1, borderColor: '#EFE7E2' },
    filterLabel: { fontSize: 12, fontWeight: '600', color: '#78665E' },
    pickerContainer: { borderWidth: 1, borderColor: '#EFE7E2', borderRadius: 8, backgroundColor: '#F8F5F2', width: '65%', height: 40, justifyContent: 'center' },
    picker: { fontSize: 12, color: '#2C1810', height: 40 },

    contentContainer: { flex: 1, padding: 16 },
    periodeInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, justifyContent: 'center' },
    periodeInfoText: { fontSize: 10, color: '#78665E', fontStyle: 'italic' },

    // Final Profit Box Styles
    finalProfitBox: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#EFE7E2', elevation: 2 },
    finalProfitLabel: { fontSize: 10, color: '#78665E', letterSpacing: 1, fontWeight: '800', marginBottom: 8 },
    finalProfitValue: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
    marginBadge: { backgroundColor: '#DCFCE7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20, marginBottom: 8 },
    marginBadgeText: { color: '#168653', fontSize: 10, fontWeight: '700' },
    disclaimerNote: { fontSize: 9, color: '#A89A92', fontStyle: 'italic', marginTop: 4 },

    // Detail Section Styles
    detailSection: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EFE7E2' },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#2C1810', marginBottom: 16 },
    calculationBlock: { marginBottom: 10 },
    calcBlockTitle: { fontSize: 11, color: '#78665E', marginBottom: 6, fontWeight: '600' },
    subNote: { fontSize: 9, color: '#C62828', fontStyle: 'italic', marginTop: 2, marginLeft: 4 },

    summaryCard: { backgroundColor: '#F8F5F2', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    summaryTitle: { fontSize: 12, color: '#78665E' },
    summaryValue: { fontSize: 12, fontWeight: '700', color: '#2C1810' },

    mainSummaryCard: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA', paddingVertical: 14 },
    mainSummaryTitle: { fontSize: 13, fontWeight: '700', color: '#C62828' },
    mainSummaryValue: { fontSize: 16, fontWeight: '900' },

    operatorIcon: { alignSelf: 'center', marginVertical: -4, zIndex: 1 },
    calculationDivider: { height: 1, backgroundColor: '#EFE7E2', marginVertical: 12 },

    // Footer Note
    footerNoteBox: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFBF8', borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#EFE7E2', marginTop: 24, gap: 10 },
    footerNoteText: { fontSize: 10, color: '#78665E', flex: 1, lineHeight: 14 },
});