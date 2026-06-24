/* global Deno */
import { base44 } from "@/api/base44Client";

export default async function handler(req) {
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const sigHeader = req.headers.get("stripe-signature");

  if (!sigHeader) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const sigParts = sigHeader.split(",");
  const tPart = sigParts.find(p => p.startsWith("t="));
  const v1Part = sigParts.find(p => p.startsWith("v1="));

  if (!tPart || !v1Part) {
    return Response.json({ error: "Invalid signature format" }, { status: 400 });
  }

  const timestamp = tPart.slice(2);
  const receivedSig = v1Part.slice(3);
  const signedPayload = `${timestamp}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (expectedSig !== receivedSig) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return Response.json({ error: "Timestamp too old" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clientId = session.client_reference_id || session.metadata?.clientId;
    const slotId = session.metadata?.slotId;
    const sessionId = session.id;
    const amountPaid = session.amount_total;

    if (clientId) {
      try {
        await base44.entities.Client.update(clientId, {
          paymentStatus: "paid",
          stripeSessionId: sessionId,
          amountPaid: amountPaid,
        });
        console.log(`✓ Client ${clientId} marked as paid. Session: ${sessionId}`);
      } catch (e) {
        console.error("Failed to update client:", e);
      }
    }

    if (slotId) {
      try {
        await base44.entities.AvailableSlot.update(slotId, {
          isBooked: true,
          bookedByClientId: clientId || "",
        });
        console.log(`✓ Slot ${slotId} marked as booked by client ${clientId}`);
      } catch (e) {
        console.error("Failed to update slot:", e);
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const clientId = session.client_reference_id || session.metadata?.clientId;
    const slotId = session.metadata?.slotId;

    if (clientId) {
      try {
        await base44.entities.Client.update(clientId, { paymentStatus: "failed" });
        console.log(`✗ Client ${clientId} payment expired`);
      } catch (e) {
        console.error("Failed to update client on expiry:", e);
      }
    }

    if (slotId) {
      try {
        await base44.entities.AvailableSlot.update(slotId, {
          isBooked: false,
          bookedByClientId: "",
        });
        console.log(`↩ Slot ${slotId} unlocked after expired session`);
      } catch (e) {
        console.error("Failed to unlock slot:", e);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    const metadata = pi.metadata || {};
    const clientId = metadata.clientId;
    const slotId = metadata.slotId;

    if (clientId) {
      try {
        await base44.entities.Client.update(clientId, { paymentStatus: "failed" });
      } catch (e) {
        console.error("Failed to update client on payment_failed:", e);
      }
    }

    if (slotId) {
      try {
        await base44.entities.AvailableSlot.update(slotId, {
          isBooked: false,
          bookedByClientId: "",
        });
      } catch (e) {
        console.error("Failed to unlock slot on payment_failed:", e);
      }
    }
  }

  return Response.json({ received: true });
}
