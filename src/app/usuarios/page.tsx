"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Shield, User, Eye, CheckCircle2, XCircle } from "lucide-react";
import { listUsers, createUser, updateUser, deleteUser, type AuthUserDetailed, type UserRole } from "@/lib/api";
import { useRequireRole } from "@/components/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";

export default function UsuariosPage() {
  // Solo administradores pueden acceder a esta página
  useRequireRole(["admin"]);

  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AuthUserDetailed | null>(null);
  const [deleteUserObj, setDeleteUserObj] = useState<AuthUserDetailed | null>(null);

  const query = useQuery({
    queryKey: ["users"],
    queryFn: ({ signal }) => listUsers(signal),
  });

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { role?: UserRole; is_active?: boolean; password?: string } }) => updateUser(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditUser(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeleteUserObj(null);
    },
  });

  if (query.isError) return <ErrorState error={query.error} />;

  const users = query.data?.users || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Crear, editar y eliminar usuarios. Asignar roles de acceso."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      {query.isLoading ? (
        <div className="relative">
          <div className="opacity-50 pointer-events-none space-y-4">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn("h-16 rounded-xl border border-white/5", shmr)} />
             ))}
          </div>
          <PremiumLoaderOverlay messages={[
            "Obteniendo lista de usuarios...",
            "Verificando permisos y roles...",
            "Construyendo tabla de accesos..."
          ]} />
        </div>
      ) : (
        <Card>
          <CardBody>
            <div className="overflow-x-auto rounded-lg border border-border-soft">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-2 text-muted">
                    <th className="py-3 px-4 font-semibold">Usuario</th>
                    <th className="py-3 px-4 font-semibold">Rol</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-4 font-semibold">Último Acceso</th>
                    <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border-soft last:border-0 hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 px-4 text-fg font-medium">{u.username}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold bg-surface-3 text-fg uppercase tracking-wider">
                          {u.role === "admin" && <Shield className="h-3 w-3 text-primary" />}
                          {u.role === "operador" && <User className="h-3 w-3 text-violet" />}
                          {u.role === "viewer" && <Eye className="h-3 w-3 text-success" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-danger text-xs font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted text-xs">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Nunca"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditUser(u)} title="Editar usuario">
                            <Edit2 className="h-4 w-4 text-muted" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteUserObj(u)} title="Eliminar usuario">
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* CREATE MODAL */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data: any) => createMut.mutate(data)}
        isPending={createMut.isPending}
        error={createMut.error}
      />

      {/* EDIT MODAL */}
      {editUser && (
        <EditUserModal
          user={editUser}
          open={!!editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(data: any) => updateMut.mutate({ id: editUser.id, body: data })}
          isPending={updateMut.isPending}
          error={updateMut.error}
        />
      )}

      {/* DELETE MODAL */}
      {deleteUserObj && (
        <Dialog
          open={!!deleteUserObj}
          onClose={() => setDeleteUserObj(null)}
          title="Eliminar usuario"
          description={`¿Estás seguro de que deseas eliminar al usuario "${deleteUserObj.username}"? Esta acción no se puede deshacer.`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteUserObj(null)}>Cancelar</Button>
              <Button
                variant="danger"
                onClick={() => deleteMut.mutate(deleteUserObj.id)}
                loading={deleteMut.isPending}
              >
                Eliminar
              </Button>
            </>
          }
        >
          {deleteMut.isError && (
            <p className="text-danger text-sm mt-2 mb-4">
              Error: {(deleteMut.error as Error).message}
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}

function CreateUserModal({ open, onClose, onSubmit, isPending, error }: any) {
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

function EditUserModal({ user, open, onClose, onSubmit, isPending, error }: any) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState<boolean>(user.is_active);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { role, is_active: isActive };
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
