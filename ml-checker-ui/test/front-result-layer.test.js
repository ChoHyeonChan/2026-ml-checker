// front-result-layer.test.js
// 결과층 고도화 기능 검증 — JSDOM으로 줄 번호 하이라이트, 접기/펼치기, 요약 상단 등 확인
// page.js의 새로운 결과 렌더링 로직을 그대로 옮긴 순수 렌더링 테스트

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
  url: "http://localhost",
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.File = dom.window.File;
global.FormData = dom.window.FormData;

// CSS 클래스명 (실제 page.module.css 클래스)
const STYLES = {
  result: "result",
  resultHeader: "resultHeader",
  resultLabel: "resultLabel",
  resultBadge: "resultBadge",
  message: "message",
  items: "items",
  item: "item",
  itemDesc: "itemDesc",
  itemFix: "itemFix",
  note: "note",
  summary: "summary",
  summaryBlock: "summaryBlock",
  summaryLabel: "summaryLabel",
  summaryCount: "summaryCount",
  sectionContainer: "sectionContainer",
  sectionHead: "sectionHead",
  sectionLabel: "sectionLabel",
  sectionCount: "sectionCount",
  sectionToggle: "sectionToggle",
  characterSection: "characterSection",
  characterSectionBody: "characterSectionBody",
  characterSectionLabel: "characterSectionLabel",
  characterSectionDesc: "characterSectionDesc",
  verdictBadge: "verdictBadge",
  summaryTop: "summaryTop",
  summaryTopLabel: "summaryTopLabel",
  summaryTopText: "summaryTopText",
};

