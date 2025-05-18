import { useState, useEffect, useCallback } from "react";

type Binding = { accelerator: string; app: string };

export default function HomePage() {
  // --- Component state ---
  const [accel, setAccel]               = useState("");
  const [listening, setListening]       = useState(false);
  const [manualToggle, setManualToggle] = useState(false);
  const [manualApp, setManualApp]       = useState("");
  const [openApps, setOpenApps]         = useState<string[]>([]);
  const [filter, setFilter]             = useState("");
  const [selectedApp, setSelectedApp]   = useState("");
  const [bindings, setBindings]         = useState<Binding[]>([]);

  // --- Fetch initial data ---
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).api) {
      (window as any).api.getOpenApps().then(setOpenApps);
      (window as any).api.getBindings().then(setBindings);
    }
  }, []);

  // --- Filtered dropdown list ---
  const filteredApps = openApps.filter(app =>
    app.toLowerCase().includes(filter.toLowerCase())
  );

  // --- Shortcut‑listening logic ---
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const parts: string[] = [];
    if (e.ctrlKey)  parts.push("Ctrl");
    if (e.metaKey)  parts.push("Meta");
    if (e.altKey)   parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    parts.push(key);
    setAccel(parts.join("+"));
  }, []);

  // Attach/detach keydown listener
  useEffect(() => {
    if (listening) {
      window.addEventListener("keydown", handleKeydown);
    } else {
      window.removeEventListener("keydown", handleKeydown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [listening, handleKeydown]);

  // --- Handlers for buttons ---
  const handleListen = () => { setAccel(""); setListening(true); };
  const handleStop   = () => setListening(false);

  const handleAdd = () => {
    const appName = manualToggle ? manualApp : selectedApp;
    (window as any).api
      .saveBinding({ accelerator: accel, app: appName })
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  const handleRemove = (acc: string) => {
    (window as any).api
      .removeBinding(acc)
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  // --- Render ---
  return (
    <main className="container">
      <h2>Key Binder</h2>

      <div className="stack">
        {/* Accelerator input + Listen/Stop */}
        <input
          className="input"
          value={accel}
          placeholder="Press Listen then your shortcut"
          readOnly
        />
        <div className="actions">
          <button className="button" onClick={handleListen}>
            Listen for Shortcut
          </button>
          <button className="button" onClick={handleStop}>
            Stop Listening
          </button>
          {listening && <span className="status">Listening…</span>}
        </div>

        {/* Manual vs Dropdown toggle */}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={manualToggle}
            onChange={e => setManualToggle(e.target.checked)}
          />
          <span>Enter application name manually</span>
        </label>

        {/* Manual entry or filtered dropdown */}
        {manualToggle ? (
          <input
            className="input"
            placeholder="Enter app name"
            value={manualApp}
            onChange={e => setManualApp(e.target.value)}
          />
        ) : (
          <>
            <input
              className="input"
              placeholder="Filter applications…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <select
              className="select"
              value={selectedApp}
              onChange={e => setSelectedApp(e.target.value)}
            >
              <option value="" disabled>
                Choose an app
              </option>
              {filteredApps.map(appName => (
                <option key={appName} value={appName}>
                  {appName}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          className="button"
          onClick={handleAdd}
          disabled={!accel || !(manualToggle ? manualApp : selectedApp)}
        >
          Add Binding
        </button>
      </div>

      {/* Binding list */}
      <ul className="list">
        {bindings.map(b => (
          <li key={b.accelerator} className="list-item">
            <span className="mono">{b.accelerator} → {b.app}</span>
            <button
              className="button button-danger"
              onClick={() => handleRemove(b.accelerator)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* scoped styles */}
      <style jsx>{`
        .container {
          padding: 2rem;
          max-width: 28rem;
          margin: 0 auto;
          font-family: system-ui, sans-serif;
          color: #1e1e1e;
        }
        h2 {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-align: center;
        }
        .stack > * + * {
          margin-top: 1rem;
        }
        .input {
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.4);
        }
        .select {
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: #fff;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          user-select: none;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .button {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .button:hover {
          background: #1d4ed8;
        }
        .button:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .button-danger {
          background: #dc2626;
        }
        .button-danger:hover {
          background: #b91c1c;
        }
        .status {
          margin-left: auto;
          font-size: 1rem;
          font-weight: 600;
          color: #dc2626;
        }
        .list {
          margin-top: 1.5rem;
          font-size: 0.875rem;
        }
        .list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid #eee;
        }
        .mono {
          font-family: Menlo, Consolas, monospace;
        }
      `}</style>
    </main>
  );
}
