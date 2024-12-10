import { ActionFunctionArgs, redirect } from "react-router";
import { logout } from "~/utils/auth.server";

export async function loader() {
  return redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
  return logout({ request });
}
