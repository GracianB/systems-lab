/* Apply preferences before paint; storage is optional. */
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  for (const [key, allowed] of [["theme", ["dark", "light"]], ["lang", ["es", "en"]]]) {
    let value = params.get(key);
    if (!allowed.includes(value)) { try { value = localStorage.getItem("lab-" + key); } catch {} }
    if (allowed.includes(value)) root.setAttribute("data-" + key, value);
  }
})();
