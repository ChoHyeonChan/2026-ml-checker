import re
from typing import Any
from app.schemas import JudgmentResult


class AnalyzerService:
    """예선 ml-data-leakage-checker 기반 + 서비스화 확장 로직.

    MVP P0에서는 LLM 없이 패턴/규칙 기반 1차 판정을 먼저 구현하고,
    실제 예선 스킬 호출/확장은 이후 연결한다.

    지금은 라인 단위 키워드 중심에서 벗어나,
    전처리 객체 이름과 split 전후 맥락을 더 보도록 보정한다.
    """

    def __init__(self, settings: Any = None) -> None:
        self.settings = settings

    def analyze_code(self, code: str) -> dict[str, Any]:
        code = (code or "").strip()
        validation = self._validate_input(code)
        if validation["errors"]:
            return validation
        lines = code.splitlines()
        context = self._build_context(lines)
        results = self._judge_with_context(lines, context)
        summary = self._compute_summary(lines, results)
        return self._build_response(lines, results, summary, not_preprocessing=validation.get("not_preprocessing", False))

    def analyze_file(self, file_bytes: bytes, file_name: str) -> dict[str, Any]:
        code = self._extract_code(file_bytes, file_name)
        if code is None:
            return {
                "classification": "이상없음",
                "summary": {"확정위반": 0, "의심": 0, "이상없음": 0},
                "results": [],
                "message": "분석 가능한 코드를 추출하지 못했습니다.",
                "warnings": [],
                "errors": ["파일에서 분석 가능한 코드를 읽을 수 없습니다."],
                "not_preprocessing": False,
            }
        validation = self._validate_input(code)
        if validation["errors"]:
            return validation
        lines = code.splitlines()
        context = self._build_context(lines)
        results = self._judge_with_context(lines, context)
        summary = self._compute_summary(lines, results)
        return self._build_response(lines, results, summary, not_preprocessing=validation.get("not_preprocessing", False))

    def _validate_input(self, code: str) -> dict[str, Any]:
        errors: list[str] = []
        warnings: list[str] = []
        not_preprocessing = False
        if not code:
            errors.append("분석할 코드가 비어 있습니다.")
        if code and not self._looks_like_python(code):
            errors.append("분석 대상 코드가 파이썬 코드로 보이지 않습니다.")
        if code and not self._looks_like_ml_preprocessing(code):
            warnings.append("ML 전처리 코드로 보기 어려운 부분이 있습니다. 분석 범위는 제한적일 수 있습니다.")
            not_preprocessing = True
        if errors:
            return {
                "classification": "이상없음",
                "summary": {"확정위반": 0, "의심": 0, "이상없음": 0},
                "results": [],
                "message": "분석을 진행할 수 없습니다.",
                "errors": errors,
                "warnings": warnings,
                "not_preprocessing": not_preprocessing,
            }
        return {"errors": [], "warnings": warnings, "code": code, "not_preprocessing": not_preprocessing}

    def _build_context(self, lines: list[str]) -> dict[str, Any]:
        preprocess_objs: dict[str, list[int]] = {}
        fit_lines: list[int] = []
        transform_lines: list[int] = []
        fit_transform_lines: list[int] = []
        decl_lines: list[int] = []
        import_lines: list[int] = []
        split_lines: list[int] = []
        target_var_lines: list[int] = []

        for idx, line in enumerate(lines, start=1):
            low = line.lower()
            stripped = line.strip()

            if stripped.startswith("import ") or stripped.startswith("from "):
                import_lines.append(idx)

            if self._looks_like_preprocess_declaration(stripped):
                decl_lines.append(idx)
                name = self._extract_preprocess_obj_name(stripped)
                if name:
                    preprocess_objs.setdefault(name, []).append(idx)

            if "fit_transform(" in low:
                fit_transform_lines.append(idx)
                name = self._guess_preprocess_obj_name_at_line(low, idx, preprocess_objs)
                if name:
                    preprocess_objs.setdefault(name, []).append(idx)
                fit_lines.append(idx)
                transform_lines.append(idx)
                continue

            if "fit(" in low:
                fit_lines.append(idx)
                name = self._guess_preprocess_obj_name_at_line(low, idx, preprocess_objs)
                if name:
                    preprocess_objs.setdefault(name, []).append(idx)
                continue

            if "transform(" in low:
                transform_lines.append(idx)
                name = self._guess_preprocess_obj_name_at_line(low, idx, preprocess_objs)
                if name:
                    preprocess_objs.setdefault(name, []).append(idx)
                continue

            if self._has_split_call(low):
                split_lines.append(idx)

            if self._has_target_reference(low):
                target_var_lines.append(idx)

        return {
            "lines": lines,
            "preprocess_objs": preprocess_objs,
            "fit_lines": fit_lines,
            "transform_lines": transform_lines,
            "fit_transform_lines": fit_transform_lines,
            "decl_lines": decl_lines,
            "import_lines": import_lines,
            "split_lines": split_lines,
            "target_var_lines": target_var_lines,
        }

    def _looks_like_preprocess_declaration(self, stripped: str) -> bool:
        return bool(re.match(r"^\s*\w+\s*=\s*", stripped)) and self._has_preprocess_keywords(stripped)

    def _extract_preprocess_obj_name(self, stripped: str) -> str | None:
        m = re.match(r"^\s*([a-zA-Z_]\w*)\s*=", stripped)
        if not m:
            return None
        return m.group(1)

    def _guess_preprocess_obj_name_at_line(self, low: str, idx: int, objs: dict[str, list[int]]) -> str | None:
        m = re.search(r"([a-zA-Z_]\w*)\s*\.\s*(fit|transform|fit_transform)\s*\(", low)
        if m:
            return m.group(1)
        for name in objs:
            if f"{name}." in low:
                return name
        return None

    def _has_split_call(self, low: str) -> bool:
        return any(k in low for k in ["train_test_split", "split", "kfold", "stratify", "cross_val", "partition"])

    def _has_target_reference(self, low: str) -> bool:
        return any(t in low for t in ["y", "target", "label"])

    def _judge_with_context(self, lines: list[str], context: dict[str, Any]) -> list[JudgmentResult]:
        results: list[JudgmentResult] = []
        for idx, line in enumerate(lines, start=1):
            tag = self._classify_line(lines, idx, line, context)
            if tag:
                results.append(JudgmentResult(
                    line=idx,
                    type=tag["type"],
                    fix_suggestion=tag["fix"],
                    reason=tag["reason"],
                ))
        return results

    def _compute_summary(self, lines: list[str], results: list[JudgmentResult]) -> dict[str, int]:
        return {
            "확정위반": sum(1 for r in results if r.type == "확정위반"),
            "의심": sum(1 for r in results if r.type == "의심"),
            "이상없음": max(0, len(lines) - len(results)),
        }

    def _classify_line(
        self,
        lines: list[str],
        idx: int,
        line: str,
        context: dict[str, Any],
    ) -> dict[str, str] | None:
        low = line.lower()
        ctx_before = lines[max(0, idx - 2):idx]
        ctx_after = lines[idx + 1:idx + 3]

        # 전처리 키워드가 전혀 없으면 전처리 판정은 보류
        if not self._has_preprocess_keywords(low):
            return None

        # import/단순 선언 라인은 전처리 사용맥락이 없으면 보류
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return None

        # 1) 타겟 직접 사용 + 전처리 패턴 -> 확정위반 우선
        if self._has_target_leakage_clear(lines, idx, line, ctx_before, ctx_after, context):
            return {
                "type": "확정위반",
                "fix": "타겟 정보를 전처리 과정에서 직접 사용하지 않도록 분리하세요.",
                "reason": "타겟 열이 전처리 과정에서 직접 참조된 것으로 보입니다.",
            }

        # 2) 전체 데이터 기준 fit/transform 후 분할 또는 분할 없음 -> 확정위반/의심
        fit_tag = self._has_preprocess_fit_before_split(lines, idx, line, ctx_before, ctx_after, context)
        if fit_tag:
            if fit_tag["level"] == " 확정위반":
                return {
                    "type": "확정위반",
                    "fix": "train/test 분할 후에만 fit/transform을 적용하도록 순서를 조정하세요.",
                    "reason": "전체 데이터 기준으로 먼저 fit/transform을 적용한 것으로 보입니다.",
                }
            return {
                "type": "의심",
                "fix": "train/test 분할 후에만 fit/transform을 적용하도록 순서를 점검하세요.",
                "reason": "전체 데이터 기준으로 먼저 fit/transform을 적용한 것으로 의심됩니다.",
            }

        # 5) fit_transform이 split boundary 없이 쓰인 경우
        ft_tag = self._has_fit_transform_before_split(lines, idx, line, ctx_before, ctx_after, context)
        if ft_tag:
            if ft_tag["level"] == " 확정위반":
                return {
                    "type": "확정위반",
                    "fix": "train/test 분할 후에만 fit_transform을 적용하도록 순서를 조정하세요.",
                    "reason": "전체 데이터 기준으로 먼저 fit_transform을 적용한 것으로 보입니다.",
                }
            return {
                "type": "의심",
                "fix": "train/test 분할 후에만 fit_transform을 적용하도록 순서를 점검하세요.",
                "reason": "전체 데이터 기준으로 먼저 fit_transform을 적용한 것으로 의심됩니다.",
            }

        # 6) split 전 fit + split 후 transform만 있는 패턴
        if self._has_fit_before_split_only_transform_after(lines, idx, line, ctx_before, ctx_after, context):
            return {
                "type": "의심",
                "fix": "train/test 분할 전에 fit한 전처리 객체를 분할 후에 transform하지 않도록 순서를 점검하세요.",
                "reason": "분할 전에 fit한 전처리 객체가 분할 후 transform에 재사용된 것으로 의심됩니다.",
            }

        # 3) 시계열/순서 관련 전처리 후 fit -> 의심
        if self._has_time_order_leakage_hint(lines, idx, line, ctx_before, ctx_after):
            return {
                "type": "의심",
                "fix": "시간 순서가 중요한 데이터라면 분할/전처리 순서를 점검하세요.",
                "reason": "시간 순서 관련 누수 가능성이 있는 패턴으로 보입니다.",
            }

        # 7) cross-validation + 외부 preprocess 결합
        if self._has_cross_val_preprocess_leakage_hint(lines, idx, line, ctx_before, ctx_after):
            return {
                "type": "의심",
                "fix": "cross-validation 내부에 전처리가 포함되도록 Pipeline을 구성하세요.",
                "reason": "cross-validation과 외부 전처리가 결합되어 누수 가능성이 있는 패턴으로 보입니다.",
            }

        # 8) groupby/분할 기준 전처리 순서
        if self._has_groupby_split_preprocess_order_leakage_hint(lines, idx, line, ctx_before, ctx_after):
            return {
                "type": "의심",
                "fix": "groupby/분할 기준이 여러 데이터에 공유되지 않도록 그룹별 또는 분할별 전처리를 분리하세요.",
                "reason": "groupby/분할 기준이 여러 데이터에 재사용된 것으로 의심됩니다.",
            }

        return None

    def _has_active_preprocess_use(self, low: str) -> bool:
        return any(k in low for k in ["fit(", "transform(", "fit_transform(", "="]) and self._has_preprocess_keywords(low)

    def _has_target_leakage_clear(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
        context: dict[str, Any],
    ) -> bool:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return False
        target_vars = self._extract_tokens(ctx_before + [line] + ctx_after, ["y", "target", "label"])
        if not target_vars:
            return False
        leak_patterns = ["fit", "transform", "fit_transform", "encoder", "scaler", "normali", "standard", "map", "apply"]
        if not any(p in low for p in leak_patterns):
            return False
        if any(k in low for k in ["map(", "apply(", "replace(", "merge", "join"]):
            return True
        return any(t in low for t in target_vars)

    def _has_preprocess_fit_before_split(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
        context: dict[str, Any],
    ) -> dict[str, str] | None:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return None
        has_fit = any(p in low for p in ["fit(", "fit_transform(", "transform("])
        if not has_fit:
            return None
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return None

        has_split_anywhere = len(context["split_lines"]) > 0
        if not has_split_anywhere:
            return {"level": " 확정위반", "note": "분할 호출이 보이지 않음"}

        window = lines[max(0, idx - 8):idx] + lines[idx + 1:idx + 10]
        split_kw = ["train_test_split", "split", "kfold", "stratify", "cross_val", "partition", "group"]
        has_split_context = any(k in " ".join(window).lower() for k in split_kw)
        if not has_split_context:
            return {"level": " 의", "note": "근처에 분할 맥락 부족"}
        return None

    def _has_fit_transform_before_split(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
        context: dict[str, Any],
    ) -> dict[str, str] | None:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return None
        if "fit_transform(" not in low:
            return None
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return None

        has_split_anywhere = len(context["split_lines"]) > 0
        if not has_split_anywhere:
            return {"level": " 확정위반", "note": "분할 호출이 보이지 않음"}

        window = lines[max(0, idx - 8):idx] + lines[idx + 1:idx + 10]
        split_kw = ["train_test_split", "split", "kfold", "stratify", "cross_val", "partition", "group"]
        has_split_context = any(k in " ".join(window).lower() for k in split_kw)
        if not has_split_context:
            return {"level": " 의", "note": "근처에 분할 맥락 부족"}
        return None

    def _has_fit_before_split_only_transform_after(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
        context: dict[str, Any],
    ) -> bool:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return False
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return False

        has_fit = any(p in low for p in ["fit(", "fit_transform("])
        if not has_fit:
            return False

        has_split_anywhere = len(context["split_lines"]) > 0
        if not has_split_anywhere:
            return False

        window = lines[max(0, idx - 8):idx] + lines[idx + 1:idx + 10]
        split_kw = ["train_test_split", "split", "kfold", "stratify", "cross_val", "partition", "group"]
        has_split_context = any(k in " ".join(window).lower() for k in split_kw)
        if not has_split_context:
            return False

        after_split = lines[idx + 1:idx + 10]
        has_transform_after_split = any("transform(" in l.lower() for l in after_split)
        return has_transform_after_split

    def _has_cross_val_preprocess_leakage_hint(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
    ) -> bool:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return False
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return False

        has_cross_val = any(k in low for k in ["cross_val_score", "cross_validate", "cross_val_predict"])
        if not has_cross_val:
            return False

        ctx_all = " ".join(ctx_before + [line] + ctx_after).lower()
        has_preprocess = any(k in ctx_all for k in ["fit(", "transform(", "fit_transform(", "scaler", "encoder", "pipeline"])
        return has_preprocess

    def _has_groupby_split_preprocess_order_leakage_hint(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
    ) -> bool:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return False
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return False

        has_groupby = any(k in low for k in ["groupby", "group_by", "grouped"])
        if not has_groupby:
            return False

        has_split_anywhere = len(context["split_lines"]) > 0
        if not has_split_anywhere:
            return False

        window = lines[max(0, idx - 8):idx] + lines[idx + 1:idx + 10]
        split_kw = ["train_test_split", "split", "kfold", "stratify", "cross_val", "partition", "group"]
        has_split_context = any(k in " ".join(window).lower() for k in split_kw)
        if not has_split_context:
            return False

        ctx_all = " ".join(ctx_before + [line] + ctx_after).lower()
        has_preprocess = any(k in ctx_all for k in ["fit(", "transform(", "fit_transform(", "scaler", "encoder", "pipeline"])
        return has_preprocess

    def _has_time_order_leakage_hint(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
    ) -> bool:
        low = line.lower()
        if not self._has_preprocess_keywords(low):
            return False
        if idx in context["import_lines"] or idx in context["decl_lines"]:
            if not self._has_active_preprocess_use(low):
                return False

        if "fit(" not in low and "transform(" not in low and "fit_transform(" not in low:
            return False

        time_kw = ["shift", "lag", "rolling", "sort_values", "sort", "date", "time", "timestamp", "before", "after"]
        window = " ".join(lines[max(0, idx - 3):idx + 4]).lower()
        return any(k in window for k in time_kw)

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

    def _build_response(
        self,
        lines: list[str],
        results: list[JudgmentResult],
        summary: dict[str, int],
        not_preprocessing: bool = False,
    ) -> dict[str, Any]:
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
            "total_lines": total,
            "not_preprocessing": not_preprocessing,
        }
