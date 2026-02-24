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
    // Authenticate
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

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
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
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { fileName, contentType, folder } = body;

    if (!fileName) {
      return new Response(JSON.stringify({ error: "fileName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const BUCKET = "ohayou-anime-storage";

    const ext = fileName.split(".").pop() || "mp4";
    const key = `${folder || "episodes"}/${crypto.randomUUID()}.${ext}`;
    const ct = contentType || "video/mp4";

    // Generate presigned PUT URL using AWS Signature V4 query string
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const region = "auto";
    const service = "s3";
    const expiresIn = 3600; // 1 hour

    const encoder = new TextEncoder();

    async function hmac(
      key: ArrayBuffer,
      data: string
    ): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    }

    async function sha256Hex(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    const endpointUrl = new URL(R2_ENDPOINT);
    const host = endpointUrl.hostname;
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;

    // For presigned URLs, payload hash is UNSIGNED-PAYLOAD
    const payloadHash = "UNSIGNED-PAYLOAD";

    // Query parameters for presigned URL (must be sorted)
    const queryParams = new URLSearchParams();
    queryParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    queryParams.set(
      "X-Amz-Credential",
      `${R2_ACCESS_KEY_ID}/${scope}`
    );
    queryParams.set("X-Amz-Date", amzDate);
    queryParams.set("X-Amz-Expires", String(expiresIn));
    queryParams.set("X-Amz-SignedHeaders", "content-type;host");

    // Sort query params for canonical request
    const sortedParams = new URLSearchParams(
      [...queryParams.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
    const canonicalQueryString = sortedParams.toString();

    const canonicalHeaders = `content-type:${ct}\nhost:${host}\n`;
    const signedHeaders = "content-type;host";

    const canonicalRequest = `PUT\n/${BUCKET}/${key}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const canonicalRequestHash = await sha256Hex(
      encoder.encode(canonicalRequest)
    );

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalRequestHash}`;

    const kDate = await hmac(
      encoder.encode("AWS4" + R2_SECRET_ACCESS_KEY),
      dateStamp
    );
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, "aws4_request");
    const signatureBuffer = await hmac(kSigning, stringToSign);
    const signature = [...new Uint8Array(signatureBuffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const presignedUrl = `${R2_ENDPOINT}/${BUCKET}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
    const publicUrl = `https://pub-4e3d2a977f8845e7b4585a44ad906f66.r2.dev/${key}`;

    return new Response(
      JSON.stringify({ presignedUrl, publicUrl, key, contentType: ct }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Presign error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
