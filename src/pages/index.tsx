// src/renderer/pages/index.tsx
import { useState, useEffect, useCallback, useRef } from "react";

type Binding = { accelerator: string; app: string };

export default function HomePage() {
  /* ────────── State ────────── */
  const [accel, setAccel]             = useState("");
  const [listening, setListening]     = useState(false);
  const [manual, setManual]           = useState(false);
  const [manualApp, setManualApp]     = useState("");
  const [openApps, setOpenApps]       = useState<string[]>([]);
  const [filter, setFilter]           = useState("");
  const [selectedApp, setSelectedApp] = useState("");
  const [bindings, setBindings]       = useState<Binding[]>([]);
  const [showList, setShowList]       = useState(false);

  /* ─────── Fetch native data ─────── */
  useEffect(() => {
    if ((window as any).api) {
      (window as any).api.getOpenApps().then(setOpenApps);
      (window as any).api.getBindings().then(setBindings);
    }
  }, []);

  const filtered = openApps.filter(a =>
    a.toLowerCase().includes(filter.toLowerCase())
  );

  /* ─────── Shortcut capture ─────── */
  const keydown = useCallback((e: KeyboardEvent) => {
    const parts: string[] = [];
    if (e.ctrlKey)  parts.push("Ctrl");
    if (e.metaKey)  parts.push("Cmd");
    if (e.altKey)   parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    parts.push(key);
    setAccel(parts.join(" + "));
  }, []);

  useEffect(() => {
    if (listening) window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [listening, keydown]);

  /* ─────────── CRUD  ─────────── */
  const add = () => {
    const appName = manual ? manualApp : selectedApp;
    (window as any).api
      .saveBinding({ accelerator: accel, app: appName })
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  const remove = (acc: string) => {
    (window as any).api
      .removeBinding(acc)
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  /* ───── dropdown auto-close ───── */
  const searchWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ─────────────  UI  ───────────── */
  return (
    <main className="window">
      <div className="sheet">
        <h2 className="title">Key Binder</h2>

        {/* Shortcut */}
        <section className="group">
          <div className="row">
            <label className="rowLabel">Shortcut</label>
            <div className="field">
              <input
                className="input mono"
                value={accel}
                placeholder="Press Listen"
                readOnly
              />
              <div className="btnGroup">
                <button className="btn blue tiny" onClick={() => { setAccel(""); setListening(true); }}>Listen</button>
                <button className="btn gray tiny" onClick={() => setListening(false)}>Stop</button>
              </div>
            </div>
          </div>
          {listening && <div className="noteWrap"><p className="note danger">Listening…</p></div>}
        </section>

        {/* App picker */}
        <section className="group">
          <div className="row">
            <label className="rowLabel">Manual entry</label>
            <input type="checkbox" className="switch" checked={manual} onChange={e => setManual(e.target.checked)} />
          </div>

          {manual ? (
            <div className="row">
              <label className="rowLabel">Application</label>
              <input
                className="input"
                placeholder="Enter App Name"
                value={manualApp}
                onChange={e => setManualApp(e.target.value)}
              />
            </div>
          ) : (
            <div className="row">
              <label className="rowLabel">Application</label>
              <div className="searchWrap" ref={searchWrapRef}>
                <input
                  className="input"
                  placeholder="Search apps…"
                  value={filter}
                  onChange={e => { setFilter(e.target.value); setShowList(true); }}
                  onFocus={() => setShowList(true)}
                  onBlur={() => setTimeout(() => setShowList(false), 120)}  /* ensure closes even if tab key */
                />
                {showList && filtered.length > 0 && (
                  <ul className="dropdown">
                    {filtered.map(name => (
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

        {/* Bindings list */}
        <section className="group listGroup">
          {bindings.length === 0 ? (
            <p className="empty">No bindings yet</p>
          ) : (
            bindings.map(b => (
              <div key={b.accelerator} className="row rowBinding">
                <span className="chip mono">{b.accelerator}</span>
                <span className="appName">{b.app}</span>
                <button className="btn textDanger tiny" onClick={() => remove(b.accelerator)}>Remove</button>
              </div>
            ))
          )}
        </section>
      </div>

      {/* ───────── global palette ───────── */}
      <style jsx global>{`
        :root {
          --fg1:#1d1d1f; --fg2:#3c3c4399; --divider:#d7d7db;
          --accent:#0a84ff; --danger:#ff453a; --radius:12px;
          --bg0:#f9faff; --bg1:#dde3f1;
          --font:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;
        }
        *,*::before,*::after{box-sizing:border-box;}
        html,body{margin:0;font-family:var(--font);-webkit-font-smoothing:antialiased;}
      `}</style>

      {/* ───────── component styles ───────── */}
      <style jsx>{`
        /* viewport + floor */
        .window{display:flex;justify-content:center;align-items:flex-start;
                padding:40px 16px;min-height:100vh;min-width:360px;
                background:radial-gradient(circle at 20% 0%,var(--bg0)0%,var(--bg1)100%);}
        .sheet{width:100%;max-width:460px;color:var(--fg1);}
        .title{margin:0 0 24px;font-size:1.7rem;font-weight:600;}

        /* card */
        .group{background:#fff;border:1px solid var(--divider);border-radius:var(--radius);margin-bottom:24px;}
        .row{display:flex;flex-wrap:wrap;gap:16px;align-items:center;padding:16px 20px;border-top:1px solid var(--divider);}
        .group .row:first-child{border-top:none;}
        .rowLabel{flex:0 0 120px;min-width:120px;font-size:.85rem;color:var(--fg2);}

        /* shortcut field */
        .field{flex:1 1 0;min-width:0;display:flex;gap:8px;}
        .btnGroup{display:flex;gap:8px;}

        /* search */
        .searchWrap{flex:1 1 0;position:relative;}

        /* inputs */
        .input{flex:1 1 0;min-width:0;font-size:.9rem;padding:8px 10px;border:1px solid var(--divider);
               border-radius:6px;background:#fafafa;transition:border-color .2s;}
        .input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px rgba(10,132,255,.3);background:#fff;}
        .mono{font-family:"SF Mono",Menlo,Consolas,monospace;}

        /* buttons */
        .btn{border:none;border-radius:6px;font-size:.84rem;font-weight:500;cursor:pointer;transition:filter .14s;}
        .btn:hover:not(:disabled){filter:brightness(1.08);}
        .btn:disabled{opacity:.55;cursor:default;}
        .blue{background:var(--accent);color:#fff;}
        .gray{background:#d1d1d6;color:var(--fg1);}
        .textDanger{background:none;color:var(--danger);}
        .tiny{padding:5px 10px;}
        .wide{width:100%;margin-bottom:28px;padding:10px 0;}

        /* switch */
        .switch{-webkit-appearance:none;width:42px;height:24px;border-radius:12px;background:#c7c7cc;cursor:pointer;position:relative;transition:background .2s;}
        .switch::before{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;}
        .switch:checked{background:var(--accent);}
        .switch:checked::before{transform:translateX(18px);}

        /* dropdown */
        .dropdown{position:absolute;left:0;right:0;top:calc(100% + 4px);max-height:180px;overflow:auto;
                  list-style:none;margin:0;padding:4px 0;background:#fff;border:1px solid var(--divider);
                  border-radius:var(--radius);box-shadow:0 8px 18px rgba(0,0,0,.12);z-index:10;}
        .dropdown li{padding:8px 14px;font-size:.9rem;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .12s;}
        .dropdown li:hover,.dropdown li.active{background:rgb(0 0 0 / 7%);}

        /* note / empty */
        .noteWrap{padding:4px 20px 14px;}
        .note{margin:0;font-size:.85rem;}
        .danger{color:var(--danger);font-weight:600;}
        .empty{padding:20px;font-size:.9rem;text-align:center;color:var(--fg2);}

        /* binding list styling */
        .rowBinding{gap:12px;}
        .chip{background:#f2f3f7;border:1px solid var(--divider);border-radius:6px;padding:4px 8px;font-size:.82rem;}
        .appName{flex:1;font-weight:500;overflow:hidden;text-overflow:ellipsis;}

        /* responsive */
        @media(max-width:600px){
          .row{padding:14px 16px;}
          .rowLabel{flex:0 0 100%;margin-bottom:6px;}
          .field{flex-direction:column;align-items:stretch;}
          .btnGroup{justify-content:flex-start;}
          .input{font-size:.88rem;padding:7px 9px;}
          .tiny{padding:6px 14px;font-size:.82rem;}
          .chip{margin-bottom:4px;}
        }
      `}</style>
    </main>
  );
}
