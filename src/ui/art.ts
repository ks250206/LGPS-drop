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
function polygon(
  c: CanvasRenderingContext2D,
  pts: XY[],
  color: string | CanvasGradient,
  outline?: string,
  lw = 2,
) {
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
function glass(c: CanvasRenderingContext2D, w: number, h: number, ...colors: string[]) {
  const fill = c.createLinearGradient(0, 0, w, h);
  colors.forEach((color, i) => fill.addColorStop(i / (colors.length - 1), color));
  return fill;
}

// A pointed quartz habit with a crown, three long faces and an internal reflection.
function prism(
  c: CanvasRenderingContext2D,
  x: number,
  base: number,
  w: number,
  h: number,
  angle: number,
  colors: string[],
) {
  const [light, mid, deep, edge] = colors;
  c.save();
  c.translate(x, base);
  c.rotate(angle);
  c.scale(w / 100, h / 100);
  const tip: XY = [-9, -100],
    left: XY = [-47, -68],
    ridge: XY = [-12, -59],
    right: XY = [43, -73];
  const body = c.createLinearGradient(-20, -87, 24, 2);
  body.addColorStop(0, light);
  body.addColorStop(0.52, mid);
  body.addColorStop(1, deep);
  polygon(c, [tip, right, [40, -4], [7, 2], [-39, -3], left], deep, edge, 1.8);
  polygon(c, [tip, left, ridge], "#fffcf2");
  polygon(c, [tip, ridge, right], light);
  polygon(c, [left, ridge, [-8, 0], [-39, -3]], mid);
  polygon(c, [ridge, right, [40, -4], [-8, 0]], body);
  polygon(c, [[23, -69], right, [40, -4], [23, -16]], deep);
  polygon(c, [left, [-22, -62], [-17, -30], [-36, -48]], "#ffffff52");
  polygon(
    c,
    [
      [-8, -59],
      [21, -66],
      [12, -56],
      [-7, -44],
    ],
    "#ffffff8a",
  );
  polygon(
    c,
    [
      [-5, -30],
      [24, -48],
      [24, -43],
      [-5, -25],
    ],
    "#ffffff55",
  );
  c.restore();
}
export function crown(c: CanvasRenderingContext2D) {
  c.clearRect(0, 0, 240, 190);
  const halo = c.createRadialGradient(121, 100, 5, 121, 100, 98);
  halo.addColorStop(0, "#b5fff7ba");
  halo.addColorStop(0.56, "#98a9ff45");
  halo.addColorStop(1, "#8d82ff00");
  c.fillStyle = halo;
  c.fillRect(0, 0, 240, 190);
  prism(c, 115, 154, 46, 92, -0.96, palette.P);
  prism(c, 123, 155, 55, 123, 0.65, palette.S);
  prism(c, 119, 159, 57, 119, -0.48, palette.Ge);
  prism(c, 116, 164, 70, 151, 0.075, palette.LGPS);
  prism(c, 111, 164, 46, 85, -0.71, palette.Li);
  prism(c, 121, 166, 38, 69, 0.66, palette.P);
  for (const [x, y, r] of [
    [31, 102, 5],
    [65, 54, 7],
    [144, 28, 8],
    [184, 72, 5],
    [163, 132, 5],
    [87, 129, 3],
  ])
    sparkle(c, x, y, r, "#fff8d6");
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
  c.shadowColor = "transparent";
  const cap: XY[] = pts.map(([px, py]) => [48 + (px - 48) * 0.71, 48 + (py - 48) * 0.68]);
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const top = (pts[i][1] + pts[j][1]) / 2 < 35;
    const lower = (pts[i][1] + pts[j][1]) / 2 > 68;
    const shade = top ? light : lower ? deep : mid;
    polygon(c, [pts[i], pts[j], cap[j], cap[i]], shade);
    polygon(c, [pts[i], pts[j], cap[j]], top ? "#ffffff60" : lower ? "#35275426" : "#ffffff36");
    polygon(c, [pts[i], cap[i], cap[j]], i % 3 === 0 ? "#ffffff40" : "#ffffff0d");
  }
  polygon(c, cap, glass(c, 74, 90, light, mid, light, mid));
  c.save();
  c.clip();
  polygon(
    c,
    [
      [0, 45],
      [54, 8],
      [84, 8],
      [13, 57],
    ],
    "#ffffff65",
  );
  polygon(
    c,
    [
      [44, 88],
      [100, 48],
      [100, 54],
      [51, 90],
    ],
    "#ffffff52",
  );
  c.restore();
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
    const rim: XY[] = [
      [8, 23],
      [23, 8],
      [width - 22, 8],
      [width - 8, 23],
      [width - 8, height - 22],
      [width - 23, height - 9],
      [22, height - 9],
      [8, height - 23],
    ];
    const inset: XY[] = rim.map(([x, y]) => [
      x < width / 2 ? x + 10 : x - 10,
      y < height / 2 ? y + 8 : y - 8,
    ]);
    polygon(c, rim, glass(c, width, height, light, mid, deep));
    rim.forEach((v, i) => {
      const j = (i + 1) % rim.length;
      polygon(c, [v, rim[j], inset[j], inset[i]], i < 2 ? light : i < 5 ? deep : mid);
      polygon(c, [v, inset[i], inset[j]], i % 2 ? "#ffffff42" : "#31285826");
    });
    polygon(c, inset, glass(c, width, height, light, mid, light, mid));
    c.save();
    c.clip();
    polygon(
      c,
      [
        [0, height * 0.48],
        [width * 0.48, 0],
        [width * 0.68, 0],
        [0, height * 0.65],
      ],
      "#ffffff59",
    );
    polygon(
      c,
      [
        [0, height * 0.76],
        [width * 0.84, 0],
        [width * 0.87, 0],
        [0, height * 0.79],
      ],
      "#ffffff70",
    );
    if (w === 2 && h === 2) {
      prism(c, width * 0.85, height * 0.95, 26, 55, 0.38, [light, mid, deep, edge]);
      prism(c, width * 0.86, height * 0.95, 16, 29, -0.5, [light, mid, deep, edge]);
    }
    c.restore();
    sparkle(c, width - 21, 23, 9, "#ffffffbd");
  }
  const fs = w === 1 && h === 1 ? 40 : Math.min(42, canvas.width / (formulas[k].length * 0.69));
  c.font = "bold " + fs + "px system-ui,sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.strokeStyle = "#ffffffbd";
  c.lineWidth = 2.8;
  c.lineJoin = "round";
  c.strokeText(formulas[k], canvas.width * 0.5, canvas.height * 0.53);
  c.fillStyle = "#30213d";
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
  c.save();
  c.globalAlpha = 0.48;
  prism(c, 113, 140, 25, 87, -0.58, palette.P);
  prism(c, 294, 135, 26, 82, 0.53, palette.Ge);
  prism(c, 290, 131, 17, 52, 0.83, palette.Li);
  c.restore();
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

