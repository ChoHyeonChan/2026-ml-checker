export default function Home() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [fileLines, setFileLines] = useState(0);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const handleOnboardingDismiss = (payload) => {
    if (payload && payload.example) {
      setCode(payload.example);
    }
  };

  const runCheck = async () => {
    setStatus("loading");
    setResult(null);

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        setResult({ type: "error", note: "검사 실행 중 문제가 생겼습니다." });
      } finally {
        setStatus("idle");
      }
      return;
    }

    if (!code.trim()) {
      setResult({ type: "empty" });
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ type: "error", note: "검사 실행 중 문제가 생겼습니다." });
    } finally {
      setStatus("idle");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setFileLines(0);
    setResult(null);

    if (!selected) return;

    selected.text().then((text) => {
      const lines = text.split("\n").length;
      setFileLines(lines);
    }).catch(() => {
      setFileLines(0);
    });
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  const clearContent = () => {
    setCode("");
    setResult(null);
  };

  const summary = result?.summary ?? { 확정위반: 0, 의심: 0, 이상없음: 0 };
  const isBackendConnected = Boolean(BACKEND_URL);

  const banner =
    result?.type === "ok"
      ? { src: BANNER_MAP["통과"], title: "명확하게 의심되는 패턴이 보이지 않아요", text: "전처리·학습 코드를 더 넣어도 좋고, 지금 상태로도 일단 괜찮아 보여요." }
      : result?.type === "error"
      ? { src: BANNER_MAP["안내필요"], title: "검사 중 문제가 있었어요", text: "잠시 뒤 다시 시도해 주세요." }
      : null;
