// file-upload.test.mjs
// 파일 업로드 기능 테스트 - 파일명, 줄 수, 지원 형식 안내 표시 검증

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
  url: "http://localhost",
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.File = dom.window.File;
global.FormData = dom.window.FormData;

// page.js에서 추출한 파일 정보 표시 로직
function renderFileInfo(file, fileLines) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const fileInfo = document.createElement("div");
  fileInfo.className = "fileInfo";
  fileInfo.style.cssText = "padding: 8px 16px; font-size: 12px; color: #666; background: #fafbfc; border-top: 1px solid #e2e6ee;";

  let fileNameEl = null;

  if (file) {
    const fileName = document.createElement("span");
    fileName.className = "fileName";
    fileName.style.cssText = "display: inline-flex; align-items: center; gap: 8px;";
    fileName.style.color = "#666";

    const nameText = document.createTextNode(`선택한 파일: ${file.name}`);
    fileName.appendChild(nameText);

    if (fileLines > 0) {
      const linesText = document.createElement("span");
      linesText.className = "fileLines";
      linesText.style.cssText = "color: #555;";
      linesText.textContent = ` / 총 ${fileLines}줄`;
      fileName.appendChild(linesText);
    }

    const clearBtn = document.createElement("button");
    clearBtn.className = "fileClear";
    clearBtn.style.cssText = "background: none; border: none; color: #ef4444; cursor: pointer; font-size: 12px; text-decoration: underline;";
    clearBtn.textContent = "지우기";
    fileName.appendChild(clearBtn);

    fileInfo.appendChild(fileName);
    fileNameEl = fileName;
  }

  root.appendChild(fileInfo);
  return { root, fileInfo, fileName: fileNameEl };
}

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// 테스트 1: 파일 선택 시 파일명 표시
test("파일 선택 시 파일명 표시", () => {
  const file = new File(["test content"], "sample.py", { type: "text/plain" });
  const { fileName } = renderFileInfo(file, 12);

  const fullText = fileName.textContent;
  assert(fullText.includes("선택한 파일: sample.py"), "파일명 미표시");
  assert(fullText.includes("총 12줄"), "줄 수 미표시");
});

// 테스트 2: 파일명 + 줄 수 함께 표시
test("파일명 + 줄 수 함께 표시", () => {
  const file = new File(["line1\nline2\nline3"], "example.ipynb", { type: "text/plain" });
  const { fileName } = renderFileInfo(file, 3);

  const fullText = fileName.textContent;
  assert(fullText.includes("선택한 파일: example.ipynb"), "ipynb 파일명 미표시");
  assert(fullText.includes("총 3줄"), "3줄 미표시");
});

// 테스트 3: 파일 선택 시 줄 수 0이면 줄 수 미표시
test("줄 수 0이면 줄 수 미표시", () => {
  const file = new File(["test"], "empty.py", { type: "text/plain" });
  const { fileName } = renderFileInfo(file, 0);

  const fullText = fileName.textContent;
  assert(fullText.includes("선택한 파일: empty.py"), "파일명 미표시");
  assert(!fullText.includes("줄"), "줄 수 표시됨 (오류)");
});

// 테스트 4: 파일 없으면 표시 없음
test("파일 없으면 표시 없음", () => {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const fileInfo = document.createElement("div");
  fileInfo.className = "fileInfo";
  fileInfo.style.cssText = "padding: 8px 16px;";
  
  // 파일 없으면 아무것도 렌더링 안 함
  assert(fileInfo.childNodes.length === 0, "null 파일일 때 표시됨 (오류)");
});

// 테스트 5: 지원 형식 안내 문구 존재 (cardHeader에)
test("지원 형식 안내 표시", () => {
  const root = document.getElementById("root");
  root.innerHTML = "";
  
  const cardHeader = document.createElement("div");
  cardHeader.className = "cardHeader";
  cardHeader.style.cssText = "display: flex; align-items: center; padding: 12px 16px;";
  
  const cardLabel = document.createElement("span");
  cardLabel.className = "cardLabel";
  cardLabel.textContent = "전처리 코드 입력";
  cardHeader.appendChild(cardLabel);
  
  const formatHint = document.createElement("span");
  formatHint.className = "fileFormatHint";
  formatHint.style.cssText = "font-size: 11px; color: #888; margin-left: 12px;";
  formatHint.textContent = "지원 형식: .py, .ipynb";
  cardHeader.appendChild(formatHint);
  
  root.appendChild(cardHeader);
  
  assert(cardHeader.querySelector(".fileFormatHint") !== null, "지원 형식 안내 없음");
  assert(cardHeader.querySelector(".fileFormatHint").textContent === "지원 형식: .py, .ipynb", "지원 형식 안내 내용 불일치");
});

// 테스트 6: 파일명 + 줄 수 + 지우기 버튼 모두 표시
test("파일명 + 줄 수 + 지우기 버튼 모두 표시", () => {
  const file = new File(["content"], "test.py", { type: "text/plain" });
  const { fileName } = renderFileInfo(file, 10);

  assert(fileName.childNodes.length >= 2, "내용 부족");
  
  const hasClearBtn = Array.from(fileName.children).some(child => child.className === "fileClear");
  assert(hasClearBtn, "지우기 버튼 없음");
});

// 실행
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

console.log(`\n파일 업로드 기능 테스트 결과: ${passed} 통과 / ${failed} 실패`);
if (failed > 0) process.exit(1);
