import { requireUserId } from "~/utils/auth.server";
import type { Route } from "./+types/home";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { FormEvent, useEffect, useState } from "react";
import { prisma } from "~/utils/db.server";
import { useEventSource } from "remix-utils/sse/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request, { redirectTo: "/login" });
  return {
    user: await prisma.user.findUnique({
      where: {
        id: userId,
      },
    }),
  };
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Hi, {user.name}</h1>
    </div>
  );
}