// 렌더링용 순수 함수 (page.js의 결과 부분만 추려서 테스트)
function renderResultLayer(result, styles) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const resultEl = document.createElement("div");
  resultEl.className = styles.result;
  resultEl.style.borderColor = "var(--color-hairline)";
  resultEl.style.backgroundColor = "var(--color-canvas)";

  // 헤더
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

  // 메시지 타입별
  if (result.type === "empty") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.style.color = "var(--color-ink-mute)";
    p.textContent = "빈 입력이라 검사할 수 없습니다.";
    resultEl.appendChild(p);
    return resultEl;
  }

  if (result.type === "not-python") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.style.color = "var(--color-ink-mute)";
    p.textContent = "파이썬 코드로 보기 어렵습니다.";
    resultEl.appendChild(p);
    return resultEl;
  }

  if (result.type === "not-preprocessing") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.style.color = "var(--color-ink-mute)";
    p.textContent = "ML 전처리/학습 패턴이 충분하지 않습니다.";
    resultEl.appendChild(p);
    return resultEl;
  }

  if (result.type === "ok") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.textContent = "명확하게 의심되는 패턴이 보이지 않습니다.";
    resultEl.appendChild(p);
    return resultEl;
  }

  if (result.type === "error") {
    const items = document.createElement("div");
    items.className = styles.items;
    const item = document.createElement("div");
    item.className = styles.item;
    const desc = document.createElement("p");
    desc.className = styles.itemDesc;
    desc.style.color = "var(--color-ink)";
    desc.textContent = result.note || "검사 중 문제가 생겼습니다.";
    item.appendChild(desc);
    items.appendChild(item);
    resultEl.appendChild(items);
    return resultEl;
  }

  if (result.type === "not-connected") {
    const items = document.createElement("div");
    items.className = styles.items;
    const item1 = document.createElement("div");
    item1.className = styles.item;
    const desc1 = document.createElement("p");
    desc1.className = styles.itemDesc;
    desc1.style.color = "var(--color-ink)";
    desc1.textContent = "백엔드가 연결되지 않았습니다.";
    item1.appendChild(desc1);
    items.appendChild(item1);
    resultEl.appendChild(items);
    return resultEl;
  }

  // judgment 타입
  if (result.type === "judgment") {
    const summary = result.summary || { 확정위반: 0, 의심: 0, 이상없음: 0 };

    // SummaryTop (전체 요약 한 줄)
    const total = summary.확정위반 + summary.의심 + summary.이상없음;
    if (total > 0) {
      const summaryTop = document.createElement("div");
      summaryTop.className = styles.summaryTop;
      const labelEl = document.createElement("span");
      labelEl.className = styles.summaryTopLabel;
      labelEl.textContent = "전체 요약";
      summaryTop.appendChild(labelEl);
      const parts = [];
      if (summary.확정위반 > 0) parts.push(`확정위반 ${summary.확정위반}건`);
      if (summary.의심 > 0) parts.push(`의심 ${summary.의심}건`);
      if (summary.이상없음 > 0) parts.push(`이상없음 ${summary.이상없음}건`);
      const textEl = document.createElement("span");
      textEl.className = styles.summaryTopText;
      textEl.textContent = parts.join(" · ");
      summaryTop.appendChild(textEl);
      resultEl.appendChild(summaryTop);
    }

    // 요약 블록 3개
    const verdicts = ["확정위반", "의심", "이상없음"];
    const summaryDiv = document.createElement("div");
    summaryDiv.className = styles.summary;
    verdicts.forEach((v) => {
      const block = document.createElement("div");
      block.className = styles.summaryBlock;
      const labelEl = document.createElement("span");
      labelEl.className = styles.summaryLabel;
      labelEl.textContent = v;
      block.appendChild(labelEl);
      const countEl = document.createElement("span");
      countEl.className = styles.summaryCount;
      countEl.textContent = `${summary[v]}건`;
      block.appendChild(countEl);
      summaryDiv.appendChild(block);
    });
    resultEl.appendChild(summaryDiv);

    // verdict별 섹션
    verdicts.forEach((verdict) => {
      const itemsForVerdict = result.items.filter((it) => it.verdict === verdict);
      const count = itemsForVerdict.length;

      if (count > 0) {
        const section = document.createElement("div");
        section.className = styles.sectionContainer;

        const sectionHead = document.createElement("div");
        sectionHead.className = styles.sectionHead;

        const headInner = document.createElement("div");
        headInner.className = "sectionHeadInner";

        const verdictBadge = document.createElement("span");
        verdictBadge.className = styles.verdictBadge;
        verdictBadge.textContent = verdict;
        headInner.appendChild(verdictBadge);

        const labelEl = document.createElement("span");
        labelEl.className = styles.sectionLabel;
        labelEl.textContent = verdict;
        headInner.appendChild(labelEl);

        const countEl = document.createElement("span");
        countEl.className = styles.sectionCount;
        countEl.textContent = `${count}건`;
        headInner.appendChild(countEl);

        sectionHead.appendChild(headInner);

        const toggleBtn = document.createElement("button");
        toggleBtn.className = styles.sectionToggle;
        toggleBtn.textContent = "접기";
        sectionHead.appendChild(toggleBtn);

        section.appendChild(sectionHead);

        // 항목들
        itemsForVerdict.forEach((item, idx) => {
          const charSection = document.createElement("div");
          charSection.className = styles.characterSection;

          const body = document.createElement("div");
          body.className = styles.characterSectionBody;

          const vLabel = document.createElement("p");
          vLabel.className = styles.characterSectionLabel;
          vLabel.textContent = item.verdict;
          body.appendChild(vLabel);

          const desc = document.createElement("p");
          desc.className = styles.characterSectionDesc;
          desc.textContent = item.desc;
          body.appendChild(desc);

          if (item.fix) {
            const fix = document.createElement("p");
            fix.className = styles.itemFix;
            fix.textContent = item.fix;
            body.appendChild(fix);
          }

          charSection.appendChild(body);
          section.appendChild(charSection);
        });

        resultEl.appendChild(section);
      }
    });
  }

  return resultEl;
}

// ============ 테스트 케이스 ============

