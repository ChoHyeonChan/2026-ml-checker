  const banner =
    result?.type === "ok"
      ? { src: BANNER_MAP["통과"], title: "명확하게 의심되는 패턴이 보이지 않아요", text: "전처리·학습 코드를 더 넣어도 좋고, 지금 상태로도 일단 괜찮아 보여요." }
      : result?.type === "error"
      ? { src: BANNER_MAP["안내필요"], title: "검사 중 문제가 있었어요", text: "잠시 뒤 다시 시도해 주세요." }
      : null;
