import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8004";

function extractPyFromIpynb(source) {
  try {
    const nb = JSON.parse(source);
    const cells = nb?.cells || [];
    const parts = [];
    for (const cell of cells) {
      if (cell?.cell_type !== "code") continue;
      const s = Array.isArray(cell.source) ? cell.source.join("") : cell.source || "";
      parts.push(s);
    }
    return parts.join("\n\n");
  } catch {
    return null;
  }
}

function isPyLike(src) {
  return /^\s*(def|class|import|from|if|elif|else|for|while|return|print|with|try|except|raise|lambda|yield|assert|#)/m.test(src);
}

async function callBackend(path, options) {
  const url = `${BACKEND_BASE}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return { type: "error", note: `백엔드 오류 (${res.status})` };
    }
    return await res.json();
  } catch (e) {
    return { type: "error", note: "백엔드에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요." };
  }
}

function mapBackendToFrontend(backendResp) {
  if (!backendResp || typeof backendResp !== "object") {
    return { type: "error", note: "잘못된 백엔드 응답" };
  }
  const { type, badge, items, note, classification, summary } = backendResp;
  return {
    type: type || "error",
    badge: badge || "결과 없음",
    items: Array.isArray(items) ? items : [],
    note: note || "",
    classification: classification || "이상없음",
    summary: summary || { 확정위반: 0, 의심: 0, 이상없음: 0 },
  };
}

export async function POST(req) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.startsWith("multipart/")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file.size === "undefined") {
      return NextResponse.json({ type: "empty" });
    }

    const name = (file.name || "").toLowerCase();
    let raw;
    try {
      raw = await file.text();
    } catch {
      return NextResponse.json({ type: "empty" });
    }

    let code = "";

    if (name.endsWith(".ipynb")) {
      code = extractPyFromIpynb(raw);
      if (!code) {
        return NextResponse.json({ type: "not-python" });
      }
    } else if (name.endsWith(".py")) {
      code = raw;
    } else {
      return NextResponse.json({ type: "not-python" });
    }

    if (!code.trim()) {
      return NextResponse.json({ type: "empty" });
    }

    if (!isPyLike(code)) {
      return NextResponse.json({ type: "not-python" });
    }

    const backendForm = new FormData();
    backendForm.append("file", new Blob([raw]), file.name);
    const backendResp = await callBackend("/api/v1/analyze/file", {
      method: "POST",
      body: backendForm,
    });
    return NextResponse.json(mapBackendToFrontend(backendResp));
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ type: "empty" });
  }

  const code = body.code ?? "";
  if (!code.trim()) {
    return NextResponse.json({ type: "empty" });
  }

  if (!isPyLike(code)) {
    return NextResponse.json({ type: "not-python" });
  }

  const backendResp = await callBackend("/api/v1/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return NextResponse.json(mapBackendToFrontend(backendResp));
}
