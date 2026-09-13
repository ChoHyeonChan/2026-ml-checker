from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import router
from app.config import Settings


def _error_payload(exc: Exception) -> dict:
    msg = getattr(exc, "detail", None) or str(exc)
    return {
        "classification": "이상없음",
        "summary": {"확정위반": 0, "의심": 0, "이상없음": 0},
        "results": [],
        "message": "검사 처리 중 오류가 발생했습니다.",
        "errors": [msg] if msg else [],
        "warnings": [],
        "not_preprocessing": False,
    }


def create_app(settings: Settings | None = None) -> FastAPI:
    _settings = settings or Settings()

    app = FastAPI(
        title="ml-data-leakage-checker API",
        version="0.1.0",
        description="ML 전처리 코드 데이터 누수 점검 서비스 API (예선 스킬 기반)",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router, prefix="/api/v1")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(Exception)
    async def _general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        payload = _error_payload(exc)
        return JSONResponse(status_code=500, content=payload)

    return app


app = create_app()
