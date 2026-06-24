/* global Deno */
export default async function handler(req) {
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

  if (!STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe secret key not configured" }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { clientId, serviceId, serviceName, priceGrosze, slotId } = body;

  if (!clientId || !priceGrosze) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "https://app.base44.com";
  const successUrl = `${origin}/platnosc?status=success&clientId=${clientId}`;
  const cancelUrl = `${origin}/platnosc?status=cancel&clientId=${clientId}&serviceId=${serviceId}&slotId=${slotId || ""}`;

  // Create a Stripe Checkout Session via REST API (no SDK needed)
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("payment_method_types[]", "card");
  params.append("line_items[0][price_data][currency]", "pln");
  params.append("line_items[0][price_data][unit_amount]", String(priceGrosze));
  params.append("line_items[0][price_data][product_data][name]", serviceName || "Konsultacja");
  params.append("line_items[0][quantity]", "1");
  params.append("client_reference_id", clientId);
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  // Enable BLIK, P24, etc. for Polish market
  params.append("payment_method_types[]", "blik");
  params.append("payment_method_types[]", "p24");

  // Add metadata
  params.append("metadata[clientId]", clientId);
  params.append("metadata[serviceId]", serviceId || "");
  params.append("metadata[slotId]", slotId || "");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await response.json();

  if (!response.ok) {
    console.error("Stripe error:", session);
    return Response.json({ error: session.error?.message || "Stripe error" }, { status: 400 });
  }

  return Response.json({ url: session.url, sessionId: session.id });
}