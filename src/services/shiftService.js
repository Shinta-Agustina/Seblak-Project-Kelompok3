import { supabase } from '../../lib/supabase';

export async function getShiftMonitoring({ limit = 100 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const { data: shifts, error } = await supabase
    .from('shift_kasir')
    .select('*, kasir (id, kode_kasir, nama)')
    .order('waktu_mulai', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;

  const ids = (shifts || []).map((shift) => shift.id);
  let transactions = [];
  if (ids.length) {
    const result = await supabase
      .from('transaksi')
      .select('id, shift_id, total, status')
      .in('shift_id', ids);
    if (result.error) throw result.error;
    transactions = result.data || [];
  }

  const totals = transactions.reduce((acc, trx) => {
    const key = trx.shift_id;
    if (!acc[key]) acc[key] = { omzet: 0, count: 0 };
    if (trx.status === 'Lunas') {
      acc[key].omzet += Number(trx.total || 0);
      acc[key].count += 1;
    }
    return acc;
  }, {});

  return (shifts || []).map((shift) => {
    const summary = totals[shift.id] || { omzet: 0, count: 0 };
    return {
      ...shift,
      namaKasir: shift.kasir?.nama || 'Kasir',
      kodeKasir: shift.kasir?.kode_kasir || '-',
      statusShift: String(shift.status || '').toUpperCase(),
      modalAwal: Number(shift.modal_awal || 0),
      omsetKotorSementara: Math.max(Number(shift.omzet_sistem || 0), summary.omzet),
      totalTransaksi: Math.max(Number(shift.total_transaksi || 0), summary.count),
      estimasiUangFisik: Number(shift.modal_awal || 0) + summary.omzet,
      selisihFisik: shift.selisih == null ? null : Number(shift.selisih),
      waktuMulai: shift.waktu_mulai,
      waktuSelesai: shift.waktu_selesai,
    };
  });
}

// =====================================================
// BUKA / TUTUP SHIFT (opsional)
// Database membuka shift otomatis saat transaksi pertama hari itu
// (lihat migrasi 006). Fungsi di bawah dipakai bila nanti ada layar
// buka/tutup shift dengan modal awal dan hitung uang fisik.
// =====================================================

// Shift milik kasir yang sedang login dan masih buka (atau null).
export async function getShiftAktif() {
  const { data, error } = await supabase
    .from('v_ringkasan_shift')
    .select('*')
    .eq('status', 'buka')
    .order('waktu_mulai', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function bukaShift(modalAwal = 0) {
  const modal = Number(modalAwal || 0);

  if (!Number.isFinite(modal) || modal < 0) {
    throw new Error('Modal awal tidak valid.');
  }

  const { data, error } = await supabase.rpc('buka_shift', {
    p_modal_awal: modal,
  });

  if (error) throw new Error(error.message);

  return data;
}

// Omzet, jumlah transaksi, dan selisih kas dihitung database.
export async function tutupShift(uangAkhirFisik, catatan = null) {
  const uang = Number(uangAkhirFisik);

  if (!Number.isFinite(uang) || uang < 0) {
    throw new Error('Uang akhir fisik tidak valid.');
  }

  const { data, error } = await supabase.rpc('tutup_shift', {
    p_uang_akhir_fisik: uang,
    p_catatan: catatan,
  });

  if (error) throw new Error(error.message);

  return data;
}
