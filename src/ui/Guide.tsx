import { useEffect, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FlaskConical,
  Gem,
  Layers3,
  GraduationCap,
} from "lucide-react";
import { formulas, recipes, type Product } from "../game/chemistry";
import { tile } from "./art";
export function Jewel({ kind, w = 1, h = 1 }: { kind: Product; w?: number; h?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!,
      image = tile(kind, w, h);
    c.width = image.width;
    c.height = image.height;
    c.getContext("2d")!.drawImage(image, 0, 0);
  }, [kind, w, h]);
  return <canvas className="jewel" ref={ref} aria-label={formulas[kind]} />;
}
export function Guide({ practice }: { practice: () => void }) {
  return (
    <section className="panel guide">
      <h2>
        <span className="iconchip lilac">
          <BookOpen size={17} />
        </span>
        合成レシピ
      </h2>
      {[
        {
          label: "二元化合物",
          icon: <FlaskConical />,
          rows: [5, 4, 3],
          color: "pink",
          size: "2マス",
        },
        { label: "中間化合物", icon: <Layers3 />, rows: [2, 1], color: "teal", size: "2 × 2" },
        { label: "最終結晶", icon: <Gem />, rows: [0], color: "violet", size: "消去" },
      ].map((g, i) => (
        <div className={"recipe-group " + g.color} key={g.label}>
          <h3>
            {g.icon}
            {g.label}
            <span>{g.size}</span>
          </h3>
          {g.rows.map((index) => {
            const r = recipes[index];
            return (
              <div key={index} className="recipe">
                <span>
                  {Object.entries(r.needs).map(([k, n], j) => (
                    <span key={k}>
                      {j > 0 && <em> + </em>}
                      {n > 1 ? n + " " : ""}
                      {formulas[k as Product]}
                    </span>
                  ))}
                </span>
                <ArrowRight size={12} />
                <b>
                  {r.count === 2 ? "2 " : ""}
                  {i === 2 ? "LGPS" : formulas[r.product]}
                </b>
              </div>
            );
          })}
        </div>
      ))}
      <button className="lesson-button" onClick={practice}>
        <GraduationCap size={17} />
        3連鎖を練習する
        <ChevronRight size={15} />
      </button>
    </section>
  );
}
export function Rules() {
  return (
    <div className="rules">
      <p>
        2個組の元素を落とし、上下左右につないで合成。最終結晶 <b>Li₁₀GeP₂S₁₂</b>{" "}
        を完成させると消去できます。
      </p>
      <ol>
        <li>
          <b>まずは 2 Li + S</b>
          　ピンクのLiを2個、黄色のSを1個つなぐと、2マスのLi₂Sができます。落下予測は半透明です。
        </li>
        <li>
          <b>材料をためる</b>
          　「合成を保留」中は着地しても反応しません。Pを2個、Sを5個つなぎ、保留を解除して次の組を落とせばP₂S₅を狙えます。HOLDは1組につき1回。
        </li>
        <li>
          <b>結晶が育つ</b>
          　着地した元素は分かれて落ちます。合成済みの結晶は一体で落下。各生成物は材料跡に重なる空き場所に収まり、2個分の2×2が取れない場合は材料を保持します。
        </li>
        <li>
          <b>連鎖で倍率アップ</b>
          　同時に起きた反応は1連鎖。重力処理の後、次の反応が起きるたび倍率が増えます。最終結晶、中間化合物、P₂S₅、GeS₂、Li₂Sの順に優先します。
        </li>
        <li>
          <b>CPU対戦</b>
          　反応で予告おじゃまを相殺し、余りを相手へ。次の組を操作できる猶予の後、連鎖が終わると最大6個落下します。隣接合成で灰色のおじゃまを除去。入口が塞がると敗北です。
        </li>
      </ol>
      <p className="fine">通常はスターター盤面から開始。対戦では両者に同じ並びの元素が届きます。</p>
    </div>
  );
}
