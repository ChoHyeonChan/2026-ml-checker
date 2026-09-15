import os
import requests
from typing import Any

SOLAR_API_URL = os.getenv("SOLAR_API_URL", "https://api.upstage.ai/v1/chat/completions")
SOLAR_API_KEY = os.getenv("SOLAR_API_KEY", "")
SOLAR_MODEL = os.getenv("SOLAR_MODEL", "solar-pro4")


class SolarService:
    """Solar API 호출 서비스.

    API 키가 설정되지 않았으면 모든 호출이 에러 응답을 반환한다.
    키 설정 후에는 on-boarding 문구 / 검사 결과 설명 생성에 사용한다.
    """

    def __init__(self) -> None:
        self.api_key = SOLAR_API_KEY
        self.api_url = SOLAR_API_URL
        self.model = SOLAR_MODEL

    def _call(self, prompt: str, system: str | None = None) -> dict[str, Any]:
        if not self.api_key:
            return {"error": "SOLAR_API_KEY not set"}
        try:
            messages: list[dict[str, str]] = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            resp = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return {"content": content}
        except Exception as e:
            return {"error": str(e)}

    def generate_onboarding_content(self, code_preview: str) -> dict[str, Any]:
        """코드 미리보기를 보고 온보딩 팝업 문구를 생성한다.

        반환값:
            - {"content": {...}} 성공
            - {"error": "..."} 실패/API 키 없음
        """
        system = "너는 ML 데이터 누수 검사 서비스의 온보딩 문구를 작성하는 도우미야. 출력은 JSON만 해줘."
        prompt = (
            "다음 전처리 코드 미리보기를 보고 온보딩 팝업에 표시할 문구를 생성해줘.\n"
            "코드 미리보기:\n"
            f"{code_preview[:500]}\n"
            "\n"
            "출력 형식 (JSON만, 다른 텍스트 없이):\n"
            '{{\n'
            '  "title": "짧은 제목 (15자 이내)",\n'
            '  "body": "이 서비스가 전처리·학습 코드에서 데이터 누수 의심 패턴을 찾아준다는 설명 (2-3문장)",\n'
            '  "character_title": "캐릭터 타이틀 (10자 이내)",\n'
            '  "character_text": "캐릭터 설명 (2문장)"\n'
            '}}\n'
        )
        return self._call(prompt, system)

    def generate_result_explanation(
        self,
        classification: str,
        summary: dict[str, int],
        results: list[dict[str, Any]],
        code_preview: str,
    ) -> dict[str, Any]:
        """검사 결과를 보고 설명과 수정 조언을 생성한다.

        반환값:
            - {"content": {"summary_text": ..., "item_explanations": [...]}} 성공
            - {"error": "..."} 실패/API 키 없음
        """
        system = "너는 ML 데이터 누수 검사 결과의 해석과 수정 조언을 제공하는 도우미야. 출력은 JSON만 해줘."
        items_text = ""
        for r in results:
            items_text += f"\n- {r.get('line')}줄: {r.get('type')} - {r.get('fix_suggestion')} - {r.get('reason')}\n"
        prompt = (
            "다음 ML 전처리 코드 검사 결과를 보고 설명과 조언을 생성해줘.\n"
            f"분류: {classification}\n"
            f"요약: 확정위반 {summary.get('확정위반', 0)}건, 의심 {summary.get('의심', 0)}건\n"
            "코드 미리보기:\n"
            f"{code_preview[:500]}\n"
            "항목들:"
            f"{items_text}\n"
            "\n"
            "출력 형식 (JSON만):\n"
            '{{\n'
            '  "summary_text": "전체 결과에 대한 한 줄 요약 (20자 이내)",\n'
            '  "item_explanations": [\n'
            '    {{"line": <줄번호>, "explanation": "이 줄이 왜 의심인지 쉽게 설명 (2-3문장)"}}\n'
            '  ]\n'
            '}}\n'
        )
        return self._call(prompt, system)
