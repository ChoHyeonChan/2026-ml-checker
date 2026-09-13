        {result && (
          <div className={styles.result} style={{ borderColor: "var(--color-hairline)", backgroundColor: "var(--color-canvas)" }}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel} style={{ color: "var(--color-ink)" }}>검사 결과</span>
              <span className={styles.resultBadge}>{result.badge}</span>
            </div>
