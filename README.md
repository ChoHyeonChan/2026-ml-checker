diff --git a/README.md b/README.md
index 2284b11..NewPREVIEW 100644
--- a/README.md
+++ b/README.md
@@ -1,4 +1,9 @@
-# Rebuild trigger after CSS selector fix v2
+# 2026-ml-checker

-## Leakage Check 레이아웃 수정 이력
+ML 전처리 코드에서 데이터 누수(data leakage) 의심 패턴을 줄 번호 + 수정 방향 위주로 확인하는 서비스입니다.

-- PR #35 머지: 전체화면 깨짐 수정
-- 이후 메인 브랜치에 여러 CSS 수정 커밋 반영
-- 좁은 화면 헤더 버튼 줄바꿈, 안내 카드 잘림, 과도한 공백 문제 대응
+## 링크

-## 현재 상태
+- 프론트엔드(Vercel): https://2026-ml-checker.vercel.app/
+- 백엔드(Render): https://two026-ml-checker.onrender.com/

-- 코드: main 브랜치 최신 반영됨
-- 배포: 최신 커밋 기준 재배포 필요
+## 저장소 구조

+- `/ml-checker-ui/`: Vite + Next.js 기반 프론트엔드
+- `/backend/`: FastAPI 기반 백엔드
+- 백엔드 `main` 브랜치 → Render 자동 배포
+- 프론트엔드 `ml-checker-ui` 브랜치 → Vercel 자동 배포

+## 배포 흐름

+- 프론트엔드는 Vercel `ml-checker-ui` 브랜치를 보고 있음
+- 백엔드는 Render `main` 브랜치를 보고 있음
+- 프론트 `page.js`에서 백엔드 CORS 허용 Origin을 통해 `/api/v1/analyze`, `/api/v1/analyze/file` 호출
+- 백엔드 API 키(`SOLAR_API_KEY`) 설정 시 LLM 설명(`llm_explanation`) 응답 생성

+## 검사 결과 화면 수정

+- 검사 결과표 글씨가 흰색 배경에 묻히던 문제를 검은색/초록색 계열 글씨로 변경
+- 검사 결과에서 "몇번째 줄 보기" 버튼 클릭 시 해당 줄로 이동하고, 여러 항목을 각각 눌렀을 때 각각 형광펜 표시되도록 적용
+- 코드 영역 기본 글씨 색을 검은색, AI 설명/항목 라벨/설명 등 주요 텍스트 대비를 높여 가독성 개선

+## 브랜치

+- `main`: 백엔드 기준, Render 배포 대상
+- `ml-checker-ui` (또는 `feat/ml-checker-ui*`): 프론트엔드 기준, Vercel 배포 대상
+- `feat/backend-mvp-p0`: 백엔드 MVP 초기 PR 브랜치
+- `feat/backend-routes-and-vercel-setup`: 백엔드 Vercel 설정 PR 브랜치
