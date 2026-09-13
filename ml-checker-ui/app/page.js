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
