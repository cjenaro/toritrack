import { MercadoPagoConfig } from "mercadopago";
import { remember } from "@epic-web/remember";

export const mp = remember(
  "mp",
  () =>
    new MercadoPagoConfig({
      // TODO: verify exists
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
      options: { timeout: 5000, idempotencyKey: "abc" },
    }),
);
