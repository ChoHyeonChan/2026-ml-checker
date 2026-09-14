"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import Onboarding from "./components/Onboarding";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const _rawExampleCodes = [
  {
    name: "이상없음 (정상)",
    color: "#22c55e",
    code: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("customer.csv")
X = df.drop("churn", axis=1)
y = df["churn"]

# 분할 먼저
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# train에만 fit, test는 transform만
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_scaled, y_train)

train_acc = model.score(X_train_scaled, y_train)
test_acc = model.score(X_test_scaled, y_test)
print(f"train: {train_acc:.3f}, test: {test_acc:.3f}")`,
    desc: "분할 후 전처리, test는 transform만 — 이상없음",
  },
  {
    name: "확정위반 #1 (타겟 groupby)",
    color: "#ef4444",
    code: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("customer.csv")

# 타겟 기준 groupby 연산 (타겟 정보 직접 사용)
df["age_enc"] = df.groupby("churn")["age"].transform("mean")

# 분할 전 정제 (테스트 정보 영향)
df = df.dropna()

X = df.drop("churn", axis=1)
y = df["churn"]

# 전체 데이터로 fit_transform (분할 전 스케일링)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

model = LogisticRegression()
model.fit(X_train, y_train)`,
    desc: "타겟 groupby + 분할 전 정제 + 전체 fit_transform — 확정위반",
  },
  {
    name: "확정위반 #2 (test 데이터로 fit)",
    color: "#ef4444",
    code: `from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = LogisticRegression()
# test 데이터로 모델 fit — 명백한 누수
model.fit(X_test, y_test)`,
    desc: "test 데이터로 모델 fit — 확정위반",
  },
];

const EXAMPLE_CODES = _rawExampleCodes;
const EXAMPLE_CODE = EXAMPLE_CODES[0].code;
const LEAKAGE_EXAMPLE = "예시: df['x_enc'] = df.groupby('y')['x'].transform('mean')";

const IPYNB_NOTE = "참고: .ipynb는 셀 표시 순서 ≠ 실제 실행 순서일 수 있어요. 실행 순서대로 정리한 파일을 올리면 더 정확해요.";

const NOT_PYTHON_EXAMPLES = ["단순 유틸리티 함수"];
const NOT_PREPROCESSING_EXAMPLES = ["단순 데이터 로드"];

const VERDICT_ORDER = ["확정위반", "의심", "이상없음"];

const VERDICT_COLORS = {
  확정위반: { badge: "#ef4444", badgeBg: "#fef2f2", text: "#b91c1c" },
  의심: { badge: "#f59e0b", badgeBg: "#fffbeb", text: "#b45309" },
  이상없음: { badge: "#22c55e", badgeBg: "#f0fdf4", text: "#15803d" },
};

const CHARACTER_MAP = {
  확정위반: "/characters/character-fail-v3.png",
  의심: "/characters/character-attention-v3.png",
  이상없음: "/characters/character-pass-v3.png",
};

