  return (
    <div className={styles.page}>
      <Onboarding onDismiss={handleOnboardingDismiss} />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title} style={{ color: "var(--color-ink)" }}>
            ML Data Leakage Checker
          </h1>
          <p className={styles.subtitle} style={{ color: "var(--color-ink-secondary)" }}>
            전처리 코드를 붙여넣거나 .py/.ipynb 파일을 올리면 데이터 누수 의심 패턴을 줄 번호와 수정 방향만 짧게 보여줍니다.
          </p>
        </div>
