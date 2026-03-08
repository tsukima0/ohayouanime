import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { videoUrl, fileName } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "videoUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the R2 key from the public URL
    const publicPrefix = "https://pub-4e3d2a977f8845e7b4585a44ad906f66.r2.dev/";
    if (!videoUrl.startsWith(publicPrefix)) {
      return new Response(JSON.stringify({ error: "Unsupported URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = videoUrl.slice(publicPrefix.length);
    const BUCKET = "ohayou-anime-storage";
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;

    const encoder = new TextEncoder();

    async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey(
        "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    }

    async function sha256Hex(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
    }

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const region = "auto";
    const service = "s3";
    const expiresIn = 3600;

    const endpointUrl = new URL(R2_ENDPOINT);
    const host = endpointUrl.hostname;
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;

    const disposition = `attachment; filename="${(fileName || "video.mp4").replace(/"/g, '\\"')}"`;

    const queryParams = new URLSearchParams();
    queryParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    queryParams.set("X-Amz-Credential", `${R2_ACCESS_KEY_ID}/${scope}`);
    queryParams.set("X-Amz-Date", amzDate);
    queryParams.set("X-Amz-Expires", String(expiresIn));
    queryParams.set("X-Amz-SignedHeaders", "host");
    queryParams.set("response-content-disposition", disposition);

    const sortedParams = new URLSearchParams(
      [...queryParams.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
    const canonicalQueryString = sortedParams.toString();

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = "host";
    const payloadHash = "UNSIGNED-PAYLOAD";

    const canonicalRequest = `GET\n/${BUCKET}/${key}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const canonicalRequestHash = await sha256Hex(encoder.encode(canonicalRequest));

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalRequestHash}`;

    const kDate = await hmac(encoder.encode("AWS4" + R2_SECRET_ACCESS_KEY), dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, "aws4_request");
    const signatureBuffer = await hmac(kSigning, stringToSign);
    const signature = [...new Uint8Array(signatureBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");

    const downloadUrl = `${R2_ENDPOINT}/${BUCKET}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

    return new Response(JSON.stringify({ downloadUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Download proxy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
