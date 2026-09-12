// front-exception.test.js
// 프론트 예외 표시 검증 — JSDOM으로 각 type별 메시지가 올바르게 렌더링되는지 확인
// page.js의 결과 조건부 렌더링 로직을 그대로 옮긴 순수 렌더링 테스트

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
  url: "http://localhost",
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.File = dom.window.File;
global.FormData = dom.window.FormData;

// page.js의 result 조건부 렌더링을 추린 순수 함수
// styles는 CSS 클래스로 대체하고, 메시지 내용은 원본 page.js와 동일하게 둔다.
function renderResult(result, styles) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  if (!result) return;

  const resultEl = document.createElement("div");
  resultEl.className = styles.result;
  resultEl.style.borderColor = "var(--color-hairline)";
  resultEl.style.backgroundColor = "var(--color-canvas)";

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

  // 각 type별 렌더링
  if (result.type === "empty") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.style.color = "var(--color-ink-mute)";
    p.textContent = "빈 입력이라 검사할 수 없습니다. 전처리 코드를 붙여넣거나 파일을 선택해 주세요.";
    resultEl.appendChild(p);
  }

  if (result.type === "not-python") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.style.color = "var(--color-ink-mute)";
    p.textContent = "파이썬 코드로 보기 어렵습니다. 파이썬 전처리/학습 코드를 붙여넣거나 .py/.ipynb 파일을 선택해 주세요.";
    resultEl.appendChild(p);
  }

  if (result.type === "not-preprocessing") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.style.color = "var(--color-ink-mute)";
    p.textContent = "ML 전처리/학습 패턴이 충분히 보이지 않습니다. 전처리 코드인지 확인해 주세요.";
    resultEl.appendChild(p);
  }

  if (result.type === "ok") {
    const p = document.createElement("p");
    p.className = styles.message;
    p.textContent = "명확하게 의심되는 패턴이 보이지 않습니다.";
    resultEl.appendChild(p);
  }

  if (result.type === "error") {
    const items = document.createElement("div");
    items.className = styles.items;
    if (result.note) {
      const item = document.createElement("div");
      item.className = styles.item;
      const desc = document.createElement("p");
      desc.className = styles.itemDesc;
      desc.style.color = "var(--color-ink)";
      desc.textContent = result.note;
      item.appendChild(desc);
      items.appendChild(item);
    }
    resultEl.appendChild(items);
  }

  if (result.type === "not-connected") {
    const items = document.createElement("div");
    items.className = styles.items;
    const item1 = document.createElement("div");
    item1.className = styles.item;
    const desc1 = document.createElement("p");
    desc1.className = styles.itemDesc;
    desc1.style.color = "var(--color-ink)";
    desc1.textContent = "백엔드가 연결되지 않아 실제 검사 결과를 표시할 수 없습니다.";
    item1.appendChild(desc1);
    items.appendChild(item1);

    const item2 = document.createElement("div");
    item2.className = styles.item;
    const fix2 = document.createElement("p");
    fix2.className = styles.itemFix;
    fix2.style.color = "var(--color-ink-secondary)";
    fix2.textContent = "Vercel 환경변수 NEXT_PUBLIC_BACKEND_URL에 백엔드 URL을 설정하면 검사 결과가 표시됩니다.";
    item2.appendChild(fix2);
    items.appendChild(item2);

    resultEl.appendChild(items);
  }

  if (result.type === "judgment") {
    const summary = result.summary || { 확정위반: 0, 의심: 0, 이상없음: 0 };

    const summaryDiv = document.createElement("div");
    summaryDiv.className = styles.summary;

    const block1 = document.createElement("div");
    block1.className = styles.summaryBlock;
    const label1 = document.createElement("span");
    label1.className = styles.summaryLabel;
    label1.textContent = "확정위반";
    const count1 = document.createElement("span");
    count1.className = styles.summaryCount;
    count1.textContent = summary.확정위반 + "건";
    block1.appendChild(label1);
    block1.appendChild(count1);
    summaryDiv.appendChild(block1);

    const block2 = document.createElement("div");
    block2.className = styles.summaryBlock;
    const label2 = document.createElement("span");
    label2.className = styles.summaryLabel;
    label2.textContent = "의심";
    const count2 = document.createElement("span");
    count2.className = styles.summaryCount;
    count2.textContent = summary.의심 + "건";
    block2.appendChild(label2);
    block2.appendChild(count2);
    summaryDiv.appendChild(block2);

    const block3 = document.createElement("div");
    block3.className = styles.summaryBlock;
    const label3 = document.createElement("span");
    label3.className = styles.summaryLabel;
    label3.textContent = "이상없음";
    const count3 = document.createElement("span");
    count3.className = styles.summaryCount;
    count3.textContent = summary.이상없음 + "건";
    block3.appendChild(label3);
    block3.appendChild(count3);
    summaryDiv.appendChild(block3);

    resultEl.appendChild(summaryDiv);

    // 확정위반 항목
    if (summary.확정위반 > 0) {
      const section = document.createElement("div");
      section.className = styles.section;
      const head = document.createElement("div");
      head.className = styles.sectionHead;
      const sLabel = document.createElement("span");
      sLabel.className = styles.sectionLabel;
      sLabel.textContent = "확정위반";
      const sCount = document.createElement("span");
      sCount.className = styles.sectionCount;
      sCount.textContent = summary.확정위반 + "건";
      head.appendChild(sLabel);
      head.appendChild(sCount);
      section.appendChild(head);

      const items = result.items ? result.items.filter((it) => it.verdict === "확정위반") : [];
      if (items.length === 0) {
        const emptyItem = document.createElement("div");
        emptyItem.className = styles.item;
        const emptyDesc = document.createElement("p");
        emptyDesc.className = styles.itemDesc;
        emptyDesc.style.color = "var(--color-ink)";
        emptyDesc.textContent = "확정위반으로 분류된 항목이 없습니다.";
        emptyItem.appendChild(emptyDesc);
        section.appendChild(emptyItem);
      } else {
        items.forEach((item, i) => {
          const itemEl = document.createElement("div");
          itemEl.className = styles.item;
          itemEl.style.borderColor = "var(--color-ruby)";
          const headEl = document.createElement("div");
          headEl.className = styles.itemHead;
          const line = document.createElement("span");
          line.className = styles.itemLine;
          line.style.color = "var(--color-ruby)";
          line.textContent = item.line;
          const verdict = document.createElement("span");
          verdict.className = styles.itemVerdict;
          verdict.textContent = item.verdict;
          headEl.appendChild(line);
          headEl.appendChild(verdict);
          itemEl.appendChild(headEl);
          const desc = document.createElement("p");
          desc.className = styles.itemDesc;
          desc.style.color = "var(--color-ink)";
          desc.textContent = item.desc;
          itemEl.appendChild(desc);
          if (item.fix) {
            const fix = document.createElement("p");
            fix.className = styles.itemFix;
            fix.style.color = "var(--color-ink-secondary)";
            fix.textContent = item.fix;
            itemEl.appendChild(fix);
          }
          section.appendChild(itemEl);
        });
      }
      resultEl.appendChild(section);
    }

    // 의심 항목
    if (summary.의심 > 0) {
      const section = document.createElement("div");
      section.className = styles.section;
      const head = document.createElement("div");
      head.className = styles.sectionHead;
      const sLabel = document.createElement("span");
      sLabel.className = styles.sectionLabel;
      sLabel.textContent = "의심";
      const sCount = document.createElement("span");
      sCount.className = styles.sectionCount;
      sCount.textContent = summary.의심 + "건";
      head.appendChild(sLabel);
      head.appendChild(sCount);
      section.appendChild(head);

      const items = result.items ? result.items.filter((it) => it.verdict === "의심") : [];
      if (items.length === 0) {
        const emptyItem = document.createElement("div");
        emptyItem.className = styles.item;
        const emptyDesc = document.createElement("p");
        emptyDesc.className = styles.itemDesc;
        emptyDesc.style.color = "var(--color-ink)";
        emptyDesc.textContent = "의심으로 분류된 항목이 없습니다.";
        emptyItem.appendChild(emptyDesc);
        section.appendChild(emptyItem);
      } else {
        items.forEach((item, i) => {
          const itemEl = document.createElement("div");
          itemEl.className = styles.item;
          itemEl.style.borderColor = "var(--color-primary)";
          const headEl = document.createElement("div");
          headEl.className = styles.itemHead;
          const line = document.createElement("span");
          line.className = styles.itemLine;
          line.style.color = "var(--color-primary)";
          line.textContent = item.line;
          const verdict = document.createElement("span");
          verdict.className = styles.itemVerdict;
          verdict.textContent = item.verdict;
          headEl.appendChild(line);
          headEl.appendChild(verdict);
          itemEl.appendChild(headEl);
          const desc = document.createElement("p");
          desc.className = styles.itemDesc;
          desc.style.color = "var(--color-ink)";
          desc.textContent = item.desc;
          itemEl.appendChild(desc);
          if (item.fix) {
            const fix = document.createElement("p");
            fix.className = styles.itemFix;
            fix.style.color = "var(--color-ink-secondary)";
            fix.textContent = item.fix;
            itemEl.appendChild(fix);
          }
          section.appendChild(itemEl);
        });
      }
      resultEl.appendChild(section);
    }

    // 이상없음 항목
    if (summary.이상없음 > 0) {
      const section = document.createElement("div");
      section.className = styles.section;
      const head = document.createElement("div");
      head.className = styles.sectionHead;
      const sLabel = document.createElement("span");
      sLabel.className = styles.sectionLabel;
      sLabel.textContent = "이상없음";
      const sCount = document.createElement("span");
      sCount.className = styles.sectionCount;
      sCount.textContent = summary.이상없음 + "건";
      head.appendChild(sLabel);
      head.appendChild(sCount);
      section.appendChild(head);

      const items = result.items ? result.items.filter((it) => it.verdict === "이상없음") : [];
      if (items.length === 0) {
        const emptyItem = document.createElement("div");
        emptyItem.className = styles.item;
        const emptyDesc = document.createElement("p");
        emptyDesc.className = styles.itemDesc;
        emptyDesc.style.color = "var(--color-ink)";
        emptyDesc.textContent = "이상없음으로 분류된 항목이 없습니다.";
        emptyItem.appendChild(emptyDesc);
        section.appendChild(emptyItem);
      } else {
        items.forEach((item, i) => {
          const itemEl = document.createElement("div");
          itemEl.className = styles.item;
          itemEl.style.borderColor = "var(--color-ink-mute)";
          const headEl = document.createElement("div");
          headEl.className = styles.itemHead;
          const line = document.createElement("span");
          line.className = styles.itemLine;
          line.style.color = "var(--color-ink-mute)";
          line.textContent = item.line;
          const verdict = document.createElement("span");
          verdict.className = styles.itemVerdict;
          verdict.textContent = item.verdict;
          headEl.appendChild(line);
          headEl.appendChild(verdict);
          itemEl.appendChild(headEl);
          const desc = document.createElement("p");
          desc.className = styles.itemDesc;
          desc.style.color = "var(--color-ink)";
          desc.textContent = item.desc;
          itemEl.appendChild(desc);
          if (item.fix) {
            const fix = document.createElement("p");
            fix.className = styles.itemFix;
            fix.style.color = "var(--color-ink-secondary)";
            fix.textContent = item.fix;
            itemEl.appendChild(fix);
          }
          section.appendChild(itemEl);
        });
      }
      resultEl.appendChild(section);
    }

    // 항목이 전혀 없는 경우
    if (summary.확정위반 === 0 && summary.의심 === 0 && summary.이상없음 === 0 && (!result.items || result.items.length === 0)) {
      const emptyItem = document.createElement("div");
      emptyItem.className = styles.item;
      const emptyDesc = document.createElement("p");
      emptyDesc.className = styles.itemDesc;
      emptyDesc.style.color = "var(--color-ink)";
      emptyDesc.textContent = "항목이 없습니다.";
      emptyItem.appendChild(emptyDesc);
      resultEl.appendChild(emptyItem);
    }
  }

  // note 표시 (error, not-connected 제외)
  if (result.note && result.type !== "error" && result.type !== "not-connected") {
    const noteEl = document.createElement("div");
    noteEl.className = styles.note;
    noteEl.style.borderLeftColor = "var(--color-primary)";
    noteEl.textContent = result.note;
    resultEl.appendChild(noteEl);
  }

  root.appendChild(resultEl);
}