// Static scenery is painted once on mount, beneath the aligned gameplay grid.
export function cavern(canvas: HTMLCanvasElement) {
  const c = canvas.getContext("2d")!;
  const w = canvas.width,
    h = canvas.height;
  c.save();
  c.scale(w / 432, h / 672);
  c.fillStyle = glass(c, 165, 672, "#171933", "#252447", "#273452", "#413357");
  c.fillRect(0, 0, 432, 672);
  const mist = c.createRadialGradient(374, 212, 1, 374, 212, 278);
  mist.addColorStop(0, "#4298a340");
  mist.addColorStop(0.65, "#51688f22");
  mist.addColorStop(1, "#243b6100");
  c.fillStyle = mist;
  c.fillRect(0, 0, 432, 672);
  // Narrow ribbons of mineral light sweep behind the board.
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(446, 45 + i * 11);
    c.bezierCurveTo(270, 62 + i * 13, 316, 254 + i * 9, 69, 291 + i * 2);
    c.bezierCurveTo(305, 276 + i * 4, 316, 100 + i * 17, 446, 80 + i * 12);
    c.fillStyle = glass(c, 440, 60, "#9a7bd300", i % 2 ? "#81eed00c" : "#88bdf313", "#97ffe01c");
    c.fill();
  }
  for (let i = 1; i <= 100; i++) {
    const x = (i * 157 + i * i * 37) % 433,
      y = (i * 71 + i * i * 13) % 559;
    if (i % 13 === 0) sparkle(c, x, y, 2.8, "#c4d8fa8a");
    else {
      c.fillStyle = i % 4 ? "#c2cef452" : "#bafbf77a";
      c.fillRect(x, y, i % 4 === 0 ? 1.7 : 1.1, 1.2);
    }
  }
  polygon(
    c,
    [
      [0, 405],
      [35, 429],
      [76, 482],
      [109, 473],
      [160, 504],
      [212, 487],
      [255, 514],
      [309, 480],
      [339, 481],
      [390, 431],
      [432, 412],
      [432, 672],
      [0, 672],
    ],
    "#343653",
  );
  polygon(
    c,
    [
      [0, 472],
      [56, 508],
      [86, 495],
      [154, 545],
      [210, 518],
      [269, 552],
      [322, 520],
      [354, 531],
      [400, 476],
      [432, 464],
      [432, 672],
      [0, 672],
    ],
    "#2c2e4b",
  );
  c.save();
  c.globalAlpha = 0.48;
  const amethyst = ["#9181bc", "#736aaa", "#504e7c", "#3e3d66"],
    aquamarine = ["#74aaa9", "#517e91", "#445776", "#353e5d"];
  for (const [x, y, width, height, angle] of [
    [6, 557, 31, 125, -0.12],
    [14, 555, 21, 86, 0.4],
    [46, 573, 18, 60, 0.45],
    [393, 555, 25, 100, -0.36],
    [421, 550, 33, 150, 0.1],
    [430, 548, 22, 88, 0.54],
  ])
    prism(c, x, y, width, height, angle, x < 200 ? amethyst : aquamarine);
  c.restore();
  polygon(
    c,
    [
      [0, 525],
      [22, 544],
      [68, 550],
      [91, 572],
      [146, 582],
      [204, 613],
      [250, 590],
      [283, 586],
      [337, 553],
      [375, 556],
      [416, 533],
      [432, 532],
      [432, 672],
      [0, 672],
    ],
    glass(c, 0, 672, "#403857", "#2b2744"),
  );
  // Foreground clusters anchor the margins, leaving the fall corridor clear.
  c.globalAlpha = 0.63;
  for (const [x, y, width, height, a] of [
    [8, 632, 32, 153, -0.13],
    [19, 636, 39, 117, 0.32],
    [31, 640, 23, 77, 0.7],
    [399, 638, 31, 115, -0.53],
    [416, 634, 42, 162, -0.07],
    [423, 632, 24, 94, 0.42],
  ])
    prism(c, x, y, width, height, a, x < 200 ? amethyst : aquamarine);
  c.restore();
}
