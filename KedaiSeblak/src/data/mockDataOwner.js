
/*
=====================================================
 MOCK DATA OWNER
 Kedai Seblak
=====================================================

 File ini menjadi penghubung untuk import data Owner
 dari file ownerData.js.

 Seluruh data utama tetap dikelola di ownerData.js.
 Tidak ada komponen React Native di file ini.
*/

export {
  WARNA_SEBLAK,
  TOP_PRODUCTS,
  SUPPLIER_LIST,
  MASTER_BAHAN_BAKU,
  STOCK_TOPPING_ITEMS,
  STOCK_BAHAN_DASAR,
  INITIAL_STOCK_ITEMS,
  INITIAL_EXPENSES,
  tentukanSatuanStok,
} from './ownerData';

// Mendukung import lain yang mungkin membutuhkan
// seluruh data Owner dalam bentuk named exports.
export * from './ownerData';
