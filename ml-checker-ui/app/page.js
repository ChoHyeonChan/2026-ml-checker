"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const runCheck = async () => {
    if (file) {
      setStatus("loading");
      setResult(null);
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
        setResult({ type: "error", message: "검사 실행 중 문제가 생겼습니다." });
      } finally {
        setStatus("idle");
      }
      return;
    }

    if (!code.trim()) {
      setResult({ type: "empty" });
      return;
    }
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ type: "error", message: "검사 실행 중 문제가 생겼습니다." });
    } finally {
      setStatus("idle");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className={styles.page}>
      {/* Gradient mesh hero */}
      <section className="gradient-mesh section-hero">
        <div className="container">
          <main className={styles.main}>
            <div className={styles.header}>
              <span className="pill-tag-soft">ML Data Leakage Checker</span>
              <h1 className="display-xxl" style={{ marginTop: "16px", color: "var(--color-ink)" }}>
                전처리 코드 누수 검사
              </h1>
              <p className="body-lg" style={{ marginTop: "12px", color: "var(--color-ink-secondary)", maxWidth: "600px" }}>
                pandas, sklearn 등을 쓰는 전처리 코드를 붙여넣거나 .py/.ipynb 파일을 올리면
                데이터 누수 의심 패턴을 줄 번호와 수정 방향만 짧게 보여줍니다.
              </p>
            </div>

            {/* Input card */}
            <div className="card-feature-light" style={{ marginTop: "48px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="heading-md" style={{ color: "var(--color-ink)" }}>전처리 코드 입력</span>
                <label className={styles.fileLabel}>
                  <input
                    type="file"
                    accept=".py,.ipynb"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileButton}>파일 선택</span>
                </label>
              </div>

              {file && (
                <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="pill-tag-soft">{file.name}</span>
                  <button
                    className="btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "13px" }}
                    onClick={clearFile}
                  >
                    지우기
                  </button>
                </div>
              )}

              <textarea
                className={styles.codeArea}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`pandas, sklearn 등을 쓰는 전처리 코드를 붙여넣으세요.`}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="btn-primary-pill"
                onClick={runCheck}
                disabled={status === "loading"}
              >
                {status === "loading" ? "검사 중..." : "누수 검사하기"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setCode(""); setResult(null); }}
                disabled={status === "loading"}
              >
                내용 지우기
              </button>
            </div>

            {/* Result panel */}
            {result && (
              <div className="card-feature-light" style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <span className="heading-md" style={{ color: "var(--color-ink)" }}>검사 결과</span>
                  <span className="pill-tag-soft" style={{ background: result.badge === "확정위반" ? "var(--color-ruby)" : result.badge === "의심" ? "var(--color-primary-bg-subdued-hover)" : "var(--color-canvas-cream)", color: result.badge === "확정위반" ? "white" : "var(--color-primary-deep)" }}>
                    {result.badge}
                  </span>
                </div>

                {result.type === "empty" && (
                  <p style={{ color: "var(--color-ink-mute)", lineHeight: "1.6" }}>
                    빈 입력이라 검사할 수 없습니다. 전처리 코드를 붙여넣거나 파일을 선택해 주세요.
                  </p>
                )}

                {result.type === "not-python" && (
                  <p style={{ color: "var(--color-ink-mute)", lineHeight: "1.6" }}>
                    파이썬 코드로 보기 어렵습니다. 파이썬 전처리/학습 코드를 붙여넣거나 .py/.ipynb 파일을 선택해 주세요.
                  </p>
                )}

                {result.type === "not-preprocessing" && (
                  <p style={{ color: "var(--color-ink-mute)", lineHeight: "1.6" }}>
                    ML 전처리/학습 패턴이 충분히 보이지 않습니다. 전처리 코드인지 확인해 주세요.
                  </p>
                )}

                {result.type === "judgment" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {result.items.map((item, i) => (
                      <div key={i} style={{
                        border: "1px solid var(--color-hairline)",
                        borderRadius: "var(--radius-md)",
                        padding: "16px",
                        background: item.verdict === "확정위반" ? "rgba(234, 34, 97, 0.05)" : item.verdict === "의심" ? "rgba(83, 58, 253, 0.05)" : "var(--color-canvas-soft)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span className="caption" style={{ color: "var(--color-ink-mute)" }}>줄 {item.line}</span>
                          <span className="pill-tag-soft" style={{
                            background: item.verdict === "확정위반" ? "var(--color-ruby)" : item.verdict === "의심" ? "var(--color-primary-bg-subdued-hover)" : "var(--color-canvas-cream)",
                            color: item.verdict === "확정위반" ? "white" : "var(--color-primary-deep)"
                          }}>
                            {item.verdict}
                          </span>
                        </div>
                        <p style={{ color: "var(--color-ink)", lineHeight: "1.5", marginBottom: "8px" }}>{item.desc}</p>
                        {item.fix && (
                          <p style={{ color: "var(--color-ink-secondary)", lineHeight: "1.5", fontSize: "14px" }}>{item.fix}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.note && (
                  <div style={{ marginTop: "20px", padding: "12px", background: "var(--color-canvas-soft)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--color-primary)" }}>
                    <p style={{ color: "var(--color-ink-mute)", fontSize: "13px", lineHeight: "1.5" }}>{result.note}</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Feature cards section */}
      <section className="section-content">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "48px" }}>
            <div className="card-cream-band">
              <span className="pill-tag-soft" style={{ marginBottom: "12px" }}>특징 1</span>
              <h3 className="heading-lg" style={{ color: "var(--color-ink)", marginBottom: "8px" }}>줄 번호 기반 판정</h3>
              <p className="body-md" style={{ color: "var(--color-ink-secondary)", lineHeight: "1.6" }}>
                의심 패턴을 발견한 줄 번호를 바로 표시하고, 해당 위치의 수정 방향만 제공합니다.
              </p>
            </div>

            <div className="card-feature-light">
              <span className="pill-tag-soft" style={{ marginBottom: "12px" }}>특징 2</span>
              <h3 className="heading-lg" style={{ color: "var(--color-ink)", marginBottom: "8px" }}>3분류 결과</h3>
              <p className="body-md" style={{ color: "var(--color-ink-secondary)", lineHeight: "1.6" }}>
                확정위반 / 의심 / 이상없음 3분류로 결과를 짧게 출력합니다. 과정 설명은 생략하고 결과만 제시합니다.
              </p>
            </div>

            <div className="card-pricing">
              <span className="pill-tag-soft" style={{ marginBottom: "12px" }}>특징 3</span>
              <h3 className="heading-lg" style={{ color: "var(--color-ink)", marginBottom: "8px" }}>원본 코드 비수정</h3>
              <p className="body-md" style={{ color: "var(--color-ink-secondary)", lineHeight: "1.6" }}>
                원본 코드는 수정하지 않고 지적만 제공합니다. 검토자가 직접 수정 여부를 결정할 수 있습니다.
              </p>

              <button className="btn-primary-pill" style={{ marginTop: "auto", alignSelf: "flex-start" }}>
                지금 검사하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Featured card */}
      <section className="section-content" style={{ backgroundColor: "var(--color-canvas-soft)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="card-pricing-featured" style={{ maxWidth: "480px", width: "100%" }}>
              <span className="pill-tag-soft" style={{ marginBottom: "12px" }}>대표 플랜</span>
              <h2 className="heading-lg" style={{ color: "var(--color-on-primary)" }}>Stripi 디자인 적용</h2>
              <p className="body-md" style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>
                이 페이지는 Stripi 디자인 시스템의 디자인 토큰을 CSS Custom Properties로 변환하여 적용한 예시입니다.
              </p>

              <div style={{ margin: "24px 0", padding: "16px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Primary Indigo</span>
                  <span className="tabular-figures" style={{ color: "white" }}>#533afd</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Ink (text)</span>
                  <span className="tabular-figures" style={{ color: "white" }}>#0d253d</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Ruby accent</span>
                  <span className="tabular-figures" style={{ color: "white" }}>#ea2261</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Font</span>
                  <span style={{ color: "white" }}>Sohne Var</span>
                </div>
              </div>

              <button className="btn-on-dark" style={{ marginTop: "auto" }}>
                디자인 토큰 확인
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-light">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
          <div>
            <p className="heading-sm" style={{ color: "var(--color-ink)", marginBottom: "8px" }}>ML Data Leakage Checker</p>
            <p className="caption">데이터 전처리 코드의 누수 패턴을 검사하는 도구</p>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#" className="link-on-light" style={{ fontSize: "13px" }}>문서</a>
            <a href="#" className="link-on-light" style={{ fontSize: "13px" }}>가이드</a>
            <a href="#" className="link-on-light" style={{ fontSize: "13px" }}>연락처</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
