// src/renderer/components/BindingList.tsx
import { Button } from "@/components/ui/button";

export function BindingList({
  bindings,
  onRemove,
}: {
  bindings: Binding[];
  onRemove: (a: string) => void;
}) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {bindings.map(b => (
        <li key={b.accelerator} className="flex justify-between">
          <span>{b.accelerator} → {b.app}</span>
          <Button size="sm" variant="destructive"
                  onClick={() => onRemove(b.accelerator)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
