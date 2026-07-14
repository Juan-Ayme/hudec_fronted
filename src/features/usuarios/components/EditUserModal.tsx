"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOffices, type UserRole, type AuthUserDetailed } from "@/lib/api";
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
  onSubmit: (data: {
    role: UserRole;
    is_active: boolean;
    password?: string;
    office_ids?: number[];
  }) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState<boolean>(user.is_active);
  const [password, setPassword] = useState("");
  const [officeIds, setOfficeIds] = useState<number[]>(user.office_ids ?? []);

  const officesQuery = useQuery({
    queryKey: ["auth-offices"],
    queryFn: ({ signal }) => getOffices(signal),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const offices = officesQuery.data?.offices ?? [];

  const toggleOffice = (id: number) =>
    setOfficeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: {
      role: UserRole;
      is_active: boolean;
      password?: string;
      office_ids?: number[];
    } = { role, is_active: isActive, office_ids: officeIds };
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

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Nueva Contraseña (opcional)</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" />
        </label>
      </form>
    </Dialog>
  );
}
