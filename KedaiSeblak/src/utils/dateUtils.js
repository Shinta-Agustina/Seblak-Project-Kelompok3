/**
 * Date utility functions for Seblak Prasmanan POS.
 * Formats dates according to local Indonesian standards.
 */

export function getTodayFormatted() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getTodayIndonesian() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export function getTodayIndonesianShort() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${monthsShort[now.getMonth()]} ${now.getFullYear()}`;
}

export function getYesterdayFormatted() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = String(yesterday.getDate()).padStart(2, '0');
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const y = yesterday.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getCurrentTimeFormatted() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}
