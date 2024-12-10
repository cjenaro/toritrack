import { Link } from "react-router";
import { LoaderFunctionArgs } from "react-router";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export default function Homepage() {
  return (
    <div className="h-full">
      <div className="container max-w-lg mx-auto p-8">
        <h2 className="text-3xl mb-4">Hi!</h2>
        <Link to="/dashboard">Visit the dashboard &rarr;</Link>
      </div>
    </div>
  );
}
