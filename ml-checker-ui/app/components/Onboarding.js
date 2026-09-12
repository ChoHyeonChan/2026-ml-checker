"use client";

import { useState, useEffect } from "react";
import styles from "./Onboarding.module.css";

const STEPS = [
  {
    title: "무엇을 해주나요?",
    body: (
      <>
        <p>이 서비스는 전처리·학습 코드에서 <strong>데이터 누수 의심 패턴</strong>을 찾아줘요.</p>
        <p>복잡한 설명 대신 <strong>줄 번호와 수정 방향만 짧게</strong> 보여줘서, 어디를 먼저 보면 될지 바로 알 수 있어요.</p>
      </>
    ),
  },
  {
    title: "어떻게 입력하나요?",
    body: (
      <>
        <p>pandas, sklearn 같은 걸 쓰는 전처리 코드를 <strong>붙여넣거나</strong>, <code>.py</code> / <code>.ipynb</code> 파일을 올리면 돼요.</p>
        <p>먼저 코드 문자열로 시작할 수 있고, 파일은 나중에 더 편해져요.</p>
        <button type="button" className={styles.exampleButton} onClick={fillExample}>
          예시 코드 복사
        </button>
      </>
    ),
    fillExample,
  },
  {
    title: "결과는 어떻게 보나요?",
    body: (
      <>
        <p>검사하면 화면에 이렇게 보여줘요.</p>
        <ul>
          <li><strong>분류</strong>: 확정위반 / 의심 / 이상없음</li>
          <li><strong>요약</strong>: “의심 4건” 같은 형태</li>
          <li><strong>항목</strong>: 줄 번호, 판정, 수정 방향, 이유</li>
        </ul>
        <p>나중에 결과 화면에서 “이 결과가 왜 이렇게 나왔는지”도 다시 볼 수 있어요.</p>
      </>
    ),
  },
  {
    title: "판정은 이렇게 나뉘어요",
    body: (
      <>
        <ul>
          <li><strong>확정위반</strong>: 명확히 의심되는 패턴</li>
          <li><strong>의심</strong>: 확인이 필요한 패턴</li>
          <li><strong>이상없음</strong>: 명확하게 의심되는 패턴이 보이지 않음</li>
        </ul>
        <p>“의심”이라고 해서 무조건 문제라는 뜻은 아니고, 한 번 더 확인해보라는 신호예요.</p>
      </>
    ),
  },
  {
    title: "이런 경우는 안내가 나와요",
    body: (
      <>
        <ul>
          <li>빈 입력</li>
          <li>파이썬 코드로 보기 어려운 경우</li>
          <li>ML 전처리·학습 패턴이 충분하지 않은 경우</li>
        </ul>
        <p>이럴 땐 메시지가 뜨면서 무엇을 하면 되는지 알려줘요.</p>
        <p className={styles.closeNote}>건너뛰어도 되고, 헤더나 도움말에서 언제든 다시 볼 수 있어요.</p>
      </>
    ),
  },
];

const DONE_KEY = "ml-checker-onboarding-done";

export default function Onboarding({ onDismiss }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DONE_KEY) === "1") return;
    setVisible(true);
  }, []);

  const close = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(DONE_KEY, "1");
    setVisible(false);
    onDismiss?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const fillExample = () => {
    const example =
      "import pandas as pd\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\n\ndf = pd.read_csv(\"data.csv\")\nX = df.drop(\"target\", axis=1)\ny = df[\"target\"]\n\n# 분할 전에 스케일링을 해버린 예\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\n\nX_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)";
    window.__mlCheckerExample = example;
    onDismiss?.({ example });
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <span className={styles.stepIndicator}>{step + 1} / {STEPS.length}</span>
          <button type="button" className={styles.skipButton} onClick={close}>
            건너뛰기
          </button>
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>{STEPS[step].title}</h2>
          <div className={styles.content}>{STEPS[step].body}</div>
        </div>

        <div className={styles.foot}>
          <button
            type="button"
            className={styles.prevButton}
            onClick={prev}
            disabled={step === 0}
          >
            이전
          </button>
          <button type="button" className={styles.nextButton} onClick={next}>
            {step === STEPS.length - 1 ? "확인했으니 닫기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
