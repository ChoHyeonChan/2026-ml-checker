                    {result.items.filter((it) => it.verdict === "의심").length === 0 && (
                      <div className={styles.item}>
                        <p className={styles.itemDesc} style={{ color: "var(--color-ink)" }}>
                          의심으로 분류된 항목이 없습니다.
