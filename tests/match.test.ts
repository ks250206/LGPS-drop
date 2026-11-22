import { describe, it, expect } from "vite-plus/test";
import { reactWave, recipes, settle, overlaps, fits, H, type Kind } from "../src/game/chemistry";
import { act, block, command, newMatch, pause, tick, exchange } from "../src/game/match";
import { draw, children, shift, spawn, lock } from "../src/game/pieces";
import { cpuMoves } from "../src/game/cpu";
const atoms: Record<string, number[]> = {
  Li: [1, 0, 0, 0],
  Ge: [0, 1, 0, 0],
  P: [0, 0, 1, 0],
  S: [0, 0, 0, 1],
  Li2S: [2, 0, 0, 1],
  GeS2: [0, 1, 0, 2],
  P2S5: [0, 0, 2, 5],
  Li3PS4: [3, 0, 1, 4],
  Li4GeS4: [4, 1, 0, 4],
  LGPS: [10, 1, 2, 12],
};
describe("synthesis", () => {
  for (const r of recipes)
    it("conserves atoms and produces " + r.product, () => {
      const inputs = Object.entries(r.needs).flatMap(([k, n]) => Array<Kind>(n).fill(k as Kind));
      expect([0, 1, 2, 3].map((i) => inputs.reduce((s, k) => s + atoms[k][i], 0))).toEqual(
        atoms[r.product].map((n) => n * r.count),
      );
      let x = 0;
      const board = inputs.map((k, i) => {
        const w = k.length > 2 ? 2 : 1,
          h = k === "Li4GeS4" || k === "Li3PS4" ? 2 : 1;
        const b = block(i, k, x, H - h, w, h);
        x += w;
        return b;
      });
      const v = reactWave(board, 20);
      expect(v.events.map((e) => e.product)).toEqual([r.product]);
      expect(v.board.length).toBe(r.product === "LGPS" ? 0 : r.count);
      for (const b of v.board)
        expect(
          fits(
            b,
            v.board.filter((c) => c !== b),
          ),
        ).toBe(true);
    });
  it("keeps all four precursors when two squares cannot fit", () => {
    const base = ["Li2S", "Li2S", "Li2S", "P2S5"].map((k, i) => block(i, k as Kind, i * 2, 13, 2));
    const board = base.concat(Array.from({ length: 9 }, (_, x) => block(10 + x, "rock", x, 12)));
    const result = reactWave(board, 25);
    expect(result.blocked).toBe(true);
    expect(result.board).toEqual(board);
  });
  it("only consumes adjacent inputs, prioritises phosphorus and clears touching slag", () => {
    const v = reactWave(
      ["P", "P", "S", "S", "S", "S", "S", "Li", "Li"]
        .map((k, i) => block(i, k as Kind, i, 13))
        .concat(block(10, "rock", 2, 12)),
      20,
    );
    expect(v.events.map((e) => e.product)).toEqual(["P2S5"]);
    expect(v.board.some((b) => b.k === "rock")).toBe(false);
    expect(
      reactWave(
        [block(0, "Li", 0, 0), block(1, "P", 1, 0), block(2, "Li", 2, 0), block(3, "S", 3, 0)],
        4,
      ).events,
    ).toHaveLength(0);
  });
  it("counts simultaneous recipes as one wave", () => {
    const m = newMatch("solo", 1),
      f = m.player;
    f.board = [0, 1, 2, 5, 6, 7].map((x, i) => block(i, i % 3 === 2 ? "S" : "Li", x, 13));
    f.active = null;
    f.resolving = true;
    m.started = true;
    tick(m, 1);
    expect(f.wave).toHaveLength(2);
    expect(f.chain).toBe(1);
    expect(f.active).toBe(null);
  });
  it("completes the guided final cascade with normal controls", () => {
    const m = newMatch("practice", 1);
    act(m, "drop");
    const waves: string[] = [];
    for (let i = 0; i < 60 && !m.result; i++) {
      tick(m, 100);
      if (m.player.wave[0] && waves.at(-1) !== m.player.wave[0].product)
        waves.push(m.player.wave[0].product);
    }
    expect(waves).toEqual(["Li2S", "Li3PS4", "LGPS"]);
    expect(m.result).toBe("complete");
    expect(m.player.board).toHaveLength(0);
  });
});
describe("play and versus", () => {
  it("preserves the bag composition across pair boundaries", () => {
    const s = { rng: 17, queue: [] };
    const supply = Array.from({ length: 25 }, () => draw(s)).flat();
    for (const bag of [supply.slice(0, 25), supply.slice(25)])
      expect(["Li", "Ge", "P", "S"].map((k) => bag.filter((a) => a === k).length)).toEqual([
        10, 1, 2, 12,
      ]);
  });
  it("wall kicks, collision, split pair and rigid overhang", () => {
    const p = { ...spawn(["Li", "P"]), dir: 1, x: 0, y: 3 };
    const q = shift(p, [], "rotate")!;
    expect(q.x).toBe(1);
    expect(shift(q, [], "left")).toBeNull();
    const base = [block(0, "P", 1, 13), block(1, "GeS2", 1, 5, 2, 1)];
    settle(base);
    expect(base[1].y).toBe(12);
    const landed = lock(base, { ...p, dir: 0, x: 0 }, 4);
    expect(landed.slice(-2).map((b) => b.y)).toEqual([13, 11]);
  });
  it("banks precursors until enabled and limits hold per turn", () => {
    const m = newMatch("practice", 2);
    act(m, "bank");
    act(m, "drop");
    tick(m, 10);
    expect(m.player.chain).toBe(0);
    act(m, "bank");
    act(m, "hold");
    const held = m.player.held;
    act(m, "hold");
    expect(m.player.held).toBe(held);
  });
  it("freezes both fields while paused", () => {
    const m = newMatch("cpu", 9);
    act(m, "left");
    pause(m);
    const copy = structuredClone(m);
    tick(m, 5000);
    act(m, "drop");
    expect(m).toEqual(copy);
  });
  it("cancels incoming first and delivers only at a later lock boundary", () => {
    const m = newMatch("cpu", 8),
      a = m.player,
      b = m.cpu!;
    a.pending = 3;
    a.due = 3;
    exchange(a, b, 5);
    expect([a.pending, a.due, b.pending]).toEqual([0, 0, 2]);
    b.bank = true;
    command(b, "drop");
    m.started = true;
    tick(m, 1);
    expect(b.board.some((b) => b.k === "rock")).toBe(false);
    command(b, "drop");
    tick(m, 1);
    expect(b.board.filter((b) => b.k === "rock")).toHaveLength(2);
  });
  it("uses legal CPU moves, identical supply and reaches a real verdict", () => {
    const m = newMatch("cpu", 31),
      c = m.cpu!;
    expect(c.supply).toEqual(m.player.supply);
    expect(c.active).toEqual(m.player.active);
    for (const move of cpuMoves(c.board, c.active!, c.id)) {
      command(c, move);
      expect(children(c.active!).every((b) => fits(b, c.board))).toBe(true);
    }
    act(m, "left");
    for (let i = 0; i < 4000 && !m.result; i++) {
      tick(m, 100);
      for (const b of c.board) expect(c.board.some((v) => v !== b && overlaps(v, b))).toBe(false);
    }
    expect(m.result).toMatch(/win|lose|draw/);
    expect(c.score).toBeGreaterThan(0);
    expect(c.sent).toBeGreaterThan(0);
  });
});

