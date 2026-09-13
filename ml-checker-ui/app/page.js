                    {result.items.filter((it) => it.verdict === "이상없음").length === 0 && (
                      <div className={styles.item}>
                        <p className={styles.itemDesc} style={{ color: "var(--color-ink)" }}>
                          이상없음으로 분류된 항목이 없습니다.
