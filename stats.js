// ▼ 統計画面の部品
const ring = document.getElementById("ring");
const ringText = document.getElementById("ringText");
const ringSub = document.getElementById("ringSub");
const statGrid = document.getElementById("statGrid");
const catStats = document.getElementById("catStats");
const priStats = document.getElementById("priStats");
 
// ▼ Date を「2026-11-19」の形の文字に変える（タスクの期限と同じ形）
function ymd(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}
 
const today = ymd(new Date());
const in7 = new Date();
in7.setDate(in7.getDate() + 7);
const limit = ymd(in7); // 7日後の日付
 
// ▼ 「ラベル　■■■□□　完了数/全体」の1行を作る
function barRow(label, done, total, cat) {
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    '<div class="bar-row">' +
    "<em>" + label + "</em>" +
    '<div class="bar-track"><div class="bar-fill"' +
    (cat ? ' data-cat="' + cat + '"' : "") +
    ' style="width:' + rate + '%"></div></div>' +
    "<span>" + done + "/" + total + "</span>" +
    "</div>"
  );
}
 
// ▼ 全体の数字を計算する
const total = tasks.length;
const done = tasks.filter(function (t) { return t.done; }).length;
const rate = total === 0 ? 0 : Math.round((done / total) * 100);
 
const overdue = tasks.filter(function (t) {
  return !t.done && t.due && t.due < today;            // 未完了で、期限が過ぎている
}).length;
 
const soon = tasks.filter(function (t) {
  return !t.done && t.due && t.due >= today && t.due <= limit; // 今日から7日以内が期限
}).length;
 
// ▼ 円グラフ（--p に、進捗率の数字を入れる。CSSが円の長さを決める）
ring.style.setProperty("--p", rate);
ringText.textContent = rate + "%";
ringSub.textContent =
  total === 0 ? "タスクを追加すると、ここに表示されます。" : done + " / " + total + " 件 完了";
 
// ▼ 4つの数字
const cards = [
  ["未完了", total - done],
  ["期限切れ", overdue],
  ["今後7日の期限", soon],
  ["メモの数", memos.length]
];
statGrid.innerHTML = cards
  .map(function (c) {
    return "<div><small>" + c[0] + "</small><b>" + c[1] + "</b></div>";
  })
  .join("");
 
// ▼ 科目別
let catHtml = "";
CATS.forEach(function (cat) {
  const items = tasks.filter(function (t) { return (t.cat || "その他") === cat; });
  if (items.length === 0) return;
  const d = items.filter(function (t) { return t.done; }).length;
  catHtml += barRow(cat, d, items.length, cat);
});
catStats.innerHTML = catHtml || '<p class="empty">まだデータがありません。</p>';
 
// ▼ 優先度別
let priHtml = "";
["高", "中", "低"].forEach(function (p) {
  const items = tasks.filter(function (t) { return (t.priority || "中") === p; });
  if (items.length === 0) return;
  const d = items.filter(function (t) { return t.done; }).length;
  priHtml += barRow("優先度：" + p, d, items.length, "");
});
priStats.innerHTML = priHtml || '<p class="empty">まだデータがありません。</p>';
