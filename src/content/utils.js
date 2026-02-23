(() => {
  function cleanText(value) {
    if (!value) {
      return "";
    }
    return value.replace(/\s+/g, " ").trim();
  }

  function getText(selector, root = document) {
    const el = root.querySelector(selector);
    return el ? cleanText(el.textContent || "") : "";
  }

  function getAttribute(selector, attribute, root = document) {
    const el = root.querySelector(selector);
    if (!el) {
      return "";
    }
    return cleanText(el.getAttribute(attribute) || "");
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function pickFirst(values) {
    for (const value of values) {
      if (value) {
        return value;
      }
    }
    return "";
  }

  window.AmazonScraperUtils = {
    cleanText,
    getText,
    getAttribute,
    unique,
    pickFirst
  };
})();
