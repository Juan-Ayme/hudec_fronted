import { redirect } from "next/navigation";

export default function RentabilidadRedirectPage() {
  redirect("/reporte-ventas?tab=rentabilidad");
}
