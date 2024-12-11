import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  Form,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import { z } from "zod";
import { useIsPending } from "~/utils/misc";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import type { Route } from "./+types/client";
import { redirectBack } from "remix-utils/redirect-back";

const ClientSchema = z.object({
  name: z.string(),
  discount: z.number().max(1).min(0),
});

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireUserId(request);
  const id = Number(params.clientId);
  const client = await prisma.client.findUnique({
    where: { id },
    select: { name: true, discount: true },
  });

  if (!client) throw redirectBack(request, { fallback: "/" });

  return {
    client,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUserId(request);
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: ClientSchema });

  if (submission.status !== "success") {
    return {
      result: submission.reply(),
      status: submission.status === "error" ? 400 : 200,
    };
  }

  const { id } = await prisma.client.update({
    where: { id: Number(params.clientId) },
    data: {
      name: submission.value.name,
      discount: submission.value.discount,
    },
    select: { id: true },
  });

  if (!id) {
    throw new Error("Couldn't create the new client");
  }

  return redirect("/clients");
}

export default function ClientForm() {
  const actionData = useActionData<typeof action>();
  const { client } = useLoaderData<typeof loader>();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "client-form",
    constraint: getZodConstraint(ClientSchema),
    //@ts-ignore
    lastResult: actionData?.result,
    defaultValue: client,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ClientSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div>
      <Form {...getFormProps(form)} className="space-y-6" method="POST">
        <div>
          <label
            htmlFor={fields.name.id}
            className="block text-sm/6 font-medium text-white"
          >
            Nombre
          </label>
          <div className="mt-2">
            <input
              {...getInputProps(fields.name, { type: "text" })}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={fields.discount.id}
            className="block text-sm/6 font-medium text-white"
          >
            Descuento
          </label>
          <div className="mt-2">
            <input
              {...getInputProps(fields.discount, { type: "number", step: 0.5 })}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-md bg-indigo-500 disabled:bg-indigo-500/80 disabled:text-white/80 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Editar
          </button>
        </div>
      </Form>
    </div>
  );
}
