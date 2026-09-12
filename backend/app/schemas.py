from pydantic import BaseModel, ConfigDict, Field
from typing import Any

class AnalyzeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000)

    model_config = ConfigDict(json_schema_extra={
        "examples": [{"code": "# 예시 전처리 코드"}]
    })

class AnalyzeFileRequest(BaseModel):
    pass

class JudgmentResult(BaseModel):
    line: int
    type: str
    fix_suggestion: str
    reason: str | None = None

class AnalyzeResponse(BaseModel):
    classification: str
    summary: dict[str, int]
    results: list[JudgmentResult]
    message: str
    warnings: list[str] = []
    errors: list[str] = []
    not_preprocessing: bool = False

class AnalyzeFileResponse(BaseModel):
    classification: str
    summary: dict[str, int]
    results: list[JudgmentResult]
    message: str
    warnings: list[str] = []
    errors: list[str] = []
    file_name: str | None = None
    total_lines: int | None = None
    not_preprocessing: bool = False

class ErrorResponse(BaseModel):
    detail: str
    code: str
    suggestions: list[str] = []
