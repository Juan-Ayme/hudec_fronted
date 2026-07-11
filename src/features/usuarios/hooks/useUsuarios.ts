"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, createUser, updateUser, deleteUser, type AuthUserDetailed, type UserRole } from "@/lib/api";
import { useRequireRole } from "@/components/auth-context";

/**
 * Hook de /usuarios: fuerza rol admin, query de usuarios + mutations de
 * crear/editar/eliminar y el estado de los diálogos.
 */
export function useUsuarios() {
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

  return {
    query,
    createOpen,
    setCreateOpen,
    editUser,
    setEditUser,
    deleteUserObj,
    setDeleteUserObj,
    createMut,
    updateMut,
    deleteMut,
  };
}
