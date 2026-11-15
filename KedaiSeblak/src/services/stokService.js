
import { supabase } from '../../lib/supabase';

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
// Harga jual disimpan ke stok_bahan.
// Pemakaian per pcs disimpan ke resep_menu.
// =====================================================

export async function updateStock(id, values = {}) {
  if (!id) {
    throw new Error('ID stok tidak ditemukan.');
  }

  const patch = {
    updated_at: new Date().toISOString(),
  };

  const allowedFields = [
    'nama_bahan',
    'kategori',
    'satuan',
    'stok_minimum',
    'harga_satuan',
    'harga_jual',
  ];

  allowedFields.forEach((key) => {
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

  [
    'stok_minimum',
    'harga_satuan',
    'harga_jual',
  ].forEach((key) => {
    if (patch[key] !== undefined) {
      patch[key] = Number(patch[key]);

      if (
        !Number.isFinite(patch[key]) ||
        patch[key] < 0
      ) {
        throw new Error(`${key} tidak valid.`);
      }
    }
  });

  // Validasi pemakaian per pcs.
  // Nilai ini bukan kolom stok_bahan, melainkan kolom resep_menu.
  const jumlahPerPorsi =
    values.jumlah_per_porsi !== undefined
      ? Number(values.jumlah_per_porsi)
      : undefined;

  if (jumlahPerPorsi !== undefined) {
    if (
      !Number.isFinite(jumlahPerPorsi) ||
      jumlahPerPorsi <= 0
    ) {
      throw new Error(
        'Pemakaian bahan per pcs harus lebih dari 0.'
      );
    }
  }

  // Simpan informasi bahan dan harga jual.
  // Trigger sinkronisasi database akan membuat/memperbarui menu_topping
  // ketika harga_jual bernilai lebih dari 0.
  const { data: updatedStock, error: stockError } = await supabase
    .from('stok_bahan')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (stockError) throw stockError;

  // Jika pemakaian per pcs dikirim, simpan ke resep_menu.
  if (jumlahPerPorsi !== undefined) {
    if (
      !Number(updatedStock.harga_jual) ||
      Number(updatedStock.harga_jual) <= 0
    ) {
      throw new Error(
        'Harga jual harus diisi lebih dahulu sebelum mengatur pemakaian per pcs.'
      );
    }

    // Cari topping yang dibuat oleh trigger sinkronisasi stok.
    const { data: topping, error: toppingError } = await supabase
      .from('menu_topping')
      .select('id, stok_id')
      .eq('stok_id', id)
      .maybeSingle();

    if (toppingError) throw toppingError;

    if (!topping) {
      throw new Error(
        'Data topping belum terbentuk. Periksa trigger sinkronisasi stok_bahan ke menu_topping.'
      );
    }

    // Simpan resep. Jika sudah ada, perbarui jumlah pemakaiannya.
    const { data: resep, error: resepError } = await supabase
      .from('resep_menu')
      .upsert(
        {
          menu_id: topping.id,
          stok_id: id,
          jumlah_per_porsi: jumlahPerPorsi,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'menu_id,stok_id',
        }
      )
      .select()
      .single();

    if (resepError) throw resepError;

    return {
      ...updatedStock,
      resep,
    };
  }

  return updatedStock;
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
// Stok diperbarui oleh trigger database.
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

  // Pastikan bahan tersedia.
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

  // Trigger database memperlakukan:
  // masuk = tambah stok
  // keluar = kurangi stok
  // penyesuaian = tambah sesuai jumlah mutasi
  const baru =
    tipe === 'masuk' || tipe === 'penyesuaian'
      ? sekarang + qty
      : sekarang - qty;

  if (baru < 0) {
    throw new Error('Stok tidak boleh negatif.');
  }

  // Insert mutasi. Trigger database akan memperbarui stok_bahan.stok.
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

  // Ambil stok terbaru dari database.
  const { data: updated, error: updatedError } = await supabase
    .from('stok_bahan')
    .select('stok')
    .eq('id', stok_id)
    .single();

  if (updatedError) {
    throw new Error(
      `Mutasi tersimpan, tetapi stok gagal dibaca: ${updatedError.message}`
    );
  }

  return {
    stok: Number(updated.stok),
    mutasi_id: mutasi.id,
  };
}
