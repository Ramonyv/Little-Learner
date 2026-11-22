import { temple } from './engine';
import type { Game } from './engine';
const env = 'Environment (Background : Decorative)',
  props = 'Props : Interactive Objects',
  traps = 'Hazards : Traps (Obstacles)',
  hero = 'Hanuman Ji - 5 Movement Steps',
  enemy = 'Raksahs Enemy - 5 Movement : Action Varinants',
  coins = 'Collectibles : Coins (Pickups)';
const groups: [string, string[]][] = [
  [
    env,
    [
      'Cloud-Large',
      'Cloud-Small',
      'Pillar_Vine',
      'Rock_Large',
      'Tree_Small',
      'Plant_Small',
      'Vector 610',
      'Vector 611',
      'Vector 612',
      'Vector 613',
      'Mountain-Waterfall',
      'Floating_Platform',
      'Tree_Large',
      'Plant_Large',
      'Spikes Small',
    ],
  ],
  [
    props,
    [
      'Temple-Small',
      'Bush_Small-Alt',
      'Log Rolling',
      'Rocke Cluster 2',
      'Spked Medium',
      'Stake-Fence',
      'Bush_Small',
      'Rocke Cluster 1',
      'Crate',
      'Wooden Platform',
    ],
  ],
  [
    traps,
    ['Hanging Spiked Ball', 'Spiked Wheel', 'Hazard_HangingSpikedBall_Large'],
  ],
  [
    hero,
    [
      '01 Idle-Neautral',
      '02 Idle-Neautral',
      '03 Run-Contact',
      '04 Run-Push',
      '05 Run-Air',
      '06 Run-Air',
      '07 Lift Off',
      '08 FLy GLide',
    ],
  ],
  [
    enemy,
    [
      '01 Idle-Neautral',
      '02 Run Contact',
      '03 Run Passing',
      '04 Attack- Sword',
      '05 Attack- Club',
    ],
  ],
  [
    coins,
    [
      'Coin_Basic',
      'Coin_Golden',
      'Coin_Glow',
      'Coin_Star',
      'Coin_Shield',
      'Coin_Winged',
      'Coin_Flying (Fly_Powerup)',
    ],
  ],
  [
    'Terrain : Ground Tiles (Level Building)',
    ['Ground_Tile_Long', 'Ground_Tile_Medium', 'Ground_Tile_Single'],
  ],
];
export async function loadArt() {
  const atlas: Record<string, HTMLImageElement | HTMLCanvasElement> = {};
  await Promise.all(
    groups.flatMap(([group, files]) =>
      files.map(async (name) => {
        const img = new Image();
        img.src = '/Hanuman Run/' + group + '/' + name + '.svg';
        await img.decode();
        let art: HTMLImageElement | HTMLCanvasElement = img;
        // Character exports have generous transparent margins. Align visible feet to the collision surface.
        if (group === hero || group === enemy) {
          const raster = document.createElement('canvas');
          raster.width = img.width * 2;
          raster.height = img.height * 2;
          const paint = raster.getContext('2d')!;
          paint.drawImage(img, 0, 0, raster.width, raster.height);
          const pixels = paint.getImageData(
            0,
            0,
            raster.width,
            raster.height,
          ).data;
          let top = raster.height,
            bottom = 0,
            left = raster.width,
            right = 0;
          for (let y = 0; y < raster.height; y++)
            for (let x = 0; x < raster.width; x++)
              if (pixels[(y * raster.width + x) * 4 + 3] > 12) {
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
                left = Math.min(left, x);
                right = Math.max(right, x);
              }
          if (right > left && bottom > top) {
            const crop = document.createElement('canvas');
            crop.width = right - left + 1;
            crop.height = bottom - top + 1;
            crop
              .getContext('2d')!
              .drawImage(
                raster,
                left,
                top,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height,
              );
            art = crop;
          }
        }
        atlas[group === enemy ? 'enemy' + name : name] = art;
      }),
    ),
  );
  return atlas;
}
export function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  g: Game,
  atlas: Awaited<ReturnType<typeof loadArt>>,
  low: boolean,
) {
  const floor = h - 65,
    player = Math.min(130, w * 0.2),
    left = g.x - player;
  function sprite(
    key: string,
    x: number,
    bottom: number,
    height: number,
    rotation = 0,
  ) {
    const img = atlas[key],
      width = (height * img.width) / img.height;
    if (x + width < w * -0.01 || x - width > w) return;
    ctx.save();
    ctx.translate(x, bottom - height / 2);
    ctx.rotate(rotation);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
  function repeat(
    key: string,
    rate: number,
    spacing: number,
    offset: number,
    size: number,
  ) {
    let x = offset - ((g.x * rate) % spacing);
    while (x > -spacing) x -= spacing;
    for (; x < w + spacing; x += spacing) sprite(key, x, floor + 4, size);
  }
  ctx.fillStyle = '#8fd8fa';
  ctx.fillRect(0, 0, w, h);
  const cloudGap = g.scene === 2 ? 175 : 270;
  for (
    let x = 90 - ((g.x * 0.12) % cloudGap), i = 0;
    x < w + 70;
    x += cloudGap, i++
  ) {
    sprite('Cloud-Large', x, 65 + (i % 2) * 34, 22);
    if (!low) sprite('Cloud-Small', x + 94, h * 0.46 + (i % 2) * 25, 15);
  }
  const mountainHeight = [96, 155, 65][g.scene];
  const mountainGap = [690, 540, 720][g.scene];
  for (
    let x = 370 - ((g.x * 0.17) % mountainGap) - mountainGap;
    x < w + mountainGap;
    x += mountainGap
  ) {
    sprite('Mountain-Waterfall', x, floor + 4, mountainHeight);
    if (g.scene === 1 && !low) {
      const unit = mountainHeight / 115,
        left = x - (339 * unit) / 2;
      ctx.save();
      ctx.translate(left, floor + 4 - mountainHeight);
      ctx.scale(unit, unit);
      ctx.strokeStyle = '#c0f3ff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.65;
      for (let i = 0; i < 3; i++) {
        const y = 46 + ((g.time * 28 + i * 15) % 42),
          sx = 141 + i * 5 - (y - 46) * 0.11;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx - 1, y + 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (g.scene === 0)
    repeat('Temple-Small', temple.rate, temple.spacing, temple.offset, 104);
  if (g.scene !== 2)
    repeat('Tree_Large', 0.49, 570, 35, g.scene === 1 ? 90 : 76);
  repeat('Bush_Small', 0.66, g.scene === 2 ? 260 : 138, 60, 24);
  repeat('Pillar_Vine', 0.44, 950, 510, 82);
  repeat('Tree_Small', 0.49, 620, 318, 46);
  repeat('Bush_Small-Alt', 0.66, 410, 215, 22);
  repeat(g.scene === 1 ? 'Plant_Large' : 'Plant_Small', 0.72, 320, 160, 26);
  const tileName = [
    'Ground_Tile_Long',
    'Ground_Tile_Medium',
    'Ground_Tile_Single',
  ][g.scene];
  const tile = atlas[tileName],
    tileWidth = (66 * tile.width) / tile.height;
  const stride = tileWidth - 1;
  for (let x = -(left % stride) - stride; x < w; x += stride)
    sprite(tileName, x + tileWidth / 2, floor + 65, 66);
  for (const p of g.platforms) {
    const key = p.wooden ? 'Wooden Platform' : 'Floating_Platform';
    const height = (p.w * atlas[key].height) / atlas[key].width;
    sprite(key, p.x - left, floor - p.y + height, height);
  }
  for (const z of g.hazards) {
    const x = z.x - left,
      bottom = floor - z.y;
    if (z.kind === 'mace') {
      const mace = z.alternateMace
        ? atlas['Hanging Spiked Ball']
        : atlas.Hazard_HangingSpikedBall_Large;
      const headX = z.alternateMace ? 99.3135 : 83.2342;
      const headY = z.alternateMace ? 188.098 : 167.229;
      // Rotate around the head so its center follows the simulated pendulum exactly.
      ctx.save();
      ctx.translate(x, bottom - z.h / 2);
      ctx.rotate(-Math.sin(g.time * 2) * 0.47);
      ctx.scale(102 / headY, 102 / headY);
      ctx.drawImage(mace, -headX, -headY);
      ctx.restore();
      continue;
    }
    if (z.kind === 'sword' || z.kind === 'club') {
      const distance = z.x - g.x,
        key =
          distance > 215
            ? '01 Idle-Neautral'
            : distance > 76
              ? Math.floor(g.time * 6) % 2
                ? '02 Run Contact'
                : '03 Run Passing'
              : z.kind === 'sword'
                ? '04 Attack- Sword'
                : '05 Attack- Club';
      sprite('enemy' + key, x, bottom, z.h);
      continue;
    }
    sprite(
      {
        log: 'Log Rolling',
        fence: 'Stake-Fence',
        boulder: 'Rock_Large',
        rockCluster: 'Rocke Cluster 2',
        mediumSpikes: 'Spked Medium',
        rock: 'Rocke Cluster 1',
        crate: 'Crate',
        spikes: 'Spikes Small',
        wheel: 'Spiked Wheel',
      }[z.kind],
      x,
      bottom,
      z.h,
      z.kind === 'wheel'
        ? g.time * 3
        : z.kind === 'log'
          ? Math.sin(g.time * 3) * 0.06
          : 0,
    );
  }
  for (const c of g.coins)
    if (!c.taken) {
      const key =
        c.kind === 'flying'
          ? 'Flying (Fly_Powerup)'
          : c.kind[0].toUpperCase() + c.kind.slice(1);
      sprite(
        'Coin_' + key,
        c.x - left,
        floor - c.y + 13 + Math.sin(g.time * 4 + c.x) * 2,
        26,
      );
    }
  const frames = groups[3][1];
  const pose = g.flight
    ? 7
    : g.y > 0 && !g.grounded
      ? 6
      : g.land
        ? 2
        : g.mode === 'ready'
          ? 0
          : 2 + (Math.floor(g.time * 10) % 4);
  ctx.globalAlpha = g.invulnerable && Math.floor(g.time * 10) % 2 ? 0.55 : 1;
  sprite(frames[pose], player, floor - g.y, 68);
  ctx.globalAlpha = 1;
  if (g.land && !low) {
    ctx.globalAlpha = Math.min(1, g.land / 0.08);
    for (let i = 0; i < 4; i++)
      sprite(
        'Vector ' + (610 + i),
        player - 14 - i * 4,
        floor - g.y - 2,
        5 + i,
      );
    ctx.globalAlpha = 1;
  }
  for (const p of g.particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - left, floor - p.y, low ? 2 : 3, 3);
  }
}
