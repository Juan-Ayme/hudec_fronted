import { redirect } from "next/navigation";

export default function AuditoriaCostosRedirectPage() {
  redirect("/configuracion?tab=costos");
}
