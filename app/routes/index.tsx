import { Link, useLoaderData } from "react-router";
import { mp } from "~/utils/mercadopago.server";
import { Payment,  User  } from "mercadopago"
import { requireUserId } from "~/utils/auth.server";

export async function loader({request}: LoaderFunctionArgs) {
  await requireUserId(request)  
  const mpPayments = new Payment(mp)
  const me = await new User(mp).get()
  const outgoingPayments = await mpPayments.search({ options: { 'payer.id': me.id! }})
  const incomingPayments = await mpPayments.search({ options: { 'collector.id': me.id! }})

  return {
    outgoingPayments,
    incomingPayments
  }
}

export default function Homepage() {
  const { outgoingPayments, incomingPayments } = useLoaderData<typeof loader>()

  return (
    <div className="h-full">
      <div className="container max-w-lg mx-auto p-8">
        <h2 className="text-3xl mb-4">Carniceria El Tori</h2>
        <Link to="/dashboard">Visit the dashboard &rarr;</Link>

        <pre>{JSON.stringify(incomingPayments, null, 2)}</pre>
        <hr />
        <hr />
        <hr />
        <hr />
        <hr />
        <hr />
        <hr />
        <hr />
        <hr />
        <hr />
        <pre>{JSON.stringify(outgoingPayments, null, 2)}</pre>
      </div>
    </div>
  );
}
