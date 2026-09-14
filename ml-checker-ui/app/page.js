"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import Onboarding from "./components/Onboarding";

import characterFailV3 from "./assets/characters/character-fail-v3.jpg";
import characterAttentionV3 from "./assets/characters/character-attention-v3.jpg";
import characterPassV3 from "./assets/characters/character-pass-v3.jpg";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const EXAMPLE_CODE = `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("data.csv")
X = df.drop("target", axis=1)
y = df["target"]

# 분할 전에 스케일링을 해버린 예
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)`;

const LEAKAGE_EXAMPLE = "예시: df['x_enc'] = df.groupby('y')['x'].transform('mean')";

const IPYNB_NOTE =
  "참고: .ipynb는 셀 표시 순서 ≠ 실제 실행 순서일 수 있어요. 실행 순서대로 정리한 파일을 올리면 더 정확해요.";

const VERDICT_ORDER = ["확정위반", "의심", "이상없음"];

const VERDICT_COLORS = {
  확정위반: { badge: "#ef4444", badgeBg: "#fef2f2", text: "#b91c1c" },
  의심: { badge: "#f59e0b", badgeBg: "#fffbeb", text: "#b45309" },
  이상없음: { badge: "#22c55e", badgeBg: "#f0fdf4", text: "#15803d" },
};

const CHARACTER_MAP = {
  확정위반: characterFailV3,
  의심: characterAttentionV3,
  이상없음: characterPassV3,
};

const BANNER_MAP = {
  통과: characterPassV3,
  안내필요: characterAttentionV3,
};

function CharacterBanner({ src, title, text }) {
  return (
    <div className={styles.characterBanner}>
      <div className={styles.characterBannerImage}>
        <img src={src} alt="" />
      </div>
      <div className={styles.characterBannerText}>
        <p className={styles.characterBannerTitle}>{title}</p>
        <p>{text}</p>
      </div>
    </div>
  );
}

