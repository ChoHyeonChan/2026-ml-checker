# 프론트 계약 (MVP P0)

## 기본
- 프론트: Vite + Next.js (ml-checker-ui/)
- 백엔드: FastAPI (backend/)
- 개발/테스트: 프론트 localhost, 백엔드 localhost:8000
- 배포: 독립 배포 공개 URL 필수(로컬/타임리 공유 링크 불가)

## 요청
- 프론트 → 백엔드
  - POST /api/v1/analyze
    - body: { code: string }
  - POST /api/v1/analyze/file
    - multipart/form-data, file

## 프론트 표시 구조
프론트는 백엔드 응답을 받아서 아래 형태로 변환·표시한다.

- type:
  - judgment (판정 있음)
  - empty (빈 입력)
  - not-python (파이썬 코드로 보기 어려움)
  - not-preprocessing (ML 전처리/학습 패턴 부족)
  - error (백엔드 오류/요청 실패)
- badge: 분류 요약 문구(예: "의심 4건", "확정위반 1건", "이상없음")
- items: [{ line, verdict, desc, fix }]
- note: 메시지/경고 요약

## 응답 필드 매핑
- classification → badge/유형 결정
- summary → badge 문구
- results[{ line, type, fix_suggestion, reason }] → items[{ line, verdict, desc, fix }]
- message/warnings/errors → note/유형 처리

## 예외 처리
- 빈 입력 → type: empty
- 비파이썬 → type: not-python
- 전처리 코드 부족 → type: not-preprocessing
- 백엔드 오류/요청 실패 → type: error
- 프론트는 errors/warnings를 note로 표시하고, 판정 결과와 함께 보여준다.

## 파일 업로드
- 프론트에서 파일 업로드 UI는 P1/추후 확장 가능
- 지금은 코드 문자열 먼저 확정

## 가림/공개
- 기본: 프론트는 백엔드가 가림 처리한 결과 표시
- 공개 제어 지점: 프론트 토글 → 백엔드 공개 여부 결정(추후 확장)
