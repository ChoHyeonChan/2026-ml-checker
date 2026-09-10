rn {
                "classification": "의심",
                "summary": {"확정위반": 0, "의심": 0, "이상없음": 0},
                "results": [],
                "message": "분석 가능한 코드를 추출하지 못했습니다.",
                "warnings": [],
                "errors": ["파일에서 분석 가능한 코드를 읽을 수 없습니다."],
            }
        lines = code.splitlines()
        results, summary = self._judge(lines)
        return self._buil