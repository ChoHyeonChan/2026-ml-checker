        <div className={styles.actions}>
          <button
            className="btn-primary-pill"
            onClick={runCheck}
            disabled={status === "loading"}
          >
            {status === "loading" ? "검사 중..." : "누수 검사하기"}
          </button>
