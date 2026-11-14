import { supabase } from '../../lib/supabase';

// shift_kasir: id, kasir_id, waktu_mulai, waktu_selesai, modal_awal, uang_akhir_fisik,
// omzet_sistem, total_transaksi, selisih, status ('buka' / 'tutup'), catatan, created_at
export async function getShifts({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('shift_kasir')
    .select('*')
    .order('waktu_mulai', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
