import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/openapi/document";

export const dynamic = "force-static";

/** Serve the public OpenAPI 3.1 document. */
export function GET() {
  return NextResponse.json(openApiDocument, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
