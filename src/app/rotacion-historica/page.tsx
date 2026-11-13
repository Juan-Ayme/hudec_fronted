import { redirect } from "next/navigation";

export default function RotacionHistoricaRedirectPage() {
  redirect("/reporte-ventas?tab=rotacion");
}
