// Category Badge Helper
export const getCategoryBadge = (kategori = '', nama = '') => {
  const text = `${kategori} ${nama}`.toLowerCase();
  if (
    text.includes('bumbu') ||
    text.includes('bawang') ||
    text.includes('cabai') ||
    text.includes('cabe') ||
    text.includes('kencur') ||
    text.includes('kemiri') ||
    text.includes('ketumbar') ||
    text.includes('merica') ||
    text.includes('kunyit') ||
    text.includes('garam') ||
    text.includes('gula') ||
    text.includes('kaldu') ||
    text.includes('penyedap') ||
    text.includes('serai') ||
    text.includes('jeruk')
  ) {
    return { label: 'Bumbu', color: '#168653', bg: '#DCFCE7' };
  }
  // Sesuai instruksi: SEMUA Topping labelnya CUKUP 'Topping' saja
  return { label: 'Topping', color: '#52141D', bg: '#FBEAEC' };
};

