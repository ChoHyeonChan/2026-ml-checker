import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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

function looksLikeMlPreprocessing(src) {
  const low = src.toLowerCase();
  const hints = [
    "fit", "transform", "fit_transform", "train_test_split",
    "target", "le", "encoder", "scaler", "normali", "standard",
    "onehot", "get_dummies", "label", "cross", "cvs", "pipeline",
    "column", "select", "preprocess", "impute",
  ];
  return hints.some((h) => low.includes(h));
}

function classifyFromBackend(resp) {
  const classification = resp.classification || "이상없음";
  const summary = resp.summary || { 확정위반: 0, 의심: 0, 이상없음: 0 };

  if (resp.errors && resp.errors.length > 0) {
    const badge =
      summary.확정위반 > 0
        ? `확정위반 ${summary.확정위반}건`
        : summary.의심 > 0
        ? `의심 ${summary.의심}건`
        : "이상없음";
    return {
      type: "error",
      badge,
      items: [],
      note: (resp.errors || []).join(" \n ") + (resp.message ? " \n " + resp.message : ""),
    };
  }

  const badge =
    summary.확정위반 > 0
      ? `확정위반 ${summary.확정위반}건`
      : summary.의심 > 0
      ? `의심 ${summary.의심}건`
      : "이상없음";

  const items = (resp.results || []).map((it) => ({
    line: it.line ?? "",
    verdict: it.type || "의심",
    desc: it.reason || "",
    fix: it.fix_suggestion || "",
  }));

  const note = [];
  if (resp.message) note.push(resp.message);
  if (resp.warnings) note.push(...resp.warnings);

  return {
    type: classification === "이상없음" ? "ok" : "judgment",
    badge,
    items,
    note: note.join(" \n ") || null,
    summary,
  };
}

export async function POST(req) {
  const contentType = req.headers.get("content-type") || "";

  // 파일 업로드인 경우
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

    if (!looksLikeMlPreprocessing(code)) {
      return NextResponse.json({ type: "not-preprocessing" });
    }

    // 백엔드 연동 가능하면 백엔드로 전달
    if (BACKEND_URL) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/analyze/file`, {
          method: "POST",
          headers: { "Content-Type": "multipart/form-data" },
          body: await makeFormData(file),
        });
        const data = await res.json();
        if (!res.ok) {
          return NextResponse.json({
            type: "error",
            message: data.message || data.detail || "백엔드 검사 중 오류가 발생했습니다.",
            note: data.errors ? data.errors.join(" \n ") : null,
          });
        }
        return NextResponse.json(classifyFromBackend(data));
      } catch {
        return NextResponse.json({
          type: "error",
          message: "백엔드 연결 중 오류가 발생했습니다.",
        });
      }
    }

    // 백엔드가 없으면 프론트 기본 판정만 반환
    return NextResponse.json({
      type: "not-connected",
      badge: "백엔드 미연결",
      note: "백엔드 URL이 설정되지 않아 실제 검사 결과를 표시할 수 없습니다.",
    });
  }

  // 코드 직접 입력인 경우
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

  if (!looksLikeMlPreprocessing(code)) {
    return NextResponse.json({ type: "not-preprocessing" });
  }

  // 백엔드 연동
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({
          type: "error",
          message: data.message || data.detail || "백엔드 검사 중 오류가 발생했습니다.",
          note: data.errors ? data.errors.join(" \n ") : null,
        });
      }
      return NextResponse.json(classifyFromBackend(data));
    } catch {
      return NextResponse.json({
        type: "error",
        message: "백엔드 연결 중 오류가 발생했습니다.",
      });
    }
  }

  return NextResponse.json({
    type: "not-connected",
    badge: "백엔드 미연결",
    note: "백엔드 URL이 설정되지 않아 실제 검사 결과를 표시할 수 없습니다.",
  });
}

function makeFormData(file) {
  const form = new FormData();
  form.append("file", file);
  return form;
}