// CSS 클래스명 매핑 (원본 page.module.css와 동일한 클래스명 사용)
const styles = {
  result: "result",
  resultHeader: "resultHeader",
  resultLabel: "resultLabel",
  resultBadge: "resultBadge",
  message: "message",
  items: "items",
  item: "item",
  itemDesc: "itemDesc",
  itemFix: "itemFix",
  summary: "summary",
  summaryBlock: "summaryBlock",
  summaryLabel: "summaryLabel",
  summaryCount: "summaryCount",
  section: "section",
  sectionHead: "sectionHead",
  sectionLabel: "sectionLabel",
  sectionCount: "sectionCount",
  itemHead: "itemHead",
  itemLine: "itemLine",
  itemVerdict: "itemVerdict",
  note: "note",
};

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ---- 예외 표시 테스트 ----

test("empty: 안내 메시지 표시", () => {
  renderResult({ type: "empty", badge: "" }, styles);
  const root = document.getElementById("root");
  assert(root.querySelector("p.message"), "empty 메시지 없음");
  assert(
    root.querySelector("p.message").textContent === "빈 입력이라 검사할 수 없습니다. 전처리 코드를 붙여넣거나 파일을 선택해 주세요.",
    "empty 메시지 내용 불일치"
  );
});

test("not-python: 안내 메시지 표시", () => {
  renderResult({ type: "not-python", badge: "" }, styles);
  const root = document.getElementById("root");
  assert(root.querySelector("p.message"), "not-python 메시지 없음");
  assert(
    root.querySelector("p.message").textContent === "파이썬 코드로 보기 어렵습니다. 파이썬 전처리/학습 코드를 붙여넣거나 .py/.ipynb 파일을 선택해 주세요.",
    "not-python 메시지 내용 불일치"
  );
});

