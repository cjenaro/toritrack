import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
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

const chartConfig = {
  amount: {
    label: "Pagado",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function PaidToChart({ chartData }: { chartData: any }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Pagos realizados</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey="amount"
              type="number"
              axisLine={false}
              tickFormatter={(value) => {
                return `$${value.toLocaleString("es-AR")}`;
              }}
            />
            <XAxis
              dataKey="account"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, _, entry) => [
                    new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(value), // Localized amount
                    entry.payload.description, // Description as the label
                  ]}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
