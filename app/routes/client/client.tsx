import { prisma } from "~/utils/db.server";
import type { Route } from "./+types/client";
import { requireUserId } from "~/utils/auth.server";
import { Link, useLoaderData } from "react-router";
import { redirectBack } from "remix-utils/redirect-back";
import DoubleCheck from "~/components/double-check";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUserId(request);
  const id = Number(params.clientId);
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      sales: {
        select: {
          type: true,
          id: true,
          amount: true,
          date: true,
        },
      },
    },
  });

  if (!client) throw redirectBack(request, { fallback: "/" });

  return {
    client,
  };
}

export default function Client() {
  const { client } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between gap-4">
        <h1>{client.name}</h1>
        <div className="flex gap-4">
          <Link
            to="edit"
            className="bg-gray-100 hover:bg-gray-50 rounded px-2 py-1 text-black"
          >
            Editar
          </Link>
          <DoubleCheck
            title="Seguro?"
            description="Si borras este cliente no hay vuelta atrás"
            submitBtn="Borrar"
            method="POST"
            action={`/clients/${client.id}/delete`}
            Trigger={({ setOpen }) => (
              <button
                onClick={() => setOpen(true)}
                className="bg-red-700 hover:bg-red-500 rounded px-2 py-1 text-white"
              >
                Borrar
              </button>
            )}
          />
        </div>
      </div>
      <table className="mt-6 w-full whitespace-nowrap text-left">
        <colgroup>
          <col className="w-full sm:w-4/12" />
          <col className="lg:w-4/12" />
          <col className="lg:w-2/12" />
        </colgroup>
        <thead className="border-b border-white/10 text-sm/6 text-white">
          <tr>
            <th
              scope="col"
              className="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8"
            >
              Tipo
            </th>
            <th scope="col" className="py-2 pl-0 pr-8 font-semibold">
              Cantidad
            </th>
            <th
              scope="col"
              className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20"
            >
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {client.sales.map((item) => (
            <tr key={item.id}>
              <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                <div className="flex items-center gap-x-4">
                  <div className="truncate text-sm/6 font-medium text-white">
                    {item.type}
                  </div>
                </div>
              </td>
              <td className="py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
                <div className="flex gap-x-3">
                  <div className="font-mono text-sm/6 text-gray-400">
                    ${item.amount.toLocaleString("es-AR")}
                  </div>
                </div>
              </td>
              <td className="py-4 pl-0 pr-4 text-sm/6 sm:pr-8 lg:pr-20">
                <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                  <time
                    dateTime={item.date?.toUTCString()}
                    className="text-gray-400"
                  >
                    {item.date?.toLocaleDateString("es-AR")}
                  </time>
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
              <div className="flex items-center gap-x-4">
                <div className="truncate text-sm/6 font-medium text-white">
                  Total:
                </div>
              </div>
            </td>
            <td className="py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
              <div className="flex gap-x-3">
                <div className="font-mono text-sm/6 text-gray-400">
                  $
                  {client.sales
                    .reduce((acc, curr) => acc + curr.amount, 0)
                    .toLocaleString("es-AR")}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
