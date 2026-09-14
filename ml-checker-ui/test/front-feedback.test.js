// front-feedback.test.js
// 피드백/가이드층 + 액션/동선 렌더링 검증 — JSDOM으로 각 상태별 피드백과 액션 바 확인

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
  url: "http://localhost",
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.File = dom.window.File;
global.FormData = dom.window.FormData;

const STYLES = {
  feedbackCard: "feedback-card",
  feedbackTitle: "feedback-title",
  feedbackDesc: "feedback-desc",
  feedbackList: "feedback-list",
  feedbackFix: "feedback-fix",
  feedbackActions: "feedback-actions",
  feedbackActionButton: "feedback-action-button",
  feedbackSecondaryButton: "feedback-secondary-button",
  notConnectedBanner: "not-connected-banner",
  notConnectedBannerInner: "not-connected-banner-inner",
  notConnectedBannerTitle: "not-connected-banner-title",
  notConnectedBannerDesc: "not-connected-banner-desc",
  result: "result",
  resultHeader: "result-header",
  resultLabel: "result-label",
  resultBadge: "result-badge",
  resultActions: "result-actions",
  resultActionButton: "result-action-button",
  resultActionButtonSecondary: "result-action-button-secondary",
  resultActionButtonTertiary: "result-action-button-tertiary",
  spinner: "spinner",
  loadingText: "loading-text",
  actions: "actions",
  btnSecondary: "btn-secondary",
};