it("reserves a blocked double-output recipe from lower-priority reactions", () => {
  const base = ["Li2S", "Li2S", "Li2S", "P2S5"].map((k, i) => block(i, k as Kind, i * 2, 13, 2));
  const board = [
    ...base,
    block(4, "GeS2", 0, 12, 2),
    ...Array.from({ length: 7 }, (_, i) => block(5 + i, "rock", 2 + i, 12)),
  ];
  const wave = reactWave(board, 20);
  expect(wave.blocked).toBe(true);
  expect(wave.board).toEqual(board);
});
it("cancels the oldest warning before a newer warning matures", () => {
  const m = newMatch("cpu", 4),
    p = m.player;
  p.active = null;
  p.pending = 5;
  p.due = 2;
  p.attack = 2;
  p.resolving = true;
  p.bank = true;
  m.started = true;
  tick(m, 1);
  expect(p.pending).toBe(3);
  expect(p.due).toBe(3);
  expect(p.board.some((b) => b.k === "rock")).toBe(false);
});
it("applies gravity to both active pairs and replans from the lower row", () => {
  const m = newMatch("cpu", 2);
  m.started = true;
  const c = m.cpu!;
  m.cpuPlan = ["right", "right"];
  m.cpuElapsed = m.elapsed = 900;
  tick(m, 50);
  expect(c.active?.y).toBe(m.player.active?.y);
  expect(c.active?.y).toBe(1);
  expect(m.cpuPlan).toBe(null);
});
it("reaches phosphorus sulfide and LGPS using the regular solo bag and legal moves", () => {
  const m = newMatch("solo", 1),
    made = new Set<string>();
  for (let i = 0; i < 80 && !m.result && !m.player.cleared; i++) {
    const f = m.player;
    for (const move of cpuMoves(f.board, f.active!, f.id)) act(m, move);
    act(m, "drop");
    while (f.resolving) {
      tick(m, 50);
      for (const r of f.wave) made.add(r.product);
    }
  }
  expect(made.has("P2S5")).toBe(true);
  expect(m.player.cleared).toBeGreaterThan(0);
});

it("resolves simultaneous blocked entrances consistently", () => {
  for (const [playerBlocked, cpuBlocked, verdict] of [
    [false, true, "win"],
    [true, false, "lose"],
    [true, true, "draw"],
  ] as const) {
    const m = newMatch("cpu", 19);
    m.started = true;
    for (const [f, blocked] of [
      [m.player, playerBlocked],
      [m.cpu!, cpuBlocked],
    ] as const) {
      f.active = null;
      f.resolving = true;
      f.bank = true;
      f.board = blocked ? Array.from({ length: H }, (_, y) => block(40 + y, "rock", 3, y)) : [];
    }
    tick(m, 50);
    expect(m.result).toBe(verdict);
  }
});
