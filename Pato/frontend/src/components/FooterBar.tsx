import React from 'react';

// Server component FooterBar: fetches settings on the server so footer is present on initial render
export default async function FooterBar() {
  // Determine backend API base
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api';
  try {
    const res = await fetch(`${base}/settings`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const footerText = data?.footerText || '';
    const footerColor = data?.footerColor || '';
    if (!footerText) return null;

    const fg = computeReadableForeground(footerColor);
    
    // Generate unique id for this footer instance
    const footerId = 'footer-custom-' + Math.random().toString(36).substr(2, 9);
    
    // Create CSS rule for dynamic colors without inline styles
    let cssRule = '';
    if (footerColor || fg) {
      cssRule = `#${footerId} { `;
      if (footerColor) cssRule += `background-color: ${footerColor}; `;
      if (fg) cssRule += `color: ${fg}; `;
      cssRule += '}';
    }

    return (
      <>
        {cssRule && <style dangerouslySetInnerHTML={{ __html: cssRule }} />}
        <footer id={footerId} className="footer-custom">
          {footerText}
        </footer>
      </>
    );
  } catch {
    // Fail gracefully
    return null;
  }
}

function computeReadableForeground(color: string): string | null {
  if (!color) return null;
  // Accept rgb(...) or hex
  const s = String(color).trim();
  let r:number, g:number, b:number;
  if (/^rgb/i.test(s)) {
    const m = s.match(/\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10));
    if (parts.length < 3) return null;
    [r,g,b] = parts.slice(0,3) as number[];
  } else {
    let hex = s.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    if (hex.length !== 6) return null;
    r = parseInt(hex.slice(0,2),16);
    g = parseInt(hex.slice(2,4),16);
    b = parseInt(hex.slice(4,6),16);
  }
  const lum = relativeLuminance(r,g,b);
  return lum > 0.5 ? '#000000' : '#ffffff';
}

function relativeLuminance(r:number,g:number,b:number){
  const srgb = [r,g,b].map(v=>v/255).map(v=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}
