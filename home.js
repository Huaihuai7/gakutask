// ▼ ホーム画面の部品
const sumTotal = document.getElementById("sumTotal");
const sumDone = document.getElementById("sumDone");
const sumRate = document.getElementById("sumRate");
const catBars = document.getElementById("catBars");
const sumTime = document.getElementById("sumTime");
const logCat = document.getElementById("logCat");
const logMin = document.getElementById("logMin");
const logBtn = document.getElementById("logBtn");
const logMsg = document.getElementById("logMsg");
const todayList = document.getElementById("todayList");
const latestMemo = document.getElementById("latestMemo");
const upcomingList = document.getElementById("upcomingList");
 
// ▼ 集計（総タスク数・完了数・進捗率）を表示する
function updateSummary() {
const total = tasks.length;
const done = tasks.filter(function (t) {
return t.done;
}).length;
const rate = total === 0 ? 0 : Math.round((done / total) * 100);
 
sumTotal.textContent = total;
sumDone.textContent = done;
sumRate.textContent = rate + "%";
sumTime.textContent = fmtMin(weekMinutes());
}
 
// ▼ 科目ごとの達成度を、バーで表示する
function updateBars() {
let html = "";
 
CATS.forEach(function (cat) {
const items = tasks.filter(function (t) {
return (t.cat || "その他") === cat;
});
if (items.length === 0) return;
 
const done = items.filter(function (t) {
return t.done;
}).length;
const rate = Math.round((done / items.length) * 100);
 
html +=
'<div class="bar-row">' +
"<em>" + cat + "</em>" +
'<div class="bar-track"><div class="bar-fill" data-cat="' + cat + '" style="width:' + rate + '%"></div></div>' +
"<span>" + rate + "%</span>" +
"</div>";
});
 
catBars.innerHTML =
html || '<p class="empty">タスクを追加すると、ここに表示されます。</p>';
}
 
// ▼ 今日が期限で、まだ終わっていないタスクを表示する
function updateToday() {
const key = dateKey(new Date());
const items = sortedTasks().filter(function (t) {
return !t.done && t.due === key;
});
 
todayList.innerHTML = "";
 
if (items.length === 0) {
const li = document.createElement("li");
li.className = "empty";
li.textContent = "今日が期限のタスクはありません。";
todayList.appendChild(li);
return;
}
 
items.forEach(function (t) {
const li = document.createElement("li");
li.textContent = t.text + "（" + (t.cat || "その他") + "）";
todayList.appendChild(li);
});
}
 
// ▼ 新しいメモを、3件まで表示する
function updateMemo() {
latestMemo.innerHTML = "";
 
if (memos.length === 0) {
const li = document.createElement("li");
li.className = "empty";
li.textContent = "まだメモがありません。";
latestMemo.appendChild(li);
return;
}
 
const newest = [...memos]
.sort(function (a, b) {
return b.id - a.id;
})
.slice(0, 3);
 
newest.forEach(function (m) {
const li = document.createElement("li");
const name = m.title || (m.body || "").slice(0, 20) || "（無題）";
li.textContent = name + (m.date ? "（" + m.date + "）" : "");
latestMemo.appendChild(li);
});
}
 
// ▼ 明日以降の、未完了タスクと予定を、近い順に5件まで表示する
function updateUpcoming() {
const key = dateKey(new Date()); // 今日
 
// タスクを、{日付, 表示する文字} の形にそろえる
const taskItems = tasks
.filter(function (t) {
return !t.done && t.due && t.due > key;
})
.map(function (t) {
return {
date: t.due,
text: t.text + "（" + (t.cat || "その他") + "）"
};
});
 
// 予定も、同じ形にそろえる（頭に【種類】を付ける）
const eventItems = calEvents
.filter(function (e) {
return e.date > key;
})
.map(function (e) {
return {
date: e.date,
text: "【" + e.kind + "】" + e.title
};
});
 
// 合わせて、日付の近い順に並べて、5件まで取る
const items = taskItems
.concat(eventItems)
.sort(function (a, b) {
return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
})
.slice(0, 5);
 
upcomingList.innerHTML = "";
 
if (items.length === 0) {
const li = document.createElement("li");
li.className = "empty";
li.textContent = "今後の予定はありません。";
upcomingList.appendChild(li);
return;
}
 
items.forEach(function (item) {
const li = document.createElement("li");
li.textContent = item.date + "　" + item.text;
upcomingList.appendChild(li);
});
}
 
// ▼ 「記録」が押されたとき
logBtn.addEventListener("click", function () {
const min = parseInt(logMin.value, 10);
 
// 1〜1440分（24時間）の整数だけ受け付ける
if (!(min >= 1 && min <= 1440)) {
logMsg.textContent = "1〜1440 の数字（分）を入れてください。";
return;
}
 
logs.push({
id: Date.now(),
date: dateKey(new Date()),
cat: logCat.value,
min: min
});
saveLogs();
updateSummary();
 
logMin.value = "";
logMsg.textContent = logCat.value + "：" + min + "分を記録しました。";
});
 
updateSummary();
updateBars();
updateToday();
updateMemo();
updateUpcoming();