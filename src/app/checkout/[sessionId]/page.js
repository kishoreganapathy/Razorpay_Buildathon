import { redirect } from "next/navigation";

export default function CheckoutRedirect({ params }) {
  redirect(`/audit/${params.sessionId}`);
}
