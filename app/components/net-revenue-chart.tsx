import { AreaChart, CartesianGrid, XAxis, Area } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { DateRange } from "react-day-picker";
import { differenceInMonths } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";

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

function datesAreAtLeastTwoMonths(date?: DateRange) {
  if (!date || !date.from || !date.to) return false;

  return Math.abs(differenceInMonths(date.from, date.to)) >= 2;
}

export default function NetRevenueChart({
  chartData,
  date,
  percentageChange,
}: {
  date?: DateRange;
  percentageChange?: number;
  chartData: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Ingresos Netos</CardTitle>
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
        <div className="flex w-full items-start gap-2 text-sm @container">
          <div className="grid gap-2 w-full">
            {percentageChange !== undefined &&
            datesAreAtLeastTwoMonths(date) ? (
              <div className="flex items-center gap-2 font-medium leading-none">
                Estamos un {percentageChange}% por{" "}
                {percentageChange >= 0 ? "arriba" : "debajo"} del mes anterior
                {percentageChange >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
