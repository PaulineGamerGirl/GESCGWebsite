const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

const dataScript = fs.readFileSync('data.js', 'utf8');
window.eval(dataScript);

const appScript = fs.readFileSync('app.js', 'utf8');
try {
  window.eval(appScript);
  console.log("calendar-render:", document.getElementById('calendar-render').innerHTML.substring(0, 50));
  console.log("detailed-timelines:", document.getElementById('detailed-timelines-render').innerHTML.substring(0, 50));
} catch (e) {
  console.error("ERROR:", e);
}
