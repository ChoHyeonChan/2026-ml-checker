import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req) {
  const body = await req.json();
  const code = body.code ?? "";

  if (!code.trim()) {
    return NextResponse.json({ type: "empty" });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json({
        type: "error",
        note: errBody.detail ?? "백엔드 요청 중 문제가 생겼습니다.",
      });
    }

    const data = await res.json();
    const { classification, summary, results, message, warnings, errors } = data;

    const isPythonIssue = errors.some((e) =>
      /코드로 보이지 않습니다|파이썬|python/i.test(e)
    );
    const isPreprocessingIssue = errors.some((e) =>
      /ML 전처리|전처리 코드|preprocessing/i.test(e)
    );

    if (errors && errors.length > 0) {
      if (isPythonIssue) {
        return NextResponse.json({
          type: "not-python",
          note: errors.join(" ") || "분석할 수 없습니다.",
          badge: "분석 불가",
          items: [],
        });
      }
      if (isPreprocessingIssue) {
        return NextResponse.json({
          type: "not-preprocessing",
          note: errors.join(" ") || "분석할 수 없습니다.",
          badge: "분석 불가",
          items: [],
        });
      }
      return NextResponse.json({
        type: "error",
        note: errors.join(" ") || "분석할 수 없습니다.",
        badge: "분석 불가",
        items: [],
      });
    }

    const note = warnings && warnings.length > 0
      ? warnings.join(" ") + (message ? " " + message : "")
      : message ?? "";

    const items = (results || []).map((r) => ({
      line: "[" + r.line + "]",
      verdict: r.type,
      desc: r.reason ?? "",
      fix: r.fix_suggestion ?? "",
    }));

    let badge;
    if (classification === "확정위반") {
      badge = summary.확정위반 + "건 확정위반";
    } else if (classification === "의심") {
      badge = summary.의심 + "건 의심";
    } else {
      badge = "이상없음";
    }

    return NextResponse.json({
      type: "judgment",
      badge,
      items,
      note,
    });
  } catch (e) {
    return NextResponse.json({
      type: "error",
      note: "검사 실행 중 문제가 생겼습니다.",
    });
  }
}

