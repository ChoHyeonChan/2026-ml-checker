from typing import Annotated

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse

from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalyzeFileResponse,
    ErrorResponse,
    JudgmentResult,
)
from app.services.analyzer import AnalyzerService

router = APIRouter()

# 단일 analyzer 인스턴스 (MVP P0)
analyzer = AnalyzerService()


def _to_ui_result(item: JudgmentResult) -> dict:
    return {
        "line": item.line,
        "type": item.type,
        "fix_suggestion": item.fix_suggestion,
        "reason": item.reason,
    }


def _build_ui_response(resp: AnalyzeResponse | AnalyzeFileResponse) -> dict:
    badge = resp.classification
    summary = resp.summary or {"확정위반": 0, "의심": 0, "이상없음": 0}
    if summary.get("확정위반", 0) > 0:
        badge = f"확정위반 {summary['확정위반']}건"
    elif summary.get("의심", 0) > 0:
        badge = f"의심 {summary['의심']}건"
    else:
        badge = "이상없음"

    items = [_to_ui_result(it) for it in (resp.results or [])]

    note = []
    if resp.message:
        note.append(resp.message)
    if resp.warnings:
        note.extend(resp.warnings)
    if resp.errors:
        note.extend(resp.errors)

    return {
        "classification": resp.classification,
        "badge": badge,
        "summary": summary,
        "items": items,
        "note": " ".join(note) if note else None,
        "not_preprocessing": bool(resp.not_preprocessing),
    }


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(body: AnalyzeRequest) -> AnalyzeResponse:
    result = analyzer.analyze_code(body.code)
    return AnalyzeResponse(**result)


@router.post("/analyze/file", response_model=AnalyzeFileResponse)
async def analyze_file(file: UploadFile = File(...)) -> AnalyzeFileResponse:
    allowed = {".py", ".ipynb"}
    name = file.filename or ""
    ext = "." + (name.rsplit(".", 1)[-1] if "." in name else "")
    if ext.lower() not in allowed:
        return JSONResponse(
            status_code=400,
            content={
                "classification": "이상없음",
                "summary": {"확정위반": 0, "의심": 0, "이상없음": 0},
                "results": [],
                "message": "지원하지 않는 파일 형식입니다.",
                "warnings": [],
                "errors": [f"지원 형식: {', '.join(sorted(allowed))}."],
                "not_preprocessing": False,
            },
        )

    raw = await file.read()
    result = analyzer.analyze_file(raw, name)
    return AnalyzeFileResponse(
        classification=result.get("classification", "이상없음"),
        summary=result.get("summary", {"확정위반": 0, "의심": 0, "이상없음": 0}),
        results=[JudgmentResult(**r) for r in result.get("results", [])],
        message=result.get("message", ""),
        warnings=result.get("warnings", []),
        errors=result.get("errors", []),
        file_name=name,
        total_lines=result.get("total_lines"),
        not_preprocessing=result.get("not_preprocessing", False),
    )
