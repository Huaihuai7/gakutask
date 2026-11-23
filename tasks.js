// ▼ タスク画面の部品
const input = document.getElementById("taskInput");
const button = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const dueInput = document.getElementById("dueInput");
const priorityInput = document.getElementById("priorityInput");
const catInput = document.getElementById("catInput");
const categoryInput = document.getElementById("categoryInput");
const undoBar = document.getElementById("undoBar");
const undoBtn = document.getElementById("undoBtn");
const undoClose = document.getElementById("undoClose");
const searchInput = document.getElementById("searchInput");       // ★追加
const filterCategory = document.getElementById("filterCategory"); // ★追加
const clearFilter = document.getElementById("clearFilter");       // ★追加
const resultInfo = document.getElementById("resultInfo");         // ★追加
 
// ▼ カテゴリの選択肢を、CATEGORIES から作る
CATEGORIES.forEach(function (name) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  categoryInput.appendChild(opt);
});
 
// ★追加：絞り込み用の選択肢（すべて／各カテゴリ／未設定）を作る
(function () {
  function add(value, text) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    filterCategory.appendChild(opt);
  }
  add("", "すべてのカテゴリ");
  CATEGORIES.forEach(function (name) {
    add(name, name);
  });
  add("__none__", "未設定"); // カテゴリが入っていない、古いタスク用
})();
 
// ▼ 直前に削除したタスクを、覚えておく
let lastDeleted = null;
 
// ▼ いま編集中のタスクの id（編集していなければ null）
let editingId = null;
 
// ★追加：検索と絞り込みの条件に、合うタスクか調べる
function matchesFilter(task) {
  const q = searchInput.value.trim().toLowerCase();
  const fc = filterCategory.value;
 
  // 検索：やること・科目・カテゴリのどれかに、文字が含まれているか
  if (q !== "") {
    const hay = (task.text + " " + (task.cat || "") + " " + (task.category || "")).toLowerCase();
    if (!hay.includes(q)) return false;
  }
 
  // カテゴリの絞り込み
  if (fc === "__none__") return !task.category;
  if (fc !== "") return task.category === fc;
  return true;
}
 
// ★追加：件数のメッセージを出す
function updateInfo(shown) {
  const total = tasks.length;
  if (total === 0) {
    resultInfo.textContent = "まだタスクがありません。";
  } else if (shown === 0) {
    resultInfo.textContent = "条件に合うタスクがありません。（全 " + total + " 件）";
  } else if (shown === total) {
    resultInfo.textContent = "全 " + total + " 件";
  } else {
    resultInfo.textContent = total + " 件中 " + shown + " 件を表示";
  }
}
 
// ▼ 選択欄を作る小さな関数
function makeSelect(list, value, label, blankText) {
  const sel = document.createElement("select");
  sel.setAttribute("aria-label", label);
  if (blankText) {
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = blankText;
    sel.appendChild(blank);
  }
  list.forEach(function (text) {
    const opt = document.createElement("option");
    opt.value = text;
    opt.textContent = text;
    sel.appendChild(opt);
  });
  sel.value = value;
  return sel;
}
 
// ▼ 編集用のカード（<li>）を作る
function buildEditItem(task) {
  const li = document.createElement("li");
  li.className = "editing";
  li.dataset.cat = task.cat || "その他";
 
  const textIn = document.createElement("input");
  textIn.type = "text";
  textIn.className = "edit-text";
  textIn.value = task.text;
  textIn.setAttribute("aria-label", "やること");
 
  const catSel = makeSelect(CATEGORIES, task.category || "", "カテゴリ", task.category ? null : "未設定");
  const subSel = makeSelect(CATS, task.cat || "その他", "科目", null);
  const priSel = makeSelect(["高", "中", "低"], task.priority || "中", "優先度", null);
  const dueIn = document.createElement("input");
  dueIn.type = "date";
  dueIn.value = task.due || "";
  dueIn.setAttribute("aria-label", "期限");
 
  const row = document.createElement("div");
  row.className = "edit-row";
  row.append(catSel, subSel, priSel, dueIn);
 
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  cancelBtn.className = "btn-sub";
 
  const actions = document.createElement("div");
  actions.className = "edit-actions";
  actions.append(saveBtn, cancelBtn);
 
  function commit() {
    const t = textIn.value.trim();
    if (t === "") {
      textIn.focus();
      return;
    }
    task.text = t;
    task.category = catSel.value || undefined;
    task.cat = subSel.value;
    task.priority = priSel.value;
    task.due = dueIn.value;
    save();
    editingId = null;
    render();
  }
 
  function cancel() {
    editingId = null;
    render();
  }
 
  saveBtn.addEventListener("click", commit);
  cancelBtn.addEventListener("click", cancel);
 
  textIn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  });
 
  li.append(textIn, row, actions);
  return li;
}
 
// ▼ 画面を描き直す
function render() {
  list.innerHTML = "";
 
  // ★変更：絞り込みに合うタスクだけを、並び順どおりに取り出す
  const visible = sortedTasks().filter(matchesFilter);
  updateInfo(visible.length); // ★追加
 
  visible.forEach(function (task) {
    // 編集中のタスクは、編集用のカードを出す
    if (task.id === editingId) {
      list.appendChild(buildEditItem(task));
      return;
    }
 
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
      (task.category || "未設定") +
      "・" + (task.cat || "その他") +
      "・優先度：" + (task.priority || "中") +
      (task.due ? "・期限 " + task.due : "");
 
    const info = document.createElement("div");
    info.className = "info";
    info.append(title, meta);
 
    // 編集ボタン
    const edit = document.createElement("button");
    edit.textContent = "編集";
    edit.className = "edit";
    edit.setAttribute("aria-label", "「" + task.text + "」を編集");
    edit.addEventListener("click", function () {
      editingId = task.id;
      render();
    });
 
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
 
    li.append(check, info, edit, del);
    list.appendChild(li);
  });
 
  // 編集中なら、文字の欄に、カーソルを合わせる
  const focusTarget = list.querySelector(".edit-text");
  if (focusTarget) focusTarget.focus();
}
 
// ★追加：検索欄に文字を入れるたび、絞り込みを変えたときに、描き直す
searchInput.addEventListener("input", function () {
  editingId = null; // 編集中のカードは、閉じる（入力欄の取り合いを防ぐ）
  render();
});
filterCategory.addEventListener("change", function () {
  editingId = null;
  render();
});
 
// ★追加：「クリア」で、条件を元に戻す
clearFilter.addEventListener("click", function () {
  searchInput.value = "";
  filterCategory.value = "";
  editingId = null;
  render();
});
 
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
    category: categoryInput.value
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