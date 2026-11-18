(function () {
  var D = window.DATOS || {};
  document.querySelectorAll("[data-opt]").forEach(function (e) { if (!D[e.getAttribute("data-opt")]) e.remove(); });
  document.querySelectorAll("[data-d]").forEach(function (e) {
    var k = e.getAttribute("data-d");
    if (D[k]) { e.textContent = D[k]; return; }
    // Dato aún sin rellenar en datos.js: se oculta la línea en vez de mostrar un aviso al público
    var li = e.closest("li");
    if (li) li.remove(); else e.textContent = "";
  });
})();
