import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const code = body.code ?? "";

  if (!code.trim()) {
    return NextResponse.json({ type: "empty" });
  }

  // 실제 검사 실행 전에는 예시 응답 구조로 UI 동작만 확인한다.
  // 백엔드 연동 이후에는 이 라우트가 검사 결과를 반환하도록 교체한다.
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
