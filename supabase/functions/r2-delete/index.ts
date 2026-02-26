import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { key } = await req.json();
    if (!key) {
      return new Response(JSON.stringify({ error: "key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const BUCKET = "ohayou-anime-storage";

    // Generate AWS Signature V4 for DELETE
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const region = "auto";
    const service = "s3";

    const encoder = new TextEncoder();

    async function hmac(k: ArrayBuffer, data: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    }

    async function sha256Hex(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    const endpointUrl = new URL(R2_ENDPOINT);
    const host = endpointUrl.hostname;
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;
    const payloadHash = await sha256Hex(encoder.encode(""));

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = `DELETE\n/${BUCKET}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const canonicalRequestHash = await sha256Hex(encoder.encode(canonicalRequest));

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalRequestHash}`;

    const kDate = await hmac(encoder.encode("AWS4" + R2_SECRET_ACCESS_KEY), dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, "aws4_request");
    const signatureBuffer = await hmac(kSigning, stringToSign);
    const signature = [...new Uint8Array(signatureBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const deleteRes = await fetch(`${R2_ENDPOINT}/${BUCKET}/${key}`, {
      method: "DELETE",
      headers: {
        "Host": host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorization,
      },
    });

    if (!deleteRes.ok && deleteRes.status !== 204 && deleteRes.status !== 404) {
      const text = await deleteRes.text();
      console.error("R2 delete failed:", deleteRes.status, text);
      return new Response(JSON.stringify({ error: `R2 delete failed (${deleteRes.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, key }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("R2 delete error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
