"use client";

import { useEffect } from 'react';
import api from '@/services/api';

export default function ThemeApplier() {
  useEffect(() => {
    const apply = async () => {
      try {
        const { data } = await api.get('/settings');
        const root = document.documentElement;
        const color = data?.themePrimaryColor || '';
        const footer = data?.footerColor || '';
        if (color) {
          // Apply to Bootstrap primary and a custom var
          root.style.setProperty('--bs-primary', color);
          root.style.setProperty('--brand-primary', color);
          // Also set RGB components used by Bootstrap's alpha utilities
          const hex = String(color).trim();
          const rgb = hexToRgbComponents(hex);
          if (rgb) {
            root.style.setProperty('--bs-primary-rgb', rgb);
            root.style.setProperty('--brand-primary-rgb', rgb);
          }
        }
        // Apply footer color as an independent var used by FooterBar
        if (footer) {
          root.style.setProperty('--footer-bg', footer);
          // compute a readable foreground and expose it
          const rgbF = hexToRgbComponents(String(footer).trim());
          let fg = '#ffffff';
          if (rgbF) {
            const [r,g,b] = rgbF.split(',').map(n => parseInt(n,10));
            const lum = relativeLuminance(r,g,b);
            fg = lum > 0.5 ? '#000000' : '#ffffff';
          }
          root.style.setProperty('--footer-foreground', fg);
        }
      } catch {
        // ignore
      }
    };
    void apply();
  }, []);
  return null;
}

function hexToRgbComponents(input: string): string | null {
  // Accept formats: #rrggbb, rrggbb, #rgb, rgb
  let hex = input.trim();
  if (hex.startsWith('rgb')) {
    // rgb(12,34,56) -> "12,34,56"
    const m = hex.match(/\(([^)]+)\)/);
    if (m && m[1]) return m[1].split(/\s*,\s*/).slice(0,3).join(',');
    return null;
  }
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0,2), 16);
  const g = parseInt(hex.slice(2,4), 16);
  const b = parseInt(hex.slice(4,6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r},${g},${b}`;
}

function relativeLuminance(r: number, g: number, b: number) {
  const srgb = [r, g, b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
