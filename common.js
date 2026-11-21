// ▼ 科目の一覧（tasks.html の選択肢と同じ並びにする）
const CATS = ["Java", "HTML・CSS", "PHP", "SQL", "その他"];
 
// ▼ 優先度を数字に変換する表（小さいほど上に表示）
const order = { "高": 0, "中": 1, "低": 2 };
 
// ▼ 保存データを読み込む（なければ空の配列）
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let memos = JSON.parse(localStorage.getItem("memos")) || [];
 
// ▼ 保存する
function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function saveMemos() {
  localStorage.setItem("memos", JSON.stringify(memos));
}
 
// ▼ 期限が近い順、同じ日なら優先度が高い順に並べ替える
function sortedTasks() {
  return [...tasks].sort(function (a, b) {
    const da = a.due || "9999-99-99"; // 期限なしは最後にする
    const db = b.due || "9999-99-99";
    if (da !== db) return da < db ? -1 : 1;
    return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
  });
}

// ▼ 名前が保存されていれば、サブタイトルの前に付ける
(function () {
  const userName = localStorage.getItem("userName");
  const sub = document.querySelector("body > p");
  if (userName && sub) sub.textContent = userName + "さん、" + sub.textContent;
})();

// ▼ 期限の通知（今日と明日が期限の、未完了のタスクを、ページの上に表示する）
(function () {
  // Date を「2026-11-19」の形の文字に変える（タスクの期限と同じ形）
  function toKey(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
 
  const now = new Date();
  const todayKey = toKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toKey(tomorrow);
 
  const dueToday = tasks.filter(function (t) {
    return !t.done && t.due === todayKey;
  });
  const dueTomorrow = tasks.filter(function (t) {
    return !t.done && t.due === tomorrowKey;
  });
 
  // どちらも無ければ、何も表示しない
  if (dueToday.length === 0 && dueTomorrow.length === 0) return;
 
  const sub = document.querySelector("body > p");
  if (!sub) return;
 
  // 「今日が期限：宿題、課題」の1行を作る
  function line(label, items) {
    if (items.length === 0) return null;
    const p = document.createElement("p");
    const b = document.createElement("b");
    b.textContent = label;
    p.append(b, "　" + items.map(function (t) { return t.text; }).join("、"));
    return p;
  }
 
  const box = document.createElement("div");
  box.className = "reminder";
  box.setAttribute("role", "status");
 
  const todayLine = line("今日が期限", dueToday);
  const tomorrowLine = line("明日が期限", dueTomorrow);
  if (todayLine) box.appendChild(todayLine);
  if (tomorrowLine) box.appendChild(tomorrowLine);
 
  // 閉じるボタン
  const close = document.createElement("button");
  close.className = "reminder-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "通知を閉じる");
  close.addEventListener("click", function () {
    box.remove();
  });
  box.appendChild(close);
 
  sub.after(box); // サブタイトルの、すぐ下に入れる
})();

// ▼ 学習記録（タスクとは別の箱に保存する）
let logs = JSON.parse(localStorage.getItem("logs")) || [];
 
function saveLogs() {
  localStorage.setItem("logs", JSON.stringify(logs));
}
 
// Date を「2026-11-21」の形の文字にする
function dateKey(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}
 
// 直近7日間の学習時間（分）の合計
function weekMinutes() {
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const key = dateKey(from);
  return logs
    .filter(function (l) { return l.date >= key; })
    .reduce(function (sum, l) { return sum + l.min; }, 0);
}
 
// 125 → 「2時間5分」
function fmtMin(m) {
  return Math.floor(m / 60) + "時間" + (m % 60) + "分";
}