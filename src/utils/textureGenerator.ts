
export function generateSumoTexture(color: string, isOpponent: boolean = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = 64; // Texture size
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  // Disable smoothing for pixel art look
  ctx.imageSmoothingEnabled = false;

  // Helper to draw a pixel rect
  const drawRect = (x: number, y: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  };

  // Flip for opponent
  if (isOpponent) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }

  // --- Body (Skin) ---
  const skinColor = '#ffccaa';
  // Head
  drawRect(24, 10, 16, 14, skinColor);
  // Torso
  drawRect(16, 24, 32, 24, skinColor);
  // Arms
  drawRect(8, 28, 8, 12, skinColor); // Left arm
  drawRect(48, 28, 8, 12, skinColor); // Right arm
  // Legs
  drawRect(18, 48, 10, 12, skinColor); // Left leg
  drawRect(36, 48, 10, 12, skinColor); // Right leg

  // --- Hair (Black) ---
  const hairColor = '#111111';
  drawRect(22, 6, 20, 8, hairColor); // Top hair
  drawRect(20, 10, 4, 8, hairColor); // Side hair L
  drawRect(40, 10, 4, 8, hairColor); // Side hair R
  drawRect(30, 2, 4, 4, hairColor);  // Mage (top knot)

  // --- Mawashi (Belt) ---
  // Use the provided color (team color) or default yellow
  const mawashiColor = color; 
  drawRect(16, 36, 32, 10, mawashiColor); // Main belt
  
  // Shide (White paper zigzags) - distinctive sumo feature
  const shideColor = '#ffffff';
  drawRect(20, 38, 4, 6, shideColor);
  drawRect(28, 38, 4, 6, shideColor);
  drawRect(36, 38, 4, 6, shideColor);
  drawRect(42, 38, 4, 6, shideColor);

  // --- Face ---
  // Eyes
  drawRect(28, 16, 2, 2, '#000000');
  drawRect(34, 16, 2, 2, '#000000');
  // Brows
  drawRect(27, 14, 4, 1, '#000000');
  drawRect(33, 14, 4, 1, '#000000');
  // Mouth (serious)
  drawRect(30, 20, 4, 1, '#aa5555');

  // Cheek blush (sweat?)
  drawRect(25, 18, 2, 1, '#ffaaaa');
  drawRect(37, 18, 2, 1, '#ffaaaa');

  return canvas;
}


