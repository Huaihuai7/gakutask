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
 
// ▼ カテゴリの選択肢を、CATEGORIES から作る
CATEGORIES.forEach(function (name) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  categoryInput.appendChild(opt);
});
 
// ▼ 直前に削除したタスクを、覚えておく
let lastDeleted = null;
 
// ★追加：いま編集中のタスクの id（編集していなければ null）
let editingId = null;
 
// ★追加：選択欄を作る小さな関数
//   list      : 選択肢の文字の配列
//   value     : 最初に選んでおく値
//   label     : 画面を読み上げるソフト用の名前
//   blankText : 「何も選んでいない」という選択肢が必要なときの文字（不要なら null）
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
 
// ★追加：編集用のカード（<li>）を作る
function buildEditItem(task) {
  const li = document.createElement("li");
  li.className = "editing";
  li.dataset.cat = task.cat || "その他";
 
  // やることの文字
  const textIn = document.createElement("input");
  textIn.type = "text";
  textIn.className = "edit-text";
  textIn.value = task.text;
  textIn.setAttribute("aria-label", "やること");
 
  // カテゴリ・科目・優先度・期限
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
 
  // 保存とキャンセル
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  cancelBtn.className = "btn-sub";
 
  const actions = document.createElement("div");
  actions.className = "edit-actions";
  actions.append(saveBtn, cancelBtn);
 
  // 保存：入力した内容を、タスクに書き込む
  function commit() {
    const t = textIn.value.trim();
    if (t === "") {          // 空のままでは、保存しない
      textIn.focus();
      return;
    }
    task.text = t;
    task.category = catSel.value || undefined; // 未設定のときは、項目ごと消える
    task.cat = subSel.value;
    task.priority = priSel.value;
    task.due = dueIn.value;
    save();
    editingId = null;
    render();
  }
 
  // キャンセル：何も変えずに、元の表示に戻す
  function cancel() {
    editingId = null;
    render();
  }
 
  saveBtn.addEventListener("click", commit);
  cancelBtn.addEventListener("click", cancel);
 
  // キーボード：Enterで保存、Escで取り消し
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
 
  sortedTasks().forEach(function (task) {
    // ★追加：編集中のタスクは、編集用のカードを出す
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
 
    // ★追加：編集ボタン
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
 
    li.append(check, info, edit, del); // ★変更：editを追加
    list.appendChild(li);
  });
 
  // ★追加：編集中なら、文字の欄に、カーソルを合わせる
  const focusTarget = list.querySelector(".edit-text");
  if (focusTarget) focusTarget.focus();
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