function CharacterSection({ verdict, line, desc, fix }) {
  const src = CHARACTER_MAP[verdict] ?? "/character-attention-v3.jpg";
  return (
    <div className={styles.characterSection}>
      <div className={styles.characterSectionImage}>
        <img src={src} alt="" />
      </div>
      <div className={styles.characterSectionBody}>
        <p className={styles.characterSectionLabel}>{verdict}</p>
        <p className={styles.characterSectionDesc}>{desc}</p>
        {fix && <p className={styles.itemFix}>{fix}</p>}
      </div>
    </div>
  );
}
