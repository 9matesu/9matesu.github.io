import fs from "node:fs";
import path from "node:path";

const root = "I:/matesu+portfolio";
const file = path.join(root, "index.html");
const lines = fs.readFileSync(file, "utf8").split("\n");

function slice(a, b) {
  return lines.slice(a - 1, b).join("\n") + "\n";
}

function write(rel, text) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, "utf8");
  console.log(rel, text.length);
}

const css = {
  "assets/css/core.css": slice(10, 833),
  "assets/css/map.css": slice(834, 1152),
  "assets/css/detail.css": slice(1153, 1870),
  "assets/css/xp-desktop.css": slice(1871, 2549),
  "assets/css/wmp.css": slice(2550, 3718),
  "assets/css/xp-windows.css": slice(3719, 4298),
  "assets/css/xp-taskbar.css": slice(4299, 4598),
  "assets/css/xp-start.css": slice(4599, 5069),
  "assets/css/misc.css": slice(5070, 5270)
};
for (const [rel, text] of Object.entries(css)) write(rel, text);

write("assets/css/xp.css", [
  "/* Windows XP shell: carregado apenas quando data-shell=xp. */",
  css["assets/css/xp-desktop.css"],
  css["assets/css/xp-windows.css"],
  css["assets/css/xp-taskbar.css"],
  css["assets/css/xp-start.css"]
].join("\n"));

const js = {
  "assets/js/content.js": slice(5760, 6637),
  "assets/js/settings.js": slice(6638, 7176),
  "assets/js/nav.js": slice(7177, 8147),
  "assets/js/map.js": slice(8148, 9428),
  "assets/js/desktop.js": slice(9429, 11176),
  "assets/js/wmp.js": slice(11177, 12310),
  "assets/js/shell.js": slice(12311, 13069)
};
for (const [rel, text] of Object.entries(js)) write(rel, text);

const head = lines.slice(0, 8).join("\n");
const body = lines.slice(5272, 5758).join("\n");
const tail = lines.slice(13070).join("\n");

const links = [
  '<link rel="stylesheet" href="assets/css/core.css">',
  '<link rel="stylesheet" href="assets/css/detail.css">',
  '<link rel="stylesheet" href="assets/css/map.css">',
  '<link rel="stylesheet" href="assets/css/wmp.css">',
  '<link rel="stylesheet" href="assets/css/misc.css">',
  '<link rel="stylesheet" href="assets/css/swiss.css">',
  '<link id="xp-css" rel="stylesheet" href="assets/css/xp.css" media="not all">'
].join("\n");

const scripts = [
  '<script src="assets/js/data-discography.js" defer></script>',
  '<script src="assets/js/content.js" defer></script>',
  '<script src="assets/js/settings.js" defer></script>',
  '<script src="assets/js/nav.js" defer></script>',
  '<script src="assets/js/map.js" defer></script>',
  '<script src="assets/js/desktop.js" defer></script>',
  '<script src="assets/js/wmp.js" defer></script>',
  '<script src="assets/js/shell.js" defer></script>'
].join("\n");

const out = [head, links, "</head>", body, scripts, tail].join("\n");
fs.writeFileSync(file, out, "utf8");
console.log("index.html", out.length);