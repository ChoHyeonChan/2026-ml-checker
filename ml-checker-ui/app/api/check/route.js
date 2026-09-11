import { NextResponse } from "next/server";

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

    // 이후 실제 검사 연동 시 여기서 code를 검사기에 전달
    return NextResponse.json({
      badge: "결과 준비 중",
      items: [
        {
          line: "[12]",
          verdict: "의심",
          desc: "split 경계 대비 fit 호출 위치가 불명확합니다.",
          fix: "fit은 train만 기준으로, test/val은 transform/predict만 사용하세요.",
        },
      ],
      note: "업로드된 파일로 검사 요청을 받았습니다. 실제 검사 연동 시 결과가 여기에 표시됩니다.",
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

  return NextResponse.json({
    badge: "결과 준비 중",
    items: [
      {
        line: "[12]",
        verdict: "의심",
        desc: "split 경계 대비 fit 호출 위치가 불명확합니다.",
        fix: "fit은 train만 기준으로, test/val은 transform/predict만 사용하세요.",
      },
    ],
    note: "이 응답은 예시 구조입니다. 실제 검사 결과가 연동되면 여기에 분류/줄 번호/수정 방향이 표시됩니다.",
  });
}
