import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-r2-action, x-r2-key, x-r2-upload-id, x-r2-part-number, x-r2-content-type, x-r2-folder, x-r2-filename, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Expose-Headers": "x-r2-etag",
};

const BUCKET = "ohayou-anime-storage";

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
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    async function signRequest(method: string, path: string, queryParams: URLSearchParams, headers: Record<string, string>, payloadHash: string) {
      const now = new Date();
      const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
      const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
      const region = "auto";
      const service = "s3";
      const scope = `${dateStamp}/${region}/${service}/aws4_request`;

      const endpointUrl = new URL(R2_ENDPOINT);
      const host = endpointUrl.hostname;

      headers["host"] = host;
      headers["x-amz-date"] = amzDate;
      headers["x-amz-content-sha256"] = payloadHash;

      const sortedHeaderKeys = Object.keys(headers).sort();
      const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
      const signedHeaders = sortedHeaderKeys.join(";");

      const sortedParams = new URLSearchParams([...queryParams.entries()].sort((a, b) => a[0].localeCompare(b[0])));
      const canonicalQueryString = sortedParams.toString();

      const canonicalRequest = `${method}\n${path}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
      const canonicalRequestHash = await sha256Hex(encoder.encode(canonicalRequest));
      const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalRequestHash}`;

      const kDate = await hmac(encoder.encode("AWS4" + R2_SECRET_ACCESS_KEY), dateStamp);
      const kRegion = await hmac(kDate, region);
      const kService = await hmac(kRegion, service);
      const kSigning = await hmac(kService, "aws4_request");
      const signatureBuffer = await hmac(kSigning, stringToSign);
      const signature = [...new Uint8Array(signatureBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

      return {
        authorization: `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        amzDate,
        host,
      };
    }

    // ──── Check for binary upload-part via PUT method ────
    if (req.method === "PUT") {
      const key = req.headers.get("x-r2-key");
      const uploadId = req.headers.get("x-r2-upload-id");
      const partNumber = req.headers.get("x-r2-part-number");
      const ct = req.headers.get("x-r2-content-type") || "application/octet-stream";

      if (!key || !uploadId || !partNumber) {
        return new Response(JSON.stringify({ error: "Missing x-r2-key, x-r2-upload-id, or x-r2-part-number headers" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const path = `/${BUCKET}/${key}`;
      const chunkData = new Uint8Array(await req.arrayBuffer());
      const payloadHash = await sha256Hex(chunkData);

      const headers: Record<string, string> = { "content-type": ct };
      const queryParams = new URLSearchParams({ partNumber, uploadId });

      const sig = await signRequest("PUT", path, queryParams, headers, payloadHash);

      const url = `${R2_ENDPOINT}${path}?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`;
      const r2Res = await fetch(url, {
        method: "PUT",
        headers: {
          "content-type": ct,
          "host": sig.host,
          "x-amz-date": sig.amzDate,
          "x-amz-content-sha256": payloadHash,
          Authorization: sig.authorization,
        },
        body: chunkData,
      });

      if (!r2Res.ok) {
        const text = await r2Res.text();
        console.error(`UploadPart ${partNumber} failed:`, text);
        throw new Error(`UploadPart ${partNumber} failed (${r2Res.status})`);
      }

      const etag = r2Res.headers.get("ETag") || `"part-${partNumber}"`;

      return new Response(
        JSON.stringify({ etag }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "x-r2-etag": etag } }
      );
    }

    // ──── JSON actions via POST ────
    const body = await req.json();
    const { action } = body;

    // ──────── ACTION: create (InitiateMultipartUpload) ────────
    if (action === "create") {
      const { fileName, contentType, folder } = body;
      const ext = fileName.split(".").pop() || "mp4";
      const key = `${folder || "episodes"}/${crypto.randomUUID()}.${ext}`;
      const ct = contentType || "video/mp4";
      const path = `/${BUCKET}/${key}`;

      const headers: Record<string, string> = { "content-type": ct };
      const queryParams = new URLSearchParams({ uploads: "" });
      const payloadHash = await sha256Hex(new Uint8Array(0));

      const sig = await signRequest("POST", path, queryParams, headers, payloadHash);

      const url = `${R2_ENDPOINT}${path}?uploads=`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": ct,
          "host": sig.host,
          "x-amz-date": sig.amzDate,
          "x-amz-content-sha256": payloadHash,
          Authorization: sig.authorization,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("InitiateMultipartUpload failed:", text);
        throw new Error(`InitiateMultipartUpload failed (${res.status})`);
      }

      const xml = await res.text();
      const uploadIdMatch = xml.match(/<UploadId>(.+?)<\/UploadId>/);
      if (!uploadIdMatch) throw new Error("No UploadId in response");

      const publicUrl = `https://pub-4e3d2a977f8845e7b4585a44ad906f66.r2.dev/${key}`;

      return new Response(
        JSON.stringify({ uploadId: uploadIdMatch[1], key, publicUrl, contentType: ct }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────── ACTION: complete (CompleteMultipartUpload) ────────
    if (action === "complete") {
      const { key, uploadId, parts } = body;
      const path = `/${BUCKET}/${key}`;

      const xmlParts = parts
        .sort((a: any, b: any) => a.partNumber - b.partNumber)
        .map((p: any) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
        .join("");
      const xmlBody = `<CompleteMultipartUpload>${xmlParts}</CompleteMultipartUpload>`;
      const bodyBytes = encoder.encode(xmlBody);
      const payloadHash = await sha256Hex(bodyBytes);

      const headers: Record<string, string> = { "content-type": "application/xml" };
      const queryParams = new URLSearchParams({ uploadId });

      const sig = await signRequest("POST", path, queryParams, headers, payloadHash);

      const url = `${R2_ENDPOINT}${path}?uploadId=${encodeURIComponent(uploadId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/xml",
          "host": sig.host,
          "x-amz-date": sig.amzDate,
          "x-amz-content-sha256": payloadHash,
          Authorization: sig.authorization,
        },
        body: bodyBytes,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("CompleteMultipartUpload failed:", text);
        throw new Error(`CompleteMultipartUpload failed (${res.status})`);
      }

      const publicUrl = `https://pub-4e3d2a977f8845e7b4585a44ad906f66.r2.dev/${key}`;

      return new Response(
        JSON.stringify({ publicUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────── ACTION: abort (AbortMultipartUpload) ────────
    if (action === "abort") {
      const { key, uploadId } = body;
      const path = `/${BUCKET}/${key}`;
      const payloadHash = await sha256Hex(new Uint8Array(0));

      const headers: Record<string, string> = {};
      const queryParams = new URLSearchParams({ uploadId });

      const sig = await signRequest("DELETE", path, queryParams, headers, payloadHash);

      const url = `${R2_ENDPOINT}${path}?uploadId=${encodeURIComponent(uploadId)}`;
      await fetch(url, {
        method: "DELETE",
        headers: {
          "host": sig.host,
          "x-amz-date": sig.amzDate,
          "x-amz-content-sha256": payloadHash,
          Authorization: sig.authorization,
        },
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: create, complete, abort (POST) or PUT for upload-part" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("r2-multipart error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
