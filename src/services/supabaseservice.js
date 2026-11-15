
export const testSemuaTabel = async () => {
  const tabel = [
    "detail_transaksi",
    "jurnal_keuangan",
    "kasir",
    "mapping_menu_stok",
    "menu_topping",
    "mutasi_stok",
    "pengeluaran",
    "pengeluaran_bahan",
    "profiles",
    "shift_kasir",
    "stok_bahan",
    "transaksi",
    "users",
  ];

  for (const namaTabel of tabel) {
    const { data, error } = await supabase
      .from(namaTabel)
      .select("*")
      .limit(1);

    if (error) {
      console.log(`❌ ${namaTabel}: ${error.message}`);
    } else {
      console.log(`✅ ${namaTabel}: berhasil diakses`, data);
    }
  }
};