test("not-preprocessing: 안내 메시지 표시", () => {
  renderResult({ type: "not-preprocessing", badge: "" }, styles);
  const root = document.getElementById("root");
  assert(root.querySelector("p.message"), "not-preprocessing 메시지 없음");
  assert(
    root.querySelector("p.message").textContent === "ML 전처리/학습 패턴이 충분히 보이지 않습니다. 전처리 코드인지 확인해 주세요.",
    "not-preprocessing 메시지 내용 불일치"
  );
});

test("ok: 안내 메시지 표시", () => {
  renderResult({ type: "ok", badge: "이상없음" }, styles);
  const root = document.getElementById("root");
  assert(root.querySelector("p.message"), "ok 메시지 없음");
  assert(
    root.querySelector("p.message").textContent === "명확하게 의심되는 패턴이 보이지 않습니다.",
    "ok 메시지 내용 불일치"
  );
  // summary 블록 없어야 함
  assert(!root.querySelector(".summary"), "ok일 때 summary 블록이 없어야 함");
});

test("error: note 표시", () => {
  renderResult(
    {
      type: "error",
      badge: "오류",
      note: "백엔드 검사 중 오류가 발생했습니다.",
    },
    styles
  );
  const root = document.getElementById("root");
  assert(root.querySelector(".items"), "error items 없음");
  assert(root.querySelector(".itemDesc").textContent === "백엔드 검사 중 오류가 발생했습니다.", "error note 내용 불일치");
  assert(!root.querySelector(".summary"), "error일 때 summary 없어야 함");
});

