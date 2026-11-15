import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

function Thumb({ uri, icon }) {
  return uri ? (
    <Image source={{ uri }} style={s.thumb} resizeMode="cover" />
  ) : (
    <View style={[s.thumb, s.thumbEmpty]}>
      <Ionicons name={icon} size={16} color="#C9BBB3" />
    </View>
  );
}

// Kartu pengeluaran untuk layar HP (menggantikan tabel yang lebar)
export default function ExpenseCard({ item, onEdit, onDelete, onViewDetail }) {
  const isBumbu = String(item.kategori || '').toLowerCase().includes('bumbu');
  return (
    <View style={s.card}>
      <View style={s.rowBetween}>
        <Text style={s.name} numberOfLines={1}>{item.keterangan || item.nama || '-'}</Text>
        <Text style={s.total}>{rupiah(item.total != null ? item.total : item.nominal)}</Text>
      </View>
      <View style={s.meta}>
        <View style={[s.badge, { backgroundColor: isBumbu ? '#FFF1D6' : '#FBE4E6' }]}>
          <Text style={[s.badgeText, { color: isBumbu ? '#B7791F' : '#C62828' }]}>{isBumbu ? 'Bumbu' : 'Topping'}</Text>
        </View>
        <Text style={s.metaText}>{String(item.waktu || '--:--').slice(0, 5)} WIB</Text>
        <Text style={s.metaText} numberOfLines={1}>· {item.supplier || '-'}</Text>
      </View>
      <View style={s.rowBetween}>
        <Text style={s.qty}>{item.jumlah} {item.satuan || ''}</Text>
        <View style={s.thumbs}>
          <Thumb uri={item.fotoItem} icon="image-outline" />
          <Thumb uri={item.fotoStruk} icon="receipt-outline" />
        </View>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={[s.btn, s.btnLihat]} onPress={() => onViewDetail && onViewDetail(item)}>
          <Ionicons name="eye-outline" size={14} color="#52141D" />
          <Text style={[s.btnText, { color: '#52141D' }]}>Lihat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnEdit]} onPress={() => onEdit && onEdit(item)}>
          <Ionicons name="create-outline" size={14} color="#FFFFFF" />
          <Text style={s.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnDel]} onPress={() => onDelete && onDelete(item)}>
          <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
          <Text style={s.btnText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EFE7E2', padding: 12, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 14, fontWeight: '800', color: '#2C1810' },
  total: { fontSize: 14, fontWeight: '800', color: '#C62828' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10.5, fontWeight: '800' },
  metaText: { fontSize: 11.5, color: '#8D7B70', flexShrink: 1 },
  qty: { fontSize: 13, fontWeight: '700', color: '#168653' },
  thumbs: { flexDirection: 'row', gap: 8 },
  thumb: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#EDE5E0', backgroundColor: '#F5EFEB' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F3ECE7', paddingTop: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 9 },
  btnLihat: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8CBC4' },
  btnEdit: { backgroundColor: '#2563EB' },
  btnDel: { backgroundColor: '#DC2626' },
  btnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
