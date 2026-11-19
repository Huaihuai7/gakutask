// ▼ 設定画面の部品
const nameInput = document.getElementById("nameInput");
const nameSaveBtn = document.getElementById("nameSaveBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearTasksBtn = document.getElementById("clearTasksBtn");
const clearMemosBtn = document.getElementById("clearMemosBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const msg = document.getElementById("msg");
 
// ▼ 画面の下に、結果のメッセージを出す
function showMsg(text) {
  msg.textContent = text;
}
 
// ▼ 保存済みの名前を、入力欄に入れる
nameInput.value = localStorage.getItem("userName") || "";
 
// ▼ 名前を保存する
nameSaveBtn.addEventListener("click", function () {
  localStorage.setItem("userName", nameInput.value.trim());
  showMsg("名前を保存しました。ほかのページを開くと、反映されます。");
});
 
// ▼ データを、ファイルに書き出す
exportBtn.addEventListener("click", function () {
  const data = {
    tasks: tasks,
    memos: memos,
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
 
  showMsg("書き出しました。ダウンロードフォルダを確認してください。");
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
      if (!confirm("今のデータを、読み込んだデータで置き換えます。よろしいですか？")) return;
 
      tasks = data.tasks;
      memos = data.memos;
      save();
      saveMemos();
      if (typeof data.userName === "string") {
        localStorage.setItem("userName", data.userName);
        nameInput.value = data.userName;
      }
      showMsg("読み込みました。（タスク " + tasks.length + " 件、メモ " + memos.length + " 件）");
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
  showMsg("タスクを削除しました。");
});
 
clearMemosBtn.addEventListener("click", function () {
  if (!confirm("メモを全部削除します。よろしいですか？")) return;
  memos = [];
  saveMemos();
  showMsg("メモを削除しました。");
});
 
clearAllBtn.addEventListener("click", function () {
  if (!confirm("タスク、メモ、名前をすべて削除します。よろしいですか？")) return;
  tasks = [];
  memos = [];
  save();
  saveMemos();
  localStorage.removeItem("userName");
  nameInput.value = "";
  showMsg("すべて削除しました。");
});

// ▼ カレンダー用ファイル（.ics）の書き出し
const icsBtn = document.getElementById("icsBtn");
 
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
      "UID:" + t.id + "@gakutask",                 // タスクごとの、重ならない番号
      "DTSTAMP:" + icsStamp(),
      "DTSTART;VALUE=DATE:" + day,                 // 終日の予定
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