test("not-connected: 안내 메시지 표시", () => {
  renderResult({ type: "not-connected", badge: "연결 안됨" }, styles);
  const root = document.getElementById("root");
  assert(root.querySelector(".items"), "not-connected items 없음");
  assert(
    root.querySelector(".itemDesc").textContent === "백엔드가 연결되지 않아 실제 검사 결과를 표시할 수 없습니다.",
    "not-connected itemDesc 불일치"
  );
  assert(
    root.querySelectorAll(".item").length === 2,
    "not-connected item 2개여야 함"
  );
  assert(
    root.querySelector(".itemFix").textContent === "Vercel 환경변수 NEXT_PUBLIC_BACKEND_URL에 백엔드 URL을 설정하면 검사 결과가 표시됩니다.",
    "not-connected itemFix 불일치"
  );
  assert(!root.querySelector(".summary"), "not-connected일 때 summary 없어야 함");
});

test("judgment: summary 블록 표시", () => {
  renderResult(
    {
      type: "judgment",
      badge: "의심 1건",
      summary: { 확정위반: 0, 의심: 1, 이상없음: 0 },
      items: [],
    },
    styles
  );
  const root = document.getElementById("root");
  assert(root.querySelector(".summary"), "judgment summary 없음");
  const counts = root.querySelectorAll(".summaryCount");
  assert(counts.length === 3, "summary count 3개여야 함");
  assert(counts[0].textContent === "0건", "확정위반 count");
  assert(counts[1].textContent === "1건", "의심 count");
  assert(counts[2].textContent === "0건", "이상없음 count");
});

