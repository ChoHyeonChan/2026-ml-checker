from fastapi import FastAPI
from fastapi.middmeware.cors import CORSMiddleware
from app.api.routes import router
from app.config import Settings


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

    return app


app = create_app()
