function CharacterBanner({ src, title, text }) {
  return (
    <div className={styles.characterBanner}>
      <div className={styles.characterBannerImage}>
        <img src={src} alt="" />
      </div>
      <div className={styles.characterBannerText}>
        <p className={styles.characterBannerTitle}>{title}</p>
        <p>{text}</p>
      </div>
    </div>
  );
}
