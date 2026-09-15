diff --git a/ml-checker-ui/app/page.js b/ml-checker-ui/app/page.js
index a92a7f3..b47ba3f 100644
--- a/ml-checker-ui/app/page.js
+++ b/ml-checker-ui/app/page.js
@@ -304,25 +304,7 @@ export default function Home() {
       <Onboarding onDismiss={handleOnboardingDismiss} forceShow={showOnboarding} />
       <main className={styles.main}>
-        <div className={styles.header}>
-          <div className={styles.brand}>
-            <img className={styles.brandLogo} src="/logo-leakage-check.png" alt="Leakage Check 로고" />
-            <div className={styles.brandText}>
-              <h1 className={styles.title}>Leakage Check</h1>
-              <p className={styles.subtitle}>전처리·학습 코드에서 데이터 누수 의심 패턴을 줄 번호와 수정 방향 위주로 확인합니다.</p>
-            </div>
-          </div>
-          <div className={styles.headerButtons}>
-            <button className={styles.exampleLoadButton} onClick={openExamplePopup}>
-              예시로 테스트하기
-            </button>
-            <button className={styles.firstTimeButton} onClick={() => setShowOnboarding(true)}>
-              <span className={styles.bubble} /> 처음이에요?
-            </button>
-          </div>
-        </div>
-
         {/* 가치 제안 카드 */}
         <div className={styles.valueProps}>
           {VALUE_PROPS.map((vp, i) => (
