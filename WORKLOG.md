# MABC 2026 ML Checker 작업 로그

## 프로젝트 개요
- MABC 2026 결선 MVP: 예선 당선 스킬 ml-data-leakage-checker를 서비스화
- 마감: 2026-09-16(수) 18:00 KST, 발표: 2026-09-19(토) @ 한국과학기술회관
- 공개 GitHub + 독립 배포 URL 필요

## 기술 스택
- 백엔드: FastAPI (backend/)
- 프론트: Next.js 16 (ml-checker-ui/ml-checker-ui/)
- DB: MongoDB (Atlas 포함) — 아직 미사용/추후

## 현재 구현 상태

### 백엔드
- app/main.py: FastAPI 앱, CORS, /api/v1 라우터
- app/api/routes.py: POST /api/v1/analyze, POST /api/v1/analyze/file
- app/services/analyzer.py: 패턴/규칙 기반 판정 로직 (확정위반/의심/이상없음)
- 로컬: uvicorn으로 localhost:8000 기동 가능
- /health, /api/v1/analyze, /api/v1/analyze/file 응답 확인됨

### 프론트
- ml-checker-ui/ml-checker-ui/app/page.js: 메인 페이지 (코드 입력, 결과 표시)
- app/api/check/route.js: /api/check 라우터 (백엔드 호출 + 응답 변환)
- app/page.module.css: 스타일
- 로컬: npm run dev로 기동 가능 (현재 80번 포트에 기존 서버 있음)

## 한 일
- 백엔드 API 계약 문서 (docs/backend-api-contract.md)
- 백엔드 요약 문서 (docs/backend-summary.md)
- 프론트 계약 문서 (docs/frontend-contract.md)
- 온보딩 구조 문서 (docs/onboarding-structure.md)
- 백엔드 라우터/analyzer 코드 작성 및 수정
- 프론트 라우터 예외 처리 수정 (not-python/not-preprocessing/error 구분)
- 캐릭터 이미지 생성 (image/ 아래 webp 파일들)
- GitHub PR #6(백엔드), #7(프론트) 머지됨

## 미완료/남은 작업
- 백엔드 _validate_input 구분 정리:
  - 현재 ML 전처리 부족 케이스는 warnings로 들어가는데, 프론트 라우터는 not-preprocessing을 errors만 보고 판단하도록 수정됨
  - → 백엔드에서 전처리 부족 케이스를 errors로 넣어야 정합됨
- 백엔드 공개 배포 URL 미설정 (Vercel 프론트가 호출할 외부 URL 필요)
- Vercel 환경변수 NEXT_PUBLIC_BACKEND_URL 미설정
- 온보딩 UI 미구현 (문서 구조만 있음)
- 파일 업로드 프론트 UI 없음 (P1/추후 확장)
- 캐릭터 디자인 팀원 제공 후 반영 위치 준비

## 깃 레포
- https://github.com/ChoHyeonChan/2026-ml-checker
- PR #6, #7 머지됨
- 현재 로컬은 git 저장소가 아님 → 필요한 파일만 깃에 올리면 됨

## 파일 경로 (공유용)
- /workspace/ac36c343-e1f5-4ef6-9b90-ef7bd627c137/WORKLOG.md (이 파일)
- /workspace/ac36c343-e1f5-4ef6-9b90-ef7bd627c137/backend/
- /workspace/ac36c343-e1f5-4ef6-9b90-ef7bd627c137/ml-checker-ui/ml-checker-ui/
- /workspace/ac36c343-e1f5-4ef6-9b90-ef7bd627c137/docs/
- /workspace/ac36c343-e1f5-4ef6-9b90-ef7bd627c137/image/

## 다음 단계 (우선순위)
1. 백엔드 analyzer.py _validate_input 수정 (전처리 부족 → errors)
2. 백엔드 공개 배포 URL 준비 (Render/Railway/VPS 등)
3. Vercel 환경변수 NEXT_PUBLIC_BACKEND_URL 설정
4. Vercel 배포 테스트
5. 온보딩 UI 뼈대 구현 (선택)
6. 제출 산출물 준비 (PRD/포스터/발표자료/데모 영상)
