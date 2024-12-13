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
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function PaymentMethodsChart({ chartData }: { chartData: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por tipo de pago</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="method"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              hide
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, _name, item) =>
                    `${item.payload.method} $${value.toLocaleString("es-AR")}`
                  }
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
