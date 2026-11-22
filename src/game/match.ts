import { W, H, fits, settle, reactWave, type Block, type Kind, type Reaction } from "./chemistry";
import {
  children,
  draw,
  lock,
  random,
  shift,
  spawn,
  type Duo,
  type Move,
  type Piece,
  type Supply,
} from "./pieces";
import { cpuMoves } from "./cpu";
export type Mode = "solo" | "cpu" | "practice";
export type Command = Move | "drop" | "hold" | "bank";
export type Result = "win" | "lose" | "draw" | "complete";
export interface Field {
  board: Block[];
  active: Piece | null;
  supply: Supply;
  held: Duo | null;
  usedHold: boolean;
  bank: boolean;
  id: number;
  score: number;
  chain: number;
  best: number;
  cleared: number;
  pending: number;
  due: number;
  attack: number;
  resolving: boolean;
  wait: number;
  dead: boolean;
  blocked: boolean;
  wave: Reaction[];
  serial: number;
  sent: number;
  garbageRng: number;
}
export interface Match {
  mode: Mode;
  player: Field;
  cpu: Field | null;
  paused: boolean;
  started: boolean;
  elapsed: number;
  cpuElapsed: number;
  cpuClock: number;
  cpuPlan: Move[] | null;
  result: Result | null;
}
export function block(id: number, k: Kind, x: number, y: number, w = 1, h = 1): Block {
  return { id, k, x, y, w, h };
}
function starter(): Block[] {
  return [
    block(1, "Ge", 0, 13),
    block(2, "S", 0, 12),
    block(3, "P", 1, 13),
    block(4, "Li", 2, 13),
    block(5, "Li", 3, 13),
    block(6, "P", 5, 13),
    block(7, "S", 6, 13),
    block(8, "Li", 7, 13),
    block(9, "Ge", 8, 13),
    block(10, "S", 8, 12),
    block(11, "P", 7, 12),
  ];
}
function lesson(): Block[] {
  return [
    block(1, "Li4GeS4", 0, 12, 2, 2),
    block(2, "Li2S", 2, 13, 2, 1),
    block(3, "Li2S", 4, 13, 2, 1),
    block(4, "P2S5", 6, 13, 2, 1),
    block(5, "Li", 2, 12),
  ];
}
function field(seed: number, practice: boolean): Field {
  const supply = { rng: seed >>> 0, queue: [] },
    first = draw(supply);
  const active = spawn(practice ? ["S", "Li"] : first);
  return {
    board: practice ? lesson() : starter(),
    supply,
    active,
    held: null,
    usedHold: false,
    bank: false,
    id: 20,
    score: 0,
    chain: 0,
    best: 0,
    cleared: 0,
    pending: 0,
    due: 0,
    attack: 0,
    resolving: false,
    wait: 0,
    dead: false,
    blocked: false,
    wave: [],
    serial: 0,
    sent: 0,
    garbageRng: (seed ^ 0x57a45) >>> 0,
  };
}
export function newMatch(mode: Mode, seed: number): Match {
  return {
    mode,
    player: field(seed, mode === "practice"),
    cpu: mode === "cpu" ? field(seed, false) : null,
    paused: false,
    started: false,
    elapsed: 0,
    cpuElapsed: 0,
    cpuClock: 0,
    cpuPlan: null,
    result: null,
  };
}
function install(f: Field, duo: Duo) {
  f.active = spawn(duo);
  if (!children(f.active).every((b) => fits(b, f.board))) {
    f.dead = true;
    f.active = null;
  }
}
export function command(f: Field, cmd: Command) {
  if (!f.active || f.dead || f.resolving) return;
  if (cmd === "bank") {
    f.bank = !f.bank;
    return;
  }
  if (cmd === "hold") {
    if (f.usedHold) return;
    const old = f.active.duo,
      next = f.held ?? draw(f.supply);
    f.held = old;
    f.usedHold = true;
    install(f, next);
    return;
  }
  if (cmd !== "drop") {
    const q = shift(f.active, f.board, cmd);
    if (q) {
      f.active = q;
      return;
    }
    if (cmd !== "down") return;
  }
  f.board = lock(f.board, f.active, f.id);
  f.id += 2;
  f.active = null;
  f.resolving = true;
  f.chain = 0;
  f.attack = 0;
  f.wave = [];
  f.blocked = false;
  f.wait = 0;
}
export function act(m: Match, cmd: Command) {
  if (m.paused || m.result) return;
  m.started = true;
  command(m.player, cmd);
  decide(m);
}
export function pause(m: Match) {
  if (!m.result) m.paused = !m.paused;
}
export function exchange(a: Field, b: Field | null, attack: number) {
  const cancel = Math.min(a.pending, attack);
  a.pending -= cancel;
  a.due = Math.max(0, a.due - cancel);
  if (b) {
    b.pending += attack - cancel;
    a.sent += attack - cancel;
  }
}
function garbage(f: Field) {
  const n = Math.min(f.due, 6);
  f.pending -= n;
  const rng = { rng: f.garbageRng },
    start = Math.floor(random(rng) * W);
  f.garbageRng = rng.rng;
  for (let i = 0; i < n; i++) {
    const b = block(f.id++, "rock", (start + i) % W, 0);
    if (!fits(b, f.board)) {
      f.dead = true;
      return;
    }
    while (b.y < H - 1 && fits({ ...b, y: b.y + 1 }, f.board)) b.y++;
    f.board.push(b);
  }
}
function resolve(f: Field, dt: number) {
  if (!f.resolving || f.dead) return false;
  f.wait -= dt;
  if (f.wait > 0) return false;
  if (!f.bank) {
    settle(f.board);
    const wave = reactWave(f.board, f.id);
    f.blocked = wave.blocked;
    if (wave.events.length) {
      f.chain++;
      f.best = Math.max(f.chain, f.best);
      f.serial++;
      f.id = wave.nextId;
      f.wave = wave.events;
      f.board = wave.board;
      const lgps = wave.events.filter((r) => r.product === "LGPS").length;
      f.cleared += lgps;
      f.score += wave.events.reduce((s, r) => s + r.points * f.chain, 0);
      f.attack += Math.max(0, f.chain - 1) + wave.events.length + lgps * 5;
      f.wait = lgps ? 740 : 430;
      return false;
    }
  }
  return true;
}
function finish(f: Field) {
  garbage(f);
  f.due = f.pending;
  f.attack = 0;
  f.wave = [];
  f.resolving = false;
  f.usedHold = false;
  if (!f.dead) install(f, draw(f.supply));
}
function decide(m: Match) {
  if (m.player.dead) m.result = m.cpu?.dead ? "draw" : "lose";
  else if (m.cpu?.dead) m.result = "win";
  else if (m.mode === "practice" && m.player.cleared && !m.player.resolving) m.result = "complete";
}
export function tick(m: Match, dt: number) {
  if (!m.started || m.paused || m.result) return;
  if (m.player.active) {
    m.elapsed += dt;
    if (m.elapsed >= 940 && m.mode !== "practice") {
      command(m.player, "down");
      m.elapsed = 0;
    }
  } else m.elapsed = 0;
  const cpu = m.cpu;
  if (cpu?.active) {
    m.cpuElapsed += dt;
    if (m.cpuElapsed >= 940) {
      command(cpu, "down");
      m.cpuElapsed = 0;
      m.cpuPlan = null;
    }
  } else m.cpuElapsed = 0;
  if (cpu?.active) {
    m.cpuClock += dt;
    if (m.cpuClock >= 280) {
      m.cpuClock = 0;
      m.cpuPlan ??= cpuMoves(cpu.board, cpu.active, cpu.id);
      const step = m.cpuPlan.shift();
      command(cpu, step ?? "drop");
      if (!step) m.cpuPlan = null;
    }
  }
  const pDone = resolve(m.player, dt),
    cDone = cpu ? resolve(cpu, dt) : false;
  // Cancel existing queues for both sides before exchanging simultaneous outgoing attacks.
  const pa = pDone ? m.player.attack : 0,
    ca = cDone && cpu ? cpu.attack : 0;
  const ps = Math.max(0, pa - m.player.pending),
    cs = cpu ? Math.max(0, ca - cpu.pending) : 0;
  if (pDone) exchange(m.player, null, pa);
  if (cDone && cpu) exchange(cpu, null, ca);
  if (cpu) {
    cpu.pending += ps;
    m.player.sent += ps;
    m.player.pending += cs;
    cpu.sent += cs;
  }
  if (pDone) finish(m.player);
  if (cDone && cpu) finish(cpu);
  decide(m);
}
