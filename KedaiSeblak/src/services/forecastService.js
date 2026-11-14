import { supabase } from '../../lib/supabase';

// Prediksi omzet harian 7 hari ke depan dari riwayat transaksi Lunas di Supabase.
// Metode: regresi linear (tren) x faktor musiman hari-dalam-minggu. Bila data < 14 hari,
// fallback ke rata-rata bergerak 7 hari. Akurasi diukur lewat backtest (MAPE) 7 hari terakhir.
// Antarmuka predictSales() sengaja dipisah supaya model TFLite bisa menggantikan isinya
// (butuh development build; tidak berjalan di Expo Go/web).
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export async function fetchDailySales(days = 90, endDate = new Date()) {
  const since = key(addDays(endDate, -days));
  const rows = [];
  for (let start = 0; start < 20000; start += 500) {
    const { data, error } = await supabase.from('transaksi').select('total, created_at')
      .eq('status', 'Lunas').gte('created_at', `${since}T00:00:00+07:00`)
      .order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(start, start + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  const map = {};
  rows.forEach((r) => {
    const d = new Date(r.created_at);
    const k = key(d);
    map[k] = (map[k] || 0) + Number(r.total || 0);
  });
  return Object.keys(map).sort().map((tanggal) => ({ tanggal, omzet: map[tanggal] }));
}

// series: [{ tanggal:'YYYY-MM-DD', omzet }] (hari kosong dianggap 0 di dalam rentang)
export function predictSales(series, horizon = 7) {
  if (!series.length) return { metode: 'none', prediksi: [], mape: null, keyakinan: 'rendah' };
  const first = new Date(`${series[0].tanggal}T00:00:00`);
  const last = new Date(`${series[series.length - 1].tanggal}T00:00:00`);
  const lookup = Object.fromEntries(series.map((s) => [s.tanggal, s.omzet]));
  const full = [];
  for (let d = new Date(first); d <= last; d = addDays(d, 1)) full.push({ d: new Date(d), y: lookup[key(d)] || 0 });

  const model = (train) => {
    if (train.length < 14) {
      const tail = train.slice(-7);
      const avg = tail.reduce((s, x) => s + x.y, 0) / Math.max(tail.length, 1);
      return { metode: 'rata-rata 7 hari', f: () => avg };
    }
    const n = train.length;
    const xs = train.map((_, i) => i);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = train.reduce((s, t) => s + t.y, 0) / n;
    let num = 0; let den = 0;
    xs.forEach((x, i) => { num += (x - mx) * (train[i].y - my); den += (x - mx) ** 2; });
    const slope = den ? num / den : 0;
    const icpt = my - slope * mx;
    const ratio = Array(7).fill(0); const cnt = Array(7).fill(0);
    train.forEach((t, i) => { const base = icpt + slope * i; if (base > 0) { ratio[t.d.getDay()] += t.y / base; cnt[t.d.getDay()] += 1; } });
    const faktor = ratio.map((r, i) => (cnt[i] ? r / cnt[i] : 1));
    return { metode: 'regresi linear + musiman mingguan', f: (i, d) => Math.max(0, (icpt + slope * i) * faktor[d.getDay()]) };
  };

  // backtest: latih tanpa 7 hari terakhir, bandingkan
  let mape = null;
  if (full.length >= 21) {
    const train = full.slice(0, -7); const test = full.slice(-7);
    const m = model(train);
    const errs = test.filter((t) => t.y > 0).map((t, _i) => {
      const idx = train.length + test.indexOf(t);
      return Math.abs(t.y - m.f(idx, t.d)) / t.y;
    });
    if (errs.length) mape = (errs.reduce((a, b) => a + b, 0) / errs.length) * 100;
  }
  const m = model(full);
  const prediksi = Array.from({ length: horizon }, (_, k) => {
    const d = addDays(last, k + 1);
    const nilai = Math.round(m.f(full.length + k, d) / 1000) * 1000;
    return { tanggal: key(d), hari: d.toLocaleDateString('id-ID', { weekday: 'short' }), prediksi: nilai };
  });
  const keyakinan = mape == null ? 'rendah' : mape < 15 ? 'tinggi' : mape < 30 ? 'sedang' : 'rendah';
  return { metode: m.metode, prediksi, mape, keyakinan, jumlahHari: full.length };
}

export async function getSalesForecast(horizon = 7) {
  const series = await fetchDailySales(90);
  return predictSales(series, horizon);
}
