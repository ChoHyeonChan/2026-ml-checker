// router-response.test.mjs
// 라우터 POST 함수의 각 분기가 올바른 type / note를 내려주는지 검증한다.

globalThis.__TEST__ = true;

if (typeof globalThis !== "undefined" && globalThis.__TEST__) {
  globalThis.NextResponse = class {
    static json(body) {
      return {
        json: async () => body,
      };
    }
  };
}

const { POST } = await import("../app/api/check/route.js");

const tests = [];

function add(desc, buildReq, validate) {
  tests.push({ desc, buildReq, validate });
}

function bad(msg) {
  throw new Error(msg);
}

function reqWith(body, headers) {
  const hdrs = new Headers();
  for (const [k, v] of Object.entries(headers || {})) hdrs.set(k, v);
  return {
    headers: {
      get(name) {
        return hdrs.get(name);
      },
    },
    async json() {
      if (body instanceof FormData) throw new Error("not json");
      return body;
    },
    async formData() {
      if (body instanceof FormData) return body;
      throw new Error("not formdata");
    },
  };
}

function file(name, text) {
  return new File([text], name, { type: "text/plain" });
}

// ---- JSON 분기 ----

add("JSON: 빈 코드 → empty", () => reqWith({ code: "" }, { "Content-Type": "application/json" }), (r) => {
  if (r.type !== "empty") bad(`expected empty, got ${r.type}`);
});

add("JSON: 코드 없음 → empty", () => reqWith({}, { "Content-Type": "application/json" }), (r) => {
  if (r.type !== "empty") bad(`expected empty, got ${r.type}`);
});

add("JSON: 파이썬 아님 → not-python", () => reqWith({ code: "hello world" }, { "Content-Type": "application/json" }), (r) => {
  if (r.type !== "not-python") bad(`expected not-python, got ${r.type}`);
});

add("JSON: 파이썬이지만 전처리 아님 → not-preprocessing", () =>
  reqWith({ code: "def foo(): return 1" }, { "Content-Type": "application/json" }), (r) => {
    if (r.type !== "not-preprocessing") bad(`expected not-preprocessing, got ${r.type}`);
  });

add("JSON: 전처리 코드, 백엔드 미연결 → judgment + summary + note", () =>
  reqWith(
    {
      code: [
        "import pandas as pd",
        "from sklearn.preprocessing import StandardScaler",
        "from sklearn.model_selection import train_test_split",
        "",
        "df = pd.read_csv('data.csv')",
        "X = df.drop('target', axis=1)",
        "y = df['target']",
        "",
        "scaler = StandardScaler()",
        "scaler.fit(X)",
        "",
        "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)",
      ].join("\n"),
    },
    { "Content-Type": "application/json" }
  ), (r) => {
    if (r.type !== "judgment") bad(`expected judgment, got ${r.type}`);
    if (!r.summary || typeof r.summary !== "object") bad("summary 누락");
    if (!r.note || !r.note.includes("백엔드 URL이 설정되지 않아")) bad("note 누락 또는 불일치");
  });

// ---- multipart 분기 ----

add("multipart: 파일 없음 → empty", () =>
  reqWith(new FormData(), { "Content-Type": "multipart/form-data" }), (r) => {
    if (r.type !== "empty") bad(`expected empty, got ${r.type}`);
  });

add("multipart: 파일 읽기 실패 → empty", () => {
  const fd = new FormData();
  const badFile = {
    name: "bad.py",
    size: 10,
    arrayBuffer: async () => new ArrayBuffer(0),
    text: async () => { throw new Error("read fail"); },
    stream: () => null,
  };
  fd.append("file", badFile);
  return reqWith(fd, { "Content-Type": "multipart/form-data" });
}, (r) => {
  if (r.type !== "empty") bad(`expected empty, got ${r.type}`);
});

add("multipart: .py 파일, 전처리 코드, 백엔드 미연결 → judgment + summary + note", () => {
  const fd = new FormData();
  fd.append("file", file("example.py", [
    "import pandas as pd",
    "from sklearn.preprocessing import StandardScaler",
    "from sklearn.model_selection import train_test_split",
    "",
    "df = pd.read_csv('data.csv')",
    "X = df.drop('target', axis=1)",
    "y = df['target']",
    "",
    "scaler = StandardScaler()",
    "scaler.fit(X)",
    "",
    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)",
  ].join("\n")));
  return reqWith(fd, { "Content-Type": "multipart/form-data" });
}, (r) => {
  if (r.type !== "judgment") bad(`expected judgment, got ${r.type}`);
  if (!r.summary || typeof r.summary !== "object") bad("summary 누락");
  if (!r.note || !r.note.includes("백엔드 URL이 설정되지 않아")) bad("note 불일치");
});

add("multipart: .py 파일, 빈 코드 → empty", () => {
  const fd = new FormData();
  fd.append("file", file("empty.py", ""));
  return reqWith(fd, { "Content-Type": "multipart/form-data" });
}, (r) => {
  if (r.type !== "empty") bad(`expected empty, got ${r.type}`);
});

// ---- 실행 ----

let okCount = 0;
let failCount = 0;

for (const t of tests) {
  try {
    const req = t.buildReq();
    const res = await POST(req);
    const body = await res.json();
    t.validate(body);
    okCount++;
    console.log(`✓ ${t.desc}`);
  } catch (e) {
    failCount++;
    console.log(`✗ ${t.desc}: ${e.message}`);
  }
}

console.log(`\n라우터 응답 분기 테스트 결과: ${okCount} 통과 / ${failCount} 실패`);
if (failCount > 0) process.exit(1);
