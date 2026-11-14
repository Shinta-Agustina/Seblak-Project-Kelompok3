import { supabase } from '../../lib/supabase';

// Ubah menjadi true hanya jika database memiliki trigger
// yang otomatis memperbarui stok_bahan.stok.
const STOK_DIUBAH_TRIGGER = false;

// =====================================================
// 1. DATA STOK BAHAN BAKU
// =====================================================

export async function getStocks() {
  const { data, error } = await supabase
    .from('stok_bahan')
    .select('*')
    .order('nama_bahan', { ascending: true });

  if (error) throw error;

  return data || [];
}

// =====================================================
// 2. RIWAYAT MUTASI STOK
// =====================================================

export async function getStockMovements({ limit = 1000 } = {}) {
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 1000, 5000)
  );

  const { data, error } = await supabase
    .from('mutasi_stok')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  return data || [];
}

// =====================================================
// 3. UPDATE INFORMASI BAHAN BAKU
// Tidak mengubah jumlah stok.
// =====================================================

export async function updateStock(id, values) {
  if (!id) {
    throw new Error('ID stok tidak ditemukan.');
  }

  const patch = {
    updated_at: new Date().toISOString(),
  };

  [
    'nama_bahan',
    'kategori',
    'satuan',
    'stok_minimum',
    'harga_satuan',
  ].forEach((key) => {
    if (values[key] !== undefined) {
      patch[key] = values[key];
    }
  });

  if (
    patch.nama_bahan !== undefined &&
    !String(patch.nama_bahan).trim()
  ) {
    throw new Error('Nama bahan wajib diisi.');
  }

  if (patch.nama_bahan !== undefined) {
    patch.nama_bahan = String(patch.nama_bahan).trim();
  }

  if (patch.stok_minimum !== undefined) {
    patch.stok_minimum = Number(patch.stok_minimum);

    if (
      !Number.isFinite(patch.stok_minimum) ||
      patch.stok_minimum < 0
    ) {
      throw new Error('Stok minimum tidak valid.');
    }
  }

  if (patch.harga_satuan !== undefined) {
    patch.harga_satuan = Number(patch.harga_satuan);

    if (
      !Number.isFinite(patch.harga_satuan) ||
      patch.harga_satuan < 0
    ) {
      throw new Error('Harga satuan tidak valid.');
    }
  }

  const { data, error } = await supabase
    .from('stok_bahan')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// =====================================================
// 4. PERMINTAAN STOK
// =====================================================

export async function getPermintaanStok(status = null) {
  let query = supabase
    .from('permintaan_stok')
    .select(`
      *,
      stok_bahan (
        id,
        nama_bahan,
        kategori,
        satuan,
        stok,
        stok_minimum
      ),
      pengeluaran (
        id,
        nama_pengeluaran,
        tanggal,
        kategori,
        jumlah,
        harga_satuan,
        total,
        catatan
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function getPermintaanMenunggu() {
  return getPermintaanStok('menunggu');
}

export async function getPermintaanDisetujui() {
  return getPermintaanStok('disetujui');
}

export async function getPermintaanDitolak() {
  return getPermintaanStok('ditolak');
}

// =====================================================
// 5. OWNER MENYETUJUI PERMINTAAN STOK
// =====================================================

export async function setujuiPermintaanStok(
  permintaanId,
  catatan = null
) {
  if (!permintaanId) {
    throw new Error('ID permintaan stok tidak ditemukan.');
  }

  const { data, error } = await supabase.rpc(
    'setujui_permintaan_stok',
    {
      p_permintaan_id: permintaanId,
      p_catatan: catatan,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// 6. OWNER MENOLAK PERMINTAAN STOK
// =====================================================

export async function tolakPermintaanStok(
  permintaanId,
  alasan
) {
  if (!permintaanId) {
    throw new Error('ID permintaan stok tidak ditemukan.');
  }

  const alasanPenolakan = String(alasan || '').trim();

  if (!alasanPenolakan) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  const { data, error } = await supabase.rpc(
    'tolak_permintaan_stok',
    {
      p_permintaan_id: permintaanId,
      p_catatan: alasanPenolakan,
    }
  );

  if (error) throw error;

  return data;
}

// =====================================================
// 7. MUTASI STOK MANUAL
// =====================================================

export async function recordStockMutation({
  stok_id,
  tipe,
  jumlah,
  keterangan,
  dibuat_oleh,
  pengeluaran_id = null,
}) {
  if (!stok_id) {
    throw new Error('Bahan stok belum dipilih.');
  }

  if (!['masuk', 'keluar', 'penyesuaian'].includes(tipe)) {
    throw new Error('Tipe mutasi tidak valid.');
  }

  const qty = Number(jumlah);

  if (!Number.isFinite(qty) || qty < 0) {
    throw new Error('Jumlah tidak valid.');
  }

  if (qty === 0 && tipe !== 'penyesuaian') {
    throw new Error('Jumlah harus lebih dari 0.');
  }

  const { data: current, error: readError } = await supabase
    .from('stok_bahan')
    .select('id, stok')
    .eq('id', stok_id)
    .single();

  if (readError) throw readError;

  const sekarang = Number(current.stok);

  if (!Number.isFinite(sekarang) || sekarang < 0) {
    throw new Error('Data stok saat ini tidak valid.');
  }

  const baru =
    tipe === 'masuk'
      ? sekarang + qty
      : tipe === 'keluar'
        ? sekarang - qty
        : qty;

  if (baru < 0) {
    throw new Error('Stok tidak boleh negatif.');
  }

  let mutasiId = null;

  if (qty > 0) {
    const { data: mutasi, error: mutationError } = await supabase
      .from('mutasi_stok')
      .insert({
        stok_id,
        tipe,
        jumlah: qty,
        keterangan: keterangan?.trim() || null,
        dibuat_oleh: dibuat_oleh || null,
        pengeluaran_id: pengeluaran_id || null,
      })
      .select('id')
      .single();

    if (mutationError) throw mutationError;

    mutasiId = mutasi.id;
  }

  if (!STOK_DIUBAH_TRIGGER) {
    const { error: updateError } = await supabase
      .from('stok_bahan')
      .update({
        stok: baru,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stok_id);

    if (updateError) {
      if (mutasiId) {
        const { error: cleanupError } = await supabase
          .from('mutasi_stok')
          .delete()
          .eq('id', mutasiId);

        if (cleanupError) {
          console.warn(
            'Gagal membersihkan data mutasi:',
            cleanupError.message
          );
        }
      }

      throw updateError;
    }
  }

  return {
    stok: baru,
    mutasi_id: mutasiId,
  };
}