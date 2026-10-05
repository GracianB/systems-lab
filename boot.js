/* Systems Lab boot: set visual state before first paint. */
(function () {
  try {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var seen = false;
    try { seen = sessionStorage.getItem("lab-intro-seen") === "1"; } catch (e) {}
    if (!reduce && !seen) {
      document.documentElement.classList.add("intro-on");
    }
  } catch (e) {}
})();
