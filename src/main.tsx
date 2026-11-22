import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  CircleHelp,
  FlaskConical,
  Gamepad2,
  Gem,
  Hand,
  Keyboard,
  Layers3,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { act, newMatch, pause, tick, type Command, type Mode } from "./game/match";
import { heroArt } from "./ui/art";
import { Board } from "./ui/Board";
import { Guide, Jewel, Rules } from "./ui/Guide";
import { sound, unlock } from "./ui/audio";
import "@fontsource-variable/fredoka/index.css";
import "./style.css";

type Modal = "help" | "settings" | "restart" | "switch" | null;
const modeName = { solo: "ひとり", cpu: "CPU対戦", practice: "練習" };
const keys: Record<string, Command> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowUp: "rotate",
  z: "rotate",
  " ": "drop",
  c: "hold",
  b: "bank",
};
function setting(k: string, value: string) {
  try {
    return localStorage.getItem("lgps-" + k) ?? value;
  } catch {
    return value;
  }
}
function store(k: string, v: string) {
  try {
    localStorage.setItem("lgps-" + k, v);
  } catch {
    /* Private browsing. */
  }
}
function gameSeed() {
  const seed = new URLSearchParams(location.search).get("seed");
  return seed !== null && /^\d{1,10}$/.test(seed) ? Number(seed) >>> 0 : Math.random() * 2 ** 32;
}
function App() {
  const [game] = useState(() => ({ current: newMatch("solo", gameSeed()) })),
    [, render] = useState(0),
    update = useCallback(() => render((n) => n + 1), []);
  const m = game.current,
    p = m.player;
  const [modal, setModal] = useState<Modal>(null),
    [target, setTarget] = useState<Mode>("solo");
  const [mute, setMute] = useState(() => setting("mute", "off") === "on"),
    [low, setLow] = useState(
      () =>
        setting(
          "motion",
          matchMedia("(prefers-reduced-motion: reduce)").matches ? "low" : "full",
        ) === "low",
    );
  const [best, setBest] = useState(() => Number(setting("best", "0")) || 0);
  const hero = useRef<HTMLCanvasElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const modalPause = useRef(false);
  useEffect(() => {
    heroArt(hero.current!);
  }, []);
  useEffect(() => {
    const clock = setInterval(() => {
      const g = game.current;
      if (!g.started || g.paused || g.result) return;
      const a = g.player.serial,
        sent = g.player.sent;
      tick(g, 50);
      if (!mute && g.player.serial > a)
        sound(g.player.wave.some((r) => r.product === "LGPS") ? "final" : "wave", g.player.chain);
      if (!mute && sent < g.player.sent) sound("attack");
      if (g.mode !== "practice" && g.player.score > best) {
        store("best", String(g.player.score));
        setBest(g.player.score);
      }
      update();
    }, 50);
    return () => clearInterval(clock);
  }, [mute, best, update]);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);
  const fieldPanel = useRef<HTMLElement>(null);
  function input(cmd: Command) {
    if (modal || m.paused || m.result) return;
    unlock();
    if (!mute && m.player.active) sound(cmd === "drop" ? "drop" : "move");
    fieldPanel.current?.focus({ preventScroll: true });
    act(m, cmd);
    update();
  }
  function restart(mode: Mode) {
    game.current = newMatch(mode, gameSeed());
    modalPause.current = false;
    setModal(null);
    update();
  }
  function open(which: Modal) {
    modalPause.current = !m.paused && !m.result;
    if (modalPause.current) m.paused = true;
    setModal(which);
    update();
  }
  function close() {
    if (modalPause.current) m.paused = false;
    modalPause.current = false;
    setModal(null);
    update();
  }
  function change(mode: Mode) {
    if (m.started && !m.result) {
      setTarget(mode);
      open("switch");
    } else restart(mode);
  }
  function togglePause() {
    if (modal || m.result) return;
    unlock();
    pause(m);
    update();
  }
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || modal) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === "Escape") {
        e.preventDefault();
        if (!e.repeat) togglePause();
        return;
      }
      if (
        key === " " &&
        document.activeElement instanceof HTMLButtonElement &&
        document.activeElement.matches(":focus-visible")
      )
        return;
      const cmd = keys[key];
      if (cmd) {
        e.preventDefault();
        if (!e.repeat || ["left", "right", "down"].includes(cmd)) input(cmd);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  useEffect(() => {
    const hide = () => {
      if (document.hidden && game.current.started && !game.current.result) {
        game.current.paused = true;
        update();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [update]);
  const practice = () => {
    if (modal) restart("practice");
    else change("practice");
  };
  const touch = (cmd: Command, label: string, icon: React.ReactNode, extra = "") => (
    <button
      className={"touch " + extra}
      onClick={() => input(cmd)}
      disabled={!!m.result || m.paused || p.resolving}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
  const modeButtons = (
    <div className="modes" aria-label="モード選択">
      {(["solo", "cpu"] as const).map((key) => (
        <button
          key={key}
          aria-pressed={m.mode === key}
          className={m.mode === key ? "chosen" : ""}
          onClick={() => {
            if (m.mode !== key) change(key);
          }}
        >
          {key === "solo" ? <UserRound /> : <Swords />}
          {key === "solo" ? "ソロプレイ" : "CPU対戦"}
        </button>
      ))}
    </div>
  );
  const message =
    m.mode === "practice" && !m.started
      ? "そのまま落として、3連鎖を見よう！"
      : p.blocked
        ? "置き場不足 · 2×2の空きを作ろう"
        : p.bank
          ? "合成保留中 · 材料を集めよう"
          : !m.started
            ? "移動・落下でスタート"
            : p.resolving && p.wave.length
              ? p.chain + "連鎖！"
              : "プレイ中";
  return (
    <div className={low ? "app reduced" : "app"}>
      <header className="top">
        <div className="top-inner">
          <div className="brand">
            <span className="brand-symbol">
              <Gem size={23} />
            </span>
            <b>
              Crystal <em>Arcade</em>
            </b>
          </div>
          <div className="navtools flex items-center">
            <button className="help" onClick={() => open("help")}>
              <CircleHelp size={17} />
              <span>遊び方</span>
            </button>
            <button
              aria-label={mute ? "音をオン" : "音をミュート"}
              aria-pressed={mute}
              className="nav-icon"
              onClick={() => {
                unlock();
                store("mute", mute ? "off" : "on");
                setMute(!mute);
              }}
            >
              {mute ? <VolumeX /> : <Volume2 />}
            </button>
            <button aria-label="設定" className="nav-icon" onClick={() => open("settings")}>
              <Settings2 />
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="hero">
          <div className="hero-orbit" />
          <div className="hero-copy">
            <h1>
              LGPS <span>DROP</span>
              <i>✦</i>
            </h1>
            <p>元素をつないで、究極の結晶を合成しよう。</p>
          </div>
          <canvas className="hero-art" ref={hero} aria-hidden="true" />
        </div>
        <div className="toolbar">
          {modeButtons}
          <div className="manage">
            <button onClick={togglePause} disabled={!!m.result}>
              {m.paused ? <Play /> : <Pause />}
              <span>{m.paused ? "再開" : "一時停止"}</span>
            </button>
            <button
              aria-label="リスタート"
              onClick={() => (m.started && !m.result ? open("restart") : restart(m.mode))}
            >
              <RotateCcw />
              <span>リスタート</span>
            </button>
          </div>
        </div>
        <div className={"arena " + (m.cpu ? "versus" : "")}>
          {m.cpu && p.sent > 0 && (
            <div key={"out" + p.sent} className="transfer outgoing" aria-hidden="true">
              <Zap />✦
            </div>
          )}
          {m.cpu && m.cpu.sent > 0 && (
            <div key={"in" + m.cpu.sent} className="transfer incoming" aria-hidden="true">
              <Zap />✦
            </div>
          )}
          <aside className="stats">
            <section className="scorecard">
              <div className="score-deco">✧</div>
              <h2>
                <Trophy size={17} />
                スコア
              </h2>
              <strong className="score-value">{String(p.score).padStart(6, "0")}</strong>
              <div className="best">
                <span>BEST</span>
                <b>{best.toLocaleString()}</b>
              </div>
            </section>
            <section className="panel supply">
              <div className="preview-box">
                <h2>
                  <span className="little-dot mint" />
                  NEXT
                </h2>
                <div className="pair">
                  {p.supply.queue.slice(0, 2).map((k, i) => (
                    <Jewel key={i} kind={k} />
                  ))}
                </div>
              </div>
              <button
                className="preview-box hold"
                disabled={!p.active || p.usedHold || m.paused || !!m.result}
                onClick={() => input("hold")}
                aria-label="HOLD 入れ替え"
              >
                <h2>
                  <span className="little-dot mauve" />
                  HOLD
                </h2>
                <div className="pair">
                  {p.held ? p.held.map((k, i) => <Jewel key={i} kind={k} />) : <Hand size={23} />}
                </div>
              </button>
            </section>
            <section className="panel chaincard">
              <div>
                <span className="iconchip peach">
                  <Zap size={17} />
                </span>
                <h2>最大連鎖</h2>
              </div>
              <b>
                {p.best}
                <small>CHAIN</small>
              </b>
            </section>
            <section className="panel elements">
              <h2>
                <span className="iconchip tealchip">
                  <FlaskConical size={17} />
                </span>
                元素
              </h2>
              <div>
                {(["Li", "S", "Ge", "P"] as const).map((k, i) => (
                  <div key={k}>
                    <Jewel kind={k} />
                    <span>{["リチウム", "硫黄", "ゲルマニウム", "リン"][i]}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
          <section
            className="field-panel focus:outline-none"
            ref={fieldPanel}
            tabIndex={-1}
            aria-label="ゲーム操作"
          >
            <div className="field-title">
              <span>
                <Gamepad2 size={18} />
                {m.mode === "practice" ? "練習フィールド" : "プレイフィールド"}
              </span>
              <small>
                <i /> PLAYER
              </small>
            </div>
            <div className="well-wrap">
              <Board field={p} low={low} paused={m.paused} label="プレイヤー盤面" />
              {(m.result || (m.paused && !modal)) && (
                <div className="overlay">
                  <span className="overlay-icon">{m.result ? <Trophy /> : <Pause />}</span>
                  <strong>
                    {m.result
                      ? {
                          win: "YOU WIN!",
                          lose: "GAME OVER",
                          draw: "DRAW",
                          complete: "LGPS CLEAR!",
                        }[m.result]
                      : "PAUSE"}
                  </strong>
                  <p>
                    {m.result
                      ? m.result === "complete"
                        ? "最終結晶が完成！"
                        : modeName[m.mode] + " · " + p.score.toLocaleString() + " 点"
                      : "一時停止中"}
                  </p>
                  <button
                    onClick={() =>
                      m.result ? restart(m.mode === "practice" ? "solo" : m.mode) : togglePause()
                    }
                  >
                    <Play size={16} />
                    {m.result
                      ? m.mode === "practice"
                        ? "ソロプレイへ"
                        : "もう一度遊ぶ"
                      : "再開する"}
                  </button>
                </div>
              )}
            </div>
            <div className="field-status">
              <span className="status-dot" />
              {message}
              {m.cpu && <b>予告 {p.pending}</b>}
            </div>
            <div className="touchbar">
              {touch("left", "左", <ArrowLeft />)}
              {touch("right", "右", <ArrowRight />)}
              {touch("rotate", "回転", <RotateCw />)}
              {touch("drop", "落下", <ArrowDownToLine />, "primary")}
            </div>
            <button
              className={"bank " + (p.bank ? "on" : "")}
              aria-pressed={p.bank}
              disabled={m.paused || !!m.result || p.resolving}
              onClick={() => input("bank")}
            >
              {p.bank ? <Check size={14} /> : <Layers3 size={14} />}合成を保留{" "}
              <b>{p.bank ? "ON" : "OFF"}</b>
            </button>
          </section>
          <aside className="side">
            {m.cpu && (
              <section className="opponent panel">
                <h2>
                  <span className="iconchip pinkchip">
                    <Monitor size={16} />
                  </span>
                  CPU <small>予告 {m.cpu.pending}</small>
                </h2>
                <Board field={m.cpu} low={low} paused={m.paused} label="CPU盤面" />
                <div className="cpu-score">
                  {m.cpu.score.toLocaleString()} 点 · {m.cpu.best} 連鎖
                </div>
                {(p.sent > 0 || m.cpu.sent > 0) && (
                  <div className="attack" key={p.sent + "-" + m.cpu.sent}>
                    <Zap size={13} /> 送信 {p.sent}　受信 {m.cpu.sent}
                  </div>
                )}
              </section>
            )}
            <div className="guide-desktop">
              <Guide practice={practice} />
            </div>
            <section className="panel keyboard">
              <h2>
                <span className="iconchip bluechip">
                  <Keyboard size={17} />
                </span>
                キーボード操作
              </h2>
              {[
                ["移動", "←", "→"],
                ["回転 / ゆっくり落下", "↑", "↓"],
                ["一気に落下", "Space"],
                ["HOLD / 合成保留", "C", "B"],
              ].map(([name, ...k]) => (
                <div key={name}>
                  <span>{name}</span>
                  <div>
                    {k.map((v) => (
                      <kbd key={v}>{v}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </aside>
        </div>
        <div className="mobile-help">
          <button onClick={() => open("help")}>
            <BookOpen size={16} /> 遊び方・レシピ
          </button>
          <button onClick={practice}>
            <Sparkles size={16} /> 3連鎖を練習
          </button>
        </div>
      </main>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <h2 id="dialog-title">
            {modal === "help"
              ? "遊び方・合成レシピ"
              : modal === "settings"
                ? "設定"
                : modal === "switch"
                  ? "モードを切り替えますか？"
                  : "最初から遊びますか？"}
          </h2>
          <button aria-label="閉じる" onClick={close}>
            <X size={19} />
          </button>
        </div>
        {modal === "help" ? (
          <>
            <Rules />
            <Guide practice={practice} />
          </>
        ) : modal === "settings" ? (
          <div className="options">
            <button
              onClick={() => {
                unlock();
                store("mute", mute ? "off" : "on");
                setMute(!mute);
              }}
            >
              <AudioLines />
              ゲーム音<b>{mute ? "OFF" : "ON"}</b>
            </button>
            <button
              onClick={() => {
                store("motion", low ? "full" : "low");
                setLow(!low);
              }}
            >
              <Sparkles />
              控えめな演出・減光<b>{low ? "ON" : "OFF"}</b>
            </button>
          </div>
        ) : (
          <>
            <p>現在のプレイを終了します。</p>
            <div className="dialog-actions">
              <button onClick={close}>続ける</button>
              <button onClick={() => restart(modal === "switch" ? target : m.mode)}>
                {modal === "switch" ? modeName[target] + "へ" : "リスタート"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
