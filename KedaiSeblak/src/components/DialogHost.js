import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { pasangHost } from '../utils/dialog';

export default function DialogHost() {
  const [daftar, setDaftar] = useState([]);

  useEffect(() => pasangHost((item) => setDaftar((p) => [...p, item])), []);

  const aktif = daftar[0];
  if (!aktif) return null;

  const tutup = (btn) => {
    setDaftar((p) => p.slice(1));
    if (btn && btn.onPress) setTimeout(() => btn.onPress(), 0);
  };
  const batal = aktif.buttons.find((b) => b.style === 'cancel');

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => tutup(batal)}>
      <View style={s.overlay}>
        <View style={s.card}>
          {aktif.title ? <Text style={s.title}>{aktif.title}</Text> : null}
          {aktif.message ? <Text style={s.message}>{aktif.message}</Text> : null}
          <View style={[s.actions, aktif.buttons.length > 2 && { flexDirection: 'column' }]}>
            {aktif.buttons.map((b, i) => {
              const destruktif = b.style === 'destructive';
              const cancel = b.style === 'cancel';
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => tutup(b)}
                  style={[s.btn, cancel ? s.btnCancel : destruktif ? s.btnDanger : s.btnPrimary]}
                >
                  <Text style={[s.btnText, cancel && { color: '#52141D' }]}>{b.text || 'OK'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(30,12,10,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  title: { fontSize: 16, fontWeight: '800', color: '#2C1810', marginBottom: 8 },
  message: { fontSize: 13, color: '#6F5C53', lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18, justifyContent: 'flex-end' },
  btn: { minWidth: 96, height: 42, paddingHorizontal: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#C62828' },
  btnDanger: { backgroundColor: '#DC2626' },
  btnCancel: { backgroundColor: '#F4EFEB' },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
