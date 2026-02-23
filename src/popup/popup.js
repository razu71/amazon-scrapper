(() => {
  const statusEl = document.getElementById("status");
  const resultEl = document.getElementById("result");
  const scrapeButton = document.getElementById("scrapeButton");

  let scrapedData = null;

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = isError
      ? "text-sm text-red-600 mb-3"
      : "text-sm text-gray-600 mb-3";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatLabel(key) {
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (match) => match.toUpperCase());
  }

  function valueToText(value) {
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "";
    }
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  function buildResultHtml(data) {
    const entries = Object.entries(data || {}).filter(([key]) => key !== "bulletFeatures");
    if (!entries.length) {
      return '<div class="text-gray-500">No data scraped yet.</div>';
    }

    return entries
      .map(([key, rawValue]) => {
        if (key === "allProductImages" && Array.isArray(rawValue)) {
          const safeLabel = escapeHtml(formatLabel(key));
          const itemsHtml = rawValue.length
            ? rawValue
                .map((item) => {
                  const itemText = valueToText(item);
                  const safeItemText = escapeHtml(itemText || "-");
                  const copyItemValue = escapeHtml(itemText);
                  return `
          <div class="mt-1 border border-gray-200 rounded p-2 bg-white">
            <div class="flex items-start justify-between gap-2">
              <div class="text-gray-800 break-words">${safeItemText}</div>
              <button data-copy-value="${copyItemValue}" class="shrink-0 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Copy</button>
            </div>
          </div>
        `;
                })
                .join("")
            : '<div class="mt-1 text-gray-800">-</div>';
          return `
        <div class="border border-gray-200 rounded p-2 mb-2 bg-gray-50">
          <div class="font-semibold text-gray-700">${safeLabel}</div>
          ${itemsHtml}
        </div>
      `;
        }

        const textValue = valueToText(rawValue);
        const safeValue = escapeHtml(textValue || "-");
        const safeLabel = escapeHtml(formatLabel(key));
        const copyValue = escapeHtml(textValue);
        return `
        <div class="border border-gray-200 rounded p-2 mb-2 bg-gray-50">
          <div class="flex items-start justify-between gap-2">
            <div class="font-semibold text-gray-700">${safeLabel}</div>
            <button data-copy-value="${copyValue}" class="shrink-0 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Copy</button>
          </div>
          <div class="mt-1 text-gray-800 break-words">${safeValue}</div>
        </div>
      `;
      })
      .join("");
  }

  function setResult(data) {
    resultEl.innerHTML = buildResultHtml(data);
  }

  function getActiveTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!tabs || !tabs.length) {
          reject(new Error("No active tab found."));
          return;
        }
        resolve(tabs[0]);
      });
    });
  }

  function sendScrapeMessage(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { type: "SCRAPE_AMAZON_PRODUCT" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        },
      );
    });
  }

  async function handleScrape() {
    setStatus("Scraping product data...");
    scrapeButton.disabled = true;

    try {
      const tab = await getActiveTab();
      if (!tab.url || !tab.url.startsWith("https://www.amazon.com/")) {
        throw new Error("Active tab is not an amazon.com page.");
      }

      const response = await sendScrapeMessage(tab.id);
      if (!response || !response.ok) {
        throw new Error(
          (response && response.error) || "Failed to scrape page.",
        );
      }

      scrapedData = response.data;
      setResult(scrapedData);
      setStatus("Data extracted successfully.");
    } catch (error) {
      scrapedData = null;
      setResult(null);
      setStatus(error.message || "Unexpected popup error.", true);
    } finally {
      scrapeButton.disabled = false;
    }
  }

  scrapeButton.addEventListener("click", handleScrape);
  resultEl.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-value]");
    if (!button) {
      return;
    }

    const value = button.getAttribute("data-copy-value") || "";
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Value copied to clipboard.");
    } catch (error) {
      setStatus("Failed to copy value.", true);
    }
  });
})();
