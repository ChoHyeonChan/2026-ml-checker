                {fileLines > 0 && (
                  <span className={styles.fileLines}> / 총 {fileLines}줄</span>
                )}
                <button className={styles.fileClear} onClick={clearFile} style={{ color: "var(--color-ink-mute)" }}>지우기</button>
