import { reactWave, settle, touches, type Block } from "./chemistry";
import { heights, lock, shift, type Move, type Piece } from "./pieces";
// Search reachable controls at the current height, then simulate the same lock and synthesis as the player.
export function cpuMoves(board: Block[], active: Piece, id: number): Move[] {
  const queue: { p: Piece; path: Move[] }[] = [{ p: active, path: [] }];
  const seen = new Set<string>();
  let best = -Infinity,
    path: Move[] = [];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i],
      key = [node.p.x, node.p.y, node.p.dir].join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    const placed = lock(board, node.p, id);
    const wave = reactWave(placed, id + 2);
    settle(wave.board);
    const hs = heights(wave.board);
    const reward = wave.events.reduce((s, r) => s + r.points, 0);
    const bonds = placed
      .filter((b) => b.id >= id)
      .reduce((s, b) => s + placed.filter((v) => touches(b, v) && v.k !== "rock").length, 0);
    const roughness = hs.slice(1).reduce((s, h, j) => s + Math.abs(h - hs[j]), 0);
    const holes = hs.reduce((s, h) => s + h, 0) - wave.board.reduce((s, b) => s + b.w * b.h, 0);
    const score =
      reward * 0.65 +
      bonds * 2 -
      roughness * 1.5 -
      Math.max(...hs) * 5 -
      holes * 5 -
      node.path.length * 0.25;
    if (score > best) {
      best = score;
      path = node.path;
    }
    for (const m of ["left", "right", "rotate"] as const) {
      const p = shift(node.p, board, m);
      // Wall kicks serve rotation, never use them to tunnel down a stack.
      if (p && Math.abs(p.y - active.y) <= 1 && !seen.has([p.x, p.y, p.dir].join(",")))
        queue.push({ p, path: [...node.path, m] });
    }
  }
  return path;
}
