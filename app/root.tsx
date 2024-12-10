import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Form,
  Link,
} from "react-router";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import { LoaderFunctionArgs } from "react-router";
import { getUserId } from "./utils/auth.server";
import { useOptionalUser } from "./utils/misc";
import { useLocation } from "react-router";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return { user: await getUserId(request) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useOptionalUser();
  const location = useLocation();
  return (
    <html lang="en" className="h-full bg-gray-900">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-900 text-white">
        <header className="px-4 md:px-12 py-8 flex justify-center md:justify-end gap-4 items-center">
          {user ? (
            <Form method="POST" action="/logout">
              <button className="bg-gray-200 text-black hover:bg-gray-100 px-2 md:px-4 py-2 rounded">
                Sign out
              </button>
            </Form>
          ) : (
            <Link
              to="/login"
              className="bg-gray-200 text-black hover:bg-gray-100 px-4 py-2 rounded"
            >
              Sign in
            </Link>
          )}
          <Link to="/dashboard">Dashboard</Link>
        </header>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Not-so-epic Web Starter" },
    {
      name: "description",
      content: "An opinionated starter that is not so epic",
    },
  ];
}
