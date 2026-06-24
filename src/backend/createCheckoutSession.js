/* global Deno */
export default async function handler(req) {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

  const { clientId, serviceId, serviceName, amount, successUrl, cancelUrl } = req.body;

  if (!clientId || !amount) {
    return { error: 'Missing required fields' };
  }

  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('line_items[0][price_data][currency]', 'pln');
  params.append('line_items[0][price_data][product_data][name]', serviceName || 'Konsultacja');
  params.append('line_items[0][price_data][unit_amount]', String(amount));
  params.append('line_items[0][quantity]', '1');
  params.append('mode', 'payment');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);
  params.append('metadata[clientId]', clientId);
  params.append('metadata[serviceId]', serviceId || '');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const session = await response.json();

  if (session.error) {
    return { error: session.error.message };
  }

  return { url: session.url, sessionId: session.id };
}