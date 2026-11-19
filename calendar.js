// ▼ カレンダー画面の部品
const calTitle = document.getElementById("calTitle");
const calGrid = document.getElementById("calGrid");
const dayTitle = document.getElementById("dayTitle");
const dayList = document.getElementById("dayList");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
 
// ▼ Date を「2026-11-18」の形の文字に変える（タスクの期限と同じ形）
function ymd(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}
 
const today = ymd(new Date());
let selected = today;                                          // 選んでいる日
let current = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // 表示中の月の1日
 
// ▼ カレンダーを描き直す
function renderCalendar() {
  const year = current.getFullYear();
  const month = current.getMonth();
  calTitle.textContent = year + "年" + (month + 1) + "月";
  calGrid.innerHTML = "";
 
  const firstWeekday = new Date(year, month, 1).getDay();  // 1日の曜日（日曜=0）
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
 
    // その日が期限のタスクがあれば、科目の色の点を付ける（最大3つ）
    const dots = document.createElement("span");
    dots.className = "dots";
    tasks
      .filter(function (t) {
        return t.due === key;
      })
      .slice(0, 3)
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
 
// ▼ 選んだ日のタスクを表示する
function renderDay() {
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