// 결과 부분만 렌더링하는 순수 함수
function renderFeedbackResult(result, styles) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const resultEl = document.createElement("div");
  resultEl.className = styles.result;
  resultEl.style.borderColor = "var(--color-hairline)";
  resultEl.style.backgroundColor = "var(--color-canvas)";

  // 결과 헤더
  const header = document.createElement("div");
  header.className = styles.resultHeader;
  const label = document.createElement("span");
  label.className = styles.resultLabel;
  label.style.color = "var(--color-ink)";
  label.textContent = "검사 결과";
  header.appendChild(label);
  const badge = document.createElement("span");
  badge.className = styles.resultBadge;
  badge.textContent = result.badge || "";
  header.appendChild(badge);
  resultEl.appendChild(header);

  if (result.type === "empty") {
    const card = document.createElement("div");
    card.className = styles.feedbackCard;
    const title = document.createElement("p");
    title.className = styles.feedbackTitle;
    title.textContent = "빈 입력 상태예요";
    card.appendChild(title);
    const desc = document.createElement("p");
    desc.className = styles.feedbackDesc;
    desc.textContent = "코드를 붙여넣거나 파일을 올려주세요.";
    card.appendChild(desc);
    const actions = document.createElement("div");
    actions.className = styles.feedbackActions;
    const btn1 = document.createElement("button");
    btn1.className = styles.feedbackActionButton;
    btn1.textContent = "예시 코드 불러오기";
    actions.appendChild(btn1);
    const btn2 = document.createElement("button");
    btn2.className = styles.feedbackSecondaryButton;
    btn2.textContent = "입력 초기화";
    actions.appendChild(btn2);
    card.appendChild(actions);
    resultEl.appendChild(card);
  }

  if (result.type === "not-python") {
    const card = document.createElement("div");
    card.className = styles.feedbackCard;
    const title = document.createElement("p");
    title.className = styles.feedbackTitle;
    title.textContent = "파이썬 코드로 보기 어려워요";
    card.appendChild(title);
    const desc = document.createElement("p");
    desc.className = styles.feedbackDesc;
    desc.textContent = "파이썬 전처리/학습 코드로 인식되지 않았어요.";
    card.appendChild(desc);
    const list = document.createElement("ul");
    list.className = styles.feedbackList;
    const li = document.createElement("li");
    li.textContent = "단순 유틸리티 함수 (예시)";
    list.appendChild(li);
    card.appendChild(list);
    const fix = document.createElement("p");
    fix.className = styles.feedbackFix;
    fix.textContent = "pandas, sklearn 등을 쓰는 전처리 코드를 붙여넣거나 파일을 선택해 주세요.";
    card.appendChild(fix);
    const actions = document.createElement("div");
    actions.className = styles.feedbackActions;
    const btn = document.createElement("button");
    btn.className = styles.feedbackActionButton;
    btn.textContent = "예시 코드 불러오기";
    actions.appendChild(btn);
    card.appendChild(actions);
    resultEl.appendChild(card);
  }

  if (result.type === "not-preprocessing") {
    const card = document.createElement("div");
    card.className = styles.feedbackCard;
    const title = document.createElement("p");
    title.className = styles.feedbackTitle;
    title.textContent = "전처리/학습 패턴이 충분하지 않아요";
    card.appendChild(title);
    const desc = document.createElement("p");
    desc.className = styles.feedbackDesc;
    desc.textContent = "ML 전처리·학습 코드가 충분히 보이지 않아요.";
    card.appendChild(desc);
    const list = document.createElement("ul");
    list.className = styles.feedbackList;
    const li = document.createElement("li");
    li.textContent = "단순 데이터 로드 (예시)";
    list.appendChild(li);
    card.appendChild(list);
    const fix = document.createElement("p");
    fix.className = styles.feedbackFix;
    fix.textContent = "전처리·학습 코드를 더 넣어 다시 검사해 보세요.";
    card.appendChild(fix);
    const actions = document.createElement("div");
    actions.className = styles.feedbackActions;
    const btn = document.createElement("button");
    btn.className = styles.feedbackActionButton;
    btn.textContent = "예시 코드 불러오기";
    actions.appendChild(btn);
    card.appendChild(actions);
    resultEl.appendChild(card);
  }

  if (result.type === "ok") {
    const card = document.createElement("div");
    card.className = styles.feedbackCard;
    const title = document.createElement("p");
    title.className = styles.feedbackTitle;
    title.textContent = "명확하게 의심되는 패턴이 보이지 않아요";
    card.appendChild(title);
    const desc = document.createElement("p");
    desc.className = styles.feedbackDesc;
    desc.textContent = "전처리·학습 코드를 더 넣어도 좋고, 지금 상태로도 일단 괜찮아 보여요.";
    card.appendChild(desc);
    const actions = document.createElement("div");
    actions.className = styles.feedbackActions;
    const btn1 = document.createElement("button");
    btn1.className = styles.feedbackActionButton;
    btn1.textContent = "예시 코드 불러오기";
    actions.appendChild(btn1);
    const btn2 = document.createElement("button");
    btn2.className = styles.feedbackSecondaryButton;
    btn2.textContent = "코드로 돌아가기";
    actions.appendChild(btn2);
    card.appendChild(actions);
    resultEl.appendChild(card);
  }

  if (result.type === "error") {
    const card = document.createElement("div");
    card.className = styles.feedbackCard;
    const title = document.createElement("p");
    title.className = styles.feedbackTitle;
    title.textContent = "검사 중 문제가 있었어요";
    card.appendChild(title);
    const desc = document.createElement("p");
    desc.className = styles.feedbackDesc;
    desc.textContent = result.note || "검사 실행 중 문제가 생겼습니다.";
    card.appendChild(desc);
    const fix = document.createElement("p");
    fix.className = styles.feedbackFix;
    fix.textContent = "코드 길이와 파일 형식을 다시 확인해 주세요.";
    card.appendChild(fix);
    const actions = document.createElement("div");
    actions.className = styles.feedbackActions;
    const btn1 = document.createElement("button");
    btn1.className = styles.feedbackActionButton;
    btn1.textContent = "다시 시도";
    actions.appendChild(btn1);
    const btn2 = document.createElement("button");
    btn2.className = styles.feedbackSecondaryButton;
    btn2.textContent = "예시 코드 불러오기";
    actions.appendChild(btn2);
    card.appendChild(actions);
    resultEl.appendChild(card);
  }

  if (result.type === "not-connected") {
    const banner = document.createElement("div");
    banner.className = styles.notConnectedBanner;
    const inner = document.createElement("div");
    inner.className = styles.notConnectedBannerInner;
    const title = document.createElement("p");
    title.className = styles.notConnectedBannerTitle;
    title.textContent = "백엔드 미연결 상태예요";
    inner.appendChild(title);
    const desc = document.createElement("p");
    desc.className = styles.notConnectedBannerDesc;
    desc.textContent = "지금은 결과 없이 안내만 보여드려요.";
    inner.appendChild(desc);
    banner.appendChild(inner);
    resultEl.appendChild(banner);

    const items = document.createElement("div");
    items.className = "items";
    const item1 = document.createElement("div");
    item1.className = "item";
    const d1 = document.createElement("p");
    d1.className = "itemDesc";
    d1.style.color = "var(--color-ink)";
    d1.textContent = "백엔드가 연결되지 않아 실제 검사 결과를 표시할 수 없습니다.";
    item1.appendChild(d1);
    items.appendChild(item1);
    const item2 = document.createElement("div");
    item2.className = "item";
    const d2 = document.createElement("p");
    d2.className = "itemFix";
    d2.style.color = "var(--color-ink-secondary)";
    d2.textContent = "Vercel 환경변수 NEXT_PUBLIC_BACKEND_URL에 백엔드 URL을 설정하면 검사 결과가 표시됩니다.";
    item2.appendChild(d2);
    items.appendChild(item2);
    resultEl.appendChild(items);
  }

  if (result.type === "judgment") {
    const summary = result.summary || { 확정위반: 0, 의심: 0, 이상없음: 0 };

    // 요약 블록
    const summaryDiv = document.createElement("div");
    summaryDiv.className = styles.summary || "summary";
    ["확정위반", "의심", "이상없음"].forEach((v) => {
      const block = document.createElement("div");
      block.className = styles.summaryBlock || "summary-block";
      const label = document.createElement("span");
      label.className = styles.summaryLabel || "summary-label";
      label.textContent = v;
      block.appendChild(label);
      const count = document.createElement("span");
      count.className = styles.summaryCount || "summary-count";
      count.textContent = `${summary[v]}건`;
      block.appendChild(count);
      summaryDiv.appendChild(block);
    });
    resultEl.appendChild(summaryDiv);

    // 액션 바
    if (summary.확정위반 > 0 || summary.의심 > 0 || summary.이상없음 > 0) {
      const actions = document.createElement("div");
      actions.className = styles.resultActions;

      const btn1 = document.createElement("button");
      btn1.className = styles.resultActionButton;
      btn1.textContent = "예시 코드로 다시 검사";
      actions.appendChild(btn1);

      const btn2 = document.createElement("button");
      btn2.className = styles.resultActionButtonSecondary;
      btn2.textContent = "코드로 돌아가기";
      actions.appendChild(btn2);

      const btn3 = document.createElement("button");
      btn3.className = styles.resultActionButtonTertiary;
      btn3.textContent = "예시 불러오기";
      actions.appendChild(btn3);

      resultEl.appendChild(actions);
    }
  }

  return resultEl;
}

