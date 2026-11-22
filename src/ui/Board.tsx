import { useEffect, useRef, useState } from "react";
import { CanvasRenderer, Container, Sprite, Texture } from "pixi.js";
import { children, landing } from "../game/pieces";
import { formulas, H, W, type Block } from "../game/chemistry";
import type { Field } from "../game/match";
import { tile, palette, crown, cavern } from "./art";
import { Jewel } from "./Guide";

const unit = 48,
  textures = new Map<string, Texture>();
function texture(b: Block) {
  const key = [b.k, b.w, b.h].join("/");
  if (!textures.has(key)) textures.set(key, Texture.from(tile(b.k, b.w, b.h)));
  return textures.get(key)!;
}
function FinalCrystal() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    crown(ref.current!.getContext("2d")!);
  }, []);
  return <canvas ref={ref} className="final-crystal" width={240} height={190} />;
}
export interface DropTrail {
  id: number;
  starts: Block[];
  distance: number;
}
export function Board({
  field: f,
  trail,
  low,
  paused,
  label,
}: {
  field: Field;
  trail?: DropTrail;
  low: boolean;
  paused: boolean;
  label: string;
}) {
  const scenery = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    cavern(scenery.current!);
  }, []);
  const host = useRef<HTMLDivElement>(null),
    live = useRef(f);
  live.current = f;
  const redraw = useRef<(() => void) | null>(null);
  useEffect(() => {
    redraw.current?.();
  });
  const [error, setError] = useState(false);
  useEffect(() => {
    const renderer = new CanvasRenderer();
    let closed = false,
      ready = false;
    const scene = new Container();
    let previous = "",
      sprites: Sprite[] = [];
    const draw = () => {
      const field = live.current;
      const current = field.active,
        signature = [
          field.id,
          field.board.map((b) => [b.id, b.k, b.x, b.y, b.w, b.h].join(":")).join(),
          current && [current.duo, current.x, current.y, current.dir].join(),
          field.resolving,
        ].join("|");
      if (signature === previous) return;
      previous = signature;
      const blocks = [...field.board.map((b) => ({ b, alpha: 1 }))];
      if (current) {
        const ghost = children(landing(current, field.board));
        for (const b of ghost) {
          while (
            b.y + 1 < H &&
            !field.board.some((v) => b.x >= v.x && b.x < v.x + v.w && b.y + 1 === v.y) &&
            !ghost.some((v) => v !== b && b.x === v.x && b.y + 1 === v.y)
          )
            b.y++;
        }
        blocks.push(
          ...ghost.map((b) => ({ b, alpha: 0.26 })),
          ...children(current).map((b) => ({ b, alpha: 1 })),
        );
      }
      blocks.forEach(({ b, alpha }, i) => {
        if (!sprites[i]) {
          sprites[i] = new Sprite();
          scene.addChild(sprites[i]);
        }
        const sprite = sprites[i];
        sprite.visible = true;
        sprite.texture = texture(b);
        sprite.position.set(b.x * unit, b.y * unit);
        sprite.width = b.w * unit;
        sprite.height = b.h * unit;
        sprite.alpha = alpha;
      });
      for (let i = blocks.length; i < sprites.length; i++) sprites[i].visible = false;
      renderer.render(scene);
    };
    function destroy() {
      scene.destroy({ children: true });
      renderer.destroy(true);
    }
    renderer
      .init({
        width: W * unit,
        height: H * unit,
        backgroundAlpha: 0,
        resolution: 1.5,
        antialias: true,
      })
      .then(() => {
        ready = true;
        if (closed) {
          destroy();
          return;
        }
        host.current!.appendChild(renderer.canvas);
        redraw.current = draw;
        draw();
      })
      .catch(() => {
        if (!closed) setError(true);
      });
    return () => {
      closed = true;
      redraw.current = null;
      if (ready) destroy();
    };
  }, []);
  const final = f.wave.some((r) => r.product === "LGPS");
  const pts = f.wave.reduce((s, r) => s + r.points * f.chain, 0);
  const first = f.wave[0];
  const cx = first
    ? (first.inputs.reduce((s, b) => s + b.x + b.w / 2, 0) / first.inputs.length / W) * 100
    : 50;
  const cy = first
    ? Math.min(
        83,
        (first.inputs.reduce((s, b) => s + b.y + 0.5, 0) / first.inputs.length / H) * 100,
      )
    : 50;
  return (
    <div
      className={"well " + (low ? "quiet " : "") + (paused ? "frozen" : "")}
      role="img"
      aria-label={label + "、固定ブロック" + f.board.length + "個"}
    >
      <canvas className="cavern" width={432} height={672} ref={scenery} aria-hidden="true" />
      <div className="well-grid" />
      {trail && (
        <div className="drop-trail" key={trail.id} aria-hidden="true">
          {trail.starts.map((b) => (
            <i
              key={b.id}
              style={
                {
                  left: ((b.x + 0.19) / W) * 100 + "%",
                  top: ((b.y + 0.55) / H) * 100 + "%",
                  width: (0.62 / W) * 100 + "%",
                  height: (trail.distance / H) * 100 + "%",
                  "--glint": palette[b.k][0],
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div ref={host} className="pixi-host" />
      {error && (
        <div className="board-error">盤面を描画できません。ブラウザを更新してください。</div>
      )}
      {first && (
        <div className="product-pops" key={"p" + f.serial}>
          {f.wave
            .flatMap((r) => r.outputs)
            .map((b) => (
              <div
                key={b.id}
                style={
                  {
                    left: (b.x / W) * 100 + "%",
                    top: (b.y / H) * 100 + "%",
                    width: (b.w / W) * 100 + "%",
                    height: (b.h / H) * 100 + "%",
                    "--rim": palette[b.k][0],
                  } as React.CSSProperties
                }
              >
                <Jewel kind={b.k} w={b.w} h={b.h} />
              </div>
            ))}
        </div>
      )}
      {first && (
        <div
          className={"fx " + (final ? "final-fx" : "")}
          key={f.serial}
          style={
            {
              "--fx-x": cx + "%",
              "--fx-y": cy + "%",
              "--tone": palette[first.product][0],
            } as React.CSSProperties
          }
        >
          {final && !low && <i className="prism-rays" />}
          <i className="shock" />
          <i className="shock second" />
          {Array.from(
            { length: low ? 3 : Math.min(36, (final ? 23 : 7) + f.chain * 3) },
            (_, i) => {
              const a = i * 2.4,
                d = (final ? 82 : 40) + (i % 5) * 9;
              return (
                <i
                  className={"particle p" + (i % 3)}
                  key={i}
                  style={
                    {
                      "--dx": Math.cos(a) * d + "px",
                      "--dy": Math.sin(a) * d - 20 + "px",
                      background: final
                        ? ["#ffff97", "#ff92cb", "#a4ffee", "#baaeff"][i % 4]
                        : palette[first.product][i % 3],
                    } as React.CSSProperties
                  }
                />
              );
            },
          )}
          <div className="burst-label">
            <small>{f.chain} CHAIN</small>
            <strong>{final ? "LGPS!" : formulas[first.product]}</strong>
            <b>+{pts.toLocaleString()}</b>
          </div>
          {final && (
            <>
              <FinalCrystal />
              <div className="score-cascade">
                {first.inputs.map((b, i) => (
                  <span key={b.id} style={{ "--i": i } as React.CSSProperties}>
                    +
                    {Math.floor((first.points * f.chain) / first.inputs.length) +
                      (i === 0 ? (first.points * f.chain) % first.inputs.length : 0)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
