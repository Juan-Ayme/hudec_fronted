import { redirect } from "next/navigation";

export default function ComprasHistoricoRedirectPage() {
  redirect("/compras-ecosistema?tab=historico");
}
