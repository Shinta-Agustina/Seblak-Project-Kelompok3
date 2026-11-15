
import { supabase } from '../../lib/supabase';
import { toEmail } from './Authservice';

// =========================================
// NORMALISASI DAN VALIDASI
// =========================================

const normalizeStatus = (status) => {
  return String(status || 'aktif').toLowerCase() === 'nonaktif'
    ? 'nonaktif'
    : 'aktif';
};

const validatePhone = (phone) => {
  if (!phone) return true;

  return /^[0-9+\-\s]{8,20}$/.test(String(phone).trim());
};

const cashierSelect =
  'id, kode_kasir, nama, username, no_telepon, status, created_at, updated_at';

// =========================================
// MEMANGGIL EDGE FUNCTION
// =========================================

async function invokeManageCashier(payload) {
  const { data, error } = await supabase.functions.invoke(
    'manage-cashier',
    {
      body: payload,
    }
  );

  if (error) {
    let message = error.message || 'Permintaan ke server gagal.';

    try {
      const response = error.context;

      if (response && typeof response.json === 'function') {
        const responseData = await response.json();

        message =
          responseData?.error ||
          responseData?.message ||
          message;
      }
    } catch {
      // Gunakan pesan error awal.
    }

    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

// =========================================
// MENGAMBIL SELURUH DATA KASIR
// =========================================

export async function getCashiers() {
  const { data, error } = await supabase
    .from('kasir')
    .select(cashierSelect)
    .order('kode_kasir', { ascending: true });

  if (error) {
    throw new Error(
      `Gagal mengambil data kasir: ${error.message}`
    );
  }

  return data || [];
}

// =========================================
// MENAMBAHKAN AKUN KASIR
// =========================================

export async function createCashierAccount(values = {}) {
  const nama = String(
    values.nama ?? values.name ?? ''
  ).trim();

  const usernameInput = String(
    values.username ?? values.email ?? ''
  ).trim().toLowerCase();

  const password = String(values.password ?? '');

  const no_telepon = String(
    values.no_telepon ?? values.phone ?? ''
  ).trim();

  const status = normalizeStatus(values.status);

  if (!nama) {
    throw new Error('Nama kasir wajib diisi.');
  }

  if (!usernameInput) {
    throw new Error('Email atau username wajib diisi.');
  }

  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  if (!validatePhone(no_telepon)) {
    throw new Error(
      'Nomor telepon harus terdiri dari 8–20 karakter angka.'
    );
  }

  let email;

  try {
    email = toEmail(usernameInput);
  } catch (error) {
    throw new Error(error.message);
  }

  const result = await invokeManageCashier({
    action: 'create',
    nama,
    username: usernameInput,
    email,
    no_telepon: no_telepon || null,
    password,
    status,
  });

  if (!result?.cashier?.id) {
    throw new Error(
      'Akun berhasil diproses, tetapi data kasir tidak diterima dari server.'
    );
  }

  return result.cashier;
}

// =========================================
// MENGUBAH DATA KASIR
// Nama, nomor telepon, status, dan email.
// =========================================

export async function updateCashier(id, values = {}) {
  if (!id) {
    throw new Error('ID kasir tidak ditemukan.');
  }

  const payload = {
    action: 'update',
    cashierId: id,
  };

  const nama = values.nama ?? values.name;

  if (nama !== undefined) {
    const newName = String(nama).trim();

    if (!newName) {
      throw new Error('Nama kasir wajib diisi.');
    }

    payload.nama = newName;
  }

  const phone = values.no_telepon ?? values.phone;

  if (phone !== undefined) {
    const newPhone = String(phone).trim();

    if (!validatePhone(newPhone)) {
      throw new Error(
        'Nomor telepon harus terdiri dari 8–20 karakter angka.'
      );
    }

    payload.no_telepon = newPhone || null;
  }

  if (values.email !== undefined || values.username !== undefined) {
    const emailInput = String(
      values.email ?? values.username ?? ''
    ).trim().toLowerCase();

    if (!emailInput) {
      throw new Error('Email kasir wajib diisi.');
    }

    try {
      payload.email = toEmail(emailInput);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  if (values.status !== undefined) {
    payload.status = normalizeStatus(values.status);
  }

  if (Object.keys(payload).length === 2) {
    throw new Error('Tidak ada perubahan data yang disimpan.');
  }

  const result = await invokeManageCashier(payload);

  if (!result?.cashier?.id) {
    throw new Error(
      'Server tidak mengembalikan data kasir setelah diperbarui.'
    );
  }

  return result.cashier;
}

// =========================================
// MENGGANTI PASSWORD KASIR
// Tanpa tautan reset password.
// =========================================

export async function updateCashierPassword(
  cashierId,
  newPassword
) {
  if (!cashierId) {
    throw new Error('ID kasir tidak ditemukan.');
  }

  const password = String(newPassword || '');

  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  const result = await invokeManageCashier({
    action: 'update_password',
    cashierId,
    password,
  });

  if (!result?.success) {
    throw new Error(
      'Server belum berhasil memperbarui password kasir.'
    );
  }

  return true;
}

// =========================================
// MENGAKTIFKAN / MENONAKTIFKAN KASIR
// =========================================

export async function setCashierStatus(id, status) {
  if (!id) {
    throw new Error('ID kasir tidak ditemukan.');
  }

  const result = await invokeManageCashier({
    action: 'update',
    cashierId: id,
    status: normalizeStatus(status),
  });

  if (!result?.cashier?.id) {
    throw new Error(
      'Gagal memperbarui status kasir.'
    );
  }

  return result.cashier;
}

// =========================================
// MENONAKTIFKAN AKUN KASIR
// Soft delete, bukan menghapus akun permanen.
// =========================================

export async function deleteCashier(id) {
  if (!id) {
    throw new Error('ID kasir tidak ditemukan.');
  }

  const result = await setCashierStatus(id, 'nonaktif');

  return Boolean(result?.id);
}
