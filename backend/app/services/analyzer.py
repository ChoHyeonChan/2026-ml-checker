d_response(lines, results, summary)

    def _validate_input(self, code: str) -> dict[str, Any]:
        errors: list[str] = []
        warnings: list[str] = []
        if not code:
            errors.append("분석할 코드가 비어 있습니다.")
        if code and not self._looks_like_python(code):
            errors.append("분석 대상 코드가 파이썬 코드로 보이지 않습니다.")
        if code and not self._looks_like_ml_preprocessing(code):
            warnings.append("ML 전처리 코드로 보기 어려운 부분이 있습니다. 분석 범위는 제한적일 수 있습니다.")
        if errors:
            return {
                "classification": "이상없음",
                "summary": {"확정위반": 0, "의심": 0, "이상없음": 0},
                "results": [],
                "message": "분석을 진행할 수 없습니다.",
                "errors": errors,
                "warnings": warnings,
            }
        return {"errors": [], "warnings": warnings, "code": code}

    def _judge(self, lines, start=1):
            tag = self._classify_line(lines, idx, line)
            if tag:
                results.append(JudgmentResult(
                    line=idx,
                    type=tag["type"],
                    fix_suggestion=tag["fix"],
                    reason=tag["reason"],
                ))
        summary = {
            "확정위반": sum(1 for r in results if r.type == "확정위반"),
            "의심": sum(1 for r in results if r.type == "의심"),
            "이상없음": max(0, len(lines) - len(results)),
        }
        return results, summary

    def _classify_line(self, lines, start=1):
        lowered = line.lower()
        ctx_before = lines[max(0, idx - 2):idx]
        ctx_after = lines[idx + 1:idx + 3]

        # 1) 타겟 직접 사용 + 전처리 패턴 -> 확정위반 우선
        if self._has_target_leakage_clear(lines, idx, line, ctx_before, ctx_after):
            return {
                "type": "확정위반",
                "fix": "타겟 정보를 전처리 과정에서 직접 사용하지 않도록 분리하세요.",
                "reason": "타겟 열이 전처리 과정에서 직접 참조된 것으로 보입니다.",
            }

        # 2) 전체 데이터 기준 fit/transform 후 분할 또는 분할 없음 -> 확정위반/의심
        fit_tag = self._has_preprocess_fit_before_split(lines, idx, line, ctx_before, ctx_after)
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

        # 3) 시계열/순서 관련 전처리 후 fit -> 의심
        time_tag = self._has_time_order_leakage_hint(lines, idx, line, ctx_before, ctx_after)
        if time_tag:
            return {
                "type": "의심",
                "fix": "시간 순서가 중요한 데이터라면 분할/전처리 순서를 점검하세요.",
                "reason": "시간 순서 관련 누수 가능성이 있는 패턴으로 보입니다.",
            }

        # 4) 파이프라인/객체 재할당/재사용 의심 -> 의심
        pipe_tag = self._has_pipeline_reuse_leakage_hint(lines, idx, line, ctx_before, ctx_after)
        if pipe_tag:
            return {
                "type": "의심",
                "fix": "fit 정보가 여러 fold/데이터에 공유되지 않도록 파이프라인을 분리하세요.",
                "reason": "전처리 객체가 여러 데이터/단계에 재사용된 것으로 의심됩니다.",
            }

        return None

    # ---------- 패턴 판단 헬퍼 ----------

    def _has_target_leakage_clear(
        self, lines: list[str], idx: int, line: str, ctx_before: list[str], ctx_after: list[str]
    ) -> bool:
        lowered = line.lower()
        if not self._has_preprocess_keywords(lowered):
            return False
        target_vars = self._extract_tokens(ctx_before + [line] + ctx_after, ["y", "target", "label"])
        if not target_vars:
            return False
        leak_patterns = ["fit", "transform", "fit_transform", "encoder", "scaler", "normali", "standard", "map", "apply"]
        if not any(p in lowered for p in leak_patterns):