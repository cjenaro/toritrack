import { Link, useLoaderData, useFetcher, Form } from "react-router";
import { mp } from "~/utils/mercadopago.server";
import { Payment, User } from "mercadopago";
import { requireUserId } from "~/utils/auth.server";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { es } from "date-fns/locale/es";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { PaymentSearchResult } from "mercadopago/dist/clients/payment/search/types";
import { DatePickerWithRange } from "~/components/ui/date-picker";
import { Route } from "./+types/index";
import { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { differenceInMonths, formatDistance } from "date-fns";

const chartConfig = {
  incoming: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
  outgoing: {
    label: "Egresos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function groupByDate(data: PaymentSearchResult[]) {
  return data.reduce<{ [key: string]: number }>((acc, item) => {
    if (!item.date_approved) return acc;

    const date = new Date(item.date_approved).toISOString().split("T")[0]; // Extract the date (YYYY-MM-DD)

    // Initialize the date if not already present
    if (!acc[date]) {
      acc[date] = 0;
    }

    // Sum up the amounts
    acc[date] += item.transaction_amount || 0;
    return acc;
  }, {});
}

function combineIntoChartData(
  incomingPayments: PaymentSearchResult[],
  outgoingPayments: PaymentSearchResult[],
) {
  const incomingByDate = groupByDate(incomingPayments);
  const outgoingByDate = groupByDate(outgoingPayments);

  const allDates = new Set([
    ...Object.keys(incomingByDate),
    ...Object.keys(outgoingByDate),
  ]);

  const chartData = Array.from(allDates)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((date) => ({
      date,
      incoming: incomingByDate[date] || 0,
      outgoing: outgoingByDate[date] || 0,
    }));

  return chartData;
}

function calculateLastMonthlyTrend(
  chartData: { incoming: number; outgoing: number; date: string }[],
) {
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7); // e.g., "2024-01"
  const previousMonth = new Date(
    currentDate.setMonth(currentDate.getMonth() - 1),
  )
    .toISOString()
    .slice(0, 7); // e.g., "2023-12"

  // Sum up net revenue for the current and previous months
  const currentMonthNet = chartData
    .filter((item) => item.date.startsWith(currentMonth)) // Filter current month data
    .reduce((sum, item) => sum + item.incoming - item.outgoing, 0);

  const previousMonthNet = chartData
    .filter((item) => item.date.startsWith(previousMonth)) // Filter previous month data
    .reduce((sum, item) => sum + item.incoming - item.outgoing, 0);

  // Calculate percentage change
  let percentageChange: number;
  if (previousMonthNet === 0) {
    percentageChange = currentMonthNet > 0 ? 100 : -100; // Handle zero last month case
  } else {
    percentageChange =
      ((currentMonthNet - previousMonthNet) / previousMonthNet) * 100;
  }

  return percentageChange;
}

function datesAreAtLeastTwoMonths(date?: DateRange) {
  if (!date || !date.from || !date.to) return false;

  return differenceInMonths(date.from, date.to) >= 2;
}

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
      from,
      to,
    };

  const chartData = combineIntoChartData(
    incomingPayments.results,
    outgoingPayments.results,
  );

  return {
    percentageChange: calculateLastMonthlyTrend(chartData),
    chartData,
    from,
    to,
  };
}

function getFormattedDistance(date?: DateRange) {
  if (!date || !date.from || !date.to) return "12 meses";

  return formatDistance(date.from, date.to, { locale: es });
}

export default function Homepage() {
  const { error, chartData, percentageChange, from, to } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [date, setDate] = useState<DateRange | undefined>({ from, to });

  if (error) {
    return (
      <div>
        <h1>{error}</h1>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="container max-w-lg mx-auto p-8">
        <h2 className="text-3xl mb-4">Carniceria El Tori</h2>
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos Netos</CardTitle>
            <CardDescription>
              Mostrando {getFormattedDistance(date)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="incoming"
                  type="natural"
                  fill="var(--color-incoming)"
                  fillOpacity={0.4}
                  stroke="var(--color-incoming)"
                  stackId="a"
                />
                <Area
                  dataKey="outgoing"
                  type="natural"
                  fill="var(--color-outgoing)"
                  fillOpacity={0.4}
                  stroke="var(--color-outgoing)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                {percentageChange !== undefined &&
                datesAreAtLeastTwoMonths(date) ? (
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Estamos un {percentageChange}% por{" "}
                    {percentageChange >= 0 ? "arriba" : "debajo"} del mes
                    anterior
                    {percentageChange >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown />
                    )}
                  </div>
                ) : null}
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  <Form className="flex justify-between gap-4">
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
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
