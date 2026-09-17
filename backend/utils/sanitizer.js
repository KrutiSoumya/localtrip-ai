const { JSDOM } = require("jsdom");

// create virtual window (required for DOMPurify in Node)
const window = new JSDOM("").window;
const DOMPurify = require("dompurify")(window);

// sanitize function
const sanitize = (text) => {
  if (!text) return text;
  return DOMPurify.sanitize(text);
};

module.exports = {
  sanitize,
};