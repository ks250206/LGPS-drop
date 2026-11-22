export const W = 9,
  H = 14;
export type Element = "Li" | "Ge" | "P" | "S";
export type Kind = Element | "Li2S" | "GeS2" | "P2S5" | "Li4GeS4" | "Li3PS4" | "rock";
export type Product = Kind | "LGPS";
export interface Block {
  id: number;
  k: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Recipe {
  product: Product;
  needs: Partial<Record<Kind, number>>;
  count: number;
  points: number;
}
export const formulas: Record<Product, string> = {
  Li: "Li",
  Ge: "Ge",
  P: "P",
  S: "S",
  Li2S: "Li₂S",
  GeS2: "GeS₂",
  P2S5: "P₂S₅",
  Li4GeS4: "Li₄GeS₄",
  Li3PS4: "Li₃PS₄",
  LGPS: "Li₁₀GeP₂S₁₂",
  rock: "×",
};
export const recipes: Recipe[] = [
  { product: "LGPS", needs: { Li4GeS4: 1, Li3PS4: 2 }, count: 1, points: 2500 },
  { product: "Li3PS4", needs: { Li2S: 3, P2S5: 1 }, count: 2, points: 360 },
  { product: "Li4GeS4", needs: { Li2S: 2, GeS2: 1 }, count: 1, points: 240 },
  { product: "P2S5", needs: { P: 2, S: 5 }, count: 1, points: 150 },
  { product: "GeS2", needs: { Ge: 1, S: 2 }, count: 1, points: 90 },
  { product: "Li2S", needs: { Li: 2, S: 1 }, count: 1, points: 60 },
];
export function overlaps(a: Block, b: Block) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
export function touches(a: Block, b: Block) {
  return (
    ((a.x + a.w === b.x || b.x + b.w === a.x) && a.y < b.y + b.h && b.y < a.y + a.h) ||
    ((a.y + a.h === b.y || b.y + b.h === a.y) && a.x < b.x + b.w && b.x < a.x + a.w)
  );
}
export function fits(b: Block, board: Block[]) {
  return (
    b.x >= 0 && b.y >= 0 && b.x + b.w <= W && b.y + b.h <= H && !board.some((v) => overlaps(b, v))
  );
}
export function settle(board: Block[]) {
  // A bridge can start falling after a support slides down in the same pass.
  let moved: boolean;
  do {
    moved = false;
    for (const b of [...board].sort((a, b) => b.y + b.h - a.y - a.h)) {
      while (b.y + b.h < H && !board.some((v) => v !== b && overlaps({ ...b, y: b.y + 1 }, v))) {
        b.y++;
        moved = true;
      }
    }
  } while (moved);
}
function outputPlan(
  rule: Recipe,
  inputs: Block[],
  others: Block[],
  nextId: number,
): Block[] | null {
  if (rule.product === "LGPS") return [];
  const shapes =
    rule.product === "Li4GeS4" || rule.product === "Li3PS4"
      ? [[2, 2]]
      : [
          [2, 1],
          [1, 2],
        ];
  const candidates: { block: Block; covered: number }[] = [];
  const cells = inputs.flatMap((b) =>
    Array.from({ length: b.w * b.h }, (_, i) => [b.x + (i % b.w), b.y + Math.floor(i / b.w)]),
  );
  const seen = new Set<string>();
  for (const [w, h] of shapes)
    for (const [cx, cy] of cells)
      for (let dx = 0; dx < w; dx++)
        for (let dy = 0; dy < h; dy++) {
          const b: Block = { id: nextId, k: rule.product, x: cx - dx, y: cy - dy, w, h };
          const key = [b.x, b.y, w, h].join(",");
          if (seen.has(key)) continue;
          seen.add(key);
          if (fits(b, others))
            candidates.push({
              block: b,
              covered: cells.filter(([x, y]) => x >= b.x && x < b.x + w && y >= b.y && y < b.y + h)
                .length,
            });
        }
  candidates.sort(
    (a, b) =>
      b.covered - a.covered ||
      b.block.y + b.block.h - a.block.y - a.block.h ||
      a.block.x - b.block.x,
  );
  for (const { block } of candidates) {
    if (rule.count === 1) return [block];
    const second = candidates.find((c) => !overlaps(block, c.block));
    if (second) return [block, { ...second.block, id: nextId + 1 }];
  }
  return null;
}
export interface Reaction {
  product: Product;
  inputs: Block[];
  outputs: Block[];
  points: number;
}
export interface Wave {
  board: Block[];
  events: Reaction[];
  blocked: boolean;
  nextId: number;
}
export function reactWave(original: Block[], initialId: number): Wave {
  let board = [...original],
    nextId = initialId,
    blocked = false;
  const events: Reaction[] = [];
  const reserved = new Set<number>();
  // New products occupy space immediately but only participate after gravity in the next wave.
  for (const rule of recipes) {
    const stalled = new Set<number>();
    while (true) {
      const eligible = board
        .filter((b) => b.id < initialId && !reserved.has(b.id) && rule.needs[b.k])
        .sort((a, b) => b.y - a.y || a.x - b.x || a.id - b.id);
      const needs = Object.entries(rule.needs) as [Kind, number][];
      if (needs.some(([k, n]) => eligible.filter((b) => b.k === k).length < n)) break;
      const edges = eligible.map((b) => eligible.flatMap((v, i) => (touches(b, v) ? [i] : [])));
      const possible = new Set<number>(),
        checked = new Set<number>();
      for (let i = 0; i < eligible.length; i++) {
        if (checked.has(i)) continue;
        const component = [i];
        checked.add(i);
        for (let j = 0; j < component.length; j++)
          for (const n of edges[component[j]]) {
            if (!checked.has(n)) {
              checked.add(n);
              component.push(n);
            }
          }
        if (needs.every(([k, n]) => component.filter((j) => eligible[j].k === k).length >= n))
          for (const j of component) possible.add(j);
      }
      const visited = new Set<string>();
      const size = needs.reduce((s, [, n]) => s + n, 0);
      function search(ids: number[]): Reaction | null {
        const key = ids.join(",");
        if (visited.has(key)) return null;
        visited.add(key);
        const inputs = ids.map((i) => eligible[i]);
        if (ids.length === size) {
          const outputs = outputPlan(
            rule,
            inputs,
            board.filter((b) => !inputs.includes(b)),
            nextId,
          );
          if (outputs) return { inputs, outputs, product: rule.product, points: rule.points };
          blocked = true;
          for (const b of inputs) stalled.add(b.id);
          return null;
        }
        for (const j of new Set(ids.flatMap((i) => edges[i]))) {
          const k = eligible[j].k;
          if (ids.includes(j) || inputs.filter((b) => b.k === k).length >= rule.needs[k]!) continue;
          const hit = search([...ids, j].sort((a, b) => a - b));
          if (hit) return hit;
        }
        return null;
      }
      let hit: Reaction | null = null;
      for (const i of possible) {
        hit = search([i]);
        if (hit) break;
      }
      if (!hit) break;
      const { inputs, outputs } = hit;
      board = board
        .filter(
          (b) => !inputs.includes(b) && !(b.k === "rock" && inputs.some((v) => touches(b, v))),
        )
        .concat(outputs);
      for (const b of inputs) stalled.delete(b.id);
      nextId += outputs.length;
      events.push(hit);
    }
    for (const id of stalled) reserved.add(id);
  }
  return { board, events, blocked, nextId };
}
