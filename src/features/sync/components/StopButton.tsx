"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XCircle } from "lucide-react";
import { stopSyncTask } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function StopButton({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => stopSyncTask(taskId),
    onSuccess: (res) => {
      toast.success("Cancelando tarea", { description: res.detail ?? "La tarea pasará a CANCELLED en unos segundos." });
      qc.invalidateQueries({ queryKey: ["sync-tasks"] });
    },
    onError: (e) => {
      toast.error("Error al cancelar", { description: (e as Error).message });
    },
  });

  return (
    <Button
      size="sm"
      variant="danger"
      className="h-5 px-2 py-0 text-[10px] uppercase tracking-[0.08em]"
      loading={mut.isPending}
      onClick={() => mut.mutate()}
      title="Cancelar la sincronización"
    >
      <XCircle className="h-3 w-3 mr-1" /> Detener
    </Button>
  );
}
