import { fits, settle, W, H, type Block, type Element } from "./chemistry";
export type Duo = [Element, Element];
export interface Piece {
  duo: Duo;
  x: number;
  y: number;
  dir: number;
}
export type Move = "left" | "right" | "rotate" | "down";
const offsets = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
export function children(p: Piece): Block[] {
  const [dx, dy] = offsets[p.dir];
  return p.duo.map((k, i) => ({ k, id: -1 - i, x: p.x + i * dx, y: p.y + i * dy, w: 1, h: 1 }));
}
export function shift(p: Piece, board: Block[], action: Move): Piece | null {
  const q = { ...p };
  if (action === "left") q.x--;
  if (action === "right") q.x++;
  if (action === "down") q.y++;
  if (action === "rotate") q.dir = (q.dir + 1) % 4;
  const kicks =
    action === "rotate"
      ? [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
      : [[0, 0]];
  for (const [dx, dy] of kicks) {
    const v = { ...q, x: q.x + dx, y: q.y + dy };
    if (children(v).every((b) => fits(b, board))) return v;
  }
  return null;
}
export function landing(p: Piece, board: Block[]) {
  let q = p;
  while (true) {
    const down = shift(q, board, "down");
    if (!down) return q;
    q = down;
  }
}
export function lock(board: Block[], p: Piece, id: number) {
  const blocks = board
    .map((b) => ({ ...b }))
    .concat(children(landing(p, board)).map((b, i) => ({ ...b, id: id + i })));
  settle(blocks);
  return blocks;
}
export function spawn(duo: Duo): Piece {
  return { duo, x: Math.floor(W / 2) - 1, y: 0, dir: 0 };
}
export interface Supply {
  rng: number;
  queue: Element[];
}
export function random(s: { rng: number }) {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
export function draw(s: Supply): Duo {
  while (s.queue.length < 6) {
    const bag: Element[] = [
      ...Array<Element>(10).fill("Li"),
      "Ge",
      "P",
      "P",
      ...Array<Element>(12).fill("S"),
    ];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random(s) * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    s.queue.push(...bag);
  }
  return s.queue.splice(0, 2) as Duo;
}
export function heights(board: Block[]) {
  return Array.from(
    { length: W },
    (_, x) => H - Math.min(H, ...board.filter((b) => x >= b.x && x < b.x + b.w).map((b) => b.y)),
  );
}
