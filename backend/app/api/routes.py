from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from app.schemas import AnalyzeRequest
from app.services.analyzer import AnalyzerService
from app.config import Settings

router = APIRouter()

_settings = Settings()
_analyzer = AnalyzerService(settings=_settings)


def _to_frontend_result(backend_resp: dict) -> dict:
    """백엔드 내부 dict 응답을 프론트 계약 형식으로 변환"""
    classification = backend_resp.get("classification", "이상없음")
    summary = backend_resp.get("summary", {})
    results = backend_resp.get("results", [])
    message = backend_resp.get("message", "")
    warnings = backend_resp.get("warnings", [])
    errors = backend_resp.get("errors", [])

    # type 결정
    if errors:
        lowered_errors = [e.lower() for e in errors]
        if any("비어" in e or "empty" in e for e in lowered_errors):
            type_ = "empty"
        elif any("파이썬" in e or "python" in e for e in lowered_errors):
            type_ = "not-python"
        elif any("전처리" in e or "preprocessing" in e or "ml" in e for e in lowered_errors):
            type_ = "not-preprocessing"
        else:
            type_ = "error"
    else:
        type_ = "judgment"

    # badge
    if type_ == "judgment":
        if classification == "확정위반":
            badge = f"확정위반 {summary.get('확정위반', 0)}건"
        elif classification == "의심":
            badge = f"의심 {summary.get('의심', 0)}건"
        else:
            badge = "이상없음"
    elif type_ == "empty":
        badge = "빈 입력"
    elif type_ == "not-python":
        badge = "파이썬 코드 아님"
    elif type_ == "not-preprocessing":
        badge = "전처리 코드 아님"
    else:
        badge = "오류"

    # items
    items = []
    for r in results:
        items.append({
            "line": f"[{r.line}]",
            "verdict": r.type,
            "desc": r.reason or "",
            "fix": r.fix_suggestion,
        })

    # note
    note_parts = []
    if message:
        note_parts.append(message)
    for w in warnings:
        note_parts.append(f"주의: {w}")
    for e in errors:
        note_parts.append(f"오류: {e}")
    note = "\n".join(note_parts)

    return {
        "type": type_,
        "badge": badge,
        "items": items,
        "note": note,
        "classification": classification,
        "summary": summary,
    }


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    resp = _analyzer.analyze_code(request.code)
    return _to_frontend_result(resp)


@router.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    name = (file.filename or "").lower()
    allowed = [ext.strip() for ext in _settings.analyzer_allowed_extensions.split(",")]
    if not any(name.endswith(ext) for ext in allowed):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 파일 형식입니다.",
        )

    raw = await file.read()
    resp = _analyzer.analyze_file(raw, file.filename or "")
    out = _to_frontend_result(resp)
    out["file_name"] = file.filename
    out["total_lines"] = resp.get("total_lines")
    return out
