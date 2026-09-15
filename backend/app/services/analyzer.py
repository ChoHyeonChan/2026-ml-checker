def _has_stratify_target_encoding_leakage(
        self,
        lines: list[str],
        idx: int,
        line: str,
        ctx_before: list[str],
        ctx_after: list[str],
        context: dict[str, Any],
    ) -> bool:
        low = line.lower()

        has_stratify_anywhere = len(context["stratify_lines"]) > 0
        if not has_stratify_anywhere:
            return False

        # 현재 라인이 타겟 인코딩/매핑이면 체크
        has_target_encoding = self._has_encoder_fit(low) or (self._has_target_reference(low) and any(k in low for k in ["map(", "apply(", "="]))
        is_stratify_line = "stratify" in low

        if not has_target_encoding and not is_stratify_line:
            return False

        if is_stratify_line and has_target_encoding:
            # stratify 라인이고 타겟 인코딩/매핑이면 즉시 True
            return True

        # 타겟 인코딩/매핑 라인에서 stratify anywhere 있으면 True
        if has_target_encoding and has_stratify_anywhere:
            return True

        # stratify 라인 이전에서 타겟 인코딩/매핑이 있었는지 확인
        for i in range(1, idx):
            prev_low = lines[i-1].lower()
            if self._has_encoder_fit(prev_low) or self._has_target_reference(prev_low):
                if any(k in prev_low for k in ["fit(", "transform(", "fit_transform(", "map(", "apply(", "="]):
                    return True

        # 현재 라인이 stratify이고 이전에 타겟 인코딩/매핑이 있었는지 확인
        if is_stratify_line:
            for i in range(idx - 1, 0, -1):
                prev_low = lines[i-1].lower()
                if self._has_encoder_fit(prev_low) or self._has_target_reference(prev_low):
                    if any(k in prev_low for k in ["fit(", "transform(", "fit_transform(", "map(", "apply(", "="]):
                        return True

        return False
