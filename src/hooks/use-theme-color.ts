import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

// Predefined theme color options with HSL values
export const THEME_COLORS = [
  { name: 'Oranye (Bara)', hue: '25', saturation: '95%', lightness: '53%' },
  { name: 'Biru Indigo', hue: '226', saturation: '70%', lightness: '55%' },
  { name: 'Biru Ocean', hue: '200', saturation: '95%', lightness: '48%' },
  { name: 'Hijau Emerald', hue: '150', saturation: '84%', lightness: '38%' },
  { name: 'Hijau Mint', hue: '162', saturation: '60%', lightness: '45%' },
  { name: 'Ungu Amethyst', hue: '270', saturation: '70%', lightness: '55%' },
  { name: 'Merah Crimson', hue: '346', saturation: '84%', lightness: '50%' },
  { name: 'Pink Rose', hue: '325', saturation: '75%', lightness: '60%' },
  { name: 'Teal Cyan', hue: '180', saturation: '75%', lightness: '40%' },
  { name: 'Kuning Amber', hue: '38', saturation: '95%', lightness: '50%' },
  { name: 'Coffee Brown', hue: '28', saturation: '45%', lightness: '45%' },
  { name: 'Sleek Slate', hue: '215', saturation: '20%', lightness: '45%' },
] as const;

export function getThemeHSL(hue: string) {
  const preset = THEME_COLORS.find(c => c.hue === hue);
  if (preset) return `${preset.hue} ${preset.saturation} ${preset.lightness}`;
  return `${hue} 95% 53%`;
}

export function applyThemeColor(hue: string) {
  const hsl = getThemeHSL(hue);
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--ring', hsl);
  // Update meta theme-color for PWA
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', `hsl(${hsl})`);
}

export function useThemeColor() {
  const storeSettings = useLiveQuery(() => db.storeSettings.toCollection().first());

  useEffect(() => {
    if (storeSettings?.themeColor) {
      applyThemeColor(storeSettings.themeColor);
    }
  }, [storeSettings?.themeColor]);

  return storeSettings?.themeColor ?? '25';
}

export async function setThemeColor(hue: string) {
  const settings = await db.storeSettings.toCollection().first();
  if (settings?.id) {
    await db.storeSettings.update(settings.id, { themeColor: hue });
  }
  applyThemeColor(hue);
}
