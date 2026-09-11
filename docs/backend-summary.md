# 백엔드 요약 (MVP P0)

## API
- POST /api/v1/analyze — 코드 문자열 분석
- POST /api/v1/analyze/file — 파일 업로드 분석(단일 파일 우선)

## 요청/응답
### POST /api/v1/analyze
- 요청: { code: string }
- 응답:
  - classification: 확정위반 | 의심 | 이상없음
  - summary: { 확정위반, 의심, 이상없음 }
  - results: [{ line, type, fix_suggestion, reason }]
  - message, warnings, errors

### POST /api/v1/analyze/file
- 요청: multipart/form-data, file
- 응답: 위 + file_name, total_lines

## 판정 로직 범주
- 타겟 직접 사용(확정위반 우선)
- 전체 데이터 fit/transform 후 분할 또는 분할 없음(확정위반/의심)
- 시계열/순서 관련 전처리 후 fit(의심)
- 파이프라인/객체 재사용/반복 fit-transform(의심)
- fit_transform이 split boundary 없이 쓰인 경우(확정위반/의심)
- split 전 fit + split 후 transform만 있는 패턴(의심)
- cross-validation + 외부 preprocess 결합(의심)
- groupby/분할 기준 전처리 순서(의심)

## 예외/판정불가
- 빈 입력 → errors
- 비파이썬 → errors + warnings
- 전처리 코드 부족 → warnings (+ 필요시 errors)
- 파일 확장자 미지원 → 400
- 파일에서 코드 추출 불가 → errors

## 가림/공개
- 기본: 민감 정보 가림
- 공개 제어 지점: 프론트 토글 → 백엔드 공개 여부 결정
- 현재는 기본 가림 정책만 적용(추후 확장)
