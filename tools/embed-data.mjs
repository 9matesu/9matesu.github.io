import fs from "node:fs";

const root = "I:/matesu+portfolio";
const items = JSON.parse(fs.readFileSync(root + "/discography.json", "utf8"));
const covers = JSON.parse(fs.readFileSync(root + "/discography-covers.json", "utf8"));
const autoral = JSON.parse(fs.readFileSync(root + "/discografia-autoral.json", "utf8"));

const body = JSON.stringify({ items, covers, autoral });
const text = "/* Gerado por tools/embed-data.mjs. Fonte: discography.json, discography-covers.json, discografia-autoral.json. */\nwindow.MATESU_DISCOGRAPHY = " + body + ";\n";
fs.writeFileSync(root + "/assets/js/data-discography.js", text, "utf8");
console.log("data-discography.js", text.length, "items", items.length, "autoral", autoral.length);