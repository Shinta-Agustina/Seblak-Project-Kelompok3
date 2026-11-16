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

  const stok = data || [];

  // Pemakaian per pcs (resep topping) agar bisa tampil di modal Edit Stok.
  // Nilainya dalam satuan stok, mis. 0.05 untuk 50 gram dari stok berbasis kg.
  // Kegagalan membaca resep tidak boleh menggagalkan daftar stok.
  const { data: topping } = await supabase
    .from('menu_topping')
    .select('stok_id, resep_menu ( stok_id, jumlah_per_porsi )')
    .not('stok_id', 'is', null);

  const petaPemakaian = {};

  (topping || []).forEach((t) => {
    const resep = (t.resep_menu || []).find(
      (r) => r.stok_id === t.stok_id
    );

    if (resep) {
      petaPemakaian[t.stok_id] = Number(resep.jumlah_per_porsi);
    }
  });

  return stok.map((row) => ({
    ...row,
    jumlah_per_porsi: petaPemakaian[row.id] ?? null,
  }));
}

// =====================================================
// 2. RIWAYAT MUTASI STOK
// Mengambil riwayat beserta nama bahan dan informasi transaksi.
// =====================================================

export async function getStockMovements({ limit = 1000 } = {}) {
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 1000, 5000)
  );

  // Ambil data mutasi stok.
  const { data: movements, error } = await supabase
    .from('mutasi_stok')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  const rows = movements || [];

  if (rows.length === 0) {
    return [];
  }

  // Kumpulkan ID bahan.
  const stockIds = [
    ...new Set(
      rows
        .map((item) => item.stok_id)
        .filter(Boolean)
    ),
  ];

  // Kumpulkan ID transaksi.
  const transactionIds = [
    ...new Set(
      rows
        .map((item) => item.transaksi_id)
        .filter(Boolean)
    ),
  ];

  // Kumpulkan ID pengeluaran.
  const expenseIds = [
    ...new Set(
      rows
        .map((item) => item.pengeluaran_id)
        .filter(Boolean)
    ),
  ];

  // ---------------------------------------------------
  // Ambil informasi bahan baku.
  // ---------------------------------------------------

  let stockMap = {};

  if (stockIds.length > 0) {
    const { data, error: stockError } = await supabase
      .from('stok_bahan')
      .select('id, nama_bahan, kategori, satuan')
      .in('id', stockIds);

    if (stockError) throw stockError;

    stockMap = Object.fromEntries(
      (data || []).map((item) => [
        item.id,
        item,
      ])
    );
  }

  // ---------------------------------------------------
  // Ambil nomor transaksi.
  // ---------------------------------------------------

  let transactionMap = {};

  if (transactionIds.length > 0) {
    const { data, error: transactionError } = await supabase
      .from('transaksi')
      .select('id, nomor_transaksi')
      .in('id', transactionIds);

    if (transactionError) throw transactionError;

    transactionMap = Object.fromEntries(
      (data || []).map((item) => [
        item.id,
        item,
      ])
    );
  }

  // ---------------------------------------------------
  // Ambil nama pengeluaran.
  // ---------------------------------------------------

  let expenseMap = {};

  if (expenseIds.length > 0) {
    const { data, error: expenseError } = await supabase
      .from('pengeluaran')
      .select('id, nama_pengeluaran')
      .in('id', expenseIds);

    if (expenseError) throw expenseError;

    expenseMap = Object.fromEntries(
      (data || []).map((item) => [
        item.id,
        item,
      ])
    );
  }

  // ---------------------------------------------------
  // Gabungkan seluruh data.
  // ---------------------------------------------------

  return rows.map((movement) => ({
    ...movement,

    nama_bahan:
      stockMap[movement.stok_id]?.nama_bahan ||
      'Bahan tidak ditemukan',

    kategori:
      stockMap[movement.stok_id]?.kategori ||
      null,

    satuan:
      stockMap[movement.stok_id]?.satuan ||
      '',

    nomor_transaksi:
      transactionMap[movement.transaksi_id]
        ?.nomor_transaksi || null,

    nama_pengeluaran:
      expenseMap[movement.pengeluaran_id]
        ?.nama_pengeluaran || null,
  }));
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

  // updated_at tidak dikirim karena diisi otomatis database.
  const patch = {};

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
  const stockQuery =
    Object.keys(patch).length > 0
      ? supabase.from('stok_bahan').update(patch).eq('id', id)
      : supabase.from('stok_bahan').select().eq('id', id);

  const { data: updatedStock, error: stockError } = await stockQuery
    .select()
    .single();

  if (stockError) throw stockError;

  // Simpan resep jika pemakaian per pcs dikirim.
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
    let { data: topping, error: toppingError } = await supabase
      .from('menu_topping')
      .select('id, stok_id')
      .eq('stok_id', id)
      .maybeSingle();

    if (toppingError) throw toppingError;

    // Topping belum ada (trigger sinkronisasi belum berjalan) -> bentuk sekarang.
    if (!topping) {
      const { data: dibuat, error: buatError } = await supabase
        .from('menu_topping')
        .insert({
          nama: updatedStock.nama_bahan,
          kategori: updatedStock.kategori || 'Topping',
          harga: Number(updatedStock.harga_jual),
          stok: 0,
          berat: `1 ${updatedStock.satuan || 'pcs'}`,
          status: 'aktif',
          stok_id: id,
        })
        .select('id, stok_id')
        .single();

      if (buatError) {
        throw new Error(`Gagal membentuk data topping: ${buatError.message}`);
      }
      topping = dibuat;
    }

    // Simpan resep.
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
  // penyesuaian = tambah sesuai jumlah mutasi.
  const baru =
    tipe === 'masuk' || tipe === 'penyesuaian'
      ? sekarang + qty
      : sekarang - qty;

  if (baru < 0) {
    throw new Error('Stok tidak boleh negatif.');
  }

  // Insert mutasi. Trigger database memperbarui stok_bahan.stok.
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

  // Ambil stok terbaru.
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
