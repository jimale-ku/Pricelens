/**
 * Local store logos from assets/attachments. Only these stores are shown in compare (see server allowlist).
 * Add new stores here and in server ALLOWED_STORES when you add assets.
 */

import { getStoreLogoUrl } from './storeLogos';

// Static require() for each asset – paths match assets/attachments/ (fixed naming)
const ASSETS = {
  Amazon: require('../assets/attachments/amazon.png'),
  Walmart: require('../assets/attachments/walmart.png'),
  Target: require('../assets/attachments/target.png'),
  'Best Buy': require('../assets/attachments/BestBuy.jpg'),
  Costco: require('../assets/attachments/Costoco.jpg'),
  eBay: require('../assets/attachments/ebbay.png'),
  Newegg: require('../assets/attachments/newegg.jpg'),
  'B&H Photo': require('../assets/attachments/BH.png'),
  Adorama: require('../assets/attachments/adorama.jpg'),
  'Ant Online': require('../assets/attachments/antonline.png'),
  Woot: require('../assets/attachments/woot.png'),
  'Back Market': require('../assets/attachments/backmarket.png'),
  Lenovo: require('../assets/attachments/lenovo.png'),
  Dell: require('../assets/attachments/dell.png'),
  HP: require('../assets/attachments/hp.png'),
  'Micro Center': require('../assets/attachments/microcenter.png'),
  GameStop: require('../assets/attachments/gamestop.png'),
  QVC: require('../assets/attachments/QVC.png'),
  HSN: require('../assets/attachments/HSN.jpg'),
  'Focus Camera': require('../assets/attachments/focusCamera.png'),
  Staples: require('../assets/attachments/staples.png'),
} as const;

export type StoreLogoSource = number | string;

/** Store names that have local logos – only these stores are shown in compare (backend filters to this list). */
export const ALLOWED_STORE_NAMES = Object.keys(ASSETS) as string[];

function getMainStoreName(storeName: string): string {
  const s = (storeName || '').trim();
  const main = s.split(/\s*[-–|]\s*/)[0].trim();
  return main || s;
}

/** Normalize for matching: lowercase, no spaces/special chars (e.g. "Ant Online" -> "antonline"). */
function normalizeForMatch(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Returns local asset (number) for Image source, or URL string. Use in Image: source={typeof r === 'number' ? r : { uri: r }}. */
export function getStoreLogoSource(storeName: string, backendLogo?: string | null): StoreLogoSource {
  const name = (storeName || '').trim();
  const main = getMainStoreName(name);
  const nameNorm = normalizeForMatch(name);
  const mainNorm = normalizeForMatch(main);
  const key = Object.keys(ASSETS).find(
    (k) =>
      k === name ||
      k === main ||
      name.toLowerCase() === k.toLowerCase() ||
      main.toLowerCase() === k.toLowerCase() ||
      mainNorm === normalizeForMatch(k) ||
      nameNorm === normalizeForMatch(k) ||
      (main === 'B&H' && k === 'B&H Photo') ||
      (name === 'B&H' && k === 'B&H Photo') ||
      (mainNorm === 'bh' && k === 'B&H Photo')
  );
  if (key && ASSETS[key as keyof typeof ASSETS]) {
    return ASSETS[key as keyof typeof ASSETS];
  }
  return getStoreLogoUrl(storeName, backendLogo);
}
