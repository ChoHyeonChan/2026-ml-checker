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
