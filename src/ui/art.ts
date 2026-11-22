import { formulas, type Product } from "../game/chemistry";
export const palette: Record<Product, string[]> = {
  Li: ["#ffacce", "#ff78ad", "#dc4385", "#943c73"],
  S: ["#fff09a", "#ffd452", "#e8a32f", "#976335"],
  Ge: ["#a3efff", "#56cff1", "#349cca", "#366b9a"],
  P: ["#dec0ff", "#ba91f4", "#9466d8", "#6b459a"],
  Li2S: ["#ffc4d3", "#fb9ab9", "#da658f", "#a44975"],
  GeS2: ["#a1fcfa", "#61d6da", "#339ca9", "#396c85"],
  P2S5: ["#dfc1ff", "#bc96ff", "#9168e2", "#65429c"],
  Li3PS4: ["#c5aeff", "#9d8cf6", "#7968c8", "#51448d"],
  Li4GeS4: ["#bcffe6", "#71e0bc", "#41b89d", "#367c78"],
  LGPS: ["#c8fffc", "#70efe1", "#50bcbf", "#376b9b"],
  rock: ["#d2d4e4", "#adafc6", "#9698aa", "#6f7088"],
};
type XY = [number, number];
function polygon(c: CanvasRenderingContext2D, pts: XY[], color: string, outline?: string, lw = 2) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.lineJoin = "round";
  c.fillStyle = color;
  c.fill();
  if (outline) {
    c.strokeStyle = outline;
    c.lineWidth = lw;
    c.stroke();
  }
}
// All artwork is drawn from the same original silhouettes on the board, in the logo and in the guide.
export function gem(
  c: CanvasRenderingContext2D,
  k: Product,
  x: number,
  y: number,
  w: number,
  h: number,
  face = false,
) {
  const [light, mid, deep, edge] = palette[k];
  c.save();
  c.translate(x, y);
  c.scale(w / 100, h / 100);
  const pts: XY[] =
    k === "S"
      ? [
          [24, 12],
          [73, 12],
          [96, 44],
          [81, 80],
          [51, 94],
          [16, 78],
          [4, 44],
        ]
      : k === "Ge"
        ? [
            [50, 4],
            [84, 23],
            [96, 59],
            [71, 86],
            [41, 96],
            [10, 72],
            [5, 39],
          ]
        : k === "P"
          ? [
              [49, 4],
              [78, 18],
              [94, 52],
              [82, 84],
              [48, 96],
              [15, 79],
              [5, 49],
              [22, 19],
            ]
          : [
              [22, 12],
              [69, 8],
              [90, 25],
              [96, 65],
              [77, 87],
              [30, 93],
              [9, 78],
              [4, 37],
            ];
  polygon(c, pts, mid, edge, 4.5);
  const cap: XY[] = pts.map(([px, py]) => [48 + (px - 48) * 0.71, 48 + (py - 48) * 0.68]);
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    polygon(
      c,
      [pts[i], pts[j], cap[j], cap[i]],
      (pts[i][1] + pts[j][1]) / 2 < 30
        ? light
        : (pts[i][0] + pts[j][0]) / 2 < 28
          ? light
          : (pts[i][1] + pts[j][1]) / 2 > 68
            ? deep
            : mid,
    );
  }
  polygon(c, cap, mid);
  c.strokeStyle = light;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(...cap[0]);
  c.lineTo(...cap[1]);
  c.stroke();
  c.fillStyle = "rgba(255,255,255,.9)";
  c.beginPath();
  c.ellipse(27, 25, 8, 3.4, -0.7, 0, Math.PI * 2);
  c.fill();
  if (face) {
    c.fillStyle = "#443858";
    for (const ex of [36, 63]) {
      c.beginPath();
      c.ellipse(ex, 52, 3.2, 5, 0, 0, 7);
      c.fill();
    }
    c.beginPath();
    c.arc(50, 56, 5, 0, Math.PI);
    c.strokeStyle = "#443858";
    c.lineWidth = 2.8;
    c.stroke();
    for (const ex of [27, 71]) {
      c.fillStyle = "#ed7ca3";
      c.beginPath();
      c.ellipse(ex, 60, 6, 2.8, 0, 0, 7);
      c.fill();
    }
  }
  c.restore();
}
function sparkle(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  polygon(
    c,
    [
      [x, y - r],
      [x + r * 0.26, y - r * 0.28],
      [x + r, y],
      [x + r * 0.26, y + r * 0.2],
      [x, y + r],
      [x - r * 0.23, y + r * 0.23],
      [x - r, y],
      [x - r * 0.2, y - r * 0.2],
    ],
    color,
  );
}
const cache = new Map<string, HTMLCanvasElement>();
export function tile(k: Product, w = 1, h = 1) {
  const key = [k, w, h].join(":");
  if (cache.has(key)) return cache.get(key)!;
  const canvas = document.createElement("canvas"),
    u = 96;
  canvas.width = w * u;
  canvas.height = h * u;
  const c = canvas.getContext("2d")!;
  if (w === 1 && h === 1) gem(c, k, 2, 2, 92, 92);
  else {
    const width = canvas.width,
      height = canvas.height,
      [light, mid, deep, edge] = palette[k];
    c.beginPath();
    c.roundRect(4, 4, width - 8, height - 8, 19);
    c.fillStyle = deep;
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 5;
    c.stroke();
    polygon(
      c,
      [
        [8, 24],
        [25, 8],
        [width - 25, 8],
        [width - 12, 21],
        [width - 29, height - 23],
        [26, height - 21],
      ],
      mid,
    );
    polygon(
      c,
      [
        [8, 23],
        [24, 8],
        [width - 25, 8],
        [width - 38, 18],
        [32, 19],
        [17, 36],
      ],
      light,
    );
    sparkle(c, width - 21, 23, 9, "#ffffffbd");
  }
  const fs = w === 1 && h === 1 ? 40 : Math.min(42, canvas.width / (formulas[k].length * 0.69));
  c.font = "bold " + fs + "px system-ui,sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#352c49";
  c.fillText(formulas[k], canvas.width * 0.5, canvas.height * 0.53);
  cache.set(key, canvas);
  return canvas;
}
export function heroArt(canvas: HTMLCanvasElement) {
  canvas.width = 800;
  canvas.height = 280;
  const c = canvas.getContext("2d")!;
  c.scale(2, 2);
  // A small constellation of faceted characters, drawn in layers with crisp sticker edges.
  for (const [x, y, r] of [
    [19, 67, 7],
    [112, 19, 5],
    [322, 26, 7],
    [351, 99, 11],
    [76, 119, 6],
    [225, 15, 5],
    [279, 120, 5],
    [6, 100, 3],
    [383, 52, 4],
  ]) {
    sparkle(c, x, y, r, r % 2 ? "#fff4bb" : "#d7c3ff");
  }
  function sticker(k: Product, x: number, y: number, w: number, h: number, a: number) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.shadowColor = "#39297455";
    c.shadowOffsetY = 4;
    c.shadowBlur = 4;
    gem(c, k, -w / 2, -h / 2, w, h, true);
    c.restore();
  }
  sticker("P", 111, 75, 78, 85, -0.23);
  sticker("S", 276, 76, 94, 88, 0.14);
  sticker("Ge", 203, 60, 106, 109, 0.14);
  sticker("Li", 159, 97, 84, 81, -0.15);
  sparkle(c, 244, 34, 9, "#fff9dc");
  sparkle(c, 95, 40, 6, "white");
}
