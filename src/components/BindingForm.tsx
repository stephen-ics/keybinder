// src/renderer/components/BindingForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BindingForm({ onAdd }: { onAdd: (b: Binding) => void }) {
  const [acc, setAcc] = useState("");
  const [app, setApp] = useState("");

  return (
    <div className="space-y-2">
      <Input
        placeholder="Shortcut (e.g. Cmd+K)"
        value={acc}
        onChange={e => setAcc(e.target.value)}
      />
      <Input
        placeholder="App Name"
        value={app}
        onChange={e => setApp(e.target.value)}
      />
      <Button onClick={() => onAdd({ accelerator: acc, app })}>
        Add
      </Button>
    </div>
  );
}
