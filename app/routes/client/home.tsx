import { Link, type LoaderFunctionArgs, useLoaderData } from "react-router";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

import { ChevronRightIcon } from "@heroicons/react/20/solid";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return {
    clients: await prisma.client.findMany(),
  };
}

export default function Clients() {
  const { clients } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-end my-6">
        <Link
          to="new"
          className="bg-gray-100 text-black px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
        >
          Agregar
        </Link>
      </div>
      <ul className="divide-y divide-white/5" role="list">
        {clients.map((client) => (
          <li
            key={client.id}
            className="relative flex items-center space-x-4 py-4"
          >
            <div className="min-w-0 flex-auto">
              <h2 className="min-w-0 text-sm/6 font-semibold text-white">
                <Link to={client.id.toString()} className="flex gap-x-2">
                  <span className="truncate">{client.name}</span>
                </Link>
              </h2>
            </div>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-5 flex-none text-gray-400"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