function CharacterSection({ verdict, line, desc, fix }) {
  const src = CHARACTER_MAP[verdict] ?? characterAttentionV3;
  const color = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.의심;
  return (
    <div className={styles.characterSection}>
      <div className={styles.characterSectionImage}>
        <img src={src} alt="" />
      </div>
      <div className={styles.characterSectionBody}>
        <p className={styles.characterSectionLabel}>{verdict}</p>
        <p className={styles.characterSectionDesc}>{desc}</p>
        {fix && <p className={styles.itemFix}>{fix}</p>}
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const color = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.의심;
  return (
    <span
      className={styles.verdictBadge}
      style={{
        backgroundColor: color.badgeBg,
        color: color.text,
        borderColor: color.badge,
      }}
    >
      {verdict}
    </span>
  );
}

function SummaryTop({ summary }) {
  const total = summary.확정위반 + summary.의심 + summary.이상없음;
  if (total === 0) return null;
  const parts = [];
  if (summary.확정위반 > 0) parts.push(`확정위반 ${summary.확정위반}건`);
  if (summary.의심 > 0) parts.push(`의심 ${summary.의심}건`);
  if (summary.이상없음 > 0) parts.push(`이상없음 ${summary.이상없음}건`);
  return (
    <div className={styles.summaryTop}>
      <span className={styles.summaryTopLabel}>전체 요약</span>
      <span className={styles.summaryTopText}>{parts.join(" · ")}</span>
    </div>
  );
}

function SectionContainer({ title, count, children, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className={styles.sectionContainer}>
      <div
        className={styles.sectionHead}
        style={{
          borderBottomColor: VERDICT_COLORS[title]?.badge ?? "#ccc",
          borderBottomWidth: "2px",
        }}
      >
        <div className={styles.sectionHeadInner}>
          <VerdictBadge verdict={title} />
          <span className={styles.sectionLabel}>{title}</span>
          <span className={styles.sectionCount}>{count}건</span>
        </div>
        <button
          className={styles.sectionToggle}
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "펼치기" : "접기"}
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}

export default function Home() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [fileLines, setFileLines] = useState(0);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showIpynbNotice, setShowIpynbNotice] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [sectionCollapsed, setSectionCollapsed] = useState(() => ({
    확정위반: false,
    의심: true,
    이상없음: true,
  }));

  const codeRef = useRef(null);
  const lineRefs = useRef([]);

  const handleOnboardingDismiss = (payload) => {
    if (payload && payload.example) {
      setCode(payload.example);
    }
  };

  const loadExample = () => {
    setCode(EXAMPLE_CODE);
    setCollapsed(false);
  };

  const scrollToLine = (lineNumber) => {
    setHighlightedLine(lineNumber);
    setTimeout(() => {
      if (codeRef.current) {
        codeRef.current.focus();
        const lines = codeRef.current.value.split("\n");
        const targetLine = lineNumber - 1;
        if (targetLine >= 0 && targetLine < lines.length) {
          let position = 0;
          for (let i = 0; i < targetLine; i++) {
            position += lines[i].length + 1;
          }
          const start = codeRef.current.selectionStart;
          const end = codeRef.current.selectionEnd;
          codeRef.current.setSelectionRange(position, position);
          codeRef.current.scrollTop =
            (targetLine / lines.length) * codeRef.current.scrollHeight -
            codeRef.current.clientHeight / 2;
        }
      }
    }, 50);
  };

  const handleLineClick = (lineNumber) => {
    scrollToLine(lineNumber);
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
    setShowIpynbNotice(false);
    setHighlightedLine(null);

    if (!selected) return;

    if (selected.name.endsWith(".ipynb")) {
      setShowIpynbNotice(true);
    }

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
    setShowIpynbNotice(false);
    setHighlightedLine(null);
  };

  const clearContent = () => {
    setCode("");
    setResult(null);
    setCollapsed(false);
    setHighlightedLine(null);
  };

  const summary = result?.summary ?? { 확정위반: 0, 의심: 0, 이상없음: 0 };
  const isBackendConnected = Boolean(BACKEND_URL);
  const isUsingFile = Boolean(file);

  const inputModeNote = isUsingFile
    ? "파일이 선택돼 있어요. 파일이 있으면 파일 기준으로 검사하고, 코드가 비어 있으면 파일만 사용해요."
    : "파일이 없으면 여기에 붙여넣은 코드 기준으로 검사해요. 파일과 코드가 둘 다 있으면 파일이 우선이에요.";

  const banner =
    result?.type === "ok"
      ? { src: BANNER_MAP["통과"], title: "명확하게 의심되는 패턴은 보이지 않아요", text: "전처리·학습 코드를 더 넣어도 좋고, 지금 상태로도 일단 괜찮아 보여요." }
      : result?.type === "error"
      ? { src: BANNER_MAP["안내필요"], title: "검사 중 문제가 있었어요", text: "잠시 뒤 다시 시도해 주세요." }
      : null;

  return (
    <div className={styles.page}>
      <Onboarding onDismiss={handleOnboardingDismiss} />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.title} style={{ color: "var(--color-ink)" }}>
              ML Data Leakage Checker
            </h1>
            <p className={styles.subtitle} style={{ color: "var(--color-ink-secondary)" }}>
              전처리 코드를 붙여넣거나 .py/.ipynb 파일을 올리면 데이터 누수 의심 패턴을 줄 번호와 수정 방향만 짧게 보여줍니다.
            </p>
          </div>
          <button className={styles.exampleLoadButton} onClick={loadExample}>
            예시 코드 불러오기
          </button>
        </div>

        <div className={styles.card} style={{ borderColor: "var(--color-hairline)", backgroundColor: "var(--color-canvas)" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel} style={{ color: "var(--color-ink)" }}>전처리 코드 입력</span>
            <span className={styles.fileFormatHint}>지원 형식: .py, .ipynb</span>
            <label className={styles.fileLabel}>
              <input
                type="file"
                accept=".py,.ipynb"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <span className={styles.fileButton} style={{ color: "var(--color-primary)" }}>파일 선택</span>
            </label>
          </div>

          <div className={styles.inputModeNote}>
            <span>{inputModeNote}</span>
          </div>

          <div className={styles.fileInfo}>
            {file && (
              <span className={styles.fileName} style={{ color: "var(--color-ink-secondary)" }}>
                선택한 파일: {file.name}
                {fileLines > 0 && (
                  <span className={styles.fileLines}> / 총 {fileLines}줄</span>
                )}
                <button className={styles.fileClear} onClick={clearFile} style={{ color: "var(--color-ink-mute)" }}>지우기</button>
              </span>
            )}
            {showIpynbNotice && (
              <span className={styles.ipynbNotice}>{IPYNB_NOTE}</span>
            )}
          </div>

          {collapsed ? (
            <div className={styles.codeAreaFolded}>
              <button className={styles.foldToggle} onClick={() => setCollapsed(false)}>
                코드 보기 ({code.split("\n").length}줄)
              </button>
            </div>
          ) : (
            <textarea
              ref={codeRef}
              className={`${styles.codeArea} ${highlightedLine !== null ? styles.codeAreaHighlighted : ""}`}
              style={highlightedLine !== null ? { backgroundImage: `linear-gradient(to bottom, transparent ${Math.max(0, (highlightedLine - 1) * 22)}px, #fef08a ${Math.max(0, (highlightedLine - 1) * 22)}px, #fef08a ${(highlightedLine) * 22}px, transparent ${(highlightedLine) * 22}px)`, backgroundSize: "100% 22px" } : {}}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`${LEAKAGE_EXAMPLE}

pandas, sklearn 등을 쓰는 전처리 코드를 붙여넣으세요.`}
            />
          )}
        </div>

        <div className={styles.actions}>
          <button
            className="btn-primary-pill"
            onClick={runCheck}
            disabled={status === "loading"}
          >
            {status === "loading" ? "검사 중..." : "누수 검사하기"}
          </button>
          <button
            className="btn-secondary"
            onClick={clearContent}
            disabled={status === "loading"}
          >
            내용 지우기
          </button>
          {!collapsed && code && (
            <button
              className={styles.foldToggle}
              onClick={() => setCollapsed(true)}
            >
              코드 접기
            </button>
          )}
        </div>

        {result && (
          <div className={styles.result} style={{ borderColor: "var(--color-hairline)", backgroundColor: "var(--color-canvas)" }}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel} style={{ color: "var(--color-ink)" }}>검사 결과</span>
              <span className={styles.resultBadge}>{result.badge}</span>
            </div>

            {banner && (
              <CharacterBanner
                src={banner.src}
                title={banner.title}
                text={banner.text}
              />
            )}

            {result.type === "empty" && (
              <p className={styles.message} style={{ color: "var(--color-ink-mute)" }}>
                빈 입력이라 검사할 수 없습니다. 전처리 코드를 붙여넣거나 파일을 선택해 주세요.
              </p>
            )}

            {result.type === "not-python" && (
              <p className={styles.message} style={{ color: "var(--color-ink-mute)" }}>
                파이썬 코드로 보기 어렵습니다. 파이썬 전처리/학습 코드를 붙여넣거나 .py/.ipynb 파일을 선택해 주세요.
              </p>
            )}

            {result.type === "not-preprocessing" && (
              <p className={styles.message} style={{ color: "var(--color-ink-mute)" }}>
                ML 전처리/학습 패턴이 충분히 보이지 않습니다. 전처리 코드인지 확인해 주세요.
              </p>
            )}

            {result.type === "ok" && (
              <p className={styles.message}>
                명확하게 의심되는 패턴이 보이지 않습니다.
              </p>
            )}

            {result.type === "error" && (
              <div className={styles.items}>
                {(result.note || result.message) && (
                  <div className={styles.item}>
                    <p className={styles.itemDesc} style={{ color: "var(--color-ink)" }}>{(result.note || result.message) || "검사 실행 중 문제가 생겼습니다."}</p>
                  </div>
                )}
              </div>
            )}

            {result.type === "not-connected" && (
              <div className={styles.items}>
                <div className={styles.item}>
                  <p className={styles.itemDesc} style={{ color: "var(--color-ink)" }}>
                    백엔드가 연결되지 않아 실제 검사 결과를 표시할 수 없습니다.
                  </p>
                </div>
                <div className={styles.item}>
                  <p className={styles.itemFix} style={{ color: "var(--color-ink-secondary)" }}>
                    Vercel 환경변수 NEXT_PUBLIC_BACKEND_URL에 백엔드 URL을 설정하면 검사 결과가 표시됩니다.
                  </p>
                </div>
              </div>
            )}

            {result.type === "judgment" && (
              <>
                <SummaryTop summary={summary} />

                <div className={styles.summary}>
                  {VERDICT_ORDER.map((verdict) => (
                    <div
                      key={verdict}
                      className={styles.summaryBlock}
                      style={{
                        background: VERDICT_COLORS[verdict]?.badgeBg ?? "#f7f8fa",
                        borderColor: VERDICT_COLORS[verdict]?.badge ?? "#e2e6ee",
                      }}
                    >
                      <span className={styles.summaryLabel}>{verdict}</span>
                      <span className={styles.summaryCount}>{summary[verdict]}건</span>
                    </div>
                  ))}
                </div>

                {summary.확정위반 > 0 && (
                  <SectionContainer title="확정위반" count={summary.확정위반}>
                    {result.items
                      .filter((it) => it.verdict === "확정위반")
                      .map((item, i) => (
                        <CharacterSection
                          key={`확정위반-${i}`}
                          verdict={item.verdict}
                          line={item.line}
                          desc={item.desc}
                          fix={item.fix}
                        />
                      ))}
                  </SectionContainer>
                )}

                {summary.의심 > 0 && (
                  <SectionContainer title="의심" count={summary.의심} defaultCollapsed={true}>
                    {result.items
                      .filter((it) => it.verdict === "의심")
                      .map((item, i) => (
                        <CharacterSection
                          key={`의심-${i}`}
                          verdict={item.verdict}
                          line={item.line}
                          desc={item.desc}
                          fix={item.fix}
                        />
                      ))}
                  </SectionContainer>
                )}

                {summary.이상없음 > 0 && (
                  <SectionContainer title="이상없음" count={summary.이상없음} defaultCollapsed={true}>
                    {result.items
                      .filter((it) => it.verdict === "이상없음")
                      .map((item, i) => (
                        <CharacterSection
                          key={`이상없음-${i}`}
                          verdict={item.verdict}
                          line={item.line}
                          desc={item.desc}
                          fix={item.fix}
                        />
                      ))}
                  </SectionContainer>
                )}

                {summary.확정위반 === 0 && summary.의심 === 0 && summary.이상없음 === 0 && result.items.length === 0 && (
                  <div className={styles.item}>
                    <p className={styles.itemDesc} style={{ color: "var(--color-ink)" }}>
                      항목이 없습니다.
                    </p>
                  </div>
                )}
              </>
            )}

            {result.note && result.type !== "error" && result.type !== "not-connected" && (
              <div className={styles.note} style={{ borderLeftColor: "var(--color-primary)" }}>{result.note}</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
