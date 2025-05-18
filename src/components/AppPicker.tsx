import { useState, useRef, useEffect } from "react";

interface Props {
  manual: boolean;
  manualApp: string;
  onManualToggle: (v: boolean) => void;
  onManualAppChange: (v: string) => void;
  openApps: string[];
  selectedApp: string;
  onSelectApp: (v: string) => void;
}

export default function AppPicker({
  manual,
  manualApp,
  onManualToggle,
  onManualAppChange,
  openApps,
  selectedApp,
  onSelectApp,
}: Props) {
  const [filter, setFilter] = useState("");
  const [showList, setShowList] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filtered = openApps.filter((a) =>
    a.toLowerCase().includes(filter.toLowerCase())
  );

  /* auto-close dropdown */
  useEffect(() => {
    const f = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);

  return (
    <section className="formBlock">
      <div className="fieldRow">
        <label>Manual entry</label>
        <input
          type="checkbox"
          className="switch"
          checked={manual}
          onChange={(e) => onManualToggle(e.target.checked)}
        />
      </div>

      {manual ? (
        <div className="fieldRow">
          <label>Application</label>
          <input
            className="input"
            placeholder="Enter App Name"
            value={manualApp}
            onChange={(e) => onManualAppChange(e.target.value)}
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
                      onSelectApp(name);
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
  );
}
