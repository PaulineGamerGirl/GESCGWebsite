const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const dataJs = fs.readFileSync("data.js", "utf8");
const appJs = fs.readFileSync("app.js", "utf8");

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => {
  console.log("Error:", err.message);
});
virtualConsole.on("warn", (warn) => {
  console.log("Warn:", warn.message);
});
virtualConsole.on("log", (log) => {
  console.log("Log:", log.message);
});

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  virtualConsole
});

// Mock marked and turndown
dom.window.marked = { parse: (text) => text };
dom.window.TurndownService = class { turndown() { return ""; } };

try {
  dom.window.eval(dataJs);
  dom.window.eval(appJs);
  console.log("JS executed successfully. Hash is:", dom.window.location.hash);
  dom.window.eval("window.location.hash = '#experiment';");
  dom.window.eval("window.dispatchEvent(new dom.window.Event('hashchange'));");
  console.log("Hash changed to #experiment");
  
  // Wait a moment for promises or timeouts
  setTimeout(() => {
    console.log("Experiment class list:", dom.window.document.getElementById('experiment').className);
  }, 100);
} catch (e) {
  console.error("Runtime Exception:", e);
}
