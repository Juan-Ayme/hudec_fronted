import { redirect } from "next/navigation";

export default function AuditoriasRedirectPage() {
  redirect("/taxonomia?tab=auditoria");
}
