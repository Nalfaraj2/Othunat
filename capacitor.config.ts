import type { CapacitorConfig } from '@capacitor/cli'

// appId is a placeholder reverse-domain identifier — replace it with your real one
// (matching your Apple/Google developer account) before the first store submission.
// Changing it later means re-adding both native platforms from scratch.
const config: CapacitorConfig = {
  appId: 'com.idhonat.app',
  appName: 'إذونات',
  webDir: 'dist',
  // Matches the app background so no white/black flash shows while the webview loads or bounces.
  backgroundColor: '#EEF1F6',
}

export default config
