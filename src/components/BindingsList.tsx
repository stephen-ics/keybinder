type Binding = { accelerator: string; app: string };

interface Props {
  bindings: Binding[];
  onRemove: (acc: string) => void;
}

export default function BindingsList({ bindings, onRemove }: Props) {
  return (
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
              onClick={() => onRemove(b.accelerator)}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </section>
  );
}