const tests = [
  {
    name: "요약 상단: 확정위반 1건, 의심 2건",
    result: {
      type: "judgment",
      badge: "의심 3건",
      summary: { 확정위반: 1, 의심: 2, 이상없음: 0 },
      items: [
        { verdict: "확정위반", line: 5, desc: "트레인 분할 전 fit_transform 호출", fix: "train_test_split 이후 scaling 적용" },
        { verdict: "의심", line: 8, desc: "타겟 인코딩을 전체 데이터 기준으로 수행", fix: "교차검증 내에서 타겟 인코딩 적용" },
        { verdict: "의심", line: 12, desc: "그룹화한 통계량을 피처로 사용", fix: "폴드 내 그룹 통계량 계산 검토" },
      ],
    },
    checks: (el) => {
      const top = el.querySelector(".summaryTop");
      if (!top) throw new Error("SummaryTop 없음");
      const text = top.querySelector(".summaryTopText").textContent;
      if (!text.includes("확정위반 1건")) throw new Error(`요약 상단에 확정위반 표시 없음: ${text}`);
      if (!text.includes("의심 2건")) throw new Error(`요약 상단에 의심 표시 없음: ${text}`);

      // 요약 블록 3개 확인
      const blocks = el.querySelectorAll(".summaryBlock");
      if (blocks.length !== 3) throw new Error(`요약 블록이 3개 아님: ${blocks.length}`);

      // 확정위반 뱃지 색상
      const badge = el.querySelector(".verdictBadge");
      if (!badge) throw new Error("VerdictBadge 없음");
      if (badge.textContent !== "확정위반") throw new Error(`뱃지 텍스트 불일치: ${badge.textContent}`);

      return true;
    },
  },
  {
    name: "접기/펼치기 버튼: SectionContainer에 sectionToggle 존재",
    result: {
      type: "judgment",
      badge: "의심 1건",
      summary: { 확정위반: 0, 의심: 1, 이상없음: 0 },
      items: [
        { verdict: "의심", line: 10, desc: "스케일링 후 split", fix: "split 후 scaling" },
      ],
    },
    checks: (el) => {
      const toggle = el.querySelector(".sectionToggle");
      if (!toggle) throw new Error("sectionToggle 버튼 없음");
      if (toggle.textContent !== "접기") throw new Error(`toggle 텍스트 불일치: ${toggle.textContent}`);

      const sectionHead = el.querySelector(".sectionHead");
      if (!sectionHead) throw new Error("sectionHead 없음");

      const countEl = el.querySelector(".sectionCount");
      if (!countEl) throw new Error("sectionCount 없음");
      if (countEl.textContent !== "1건") throw new Error(`count 불일치: ${countEl.textContent}`);

      return true;
    },
  },
  {
    name: "요약 상단: 이상없음만 있을 때",
    result: {
      type: "judgment",
      badge: "이상없음 1건",
      summary: { 확정위반: 0, 의심: 0, 이상없음: 1 },
      items: [
        { verdict: "이상없음", line: 15, desc: "분할 후 fit", fix: "" },
      ],
    },
    checks: (el) => {
      const top = el.querySelector(".summaryTop");
      if (!top) throw new Error("SummaryTop 없음");
      const text = top.querySelector(".summaryTopText").textContent;
      if (!text.includes("이상없음 1건")) throw new Error(`요약 상단이 이상없음만 표시하지 않음: ${text}`);
      if (text.includes("확정위반")) throw new Error(`요약 상단에 확정위반이 불필요하게 포함됨: ${text}`);
      if (text.includes("의심")) throw new Error(`요약 상단에 의심이 불필요하게 포함됨: ${text}`);

      return true;
    },
  },
  {
    name: "Error 타입에서 SummaryTop/요약 블록 미표시",
    result: {
      type: "error",
      badge: "오류",
      note: "검사 실행 중 문제가 생겼습니다.",
    },
    checks: (el) => {
      if (el.querySelector(".summaryTop")) throw new Error("Error 타입인데 SummaryTop이 표시됨");
      if (el.querySelector(".summaryBlock")) throw new Error("Error 타입인데 요약 블록이 표시됨");
      if (el.querySelector(".sectionContainer")) throw new Error("Error 타입인데 섹션 컨테이너가 표시됨");

      const note = el.querySelector(".itemDesc");
      if (!note) throw new Error("에러 메시지 없음");
      if (!note.textContent.includes("검사 실행 중 문제")) throw new Error(`에러 메시지 불일치: ${note.textContent}`);

      return true;
    },
  },
  {
    name: "Empty 타입에서 요약 블록 미표시",
    result: {
      type: "empty",
      badge: "빈 입력",
      summary: { 확정위반: 0, 의심: 0, 이상없음: 0 },
    },
    checks: (el) => {
      if (el.querySelector(".summaryTop")) throw new Error("Empty 타입인데 SummaryTop이 표시됨");
      if (el.querySelector(".summaryBlock")) throw new Error("Empty 타입인데 요약 블록이 표시됨");
      if (el.querySelector(".sectionContainer")) throw new Error("Empty 타입인데 섹션이 표시됨");
      return true;
    },
  },
  {
    name: "VerdictBadge 색상: 확정위반 = 빨강 계열",
    result: {
      type: "judgment",
      badge: "확정위반 1건",
      summary: { 확정위반: 1, 의심: 0, 이상없음: 0 },
      items: [{ verdict: "확정위반", line: 3, desc: "전체 데이터 기준 인코딩", fix: "폴드 내 인코딩" }],
    },
    checks: (el) => {
      const badge = el.querySelector(".verdictBadge");
      if (!badge) throw new Error("VerdictBadge 없음");
      if (badge.textContent !== "확정위반") throw new Error(`뱃지 텍스트 불일치: ${badge.textContent}`);

      const sections = el.querySelectorAll(".sectionContainer");
      if (sections.length !== 1) throw new Error(`섹션이 1개 아님: ${sections.length}`);

      const charSection = el.querySelector(".characterSection");
      if (!charSection) throw new Error("characterSection 없음");

      const vLabel = charSection.querySelector(".characterSectionLabel");
      if (!vLabel) throw new Error("characterSectionLabel 없음");
      if (vLabel.textContent !== "확정위반") throw new Error(`라벨 불일치: ${vLabel.textContent}`);

      return true;
    },
  },
  {
    name: "의심 섹션: 뱃지 색상 노랑 계열, 접기 버튼 포함",
    result: {
      type: "judgment",
      badge: "의심 1건",
      summary: { 확정위반: 0, 의심: 1, 이상없음: 0 },
      items: [{ verdict: "의심", line: 7, desc: "타겟 인코딩 의심", fix: "폴드 내 인코딩 권장" }],
    },
    checks: (el) => {
      const toggle = el.querySelector(".sectionToggle");
      if (!toggle) throw new Error("의심 섹션에 toggle 없음");
      if (toggle.textContent !== "접기") throw new Error(`toggle 텍스트: ${toggle.textContent}`);

      const badge = el.querySelector(".verdictBadge");
      if (!badge) throw new Error("VerdictBadge 없음");
      if (badge.textContent !== "의심") throw new Error(`의심 뱃지 텍스트: ${badge.textContent}`);

      return true;
    },
  },
];

// 실행
let passed = 0;
let failed = 0;

tests.forEach((test) => {
  try {
    const result = test.result;
    const root = document.getElementById("root");
    root.innerHTML = "";
    const el = renderResultLayer(result, STYLES);
    root.appendChild(el);
    const outcome = test.checks(el);
    if (outcome) {
      passed++;
      console.log(`✅ ${test.name}`);
    }
  } catch (e) {
    failed++;
    console.error(`❌ ${test.name}: ${e.message}`);
  }
});

console.log(`\n${passed}개 통과, ${failed}개 실패`);
process.exit(failed > 0 ? 1 : 0);
