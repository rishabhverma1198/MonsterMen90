import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const payload = await req.json();

  // Example: Razorpay webhook
  if (payload.event === "payment.captured") {
    const order = payload.payload.payment.entity;

    await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        total_amount: order.amount / 100,
        payment_status: "PAID",
        store_id: order.notes.store_id,
      }),
    });
  }

  return new Response("ok");
});