const BANNER_MAP = {
  통과: "/characters/character-pass-v3.png",
  안내필요: "/characters/character-attention-v3.png",
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
  const src = CHARACTER_MAP[verdict] ?? "/characters/character-attention-v3.png";
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
    <span className={styles.verdictBadge} style={{ backgroundColor: color.badgeBg, color: color.text, borderColor: color.badge }}>
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
      <div className={styles.sectionHead} style={{ borderBottomColor: VERDICT_COLORS[title]?.badge ?? "#ccc", borderBottomWidth: "2px" }}>
        <div className={styles.sectionHeadInner}>
          <VerdictBadge verdict={title} />
          <span className={styles.sectionLabel}>{title}</span>
          <span className={styles.sectionCount}>{count}건</span>
        </div>
        <button className={styles.sectionToggle} onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
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
  const [showExamplePopup, setShowExamplePopup] = useState(false);

  const codeRef = useRef(null);

  const handleOnboardingDismiss = (payload) => {
    if (payload?.example) setCode(payload.example);
  };

  const openExamplePopup = () => setShowExamplePopup(true);
  const closeExamplePopup = () => setShowExamplePopup(false);
  const loadExample = (codeStr) => {
    setCode(codeStr);
    setCollapsed(false);
    setShowExamplePopup(false);
  };

  const runCheck = async () => {
    setStatus("loading");
    setResult(null);

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/check", { method: "POST", body: formData });
        setResult(await res.json());
      } catch {
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
      setResult(await res.json());
    } catch {
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
    if (selected.name.endsWith(".ipynb")) setShowIpynbNotice(true);

    selected.text().then((text) => {
      setFileLines(text.split("\n").length);
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

  return (
    <div className={styles.page}>
      <Onboarding onDismiss={handleOnboardingDismiss} />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <img className={styles.brandLogo} src="/logo-leakage-check.png" alt="Leakage Check 로고" />
            <div className={styles.brandText}>
              <h1 className={styles.title}>Leakage Check</h1>
              <p className={styles.subtitle}>전처리·학습 코드에서 데이터 누수 의심 패턴을 줄 번호와 수정 방향 위주로 확인합니다.</p>
            </div>
          </div>
          <button className={styles.exampleLoadButton} onClick={openExamplePopup}>예시로 테스트하기</button>
        </div>

        {showExamplePopup && (
          <div className={styles.examplePopupOverlay} onClick={closeExamplePopup}>
            <div className={styles.examplePopup} onClick={(e) => e.stopPropagation()}>
              <div className={styles.examplePopupHeader}>
                <h3 className={styles.examplePopupTitle}>예시 코드 선택</h3>
                <button className={styles.examplePopupClose} onClick={closeExamplePopup}>닫기</button>
              </div>
              <div className={styles.examplePopupList}>
                {EXAMPLE_CODES.map((ex, i) => (
                  <button key={i} className={styles.examplePopupOption} style={{ borderLeftColor: ex.color, borderLeftWidth: "4px" }} onClick={() => loadExample(ex.code)}>
                    <span className={styles.examplePopupOptionName}>{ex.name}</span>
                    <span className={styles.examplePopupOptionDesc}>{ex.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.card} style={{ borderColor: "var(--color-hairline)", backgroundColor: "var(--color-canvas)" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel} style={{ color: "var(--color-ink)" }}>전처리 코드 입력</span>
            <span className={styles.fileFormatHint}>지원 형식: .py, .ipynb</span>
            <label className={styles.fileLabel}>
              <input type="file" accept=".py,.ipynb" onChange={handleFileChange} className={styles.fileInput} />
              <span className={styles.fileButton}>파일 선택</span>
            </label>
          </div>

          <div className={styles.inputModeNote}><span></span></div>

          <div className={styles.fileInfo}>
            {file && (
              <span className={styles.fileName} style={{ color: "var(--color-ink-secondary)" }}>
                선택한 파일: {file.name}
                {fileLines > 0 && <span className={styles.fileLines}> / 총 {fileLines}줄</span>}
                <button className={styles.fileClear} onClick={clearFile} style={{ color: "var(--color-ink-mute)" }}>지우기</button>
              </span>
            )}
            {showIpynbNotice && <span className={styles.ipynbNotice}>{IPYNB_NOTE}</span>}
          </div>

          {collapsed ? (
            <div className={styles.codeAreaFolded}>
              <button className={styles.foldToggle} onClick={() => setCollapsed(false)}>코드 펼치기 ({code.split("\n").length}줄)</button>
            </div>
          ) : (
            <textarea
              ref={codeRef}
              className={`${styles.codeArea} ${highlightedLine !== null ? styles.codeAreaHighlighted : ""}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={LEAKAGE_EXAMPLE}
            />
          )}
        </div>

        <div className={styles.actions}>
          <button className="btn-primary-pill" onClick={runCheck} disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <span className="spinner" />
                <span className="loading-text">검사 중…</span>
              </>
            ) : (
              "누수 검사하기"
            )}
          </button>
          <button className="btn-secondary" onClick={clearContent} disabled={status === "loading"}>내용 지우기</button>
          {!collapsed && code && (
            <button className={styles.foldToggle} onClick={() => setCollapsed(true)}>코드 접기</button>
          )}
        </div>

        {result && (
          <div className={styles.result} style={{ borderColor: "var(--color-hairline)", backgroundColor: "var(--color-canvas)" }}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel} style={{ color: "var(--color-ink)" }}>검사 결과</span>
              <span className={styles.resultBadge}>{result.badge}</span>
            </div>

            {result.type === "empty" && (
              <div className={styles.feedbackCard}>
                <p className={styles.feedbackTitle}>빈 입력 상태예요</p>
                <p className={styles.feedbackDesc}>코드를 붙여넣거나 파일을 올려주세요.</p>
                <div className={styles.feedbackActions}>
                  <button className={styles.feedbackActionButton} onClick={() => loadExample(EXAMPLE_CODES[0].code)}>예시 불러오기</button>
                  <button className={styles.feedbackSecondaryButton} onClick={clearContent}>코드 지우기</button>
                </div>
              </div>
            )}

            {result.type === "not-python" && (
              <div className={styles.feedbackCard}>
                <p className={styles.feedbackTitle}>파이썬 코드로 보기 어려워요</p>
                <p className={styles.feedbackDesc}>파이썬 전처리/학습 코드로 인식되지 않았어요.</p>
                <p className={styles.feedbackFix}>pandas, sklearn 등을 쓰는 전처리 코드를 붙여넣거나 .py/.ipynb 파일을 선택해 주세요.</p>
                <div className={styles.feedbackActions}>
                  <button className={styles.feedbackActionButton} onClick={() => loadExample(EXAMPLE_CODES[0].code)}>예시 불러오기</button>
                </div>
              </div>
            )}

            {result.type === "not-preprocessing" && (
              <div className={styles.feedbackCard}>
                <p className={styles.feedbackTitle}>전처리/학습 패턴이 충분하지 않아요</p>
                <p className={styles.feedbackDesc}>ML 전처리·학습 코드가 충분히 보이지 않아요.</p>
                <p className={styles.feedbackFix}>전처리·학습 코드를 더 넣어 다시 검사해 보세요.</p>
                <div className={styles.feedbackActions}>
                  <button className={styles.feedbackActionButton} onClick={() => loadExample(EXAMPLE_CODES[0].code)}>예시 불러오기</button>
                </div>
              </div>
            )}

            {result.type === "ok" && (
              <div className={styles.feedbackCard}>
                <p className={styles.feedbackTitle}>명확하게 의심되는 패턴이 보이지 않아요</p>
                <p className={styles.feedbackDesc}>전처리·학습 코드를 더 넣어도 좋고, 지금 상태로도 일단 괜찮아 보여요.</p>
                <div className={styles.feedbackActions}>
                  <button className={styles.feedbackActionButton} onClick={() => loadExample(EXAMPLE_CODES[0].code)}>예시 불러오기</button>
                  <button className={styles.feedbackSecondaryButton} onClick={clearContent}>코드로 돌아가기</button>
                </div>
              </div>
            )}

            {result.type === "error" && (
              <div className={styles.feedbackCard}>
                <p className={styles.feedbackTitle}>검사 중 문제가 있었어요</p>
                <p className={styles.feedbackDesc}>{(result.note || result.message) || "검사 실행 중 문제가 생겼습니다."}</p>
                <p className={styles.feedbackFix}>코드/파일 형식을 다시 확인한 뒤 다시 시도해 주세요.</p>
                <div className={styles.feedbackActions}>
                  <button className={styles.feedbackActionButton} onClick={() => { setResult(null); setStatus("idle"); }}>다시 시도</button>
                  <button className={styles.feedbackSecondaryButton} onClick={() => loadExample(EXAMPLE_CODES[0].code)}>예시 불러오기</button>
                </div>
              </div>
            )}

            {result.type === "not-connected" && (
              <div className={styles.notConnectedBanner}>
                <div className={styles.notConnectedBannerInner}>
                  <p className={styles.notConnectedBannerTitle}>백엔드 미연결 상태예요</p>
                  <p className={styles.notConnectedBannerDesc}>지금은 결과 대신 안내만 보여요. 백엔드를 연결하면 검사 결과가 표시됩니다.</p>
                </div>
              </div>
            )}

            {result.type === "judgment" && (
              <>
                <SummaryTop summary={summary} />

                <div className={styles.summary}>
                  {VERDICT_ORDER.map((verdict) => (
                    <div key={verdict} className={styles.summaryBlock} style={{ background: VERDICT_COLORS[verdict]?.badgeBg ?? "#f7f8fa", borderColor: VERDICT_COLORS[verdict]?.badge ?? "#e2e6ee" }}>
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
                        <CharacterSection key={`확정위반-${i}`} verdict={item.verdict} line={item.line} desc={item.desc} fix={item.fix} />
                      ))}
                  </SectionContainer>
                )}

                {summary.의심 > 0 && (
                  <SectionContainer title="의심" count={summary.의심} defaultCollapsed={true}>
                    {result.items
                      .filter((it) => it.verdict === "의심")
                      .map((item, i) => (
                        <CharacterSection key={`의심-${i}`} verdict={item.verdict} line={item.line} desc={item.desc} fix={item.fix} />
                      ))}
                  </SectionContainer>
                )}

                {summary.이상없음 > 0 && (
                  <SectionContainer title="이상없음" count={summary.이상없음} defaultCollapsed={true}>
                    {result.items
                      .filter((it) => it.verdict === "이상없음")
                      .map((item, i) => (
                        <CharacterSection key={`이상없음-${i}`} verdict={item.verdict} line={item.line} desc={item.desc} fix={item.fix} />
                      ))}
                  </SectionContainer>
                )}

                {summary.확정위반 === 0 && summary.의심 === 0 && summary.이상없음 === 0 && result.items.length === 0 && (
                  <div className={styles.item}>
                    <p className={styles.itemDesc} style={{ color: "var(--color-ink)" }}>항목이 없습니다.</p>
                  </div>
                )}
              </>
            )}

            {result.note && result.type !== "error" && result.type !== "not-connected" && (
              <div className={styles.note} style={{ borderLeftColor: "var(--color-primary)" }}>{result.note}</div>
            )}

            {result.type === "judgment" && (
              <div className={styles.resultActions}>
                <button className={styles.resultActionButton} onClick={() => { setResult(null); setCode(EXAMPLE_CODES[1]?.code ?? EXAMPLE_CODES[0].code); setCollapsed(false); }}>예시 코드로 다시 검사</button>
                <button className={styles.resultActionButtonSecondary} onClick={() => { setResult(null); }}>코드로 돌아가기</button>
                <button className={styles.resultActionButtonTertiary} onClick={() => loadExample(EXAMPLE_CODES[0].code)}>예시 불러오기</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

