import { redirect } from "next/navigation";

export default function ProductTypesRedirectPage() {
  redirect("/taxonomia?tab=tipologias");
}
