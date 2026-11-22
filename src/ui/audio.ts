let ctx: AudioContext | undefined;
export function unlock() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  } catch {
    /* Audio is optional. */
  }
}
function note(
  hz: number,
  delay: number,
  duration: number,
  level: number,
  type: OscillatorType = "sine",
) {
  if (!ctx || ctx.state !== "running") return;
  const start = ctx.currentTime + delay,
    osc = ctx.createOscillator(),
    gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = hz;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}
export function sound(kind: "drop" | "move" | "wave" | "final" | "attack", chain = 1) {
  const base = 392 * Math.pow(1.12246, Math.min(8, chain - 1));
  if (kind === "move") {
    note(440, 0, 0.045, 0.016);
    return;
  }
  if (kind === "drop") {
    note(165, 0, 0.09, 0.06, "triangle");
    return;
  }
  if (kind === "attack") {
    note(622, 0, 0.09, 0.03);
    note(932, 0.065, 0.12, 0.03);
    return;
  }
  const tones = kind === "final" ? [1, 1.25, 1.5, 2, 2.5, 3] : [1, 1.25, 1.5];
  tones.forEach((v, i) =>
    note(
      base * v,
      (kind === "final" ? 0.08 : 0) + i * (kind === "final" ? 0.068 : 0.047),
      i === tones.length - 1 ? 0.29 : 0.14,
      0.052,
      "triangle",
    ),
  );
}
