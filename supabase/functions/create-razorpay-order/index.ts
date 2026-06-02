import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    return jsonResponse({ error: "Razorpay credentials are not configured" }, 500);
  }

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const currency = body.currency || "INR";
    const receipt = body.receipt || `receipt_${Date.now()}`;

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ error: "A valid amount is required" }, 400);
    }

    const auth = btoa(`${keyId}:${keySecret}`);
    const razorpayResponse = await fetch(RAZORPAY_ORDERS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        receipt,
      }),
    });

    const data = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      return jsonResponse(
        { error: data?.error?.description || "Unable to create Razorpay order" },
        razorpayResponse.status,
      );
    }

    return jsonResponse({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to create Razorpay order" },
      500,
    );
  }
});