test("judgment: 확정위반 항목 표시", () => {
  renderResult(
    {
      type: "judgment",
      badge: "확정위반 1건",
      summary: { 확정위반: 1, 의심: 0, 이상없음: 0 },
      items: [
        {
          line: "5",
          verdict: "확정위반",
          desc: "스케일링 fit이 전체 데이터 기준으로 먼저 호출될 수 있습니다.",
          fix: "학습 데이터 기준으로 fit한 뒤 검증/테스트 데이터에는 transform만 적용하세요.",
        },
      ],
    },
    styles
  );
  const root = document.getElementById("root");
  const sections = root.querySelectorAll(".section");
  assert(sections.length === 1, "확정위반 section 1개여야 함");
  const sLabel = sections[0].querySelector(".sectionLabel");
  assert(sLabel.textContent === "확정위반", "section label");
  assert(sLabel.parentElement.querySelector(".sectionCount").textContent === "1건", "section count");

  const items = sections[0].querySelectorAll(".item");
  assert(items.length === 1, "항목 1개");
  assert(items[0].querySelector(".itemLine").textContent === "5", "줄 번호");
  assert(items[0].querySelector(".itemVerdict").textContent === "확정위반", "판정 유형");
  assert(items[0].querySelector(".itemDesc").textContent === "스케일링 fit이 전체 데이터 기준으로 먼저 호출될 수 있습니다.", "이유");
  assert(items[0].querySelector(".itemFix").textContent === "학습 데이터 기준으로 fit한 뒤 검증/테스트 데이터에는 transform만 적용하세요.", "수정 제안");
  assert(items[0].style.borderColor === "var(--color-ruby)", "확정위반 border 색상");
});

