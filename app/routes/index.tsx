import { useLoaderData, Form } from "react-router";
import { mp } from "~/utils/mercadopago.server";
import { Payment, User } from "mercadopago";
import { requireUserId } from "~/utils/auth.server";
import { es } from "date-fns/locale/es";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import { DatePickerWithRange } from "~/components/ui/date-picker";
import { Route } from "./+types/index";
import { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { formatDistance } from "date-fns";
import {
  calculateLastMonthlyTrend,
  combineIntoChartData,
  preparePaidToAccounts,
  prepareRevenueByPaymentMethod,
} from "~/utils/charts.server";
import PaymentMethodsChart from "~/components/bar-chart";
import NetRevenueChart from "~/components/net-revenue-chart";
import PaidToChart from "~/components/paid-to-chart";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserId(request);

  const searchParams = new URLSearchParams(request.url);

  let from = new Date();
  let to = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const spFrom = searchParams.get("from");
  const spTo = searchParams.get("to");

  if (spFrom) from = new Date(spFrom);
  if (spTo) to = new Date(spTo);

  const mpPayments = new Payment(mp);
  const me = await new User(mp).get();
  const outgoingPayments = await mpPayments.search({
    options: {
      "payer.id": me.id!,
      begin_date: from.toISOString(),
      end_date: to.toISOString(),
    },
  });
  const incomingPayments = await mpPayments.search({
    options: {
      "collector.id": me.id!,
      begin_date: from.toISOString(),
      end_date: to.toISOString(),
    },
  });

  if (!incomingPayments?.results || !outgoingPayments?.results)
    return {
      error: "No se pudieron cargar los datos de mercado pago",
      chartData: [],
      barChartData: [],
      from,
      to,
    };

  const chartData = combineIntoChartData(
    incomingPayments.results,
    outgoingPayments.results,
  );

  const barChartData = prepareRevenueByPaymentMethod(incomingPayments.results);
  const paidToChartDate = preparePaidToAccounts(outgoingPayments.results);

  return {
    percentageChange: calculateLastMonthlyTrend(chartData),
    chartData,
    barChartData,
    paidToChartDate,
    from,
    to,
  };
}

function getFormattedDistance(date?: DateRange) {
  if (!date || !date.from || !date.to) return "12 meses";

  return formatDistance(date.from, date.to, { locale: es });
}

export default function Homepage() {
  const {
    error,
    paidToChartDate,
    chartData,
    percentageChange,
    from,
    to,
    barChartData,
  } = useLoaderData<typeof loader>();
  const [date, setDate] = useState<DateRange | undefined>({ from, to });

  if (error) {
    /* TODO: nice error showing */
    return (
      <div>
        <h1>{error}</h1>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="container mx-auto p-8 ">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Tendencia de Ingresos Netos</CardTitle>
            <CardDescription>
              Mostrando {getFormattedDistance(date)}
              <Form className="flex justify-between gap-4 flex-col flex-grow @sm:flex-row">
                <DatePickerWithRange
                  defaults={{ from, to }}
                  onChange={(date?: DateRange) => setDate(date)}
                />
                {/* For some reason params need the first one that will be null anyways */}
                <input type="hidden" name="holder" value={"null"} />
                <input
                  type="hidden"
                  name="from"
                  value={date?.from?.toISOString().slice(0, 10)}
                />
                <input
                  type="hidden"
                  name="to"
                  value={date?.to?.toISOString().slice(0, 10)}
                />
                <Button>Enviar</Button>
              </Form>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            <NetRevenueChart
              date={date}
              chartData={chartData}
              percentageChange={percentageChange}
            />
            <PaymentMethodsChart chartData={barChartData} />
            <PaidToChart chartData={paidToChartDate} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
