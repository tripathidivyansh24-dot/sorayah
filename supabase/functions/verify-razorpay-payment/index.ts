import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

async function hmacSha256(message: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!keySecret) {
    return jsonResponse({ error: "Razorpay secret is not configured" }, 500);
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: "Missing Razorpay payment verification fields" }, 400);
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256(payload, keySecret);

    if (expectedSignature !== razorpay_signature) {
      return jsonResponse({ success: false, error: "Payment signature verification failed" }, 400);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to verify Razorpay payment" },
      500,
    );
  }
});
