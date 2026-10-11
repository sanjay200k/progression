/* Native shell hooks (Capacitor). No-op in a normal browser. */
const cap = window.Capacitor;

if (cap?.isNativePlatform?.()) {
  const plugins = cap.Plugins || {};

  // Status bar: dark theme, content below the bar.
  try {
    plugins.StatusBar?.setStyle?.({ style: 'DARK' });
    plugins.StatusBar?.setBackgroundColor?.({ color: '#0a0f1d' });
    plugins.StatusBar?.setOverlaysWebView?.({ overlay: false });
  } catch {}

  // Android back button: close dialog first, then navigate back, then exit.
  // Needs @capacitor/app (npm i @capacitor/app && npx cap sync android).
  try {
    plugins.App?.addListener?.('backButton', ({ canGoBack }) => {
      const dlg = document.getElementById('dlg');
      if (dlg?.open) { dlg.close(); return; }
      if (canGoBack || history.length > 1) { history.back(); return; }
      plugins.App.exitApp?.();
    });
  } catch {}
}
