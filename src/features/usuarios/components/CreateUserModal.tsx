"use client";

import { useState } from "react";
import { type UserRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export function CreateUserModal({
  open,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { username: string; password: string; role: UserRole }) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  // Reset on open if closed
  if (!open && username) {
    setUsername("");
    setPassword("");
    setRole("viewer");
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username, password, role });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo Usuario"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button onClick={handleSubmit} loading={isPending} disabled={!username || password.length < 6}>
            Crear
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
            {error.message}
          </div>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Nombre de usuario</span>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: juan_perez" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Contraseña</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Rol</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-10 w-full rounded-md border border-border-soft bg-surface px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-fg"
          >
            <option value="viewer">Viewer (Solo lectura)</option>
            <option value="operador">Operador (Acciones de negocio)</option>
            <option value="admin">Admin (Acceso total)</option>
          </select>
        </label>
      </form>
    </Dialog>
  );
}
