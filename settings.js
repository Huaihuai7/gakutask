// ▼ 設定画面の部品
const nameInput = document.getElementById("nameInput");
const nameSaveBtn = document.getElementById("nameSaveBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearTasksBtn = document.getElementById("clearTasksBtn");
const clearMemosBtn = document.getElementById("clearMemosBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const icsBtn = document.getElementById("icsBtn");
const msg = document.getElementById("msg");
const dataSummary = document.getElementById("dataSummary"); // ★追加
const lastExport = document.getElementById("lastExport");   // ★追加
 
// ▼ 画面の下に、結果のメッセージを出す
function showMsg(text) {
  msg.textContent = text;
}
 
// ★追加：いま保存されているデータの件数を、表示する
function renderSummary() {
  const done = tasks.filter(function (t) { return t.done; }).length;
  const totalMin = logs.reduce(function (sum, l) { return sum + (l.min || 0); }, 0);
 
  const cards = [
    ["タスク", tasks.length + " 件", "完了 " + done + "／未完了 " + (tasks.length - done)],
    ["メモ", memos.length + " 件", ""],
    ["学習記録", logs.length + " 件", "合計 " + fmtMin(totalMin)]
  ];
 
  dataSummary.innerHTML = ""; // いったん空にする
  cards.forEach(function (c) {
    const box = document.createElement("div");
    const label = document.createElement("small");
    label.textContent = c[0];
    const count = document.createElement("b");
    count.textContent = c[1];
    const note = document.createElement("small");
    note.textContent = c[2];
    box.append(label, count, note);
    dataSummary.appendChild(box);
  });
 
  // 最後に書き出した日時
  const last = localStorage.getItem("lastExport");
  lastExport.textContent = last
    ? "最後に書き出した日時：" + new Date(last).toLocaleString("ja-JP")
    : "まだ書き出していません。";
}
 
// ▼ 保存済みの名前を、入力欄に入れる
nameInput.value = localStorage.getItem("userName") || "";
 
// ▼ 名前を保存する
nameSaveBtn.addEventListener("click", function () {
  localStorage.setItem("userName", nameInput.value.trim());
  showMsg("名前を保存しました。ほかのページを開くと、反映されます。");
});
 
// ▼ 学習記録が、正しい形のものだけを残す
function validLogs(arr) {
  return arr.filter(function (l) {
    return (
      l &&
      typeof l.date === "string" &&
      typeof l.cat === "string" &&
      Number.isFinite(l.min) &&
      l.min >= 1
    );
  });
}
 
// ▼ データを、ファイルに書き出す
exportBtn.addEventListener("click", function () {
  const data = {
    version: 2,                       // バックアップの形式の番号
    tasks: tasks,
    memos: memos,
    logs: logs,
    userName: localStorage.getItem("userName") || "",
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
 
  const a = document.createElement("a"); // 見えないリンクを作って、押す
  a.href = url;
  a.download = "gakutask-backup.json";
  a.click();
  URL.revokeObjectURL(url);
 
  localStorage.setItem("lastExport", data.exportedAt); // ★追加：書き出した日時を覚える
  renderSummary();                                      // ★追加
 
  showMsg(
    "書き出しました。（タスク " + tasks.length + " 件、メモ " + memos.length +
    " 件、学習記録 " + logs.length + " 件）"
  );
});
 
// ▼ ファイルから、データを読み込む
importFile.addEventListener("change", function () {
  const file = importFile.files[0];
  if (!file) return;
 
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(reader.result);
      // 形が正しいか確認する（配列でなければ、エラーにする）
      if (!Array.isArray(data.tasks) || !Array.isArray(data.memos)) {
        throw new Error("形式が違います");
      }
 
      // ★追加：ファイルの中身の件数を、確認画面に出す
      const hasLogs = Array.isArray(data.logs);
      const fileLogs = hasLogs ? validLogs(data.logs) : [];
      const ok = confirm(
        "このファイルには、次のデータが入っています。\n" +
        "・タスク " + data.tasks.length + " 件\n" +
        "・メモ " + data.memos.length + " 件\n" +
        "・学習記録 " + (hasLogs ? fileLogs.length + " 件" : "なし") + "\n\n" +
        "今のデータを、これで置き換えます。よろしいですか？"
      );
      if (!ok) return;
 
      tasks = data.tasks;
      memos = data.memos;
      save();
      saveMemos();
 
      // 学習記録は、古いバックアップには入っていない。ある場合だけ、置き換える
      if (hasLogs) {
        logs = fileLogs;
        saveLogs();
      }
 
      if (typeof data.userName === "string") {
        localStorage.setItem("userName", data.userName);
        nameInput.value = data.userName;
      }
 
      renderSummary(); // ★追加
 
      let text = "読み込みました。（タスク " + tasks.length + " 件、メモ " + memos.length + " 件";
      text += hasLogs
        ? "、学習記録 " + logs.length + " 件）"
        : "。学習記録は、このファイルに入っていないため、そのままです）";
      showMsg(text);
    } catch (e) {
      showMsg("読み込めませんでした。書き出したバックアップのファイルか、確認してください。");
    }
    importFile.value = ""; // 同じファイルを、もう一度選べるようにする
  };
  reader.readAsText(file);
});
 
// ▼ データを削除する
clearTasksBtn.addEventListener("click", function () {
  if (!confirm("タスクを全部削除します。よろしいですか？")) return;
  tasks = [];
  save();
  renderSummary(); // ★追加
  showMsg("タスクを削除しました。");
});
 
clearMemosBtn.addEventListener("click", function () {
  if (!confirm("メモを全部削除します。よろしいですか？")) return;
  memos = [];
  saveMemos();
  renderSummary(); // ★追加
  showMsg("メモを削除しました。");
});
 
clearAllBtn.addEventListener("click", function () {
  if (!confirm("タスク、メモ、学習記録、名前をすべて削除します。よろしいですか？")) return;
  tasks = [];
  memos = [];
  logs = [];
  save();
  saveMemos();
  saveLogs();
  localStorage.removeItem("userName");
  nameInput.value = "";
  renderSummary(); // ★追加
  showMsg("すべて削除しました。");
});
 
// ▼ カレンダー用ファイル（.ics）の書き出し
 
// 文字の中の特別な記号を、.ics の決まりに合わせて変える
function icsEscape(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
 
// 今の時刻を「20261119T015100Z」の形にする（.ics で必要な作成日時）
function icsStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
 
icsBtn.addEventListener("click", function () {
  // 期限があって、まだ終わっていないタスクだけ
  const items = tasks.filter(function (t) {
    return !t.done && t.due;
  });
  if (items.length === 0) {
    showMsg("期限のある未完了のタスクがありません。");
    return;
  }
 
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GakuTask//JA", "CALSCALE:GREGORIAN"];
 
  items.forEach(function (t) {
    const day = t.due.replace(/-/g, ""); // 2026-11-20 → 20261120
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + t.id + "@gakutask",
      "DTSTAMP:" + icsStamp(),
      "DTSTART;VALUE=DATE:" + day,
      "SUMMARY:" + icsEscape(t.text),
      "DESCRIPTION:" + icsEscape((t.cat || "その他") + "・優先度：" + (t.priority || "中")),
 
      // 前日の9時に通知（予定は0時開始なので、15時間前）
      "BEGIN:VALARM",
      "TRIGGER:-PT15H",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + icsEscape("明日が期限：" + t.text),
      "END:VALARM",
 
      // 当日の9時に通知（予定の開始から、9時間後）
      "BEGIN:VALARM",
      "TRIGGER:PT9H",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + icsEscape("今日が期限：" + t.text),
      "END:VALARM",
 
      "END:VEVENT"
    );
  });
 
  lines.push("END:VCALENDAR");
 
  // 行の区切りは、.ics の決まりで「\r\n」にする
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
 
  const a = document.createElement("a");
  a.href = url;
  a.download = "gakutask.ics";
  a.click();
  URL.revokeObjectURL(url);
 
  showMsg(items.length + " 件のタスクを書き出しました。カレンダーアプリで開いてください。");
});
 
renderSummary(); // ★追加：ページを開いたときに、件数を表示する
