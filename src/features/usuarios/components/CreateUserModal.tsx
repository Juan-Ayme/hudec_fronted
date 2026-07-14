"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOffices, type UserRole } from "@/lib/api";
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
  onSubmit: (data: {
    username: string;
    password: string;
    role: UserRole;
    office_ids?: number[];
  }) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [officeIds, setOfficeIds] = useState<number[]>([]);

  const officesQuery = useQuery({
    queryKey: ["auth-offices"],
    queryFn: ({ signal }) => getOffices(signal),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const offices = officesQuery.data?.offices ?? [];

  // Reset on open if closed
  if (!open && username) {
    setUsername("");
    setPassword("");
    setRole("viewer");
    setOfficeIds([]);
  }

  const toggleOffice = (id: number) =>
    setOfficeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username, password, role, office_ids: officeIds });
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

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Acceso a sucursales</span>
          <p className="text-xs text-muted">
            Sin seleccionar = acceso a <strong>todas</strong> las sucursales. Marcá una o varias para restringir.
          </p>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border-soft p-2">
            {officesQuery.isLoading ? (
              <span className="text-xs text-faint">Cargando sucursales…</span>
            ) : officesQuery.isError ? (
              <span className="text-xs text-danger">No se pudieron cargar las sucursales.</span>
            ) : offices.length === 0 ? (
              <span className="text-xs text-faint">Sin sucursales</span>
            ) : (
              offices.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-fg">
                  <input
                    type="checkbox"
                    checked={officeIds.includes(o.id)}
                    onChange={() => toggleOffice(o.id)}
                    className="accent-primary"
                  />
                  {o.name}
                </label>
              ))
            )}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
