import { prisma } from "~/utils/db.server";
import type { Route } from "./+types/client";
import { requireUserId } from "~/utils/auth.server";
import { useLoaderData } from "react-router";
import { redirectBack } from "remix-utils/redirect-back";

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
          month: {
            select: { startDate: true },
          },
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
      <h1>{client.name}</h1>
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
                    dateTime={item.month.startDate.toUTCString()}
                    className="text-gray-400"
                  >
                    {item.month.startDate.toLocaleDateString("es-AR")}
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
