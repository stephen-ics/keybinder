import { useState, useEffect, useCallback } from "react";
import ThemeToggle from "../components/ThemeToggle";
import ShortcutField from "../components/ShortcutField";
import AppPicker from "../components/AppPicker";
import BindingsList from "../components/BindingsList";

type Binding = { accelerator: string; app: string };

export default function HomePage() {
  /* ─── Theme ─── */
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = localStorage.getItem("keybinderTheme") as
      | "dark"
      | "light"
      | null;
    if (stored) setTheme(stored);
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
  const [selectedApp, setSelectedApp] = useState("");

  const [bindings, setBindings] = useState<Binding[]>([]);

  /* ---- initial data ---- */
  useEffect(() => {
    if ((window as any).api) {
      (window as any).api.getOpenApps().then(setOpenApps);
      (window as any).api.getBindings().then(setBindings);
    }
  }, []);

  /* ---- key listener (no dupes) ---- */
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
    setAccel(parts.join(" + "));
  }, []);

  useEffect(() => {
    if (listening) window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [listening, keydown]);

  /* ---- save / remove ---- */
  const add = () => {
    const appName = manual ? manualApp : selectedApp;
    const accelerator = accel.replace(/\s*\+\s*/g, "+"); // "Cmd + D" → "Cmd+D"
    (window as any)
      .api.saveBinding({ accelerator, app: appName })
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };
  const remove = (acc: string) => {
    (window as any)
      .api.removeBinding(acc)
      .then(() => (window as any).api.getBindings())
      .then(setBindings);
  };

  /* ─── UI ─── */
  return (
    <div className="root">
      <header className="panelHead">
        <h2>Key Binder</h2>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <ShortcutField
        accel={accel}
        listening={listening}
        onStart={() => {
          setAccel("");
          setListening(true);
        }}
        onStop={() => setListening(false)}
      />

      <AppPicker
        manual={manual}
        manualApp={manualApp}
        onManualToggle={setManual}
        onManualAppChange={setManualApp}
        openApps={openApps}
        selectedApp={selectedApp}
        onSelectApp={setSelectedApp}
      />

      <button
        className="btn blue wide"
        disabled={!accel || !(manual ? manualApp : selectedApp)}
        onClick={add}
      >
        Add Binding
      </button>

      <BindingsList bindings={bindings} onRemove={remove} />
    </div>
  );
}
