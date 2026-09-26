import * as Network from 'expo-network';

/** Best-effort LAN IPv4 of this device (needed in PKG URLs for the console). */
export async function getLanIp(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    if (!ip || ip === '0.0.0.0') return null;
    if (ip.startsWith('169.254.')) return null;
    if (ip === '127.0.0.1') return null;
    return ip;
  } catch {
    return null;
  }
}
