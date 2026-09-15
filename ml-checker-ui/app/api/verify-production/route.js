import { NextResponse as NR_from_server } from "next/server";

const NextResponse =
  typeof globalThis !== "undefined" && globalThis.__TEST__ && globalThis.NextResponse
    ? globalThis.NextResponse
    : NR_from_server;

export async function GET() {
  return NextResponse.json({
    deployed_sha: "2b3438f58141b8976aff9c5a6f5d19abc203a887",
    env_backend_url: process.env.NEXT_PUBLIC_BACKEND_URL || null,
  });
}