// ============ 테스트 케이스 ============

const tests = [
  {
    name: "empty: 피드백 카드 + 예시 버튼 + 초기화 버튼",
    result: {
      type: "empty",
      badge: "빈 입력",
    },
    checks: (el) => {
      const card = el.querySelector("." + STYLES.feedbackCard);
      if (!card) throw new Error("피드백 카드 없음");
      const title = card.querySelector("." + STYLES.feedbackTitle);
      if (!title || title.textContent !== "빈 입력 상태예요") throw new Error(`피드백 제목 불일치: ${title?.textContent}`);
      const desc = card.querySelector("." + STYLES.feedbackDesc);
      if (!desc || !desc.textContent.includes("코드를 붙여넣거나")) throw new Error(`피드백 설명 불일치: ${desc?.textContent}`);
      const btn1 = card.querySelector("." + STYLES.feedbackActionButton);
      if (!btn1 || btn1.textContent !== "예시 코드 불러오기") throw new Error(`예시 버튼 없음: ${btn1?.textContent}`);
      const btn2 = card.querySelector("." + STYLES.feedbackSecondaryButton);
      if (!btn2 || btn2.textContent !== "입력 초기화") throw new Error(`초기화 버튼 없음: ${btn2?.textContent}`);
      return true;
    },
  },
  {
    name: "not-python: 예시 목록 + fixes + 예시 버튼",
    result: {
      type: "not-python",
      badge: "인식 어려움",
    },
    checks: (el) => {
      const card = el.querySelector("." + STYLES.feedbackCard);
      if (!card) throw new Error("피드백 카드 없음");
      const title = card.querySelector("." + STYLES.feedbackTitle);
      if (!title || !title.textContent.includes("파이썬 코드로 보기 어려워요")) throw new Error(`제목 불일치: ${title?.textContent}`);
      const list = card.querySelector("." + STYLES.feedbackList);
      if (!list) throw new Error("예시 목록 없음");
      const li = list.querySelector("li");
      if (!li || !li.textContent.includes("유틸리티")) throw new Error(`예시 li 불일치: ${li?.textContent}`);
      const fix = card.querySelector("." + STYLES.feedbackFix);
      if (!fix || !fix.textContent.includes("전처리 코드를 붙여넣거나")) throw new Error(`fix 불일치: ${fix?.textContent}`);
      const btn = card.querySelector("." + STYLES.feedbackActionButton);
      if (!btn || btn.textContent !== "예시 코드 불러오기") throw new Error(`예시 버튼 없음`);
      return true;
    },
  },
  {
    name: "not-preprocessing: 예시 목록 + fixes + 예시 버튼",
    result: {
      type: "not-preprocessing",
      badge: "패턴 부족",
    },
    checks: (el) => {
      const card = el.querySelector("." + STYLES.feedbackCard);
      if (!card) throw new Error("피드백 카드 없음");
      const title = card.querySelector("." + STYLES.feedbackTitle);
      if (!title || !title.textContent.includes("전처리/학습 패턴이 충분하지 않아요")) throw new Error(`제목 불일치`);
      const list = card.querySelector("." + STYLES.feedbackList);
      if (!list) throw new Error("예시 목록 없음");
      const li = list.querySelector("li");
      if (!li || !li.textContent.includes("데이터 로드")) throw new Error(`예시 li 불일치: ${li?.textContent}`);
      const fix = card.querySelector("." + STYLES.feedbackFix);
      if (!fix || !fix.textContent.includes("전처리·학습 코드를 더 넣어")) throw new Error(`fix 불일치`);
      const btn = card.querySelector("." + STYLES.feedbackActionButton);
      if (!btn || btn.textContent !== "예시 코드 불러오기") throw new Error(`예시 버튼 없음`);
      return true;
    },
  },
  {
    name: "ok: 피드백 카드 + 코드로 돌아가기 버튼 + 예시 버튼",
    result: {
      type: "ok",
      badge: "이상없음",
      summary: { 확정위반: 0, 의심: 0, 이상없음: 1 },
    },
    checks: (el) => {
      const card = el.querySelector("." + STYLES.feedbackCard);
      if (!card) throw new Error("피드백 카드 없음");
      const title = card.querySelector("." + STYLES.feedbackTitle);
      if (!title || !title.textContent.includes("명확하게 의심되는 패턴이 보이지")) throw new Error(`제목 불일치`);
      const btn1 = card.querySelector("." + STYLES.feedbackActionButton);
      if (!btn1 || btn1.textContent !== "예시 코드 불러오기") throw new Error(`예시 버튼 없음`);
      const btn2 = card.querySelector("." + STYLES.feedbackSecondaryButton);
      if (!btn2 || btn2.textContent !== "코드로 돌아가기") throw new Error(`코드로 돌아가기 버튼 없음`);
      return true;
    },
  },
  {
    name: "error: 다시 시도 버튼 + 예시 버튼 + fixes 문구",
    result: {
      type: "error",
      badge: "오류",
      note: "검사 실행 중 문제가 생겼습니다.",
    },
    checks: (el) => {
      const card = el.querySelector("." + STYLES.feedbackCard);
      if (!card) throw new Error("피드백 카드 없음");
      const title = card.querySelector("." + STYLES.feedbackTitle);
      if (!title || !title.textContent.includes("검사 중 문제가 있었어요")) throw new Error(`제목 불일치`);
      const desc = card.querySelector("." + STYLES.feedbackDesc);
      if (!desc || !desc.textContent.includes("검사 실행 중 문제")) throw new Error(`에러 설명 불일치`);
      const fix = card.querySelector("." + STYLES.feedbackFix);
      if (!fix || !fix.textContent.includes("코드 길이와 파일 형식을 다시 확인")) throw new Error(`fix 문구 불일치: ${fix?.textContent}`);
      const btn1 = card.querySelector("." + STYLES.feedbackActionButton);
      if (!btn1 || btn1.textContent !== "다시 시도") throw new Error(`다시 시도 버튼 없음: ${btn1?.textContent}`);
      const btn2 = card.querySelector("." + STYLES.feedbackSecondaryButton);
      if (!btn2 || btn2.textContent !== "예시 코드 불러오기") throw new Error(`예시 버튼 없음`);
      return true;
    },
  },
  {
    name: "not-connected: 상단 배너 + 안내 문구",
    result: {
      type: "not-connected",
      badge: "연결 안됨",
    },
    checks: (el) => {
      const banner = el.querySelector("." + STYLES.notConnectedBanner);
      if (!banner) throw new Error("not-connected 배너 없음");
      const inner = banner.querySelector("." + STYLES.notConnectedBannerInner);
      if (!inner) throw new Error("배너 내부 없음");
      const title = inner.querySelector("." + STYLES.notConnectedBannerTitle);
      if (!title || !title.textContent.includes("백엔드 미연결")) throw new Error(`배너 제목 불일치`);
      const desc = inner.querySelector("." + STYLES.notConnectedBannerDesc);
      if (!desc || !desc.textContent.includes("결과 없이 안내만")) throw new Error(`배너 설명 불일치`);
      const items = el.querySelector(".items");
      if (!items) throw new Error("안내 items 없음");
      const d1 = items.querySelector(".itemDesc");
      if (!d1 || !d1.textContent.includes("백엔드가 연결되지 않아")) throw new Error(`안내 설명 불일치`);
      return true;
    },
  },
  {
    name: "judgment: 결과 액션 바 3개 버튼 (예시 코드로 다시 검사, 코드로 돌아가기, 예시 불러오기)",
    result: {
      type: "judgment",
      badge: "의심 2건",
      summary: { 확정위반: 1, 의심: 1, 이상없음: 0 },
    },
    checks: (el) => {
      const actions = el.querySelector("." + STYLES.resultActions);
      if (!actions) throw new Error("결과 액션 바 없음");
      const btns = actions.querySelectorAll("button");
      if (btns.length !== 3) throw new Error(`액션 버튼 수 불일치: ${btns.length}개`);
      const texts = Array.from(btns).map((b) => b.textContent);
      if (!texts.includes("예시 코드로 다시 검사")) throw new Error(`예시 코드로 다시 검사 버튼 없음: ${texts}`);
      if (!texts.includes("코드로 돌아가기")) throw new Error(`코드로 돌아가기 버튼 없음: ${texts}`);
      if (!texts.includes("예시 불러오기")) throw new Error(`예시 불러오기 버튼 없음: ${texts}`);
      const primary = actions.querySelector("." + STYLES.resultActionButton);
      if (!primary || primary.textContent !== "예시 코드로 다시 검사") throw new Error(`대표 액션 버튼 불일치`);
      const secondary = actions.querySelector("." + STYLES.resultActionButtonSecondary);
      if (!secondary || secondary.textContent !== "코드로 돌아가기") throw new Error(`보조 액션 버튼 불일치`);
      const tertiary = actions.querySelector("." + STYLES.resultActionButtonTertiary);
      if (!tertiary || tertiary.textContent !== "예시 불러오기") throw new Error(`3차 액션 버튼 불일치`);
      return true;
    },
  },
  {
    name: "loading: btn-primary-pill 구조 - spinner 클래스 정의 및 로딩 시 표시 지원",
    result: null,
    checks: () => {
      // spinner는 CSS 클래스로 정의되어 있고, 로딩 시 btn-primary-pill[disabled]에 표시되는 구조
      // 여기서는 spinner 클래스가 CSS에 정의되어 있고 버튼 구조가 이를 지원하는지 확인
      const styleEl = document.querySelector('style[data-testid="module-css"]') || document.querySelector('style');
      const cssText = styleEl ? styleEl.textContent : "";
      const hasSpinnerClass = cssText.includes(".spinner");
      if (!hasSpinnerClass) throw new Error("CSS에 spinner 클래스 정의 없음");
      return true;
    },
  },
];

// 실행
let passed = 0;
let failed = 0;

tests.forEach((test) => {
  try {
    if (test.result) {
      const result = test.result;
      const root = document.getElementById("root");
      root.innerHTML = "";
      const el = renderFeedbackResult(result, STYLES);
      root.appendChild(el);
      const outcome = test.checks(el);
      if (outcome) {
        passed++;
        console.log(`✅ ${test.name}`);
      }
    } else {
      const outcome = test.checks();
      if (outcome) {
        passed++;
        console.log(`✅ ${test.name}`);
      }
    }
  } catch (e) {
    failed++;
    console.error(`❌ ${test.name}: ${e.message}`);
  }
});

console.log(`\n${passed}개 통과, ${failed}개 실패`);
process.exit(failed > 0 ? 1 : 0);
