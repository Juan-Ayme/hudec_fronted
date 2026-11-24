"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  getAtributoDefs,
  getCoberturaAtributos,
  subirDriver,
  type ImportDriverResult,
} from "@/lib/atributos-api";

const KEY = ["atributos"] as const;

/**
 * Pestaña "Atributos" de /taxonomia: cobertura actual + carga del driver
 * en dos pasos (probar sin guardar → cargar). La carga real solo se habilita
 * para el mismo archivo que se probó.
 */
export function useAtributos() {
  const qc = useQueryClient();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [prueba, setPrueba] = useState<ImportDriverResult | null>(null);
  const [cargado, setCargado] = useState<ImportDriverResult | null>(null);

  const defs = useQuery({
    queryKey: [...KEY, "defs"],
    queryFn: ({ signal }) => getAtributoDefs(signal),
    staleTime: 5 * 60_000,
  });

  const cobertura = useQuery({
    queryKey: [...KEY, "cobertura"],
    queryFn: ({ signal }) => getCoberturaAtributos(signal),
    staleTime: 60_000,
  });

  const elegirArchivo = (f: File | null) => {
    setArchivo(f);
    setPrueba(null);
    setCargado(null);
  };

  const probar = useMutation({
    mutationFn: (f: File) => subirDriver(f, true),
    onSuccess: (r) => {
      setPrueba(r);
      setCargado(null);
    },
    onError: (err: Error) =>
      toast.error("No se pudo revisar el Excel", { description: err.message }),
  });

  const cargar = useMutation({
    mutationFn: (f: File) => subirDriver(f, false),
    onSuccess: (r) => {
      setCargado(r);
      setPrueba(null);
      setArchivo(null);
      toast.success("Atributos cargados", {
        description: `${r.stats.atributos_escritos} dato(s) guardado(s)`,
      });
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) =>
      toast.error("No se pudo cargar el Excel", { description: err.message }),
  });

  return { defs, cobertura, archivo, elegirArchivo, prueba, cargado, probar, cargar };
}
