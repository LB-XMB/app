/**
 * Quiet PKG diagnostics — logcat only (`adb logcat | grep '\[pkg\]'`), no in-app UI.
 */
export function pkgDebug(message: string): void {
  if (__DEV__) {
    console.log(`[pkg] ${message}`);
  }
}
