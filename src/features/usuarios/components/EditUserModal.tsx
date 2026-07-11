"use client";

import { useState } from "react";
import { type UserRole, type AuthUserDetailed } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export function EditUserModal({
  user,
  open,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  user: AuthUserDetailed;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { role: UserRole; is_active: boolean; password?: string }) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState<boolean>(user.is_active);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: { role: UserRole; is_active: boolean; password?: string } = { role, is_active: isActive };
    if (password) body.password = password;
    onSubmit(body);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Editar usuario: ${user.username}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button onClick={handleSubmit} loading={isPending} disabled={password.length > 0 && password.length < 6}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
            {error.message}
          </div>
        )}

        <label className="flex items-center gap-3 border border-border-soft rounded-lg p-3 bg-surface-2 cursor-pointer transition-colors hover:border-border">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary rounded border-border-soft"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-fg">Usuario activo</span>
            <span className="text-xs text-muted">Permite al usuario iniciar sesión en el sistema.</span>
          </div>
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

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Nueva Contraseña (opcional)</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" />
        </label>
      </form>
    </Dialog>
  );
}
