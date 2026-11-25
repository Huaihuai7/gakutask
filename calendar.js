// ▼ カレンダー画面の部品
const calTitle = document.getElementById("calTitle");
const calGrid = document.getElementById("calGrid");
const dayTitle = document.getElementById("dayTitle");
const dayList = document.getElementById("dayList");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
// ★追加：予定まわりの部品
const evDayTitle = document.getElementById("evDayTitle");
const evDayList = document.getElementById("evDayList");
const evTitle = document.getElementById("evTitle");
const evKind = document.getElementById("evKind");
const evDate = document.getElementById("evDate");
const evAddBtn = document.getElementById("evAddBtn");
const evMsg = document.getElementById("evMsg");
 
// ★追加：予定の種類の選択肢を、EVENT_KINDS から作る
EVENT_KINDS.forEach(function (name) {
const opt = document.createElement("option");
opt.value = name;
opt.textContent = name;
evKind.appendChild(opt);
});
 
// ▼ Date を「2026-11-18」の形の文字に変える（タスクの期限と同じ形）
function ymd(d) {
return d.getFullYear() + "-" +
String(d.getMonth() + 1).padStart(2, "0") + "-" +
String(d.getDate()).padStart(2, "0");
}
 
const today = ymd(new Date());
let selected = today; // 選んでいる日
let current = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // 表示中の月の1日
 
// ▼ カレンダーを描き直す
function renderCalendar() {
const year = current.getFullYear();
const month = current.getMonth();
calTitle.textContent = year + "年" + (month + 1) + "月";
calGrid.innerHTML = "";
 
const firstWeekday = new Date(year, month, 1).getDay(); // 1日の曜日（日曜=0）
const lastDate = new Date(year, month + 1, 0).getDate(); // その月の日数
 
// 1日より前の、空白のマス
for (let i = 0; i < firstWeekday; i++) {
calGrid.appendChild(document.createElement("span"));
}
 
for (let d = 1; d <= lastDate; d++) {
const key = ymd(new Date(year, month, d));
 
const btn = document.createElement("button");
btn.className = "day";
if (key === today) btn.classList.add("today");
if (key === selected) btn.classList.add("sel");
btn.textContent = d;
 
// その日の予定とタスクの点を付ける（合わせて最大3つ。予定が先）
const dots = document.createElement("span");
dots.className = "dots";
 
// ★変更：予定の点（試験は赤、それ以外は緑）
const dayEvents = calEvents
.filter(function (e) {
return e.date === key;
})
.slice(0, 3);
dayEvents.forEach(function (ev) {
const dot = document.createElement("i");
dot.className = "dot";
dot.style.background = ev.kind === "試験" ? "#dc2626" : "#0f766e";
dot.style.borderRadius = "2px";
dots.appendChild(dot);
});
 
// タスクの点（予定の分を引いた、残りの数だけ）
tasks
.filter(function (t) {
return t.due === key;
})
.slice(0, 3 - dayEvents.length)
.forEach(function (t) {
const dot = document.createElement("i");
dot.className = "dot";
dot.dataset.cat = t.cat || "その他";
dots.appendChild(dot);
});
btn.appendChild(dots);
 
btn.addEventListener("click", function () {
selected = key;
renderCalendar();
renderDay();
});
 
calGrid.appendChild(btn);
}
}
 
// ★追加：選んだ日の予定を表示する
function renderEvents() {
const parts = selected.split("-");
evDayTitle.textContent = Number(parts[1]) + "月" + Number(parts[2]) + "日の予定";
evDate.value = selected; // 追加欄の日付も、選んだ日に合わせる
evDayList.innerHTML = "";
 
const items = calEvents.filter(function (e) {
return e.date === selected;
});
 
if (items.length === 0) {
const p = document.createElement("p");
p.className = "empty";
p.textContent = "この日の予定はありません。";
evDayList.appendChild(p);
return;
}
 
items.forEach(function (ev) {
const li = document.createElement("li");
 
const title = document.createElement("span");
title.textContent = ev.title;
 
const meta = document.createElement("small");
meta.textContent = ev.kind;
 
const info = document.createElement("div");
info.className = "info";
info.append(title, meta);
 
const del = document.createElement("button");
del.textContent = "×";
del.className = "del";
del.setAttribute("aria-label", "「" + ev.title + "」を削除");
del.addEventListener("click", function () {
calEvents = calEvents.filter(function (e) {
return e.id !== ev.id;
});
saveCalEvents();
renderEvents();
});
 
li.append(info, del);
evDayList.appendChild(li);
});
}
 
// ▼ 選んだ日のタスクを表示する
function renderDay() {
renderEvents(); // ★追加：予定も一緒に描き直す
 
const parts = selected.split("-");
dayTitle.textContent = Number(parts[1]) + "月" + Number(parts[2]) + "日のタスク";
dayList.innerHTML = "";
 
const items = sortedTasks().filter(function (t) {
return t.due === selected;
});
 
if (items.length === 0) {
const p = document.createElement("p");
p.className = "empty";
p.textContent = "この日のタスクはありません。";
dayList.appendChild(p);
return;
}
 
items.forEach(function (task) {
const li = document.createElement("li");
li.dataset.cat = task.cat || "その他";
if (task.done) li.classList.add("done");
 
const check = document.createElement("input");
check.type = "checkbox";
check.checked = task.done;
check.addEventListener("change", function () {
task.done = check.checked;
save();
renderDay();
});
 
const title = document.createElement("span");
title.textContent = task.text;
 
const meta = document.createElement("small");
meta.textContent = (task.cat || "その他") + "・優先度：" + (task.priority || "中");
 
const info = document.createElement("div");
info.className = "info";
info.append(title, meta);
 
li.append(check, info);
dayList.appendChild(li);
});
}
 
// ★追加：「追加」が押されたとき、予定を保存する
evAddBtn.addEventListener("click", function () {
const t = evTitle.value.trim();
if (t === "") {
evMsg.textContent = "予定の名前を入れてください。";
return;
}
if (evDate.value === "") {
evMsg.textContent = "日付を選んでください。";
return;
}
 
calEvents.push({
id: Date.now(),
title: t,
date: evDate.value,
kind: evKind.value
});
saveCalEvents();
 
evTitle.value = "";
evMsg.textContent = "予定を追加しました。";
 
// 追加した日に、カレンダーを移動する
selected = evDate.value;
const p = selected.split("-");
current = new Date(Number(p[0]), Number(p[1]) - 1, 1);
renderCalendar();
renderDay();
});
 
// ▼ 前の月・次の月・今日
prevBtn.addEventListener("click", function () {
current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
renderCalendar();
});
nextBtn.addEventListener("click", function () {
current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
renderCalendar();
});
todayBtn.addEventListener("click", function () {
selected = today;
current = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
renderCalendar();
renderDay();
});
 
renderCalendar();
renderDay();