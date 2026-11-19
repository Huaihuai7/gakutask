// ▼ ホーム画面の部品
const sumTotal = document.getElementById("sumTotal");
const sumDone = document.getElementById("sumDone");
const sumRate = document.getElementById("sumRate");
const catBars = document.getElementById("catBars");
 
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
 
updateSummary();
updateBars();