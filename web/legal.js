(function () {
  var D = window.DATOS || {};
  var L = { titular: "nombre o razón social", nif: "NIF/CIF", domicilio: "domicilio", email: "email", telefono: "teléfono", dominio: "dominio" };
  document.querySelectorAll("[data-opt]").forEach(function (e) { if (!D[e.getAttribute("data-opt")]) e.remove(); });
  document.querySelectorAll("[data-d]").forEach(function (e) {
    var k = e.getAttribute("data-d");
    if (D[k]) { e.textContent = D[k]; }
    else { e.textContent = "[completar " + (L[k] || k) + " en datos.js]"; e.className = "pend"; }
  });
})();
