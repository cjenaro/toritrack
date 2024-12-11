import { requireUserId } from "~/utils/auth.server";
import { Route } from "./+types/delete";
import { prisma } from "~/utils/db.server";
import { redirect } from "react-router";

export async function action({ params, request }: Route.ActionArgs) {
  await requireUserId(request);
  const clientId = Number(params.clientId);

  await prisma.client.delete({ where: { id: clientId } });

  return redirect("/clients");
}
