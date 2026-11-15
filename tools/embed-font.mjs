import fs from "node:fs";
import path from "node:path";

const dir = "I:/matesu+portfolio/assets/fonts";
const weights = [300, 400, 500, 600, 700];
let css = "/* Switzer local, embutido para abrir por file:// sem CORS. */\n";
for (const w of weights) {
  const file = path.join(dir, `switzer-${w}.woff2`);
  const b64 = fs.readFileSync(file).toString("base64");
  css += `@font-face {\n  font-family: "Switzer";\n  font-style: normal;\n  font-weight: ${w};\n  font-display: swap;\n  src: url("data:font/woff2;base64,${b64}") format("woff2");\n}\n`;
}
fs.writeFileSync(path.join(dir, "switzer.css"), css, "utf8");
console.log("switzer.css", css.length);