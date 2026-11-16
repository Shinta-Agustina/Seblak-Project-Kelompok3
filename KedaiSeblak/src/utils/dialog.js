// Pengganti Alert.alert yang tampil di web maupun HP (modal di dalam aplikasi).
// API sama dengan Alert.alert(title, message, buttons). Host-nya dipasang di KasirProvider.
let listener = null;
const antrean = [];

export const Alert = {
  alert(title, message, buttons) {
    const item = { title, message, buttons: Array.isArray(buttons) && buttons.length ? buttons : [{ text: 'OK' }] };
    if (listener) listener(item);
    else antrean.push(item);
  },
};

export function pasangHost(fn) {
  listener = fn;
  while (antrean.length && listener) listener(antrean.shift());
  return () => { if (listener === fn) listener = null; };
}
