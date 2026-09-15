import { NextResponse as NR_from_server } from "next/server";

const NextResponse =
  typeof globalThis !== "undefined" && globalThis.__TEST__ && globalThis.NextResponse
    ? globalThis.NextResponse
    : NR_from_server;

export async function GET() {
  return NextResponse.json({
    deployed_sha: "0b4ede204aaec97b19d0dc9865de89cdab61b5f8",
    env_backend_url: process.env.NEXT_PUBLIC_BACKEND_URL || null,
  });
}
