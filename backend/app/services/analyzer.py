
            return False
        if any(k in lowered for k in ["map(", "apply(", "replace(", "merge", "join"]):
            return True
        return any(t in lowered for t in target_vars)

    def _has_preprocess_fit_before_split(
        self, lines: list[str], idx: int, line: str, ctx_before: list[str], ctx_after: list[str]
    ) -> dict[str, str] | None:
        lowered = line.lower()
        if not self._has_preprocess_keywords(lowered):
            return None
        has_fit = any(p in lowered for p in ["fit(", "fit_transform(", "transform("])
        if not has_fit:
            return None
        window = lines[max(0, idx - 8):idx] + lines[idx + 1:idx + 10]
        split_kw = ["train_test_split", "split", "kfold", "stratify", "cross_val", "partition", "group"]
        has_split_context = any(k in " ".join(window).lower() for k in split_kw)
        has_any_split_call = any(k in " ".join(lines).lower() for k in ["train_test_split", "split", "kfold", "cross_val", "partition"])
        if not has_any_split_call:
            return {"level": " 확정위반", "note": "분할 호출이 보이지 않음"}
        if not has_split_context:
            return {"level": " 의", "note": "근처에 분할 맥락 부족"}
        return None

    def _has_time_order_leakage_hint(
        self, lines: list[str], idx: int, line: str, ctx_before: list[str], ctx_after: list[str]
    ) -> bool:
        lowered = line.lower()
        if not self._has_preprocess_keywords(lowered):
            return False
        if "fit(" not in lowered and "transform(" not in lowered and "fit_transform(" not in lowered:
            return False
        time_kw = ["shift", "lag", "rolling", "sort_values", "sort", "date", "time", "timestamp", "before", "after"]
        window = " ".join(lines[max(0, idx - 3):idx + 4]).lower()
        return any(k in window for k in time_kw)

    def _has_pipeline_reuse_leakage_hint(
        self, lines: list[str], idx: int, line: str, ctx_before: list[str], ctx_after: list[str]
    ) -> bool:
        lowered = line.lower()
        if not self._has_preprocess_keywords(lowered):
            return False
        reuse_hints = ["scaler", "encoder", "pipeline", "preprocessor", "imputer", "le", "std", "mean", "std"]
        window = " ".join(lines[max(0, idx - 5):idx + 5]).lower()
        if not any(k in lowered for k in reuse_hints):
            return False
        if lowered.count("fit(") + lowered.count("transform(") >= 2:
            return True
        return any(k in window for k in ["scaler", "encoder", "pipeline", "preprocessor"])

    def _has_preprocess_keywords(self, lowered: str) -> bool:
        keywords = [
            "fit", "transform", "fit_transform", "encode", "scale",
            "normali", "standard", "impute", "drop", "fillna", "replace",
            "get_dummies", "onehot", "label", "encoder", "scaler",
            "preprocess", "pipeline", "select", "feature",
        ]
        return any(k in lowered for k in keywords)

    def _extract_tokens(self, texts: list[str], tokens: list[str]) -> list[str]:
        found: list[str] = []
        for t in texts:
            low = t.lower()
            for tok in tokens:
                if tok in low:
                    found.append(tok)
        return list(dict.fromkeys(found))

    def _looks_like_python(self, code: str) -> bool:
        lowered = code.lower()
        hints = ["def ", "import ", "from ", "=", "df", "fit", "transform", "train", "test", "split"]
        return any(h in lowered for h in hints) or code.lstrip().startswith("#")

    def _looks_like_ml_preprocessing(self, code: str) -> bool:
        lowered = code.lower()
        ml_hints = [
            "fit", "transform", "fit_transform", "train_test_split",
            "target", "le", "encoder", "scaler", "normali", "standard",
            "onehot", "get_dummies", "label", "cross", "cvs", "pipeline",
            "column", "select", "preprocess", "impute",
        ]
        return any(h in lowered for h in ml_hints)

    def _extract_code(self, file_bytes: bytes, file_name: str) -> str | None:
        for enc in ("utf-8", "latin-1"):
            try:
                return file_bytes.decode(enc).strip()
            except Exception:
                continue
        return None

    def _build_response(self, lines, summary: dict[str, int]) -> dict[str, Any]:
        total = len(lines) or 1
        if summary["확정위반"] > 0:
            classification = "확정위반"
            message = f"{summary['확정위반']}건의 확정위반 패턴이 확인되었습니다."
        elif summary["의심"] > 0:
            classification = "의심"
            message = f"{summary['의심']}건의 의심 패턴이 확인되었습니다."
        else:
            classification = "이상없음"
            message = "명확하게 의심되는 패턴이 보이지 않습니다."
        return {
            "classification": classification,
            "summary": summary,
            "results": results,
            "message": message,
            "warnings": [],
            "errors": [],
        }
