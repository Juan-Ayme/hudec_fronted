import { redirect } from "next/navigation";

export default function SaludCatalogoRedirectPage() {
  redirect("/pulso?tab=salud");
}
