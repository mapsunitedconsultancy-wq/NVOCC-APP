/**
 * Image processing utilities for client-side uploads and localStorage persistence.
 */

export const DEFAULT_CARRIER_SEAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" width="420" height="140">
  <rect width="100%" height="100%" fill="none"/>
  <g transform="translate(10, 10)">
    <!-- Circular Seal Emblem on the left -->
    <circle cx="60" cy="60" r="54" fill="none" stroke="%230F172A" stroke-width="2.5" stroke-dasharray="3,2"/>
    <circle cx="60" cy="60" r="49" fill="none" stroke="%230F172A" stroke-width="1.5"/>
    <circle cx="60" cy="60" r="34" fill="none" stroke="%230F172A" stroke-width="1"/>
    
    <!-- Outer Circular Text -->
    <path id="sealPath" fill="none" d="M 18,60 A 42,42 0 1,1 102,60 A 42,42 0 1,1 18,60" />
    <text font-size="7.5" font-weight="bold" font-family="Arial, sans-serif" fill="%230F172A" letter-spacing="1">
      <textPath href="%23sealPath" startOffset="50%" text-anchor="middle">
        ★ MAPS FREIGHT SOLUTIONS PVT LTD ★
      </textPath>
    </text>

    <!-- Center Icon: Anchor & Ship Wheel -->
    <g transform="translate(60,60) scale(0.95)">
      <circle cx="0" cy="0" r="6" fill="%230F172A"/>
      <path d="M 0,-14 L 0,14 M -12,2 C -10,12 10,12 12,2 M -6,-8 L 6,-8" stroke="%230F172A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <text x="0" y="24" font-size="6" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="%230F172A">
        ESTD 2024
      </text>
    </g>

    <!-- Right Side: Official Carrier Stamp Details -->
    <g transform="translate(130, 16)">
      <text x="0" y="16" font-size="13" font-weight="900" font-family="Arial, sans-serif" fill="%230F172A" letter-spacing="0.5">
        MAPS FREIGHT SOLUTIONS PVT. LTD.
      </text>
      <text x="0" y="32" font-size="8.5" font-weight="bold" font-family="Arial, sans-serif" fill="%231E293B" letter-spacing="0.8">
        ★ OFFICIAL CARRIER &amp; NVOCC OPERATIONS DESK ★
      </text>
      
      <line x1="0" y1="39" x2="265" y2="39" stroke="%230F172A" stroke-width="1.2"/>
      <line x1="0" y1="41.5" x2="265" y2="41.5" stroke="%230F172A" stroke-width="0.5"/>

      <text x="0" y="54" font-size="7.5" font-weight="bold" font-family="Courier, monospace" fill="%23334155">
        REG NO: MTO/DGS/2026/0912  •  FMC ORG: 028491
      </text>
      <text x="0" y="66" font-size="7.5" font-family="Arial, sans-serif" fill="%23334155">
        SEAL CODE: MUN-SEAL-7712  •  PORT OF GANDHIDHAM
      </text>
      <text x="0" y="78" font-size="7" font-weight="bold" font-family="Arial, sans-serif" fill="%23475569">
        COMBINED TRANSPORT ISSUING OFFICE — GANDHIDHAM / MUNDRA
      </text>

      <rect x="0" y="85" width="265" height="18" fill="none" stroke="%230F172A" stroke-width="0.8"/>
      <text x="132" y="97" font-size="7" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="%230F172A" letter-spacing="1">
        VERIFIED OFFICIAL ORIGINAL B/L STAMP
      </text>
    </g>
  </g>
</svg>`;

/**
 * Validates and converts an uploaded image to a data URL, automatically scaling large
 * images to prevent localStorage quota exhaustion.
 */
export async function processImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 600,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image format.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.onload = () => {
      const result = reader.result as string;

      // Keep SVGs or smaller files intact without canvas redraw
      if (file.type.includes('svg') || file.size < 400 * 1024) {
        resolve(result);
        return;
      }

      // Resize larger raster photos (PNG/JPEG)
      const img = new Image();
      img.onerror = () => resolve(result); // Fallback to raw data if image load fails
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
