import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get("url");

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "url parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the video from the origin
    const upstream = await fetch(videoUrl);

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
        {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contentLength = upstream.headers.get("content-length");
    const contentType = upstream.headers.get("content-type") || "video/mp4";

    const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Access-Control-Expose-Headers": "Content-Length, Content-Type, X-Content-Length",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
      headers["X-Content-Length"] = contentLength;
    }

    return new Response(upstream.body, { headers });
  } catch (err) {
    console.error("Download proxy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
