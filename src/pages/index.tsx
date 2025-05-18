import { useState, useEffect, useCallback, useRef } from "react";
import { Sun, Moon } from "lucide-react";

type Binding = { accelerator: string; app: string };

export default function HomePage() {
  /* ─── Theme (SS-safe) ─── */
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("keybinderTheme") as
        | "dark"
        | "light"
        | null;
      if (stored) setTheme(stored);
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("keybinderTheme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  /* ─── Binding state ─── */
  const [accel, setAccel] = useState("");
  const [listening, setListening] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualApp, setManualApp] = useState("");
  const [openApps, setOpenApps] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState("");
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if ((window as any).api) {
      (window as any).api.getOpenApps().then(setOpenApps);
      (window as any).api.getBindings().then(setBindings);
    }
  }, []);

  const filtered = openApps.filter((a) =>
    a.toLowerCase().includes(filter.toLowerCase())
  );

  /* ---- key listener: no duplicates, allow pure-modifier combos ---- */
  const keydown = useCallback((e: KeyboardEvent) => {
    const parts: string[] = [];
    if (e.metaKey) parts.push("Cmd");
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");

    const isModifierKey = ["Meta", "Control", "Alt", "Shift"].includes(e.key);

    if (!isModifierKey) {
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      parts.push(k);
    }

    /* examples
       ⌘  → "Cmd"
       ⌘⌥  → "Cmd + Alt"
       ⌘⇧B → "Cmd + Shift + B"
    */
    setAccel(parts.join(" + "));
  }, []);

  useEffect(() => {
    if (listening) window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [listening, keydown]);

  /* ---- save / remove ---- */
  const add = () => {
    const name = manual ? manualApp : selectedApp;
    const accelerator = accel.replace(/\s*\+\s*/g, "+"); // "Cmd + D" → "Cmd+D"
    (window as any)
      .api.saveBinding({ accelerator, app: name })
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  const remove = (acc: string) => {
    (window as any)
      .api.removeBinding(acc)
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  /* ---- dropdown auto-close ---- */
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);

  /* ─── UI (all original styling kept) ─── */
  return (
    <div className="root">
      <header className="panelHead">
        <h2>Key Binder</h2>
        <button
          className="themeToggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Shortcut */}
      <section className="formBlock">
        <div className="fieldRow">
          <label>Shortcut</label>
          <div className="field">
            <input
              className="input mono"
              value={accel}
              placeholder="Press Listen"
              readOnly
            />
            <button
              className="btn blue tiny"
              onClick={() => {
                setAccel("");
                setListening(true);
              }}
            >
              Listen
            </button>
            <button
              className="btn gray tiny"
              onClick={() => setListening(false)}
            >
              Stop
            </button>
          </div>
        </div>
        {listening && <p className="note">Listening…</p>}
      </section>

      {/* App picker */}
      <section className="formBlock">
        <div className="fieldRow">
          <label>Manual entry</label>
          <input
            type="checkbox"
            className="switch"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
        </div>

        {manual ? (
          <div className="fieldRow">
            <label>Application</label>
            <input
              className="input"
              placeholder="Enter App Name"
              value={manualApp}
              onChange={(e) => setManualApp(e.target.value)}
            />
          </div>
        ) : (
          <div className="fieldRow" ref={searchRef}>
            <label>Application</label>
            <div className="searchWrap">
              <input
                className="input"
                placeholder="Search apps…"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setShowList(true);
                }}
                onFocus={() => setShowList(true)}
              />
              {showList && filtered.length > 0 && (
                <ul className="dropdown">
                  {filtered.map((name) => (
                    <li
                      key={name}
                      className={name === selectedApp ? "active" : ""}
                      onClick={() => {
                        setSelectedApp(name);
                        setFilter(name);
                        setShowList(false);
                      }}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <button
        className="btn blue wide"
        disabled={!accel || !(manual ? manualApp : selectedApp)}
        onClick={add}
      >
        Add Binding
      </button>

      {/* Bindings */}
      <section className="bindingsCard">
        <h3>Bindings</h3>
        {bindings.length === 0 ? (
          <p className="empty">No bindings yet</p>
        ) : (
          bindings.map((b) => (
            <div key={b.accelerator} className="bindRow">
              <span className="keyCapsule">{b.accelerator}</span>
              <span className="appName">{b.app}</span>
              <button
                className="btn textDanger tiny"
                onClick={() => remove(b.accelerator)}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </section>

      {/* ---- global + scoped styles (unchanged from your original) ---- */}
      <style jsx global>{`
        :root,
        [data-theme="dark"] {
          --fg: #f5f5f7;
          --fgSub: #a2a2a5;
          --bg: #1c1c1e;
          --field: #2a2a2d;
          --divider: #2e2e32;
          --accent: #0a84ff;
          --danger: #ff453a;
          --hover: rgba(255, 255, 255, 0.08);
        }
        [data-theme="light"] {
          --fg: #1c1c1e;
          --fgSub: #666;
          --bg: #f5f5f7;
          --field: #ffffff;
          --divider: #d0d0d4;
          --accent: #0a84ff;
          --danger: #ff453a;
          --hover: rgba(0, 0, 0, 0.06);
        }
        html,
        body {
          margin: 0;
          height: 100%;
          background: var(--bg);
          color: var(--fg);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Segoe UI", Roboto, sans-serif;
        }
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
      `}</style>

      {/* Component-scoped styles (all unchanged) */}
      <style jsx>{`
        .root {
          max-width: 600px;
          margin: 0 auto;
          padding: 32px 20px;
        }
        .panelHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .panelHead h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .themeToggle {
          background: none;
          border: none;
          padding: 4px;
          display: flex;
          align-items: center;
          cursor: pointer;
          color: var(--fg);
        }
        .formBlock {
          margin-bottom: 24px;
        }
        .fieldRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }
        .fieldRow:last-child {
          margin-bottom: 0;
        }
        .fieldRow label {
          flex: 0 0 110px;
          font-size: 0.85rem;
          color: var(--fgSub);
        }
        .field {
          flex: 1 1 0;
          display: flex;
          gap: 8px;
          min-width: 0;
        }
        .input {
          flex: 1 1 0;
          min-width: 0;
          font-size: 0.9rem;
          padding: 9px 11px;
          border: 1px solid var(--divider);
          border-radius: 8px;
          background: var(--field);
          color: var(--fg);
        }
        .input::placeholder {
          color: var(--fgSub);
        }
        .input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .mono {
          font-family: "SF Mono", Menlo, Consolas, monospace;
        }
        .btn {
          border: none;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn:hover:not(:disabled) {
          opacity: 0.85;
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .blue {
          background: var(--accent);
          color: #fff;
        }
        .gray {
          background: var(--divider);
          color: var(--fg);
        }
        .textDanger {
          background: none;
          color: var(--danger);
        }
        .tiny {
          padding: 6px 12px;
        }
        .wide {
          display: block;
          width: 100%;
          padding: 10px 0;
          margin: 0 0 28px;
        }
        .switch {
          -webkit-appearance: none;
          width: 42px;
          height: 24px;
          border-radius: 12px;
          background: #8e8e93;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
        }
        .switch::before {
          content: "";
          position: absolute;
          left: 3px;
          top: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
        }
        .switch:checked {
          background: var(--accent);
        }
        .switch:checked::before {
          transform: translateX(18px);
        }
        .searchWrap {
          flex: 1 1 0;
          position: relative;
        }
        .dropdown {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 4px);
          max-height: 200px;
          overflow: auto;
          background: var(--field);
          border: 1px solid var(--divider);
          border-radius: 10px;
          list-style: none;
          margin: 0;
          padding: 4px 0;
          z-index: 20;
        }
        .dropdown li {
          padding: 9px 14px;
          font-size: 0.9rem;
          cursor: pointer;
          color: var(--fg);
        }
        .dropdown li:hover {
          background: var(--hover);
        }
        .dropdown .active {
          background: rgba(10, 132, 255, 0.3);
        }
        .note {
          margin: 0;
          font-size: 0.85rem;
          color: var(--accent);
        }
        .bindingsCard {
          margin-top: 32px;
        }
        .bindingsCard h3 {
          margin: 0 0 12px;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--fgSub);
        }
        .bindRow {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 24px;
          border-top: 1px solid var(--divider);
        }
        .bindRow:first-child {
          border-top: none;
        }
        .bindRow:hover {
          background: var(--hover);
        }
        .keyCapsule {
          background: var(--field);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-family: "SF Mono", Menlo, Consolas, monospace;
          border: 1px solid var(--divider);
        }
        .appName {
          flex: 1;
          font-size: 0.87rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 480px) {
          .fieldRow label {
            flex: 0 0 100%;
            margin-bottom: 4px;
          }
          .field {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
