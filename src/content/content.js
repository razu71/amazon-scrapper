(() => {
  function isAmazonProductPage() {
    return /\/dp\/[A-Z0-9]{10}/i.test(window.location.pathname);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || request.type !== "SCRAPE_AMAZON_PRODUCT") {
      return;
    }

    try {
      if (!isAmazonProductPage()) {
        sendResponse({
          ok: false,
          error: "This is not a supported Amazon product page (/dp/ASIN)."
        });
        return;
      }

      const data = window.AmazonProductScraper.scrapeAmazonProductData();
      console.log("Amazon Product Data:", data);
      sendResponse({
        ok: true,
        data
      });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error && error.message ? error.message : "Unexpected scraping error."
      });
    }
  });
})();
