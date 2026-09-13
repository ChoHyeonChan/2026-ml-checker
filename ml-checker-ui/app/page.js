const BANNER_MAP = {
  통과: "/character-pass-v3.jpg",
  안내필요: "/character-attention-v3.jpg",
};

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
