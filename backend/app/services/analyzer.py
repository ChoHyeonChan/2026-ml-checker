from typing import Any
from app.schemas import JudgmentResult


class AnalyzerService:
    """예선 ml-data-leakage-checker 기반 + 서비스화 확장 로직.
    MVP P0에서는 LLM 없이 패턴/규칙 기반 1차 판정을 먼저 구현하고,
    실제 예선 스킬 호출/확장은 이후 연결한다. 규칙은 확실히 잡을 수 있는 누수부터 우선한다.
    """

    def __init__(self, settings: Any = None) -> None:
        self.settings = settings

    def analyze_code(self
