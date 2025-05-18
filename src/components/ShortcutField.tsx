interface Props {
    accel: string;
    listening: boolean;
    onStart: () => void;
    onStop: () => void;
  }
  
  export default function ShortcutField({
    accel,
    listening,
    onStart,
    onStop,
  }: Props) {
    return (
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
            <button className="btn blue tiny" onClick={onStart}>
              Listen
            </button>
            <button className="btn gray tiny" onClick={onStop}>
              Stop
            </button>
          </div>
        </div>
        {listening && <p className="note">Listening…</p>}
      </section>
    );
  }
  