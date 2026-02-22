import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const BUCKET = "ohayou-anime-storage";

    const ext = file.name.split(".").pop() || "mp4";
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);
    const contentType = file.type || "video/mp4";

    // AWS Signature V4 for R2 PUT (no Node.js fs dependency)
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const region = "auto";
    const service = "s3";
    const encoder = new TextEncoder();

    async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    }

    async function sha256Hex(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
    }

    const payloadHash = await sha256Hex(body);
    const endpointUrl = new URL(R2_ENDPOINT);
    const host = endpointUrl.hostname;
    const putUrl = `${R2_ENDPOINT}/${BUCKET}/${key}`;

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = `PUT\n/${BUCKET}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const canonicalRequestHash = await sha256Hex(encoder.encode(canonicalRequest));

    const scope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalRequestHash}`;

    const kDate = await hmac(encoder.encode("AWS4" + R2_SECRET_ACCESS_KEY), dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, "aws4_request");
    const signatureBuffer = await hmac(kSigning, stringToSign);
    const signature = [...new Uint8Array(signatureBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");

    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const uploadRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Host": host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        "Authorization": authorization,
      },
      body: body,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`R2 upload failed (${uploadRes.status}): ${errText}`);
    }

    const publicUrl = `https://pub-4e3d2a977f8845e7b4585a44ad906f66.r2.dev/${key}`;

    return new Response(JSON.stringify({ url: publicUrl, key }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("R2 upload error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
