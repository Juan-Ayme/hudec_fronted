import { redirect } from "next/navigation";

export default function PlanMesRedirectPage() {
  redirect("/pulso?tab=plan");
}
