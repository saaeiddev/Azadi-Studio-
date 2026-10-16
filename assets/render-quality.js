import * as THREE from 'three';

// Small, repeatable data maps: no downloads, baked lighting, or palette changes.
// A separate seed leaves the existing room, skyline and plants unchanged.
function dataTexture(sample, repeatX = 1, repeatY = 1) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = Math.round(THREE.MathUtils.clamp(sample(x, y, size), 0, 1) * 255);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function noise(x, y) {
  let n = Math.imul(x + 17, 374761393) ^ Math.imul(y + 41, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function createSurfaceDetails(maxAnisotropy = 8) {
  const tau = Math.PI * 2;
  const brush = (x, y, size) => .52 + .21 * Math.sin(y / size * tau * 89)
    + .08 * Math.sin(y / size * tau * 31 + .14 * Math.sin(x / size * tau))
    + .07 * (noise(x, y) - .5);
  const grain = (x, y, size) => {
    const u = x / size * 16, v = y / size * 16;
    let distance = 2;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = Math.floor(u) + dx, gy = Math.floor(v) + dy;
        const wx = (gx + 16) % 16, wy = (gy + 16) % 16;
        const px = gx + .2 + noise(wx, wy) * .6;
        const py = gy + .2 + noise(wy + 32, wx) * .6;
        distance = Math.min(distance, Math.hypot(u - px, v - py));
      }
    }
    return .3 + .6 * Math.exp(-distance * distance * 4);
  };
  const wood = (x, y, size) => .5 + .19 * Math.sin(y / size * tau * 52
    + .9 * Math.sin(x / size * tau * 2)) + .07 * Math.sin(y / size * tau * 107);
  const maps = {
    metalBump: dataTexture(brush, 3, 3),
    metalRoughness: dataTexture((x, y, s) => .8 + .2 * brush(x, y, s), 3, 3),
    leatherBump: dataTexture(grain, 8, 4),
    leatherRoughness: dataTexture((x, y, s) => .84 + .16 * grain(x, y, s), 8, 4),
    woodBump: dataTexture(wood, 3, 2),
    woodRoughness: dataTexture((x, y, s) => .88 + .12 * wood(x, y, s), 3, 2),
    polymerBump: dataTexture((x, y) => .43 + .14 * noise(x, y), 4, 4),
  };
  for (const texture of Object.values(maps)) texture.anisotropy = Math.min(8, maxAnisotropy);
  return maps;
}

// Sharper high-DPI rendering with a bounded fill-rate on large / mobile displays.
export function studioPixelRatio(width, height, deviceRatio, small) {
  const cap = small ? 2 : 2.25;
  const pixelBudget = small ? 1800000 : 4000000;
  const area = Math.max(1, width * height);
  return Math.max(1, Math.min(deviceRatio || 1, cap, Math.sqrt(pixelBudget / area)));
}

// Zero velocity and acceleration at each end of the existing camera move.
export function cameraEase(progress) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
