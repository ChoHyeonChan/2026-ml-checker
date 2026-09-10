, code: str) -> dict[str, Any]:
        code = (code or "").strip()
        validation = self._validate_input(code)
        if validation["errors"]:
            return validation
        lines = code.splitlines()
        results, summary = self._judge(lines)
        return self._build_response(lines, results, summary)

    def analyze_file(self, file_bytes, file_name: str) -> dict[str, Any]:
        code = self._extract_code(file_bytes, file_name)
        if code is None:
            retu