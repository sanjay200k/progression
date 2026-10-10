/* Native shell hooks (Capacitor). No-op in a normal browser. */
const cap = window.Capacitor;
if (cap?.isNativePlatform?.()) {
  const bar = cap.Plugins?.StatusBar;
  try { bar?.setStyle?.({ style: 'DARK' }); bar?.setBackgroundColor?.({ color: '#0a0f1d' }); } catch {}
}
