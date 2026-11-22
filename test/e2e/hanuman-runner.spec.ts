import { expect, test } from '@playwright/test';
import { Game } from '../../src/runner/engine';

const advance = (game: Game, seconds: number) => {
  for (let frame = 0; frame < Math.round(seconds * 120); frame++)
    game.step(1 / 120);
};

test('flight expires in the air and protects the descent', () => {
  const game = new Game();
  game.mode = 'running';
  game.collect({ kind: 'flying', x: 0, y: 0, taken: false });
  game.held = true;
  advance(game, 5);
  const peak = game.y;
  game.held = false;
  advance(game, 1.1);
  expect(game.y).toBeLessThan(peak);
  expect(game.safeLanding).toBe(true);
  expect(game.flight).toBe(0);
  advance(game, 2);
  expect(game.grounded).toBe(true);
  expect(game.hearts).toBe(3);
});

test('open the game from Games and resume a paused run', async ({ page }) => {
  await page.goto('/games');
  await page.getByRole('link', { name: 'Play Hanuman Runner' }).click();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start running' }).click();
  await page.keyboard.press('Space');
  await page.keyboard.press('p');
  await expect(
    page.getByRole('heading', { name: 'Game paused' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled();
});

test('coin values, multiplier, shield and magnet use game time', () => {
  const game = new Game();
  game.mode = 'running';
  const collect = (kind: Game['coins'][number]['kind']) =>
    game.collect({ kind, x: game.x, y: 0, taken: false });
  collect('basic');
  collect('golden');
  collect('star');
  expect(game.total).toBe(16);
  collect('glow');
  collect('star');
  expect(game.total).toBe(36);
  expect(game.double).toBe(8);
  collect('winged');
  const coin = { kind: 'basic' as const, x: game.x + 115, y: 35, taken: false };
  game.coins = [coin];
  advance(game, 0.3);
  expect(coin.taken).toBe(true);
  collect('shield');
  game.x = game.hazards[0].x;
  advance(game, 0.025);
  expect(game.shield).toBe(false);
  expect(game.hearts).toBe(3);
  expect(game.invulnerable).toBeGreaterThan(1.9);
  game.pause();
  const before = game.double;
  advance(game, 2);
  expect(game.double).toBe(before);
});

test('the default run cycles through every scene and ends on the last heart', () => {
  const game = new Game();
  game.mode = 'running';
  const seen = [game.scene];
  const encountered = new Set<string>();
  while (seen.length < 5 && game.time < 150 && game.mode === 'running') {
    for (const h of game.hazards)
      if (Math.abs(h.origin - game.x) < 2)
        encountered.add(h.alternateMace ? 'smallMace' : h.kind);
    const next = game.hazards.find(
      (h) => h.origin > game.x && h.kind !== 'mace',
    );
    if (next && next.origin - game.x < 102 && game.grounded) game.press();
    if (!game.flight) game.held = false;
    game.step(1 / 120);
    if (seen[seen.length - 1] !== game.scene) seen.push(game.scene);
  }
  expect([...encountered].sort()).toEqual(
    [
      'rock',
      'crate',
      'spikes',
      'sword',
      'wheel',
      'mace',
      'club',
      'log',
      'fence',
      'smallMace',
      'mediumSpikes',
      'rockCluster',
      'boulder',
    ].sort(),
  );
  expect(seen).toEqual([0, 1, 2, 0, 1]);
  expect(game.hearts).toBe(3);
  expect(game.hazards.length).toBeLessThan(25);
  advance(game, 90);
  expect(game.hearts).toBe(0);
  expect(game.mode).toBe('over');
});

test('runner audio loads all eight clips and schedules the temple greeting after its bell', async ({
  page,
}) => {
  const loaded = new Set<string>();
  page.on('response', (response) => {
    if (
      decodeURI(response.url()).includes('/Hanuman Run/SFX Sounds/') &&
      response.ok()
    )
      loaded.add(response.url());
  });
  await page.addInitScript(() => {
    const starts: number[] = [];
    Object.assign(window, { runnerAudioStarts: starts });
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when = 0, ...args) {
      starts.push(when);
      return original.call(this, when, ...args);
    };
  });
  await page.goto('/games/hanuman-runner');
  await page.getByRole('button', { name: 'Sound off', exact: true }).click();
  await expect.poll(() => loaded.size).toBe(8);
  await page.getByRole('button', { name: 'Start running' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const starts: number[] = Reflect.get(window, 'runnerAudioStarts');
        return starts.some(
          (t, i) => i > 0 && Math.abs(t - starts[i - 1] - 0.25) < 0.001,
        );
      }),
    )
    .toBe(true);
  await expect(page.locator('.run-counter')).toHaveText('1');
  await page.getByRole('button', { name: 'Sound on', exact: true }).click();
  const count = () =>
    page.evaluate(() => Reflect.get(window, 'runnerAudioStarts').length);
  const mutedCount = await count();
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  expect(await count()).toBe(mutedCount);
});
