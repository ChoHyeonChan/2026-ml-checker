from typing import Annotated

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import logging

from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalyzeFileResponse,
    ErrorResponse,
    JudgmentResult,
)
from app.services.analyzer import AnalyzerService
from app.services.solar_service import SolarService

router = APIRouter()

# 단일 analyzer 인스턴스 (MVP P0)
analyzer = AnalyzerService()

# SolarService 인스턴스 (API 키 설정 시 LLM 설명 생성)
solar = SolarService()

logger = logging.getLogger(__name__)


def _to_ui_result(item) -> dict:
    if isinstance(item, JudgmentResult):
        return {
            "line": item.line,
            "type": item.type,
            "fix_suggestion": item.fix_suggestion,
            "reason": item.reason,
        }
    return {
        "line": item.get("line", 0) if isinstance(item.get("line"), int) else item.get("line", ""),
        "type": item.get("type", "의심"),
        "fix_suggestion": item.get("fix_suggestion", ""),
        "reason": item.get("reason", ""),
    }


def _to_judgment_result(item) -> JudgmentResult:
    if isinstance(item, JudgmentResult):
        return item
    return JudgmentResult(**item)


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

    # LLM 설명 추가 (API 키 설정 시)
    llm_explanation = None
    try:
        llm = solar.generate_result_explanation(
            classification=result.get("classification", "이상없음"),
            summary=result.get("summary", {}),
            results=result.get("results", []),
            code_preview=body.code[:500],
        )
        if "content" in llm:
            llm_explanation = llm["content"]
    except Exception as e:
        logger.error(f"SolarService error: {e}")

    return AnalyzeResponse(
        classification=result.get("classification", "이상없음"),
        summary=result.get("summary", {}),
        results=[_to_judgment_result(r) for r in result.get("results", [])],
        message=result.get("message", ""),
        warnings=result.get("warnings", []),
        errors=result.get("errors", []),
        not_preprocessing=result.get("not_preprocessing", False),
        llm_explanation=llm_explanation,
    )


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
                "file_name": name,
                "total_lines": None,
                "not_preprocessing": False,
            },
        )

    raw = await file.read()
    result = analyzer.analyze_file(raw, name)
    return AnalyzeFileResponse(
        classification=result.get("classification", "이상없음"),
        summary=result.get("summary", {"확정위반": 0, "의심": 0, "이상없음": 0}),
        results=[_to_judgment_result(r) for r in result.get("results", [])],
        message=result.get("message", ""),
        warnings=result.get("warnings", []),
        errors=result.get("errors", []),
        file_name=name,
        total_lines=result.get("total_lines"),
        not_preprocessing=result.get("not_preprocessing", False),
    )
