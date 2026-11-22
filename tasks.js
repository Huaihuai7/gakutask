// ▼ タスク画面の部品
const input = document.getElementById("taskInput");
const button = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const dueInput = document.getElementById("dueInput");
const priorityInput = document.getElementById("priorityInput");
const catInput = document.getElementById("catInput");
const categoryInput = document.getElementById("categoryInput"); // ★追加
const undoBar = document.getElementById("undoBar");
const undoBtn = document.getElementById("undoBtn");
const undoClose = document.getElementById("undoClose");
 
// ★追加：カテゴリの選択肢を、CATEGORIES から作る
CATEGORIES.forEach(function (name) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  categoryInput.appendChild(opt);
});
 
// ▼ 直前に削除したタスクを、覚えておく
let lastDeleted = null;
 
// ▼ 画面を描き直す
function render() {
  list.innerHTML = "";
 
  sortedTasks().forEach(function (task) {
    const li = document.createElement("li");
    li.dataset.cat = task.cat || "その他";
    if (task.done) li.classList.add("done");
 
    // 完了チェック
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.addEventListener("change", function () {
      task.done = check.checked;
      save();
      render();
    });
 
    // タスクの文字
    const title = document.createElement("span");
    title.textContent = task.text;
 
    // カテゴリ・科目・優先度・期限（小さい文字）
    const meta = document.createElement("small");
    meta.textContent =
      (task.category || "未設定") +                  // ★追加：カテゴリ（古いタスクは「未設定」）
      "・" + (task.cat || "その他") +
      "・優先度：" + (task.priority || "中") +
      (task.due ? "・期限 " + task.due : "");
 
    const info = document.createElement("div");
    info.className = "info";
    info.append(title, meta);
 
    // 削除ボタン
    const del = document.createElement("button");
    del.textContent = "×";
    del.className = "del";
    del.addEventListener("click", function () {
      lastDeleted = task;
      tasks = tasks.filter(function (t) {
        return t.id !== task.id;
      });
      save();
      render();
      undoBar.hidden = false;
    });
 
    li.append(check, info, del);
    list.appendChild(li);
  });
}
 
// ▼ 追加ボタンが押されたとき
button.addEventListener("click", function () {
  const text = input.value.trim();
  if (text === "") return;
 
  tasks.push({
    id: Date.now(),
    text: text,
    done: false,
    due: dueInput.value,
    priority: priorityInput.value,
    cat: catInput.value,
    category: categoryInput.value                     // ★追加：カテゴリを保存
  });
  save();
  render();
 
  input.value = "";
  dueInput.value = "";
});
 
// ▼ 「元に戻す」が押されたとき
undoBtn.addEventListener("click", function () {
  if (!lastDeleted) return;
 
  tasks.push(lastDeleted);
  lastDeleted = null;
  undoBar.hidden = true;
 
  save();
  render();
});
 
// ▼ ×が押されたら、バーを閉じる
undoClose.addEventListener("click", function () {
  lastDeleted = null;
  undoBar.hidden = true;
});
 
render();