"use client";

import { Edit2, Trash2, Shield, User, Eye, CheckCircle2, XCircle } from "lucide-react";
import type { AuthUserDetailed } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export function UsuariosTable({
  users,
  onEdit,
  onDelete,
}: {
  users: AuthUserDetailed[];
  onEdit: (u: AuthUserDetailed) => void;
  onDelete: (u: AuthUserDetailed) => void;
}) {
  return (
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
                      <Button variant="ghost" size="icon" onClick={() => onEdit(u)} title="Editar usuario">
                        <Edit2 className="h-4 w-4 text-muted" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(u)} title="Eliminar usuario">
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
  );
}
