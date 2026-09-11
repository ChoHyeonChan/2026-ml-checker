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
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>ML Data Leakage Checker</h1>
          <p className={styles.subtitle}>
            전처리 코드를 붙여넣거나 .py/.ipynb 파일을 올리면 데이터 누수 의심 패턴을 줄 번호와 수정 방향만 짧게 보여줍니다.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>전처리 코드 입력</span>
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

          <div className={styles.fileInfo}>
            {file && (
              <span className={styles.fileName}>
                선택한 파일: {file.name}
                <button className={styles.fileClear} onClick={clearFile}>지우기</button>
              </span>
            )}
          </div>

          <textarea
            className={styles.codeArea}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`pandas, sklearn 등을 쓰는 전처리 코드를 붙여넣으세요.`}
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.runButton}
            onClick={runCheck}
            disabled={status === "loading"}
          >
            {status === "loading" ? "검사 중..." : "누수 검사하기"}
          </button>
        </div>

        {result && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel}>검사 결과</span>
              <span className={styles.resultBadge}>{result.badge}</span>
            </div>

            {result.type === "empty" && (
              <p className={styles.message}>
                빈 입력이라 검사할 수 없습니다. 전처리 코드를 붙여넣거나 파일을 선택해 주세요.
              </p>
            )}

            {result.type === "not-python" && (
              <p className={styles.message}>
                파이썬 코드로 보기 어렵습니다. 파이썬 전처리/학습 코드를 붙여넣거나 .py/.ipynb 파일을 선택해 주세요.
              </p>
            )}

            {result.type === "not-preprocessing" && (
              <p className={styles.message}>
                ML 전처리/학습 패턴이 충분히 보이지 않습니다. 전처리 코드인지 확인해 주세요.
              </p>
            )}

            {result.type === "judgment" && (
              <div className={styles.items}>
                {result.items.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemLine}>{item.line}</span>
                      <span className={styles.itemVerdict}>{item.verdict}</span>
                    </div>
                    <p className={styles.itemDesc}>{item.desc}</p>
                    {item.fix && (
                      <p className={styles.itemFix}>{item.fix}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {result.note && (
              <div className={styles.note}>{result.note}</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
