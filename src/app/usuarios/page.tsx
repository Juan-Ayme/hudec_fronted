import { redirect } from "next/navigation";

export default function UsuariosRedirectPage() {
  redirect("/configuracion?tab=usuarios");
}