test("judgment: 의심 항목 표시", () => {
  renderResult(
    {
      type: "judgment",
      badge: "의심 1건",
      summary: { 확정위반: 0, 의심: 1, 이상없음: 0 },
      items: [
        {
          line: "3",
          verdict: "의심",
          desc: "코드에서 타겟 정보를 직접 참조하는 표현이 보입니다.",
          fix: "전처리 단계에서 타겟을 직접 변환하지 말고, 피처만 처리하세요.",
        },
      ],
    },
    styles
  );
  const root = document.getElementById("root");
  const sections = root.querySelectorAll(".section");
  assert(sections.length === 1, "의심 section 1개여야 함");
  assert(sections[0].querySelector(".sectionLabel").textContent === "의심", "section label");
  const items = sections[0].querySelectorAll(".item");
  assert(items.length === 1, "의심 항목 1개");
  assert(items[0].querySelector(".itemVerdict").textContent === "의심", "의심 판정");
  assert(items[0].style.borderColor === "var(--color-primary)", "의심 border 색상");
});

test("judgment: 이상없음 항목 표시", () => {
  renderResult(
    {
      type: "judgment",
      badge: "이상없음 1건",
      summary: { 확정위반: 0, 의심: 0, 이상없음: 1 },
      items: [
        {
          line: "10",
          verdict: "이상없음",
          desc: "명확하게 의심되는 패턴이 보이지 않습니다.",
        },
      ],
    },
    styles
  );
  const root = document.getElementById("root");
  const sections = root.querySelectorAll(".section");
  assert(sections.length === 1, "이상없음 section 1개");
  assert(sections[0].querySelector(".sectionLabel").textContent === "이상없음", "section label");
  const items = sections[0].querySelectorAll(".item");
  assert(items.length === 1, "이상없음 항목 1개");
  assert(items[0].style.borderColor === "var(--color-ink-mute)", "이상없음 border 색상");
});

test("judgment: 항목이 없을 때 안내 메시지", () => {
  renderResult(
    {
      type: "judgment",
      badge: "이상없음",
      summary: { 확정위반: 0, 의심: 0, 이상없음: 0 },
      items: [],
    },
    styles
  );
  const root = document.getElementById("root");
  const emptyMsg = root.querySelector(".itemDesc");
  assert(emptyMsg && emptyMsg.textContent === "항목이 없습니다.", "항목 없음 안내 메시지");
});

test("judgment: note 표시 (error, not-connected이 아닐 때)", () => {
  renderResult(
    {
      type: "judgment",
      badge: "의심 2건",
      summary: { 확정위반: 1, 의심: 1, 이상없음: 0 },
      items: [
        { line: "4", verdict: "확정위반", desc: "스케일링 fit", fix: "학습 데이터만 fit" },
        { line: "7", verdict: "의심", desc: "타겟 참조", fix: "타겟 제외" },
      ],
      note: "백엔드 미연결 상태라 프론트 기본 패턴 점검 결과만 표시합니다.",
    },
    styles
  );
  const root = document.getElementById("root");
  const noteEl = root.querySelector(".note");
  assert(noteEl, "note 요소 없음");
  assert(noteEl.textContent === "백엔드 미연결 상태라 프론트 기본 패턴 점검 결과만 표시합니다.", "note 내용");
});

test("error: note가 없을 때 items만 표시", () => {
  renderResult(
    {
      type: "error",
      badge: "오류",
      note: null,
    },
    styles
  );
  const root = document.getElementById("root");
  assert(root.querySelector(".items"), "error items 존재");
  assert(!root.querySelector(".itemDesc"), "note 없을 때 itemDesc 없음");
});

test("not-connected: note가 있어도 표시 안 함", () => {
  renderResult(
    {
      type: "not-connected",
      badge: "연결 안됨",
      note: "무시할 노트",
    },
    styles
  );
  const root = document.getElementById("root");
  assert(!root.querySelector(".note"), "not-connected일 때 note 표시 안 함");
  assert(root.querySelector(".items"), "not-connected items 존재");
});

// ---- 실행 ----

for (const t of tests) {
  try {
    t.fn();
    passed++;
    console.log(`✓ ${t.name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${t.name}: ${e.message}`);
  }
}

console.log(`\n프론트 예외 표시 테스트 결과: ${passed} 통과 / ${failed} 실패`);
if (failed > 0) process.exit(1);
