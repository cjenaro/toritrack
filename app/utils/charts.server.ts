import { PaymentSearchResult } from "mercadopago/dist/clients/payment/search/types";

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

export function combineIntoChartData(
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

export function calculateLastMonthlyTrend(
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

const readablePaymentMethods = {
  account_money: "Dinero en cuenta",
  cvu: "Transferencia",
} as const;

export function prepareRevenueByPaymentMethod(
  incomingPayments: PaymentSearchResult[],
) {
  // Group by payment method
  const revenueByMethod = incomingPayments.reduce<Record<string, number>>(
    (acc, payment) => {
      if (!payment.payment_method_id) return acc;

      const method = readablePaymentMethods[payment.payment_method_id];
      if (method)
        acc[method] = (acc[method] || 0) + (payment?.transaction_amount || 0);
      return acc;
    },
    {},
  );

  return Object.entries(revenueByMethod).map(([method, amount]) => ({
    method,
    amount,
  }));
}

export function preparePaidToAccounts(outgoingPayments: PaymentSearchResult[]) {
  const groupedPayments = outgoingPayments.reduce(
    (acc, payment) => {
      const {
        /* @ts-expect-error */
        collector,
        transaction_amount = 0,
        description = "",
      } = payment;
      const collector_id = collector?.id;
      if (!collector_id) return acc;

      if (!acc[collector_id]) {
        // Initialize the group with the first description and amount
        acc[collector_id] = { amount: 0, description };
      }

      // Accumulate the amount
      acc[collector_id].amount += transaction_amount;

      return acc;
    },
    {} as Record<string, { amount: number; description: string }>,
  );

  return Object.entries(groupedPayments).map(([id, data]) => ({
    id,
    amount: data.amount,
    description: data.description,
  }));
}
