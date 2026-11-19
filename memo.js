// ▼ メモ画面の部品
const memoTitle = document.getElementById("memoTitle");
const memoBody = document.getElementById("memoBody");
const memoAddBtn = document.getElementById("memoAddBtn");
const memoSearch = document.getElementById("memoSearch");
const memoList = document.getElementById("memoList");
 
// ▼ メモの一覧を描き直す（検索欄の文字で絞り込む）
function renderMemos() {
  memoList.innerHTML = "";
  const q = memoSearch.value.trim().toLowerCase();
 
  const shown = memos.filter(function (m) {
    return (m.title + " " + m.body).toLowerCase().includes(q);
  });
 
  if (shown.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = memos.length === 0 ? "学んだことを書いてみましょう。" : "見つかりませんでした。";
    memoList.appendChild(p);
    return;
  }
 
  shown.forEach(function (m) {
    const card = document.createElement("div");
    card.className = "memo";
 
    const head = document.createElement("div");
    head.className = "memo-head";
 
    const title = document.createElement("b");
    title.textContent = m.title;
 
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "×";
    del.setAttribute("aria-label", "メモを削除");
    del.addEventListener("click", function () {
      memos = memos.filter(function (x) {
        return x.id !== m.id;
      });
      saveMemos();
      renderMemos();
    });
 
    head.append(title, del);
 
    const body = document.createElement("p");
    body.textContent = m.body;
 
    const date = document.createElement("small");
    date.textContent = m.date;
 
    card.append(head, body, date);
    memoList.appendChild(card);
  });
}
 
// ▼ 「メモを保存」が押されたとき
memoAddBtn.addEventListener("click", function () {
  const title = memoTitle.value.trim();
  const body = memoBody.value.trim();
  if (title === "" && body === "") return;
 
  memos.unshift({
    id: Date.now(),
    title: title || "無題",
    body: body,
    date: new Date().toLocaleDateString("ja-JP")
  });
  saveMemos();
  renderMemos();
 
  memoTitle.value = "";
  memoBody.value = "";
});
 
// ▼ 検索欄に文字を入れるたびに、絞り込む
memoSearch.addEventListener("input", renderMemos);
 
renderMemos();