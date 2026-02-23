(() => {
  const { cleanText, getText, getAttribute, unique, pickFirst } = window.AmazonScraperUtils;

  function extractAsin() {
    const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }

    const asinInput = getAttribute("#ASIN", "value");
    if (asinInput) {
      return asinInput.toUpperCase();
    }

    const dataAsin = document.querySelector("[data-asin]");
    if (dataAsin) {
      const asin = cleanText(dataAsin.getAttribute("data-asin") || "");
      if (asin.length === 10) {
        return asin.toUpperCase();
      }
    }

    const canonicalHref = getAttribute("link[rel='canonical']", "href");
    const canonicalMatch = canonicalHref.match(/\/dp\/([A-Z0-9]{10})/i);
    if (canonicalMatch && canonicalMatch[1]) {
      return canonicalMatch[1].toUpperCase();
    }

    return "";
  }

  function extractTitle() {
    return getText("#productTitle");
  }

  function extractPrice() {
    const selectorCandidates = [
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice"
    ];
    for (const selector of selectorCandidates) {
      const value = getText(selector);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function extractOriginalPrice() {
    const selectorCandidates = [
      "span.a-price.a-text-price span.a-offscreen",
      ".basisPrice .a-offscreen",
      "#priceblock_listprice",
      "#priceblock_wasprice"
    ];
    for (const selector of selectorCandidates) {
      const value = getText(selector);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function extractDescription() {
    const description = getText("#productDescription");
    if (description) {
      return description;
    }

    const bulletsRoot = document.querySelector("#feature-bullets");
    if (!bulletsRoot) {
      return "";
    }
    const bulletItems = [...bulletsRoot.querySelectorAll("li span.a-list-item")]
      .map((el) => cleanText(el.textContent || ""))
      .filter(Boolean);
    return bulletItems.join(" ");
  }

  function extractBulletFeatures() {
    const bulletsRoot = document.querySelector("#feature-bullets");
    if (!bulletsRoot) {
      return [];
    }
    return unique(
      [...bulletsRoot.querySelectorAll("li span.a-list-item")]
        .map((el) => cleanText(el.textContent || ""))
        .filter(Boolean)
    );
  }

  function parseImageBlockUrls() {
    const imageUrls = [];
    const scripts = [...document.querySelectorAll("script")];
    const imagePattern = /https:\/\/m\.media-amazon\.com\/images\/I\/[^"'\\\s]+/g;

    for (const script of scripts) {
      const text = script.textContent || "";
      if (!text.includes("ImageBlockATF") && !text.includes("colorImages")) {
        continue;
      }
      const matches = text.match(imagePattern) || [];
      for (const url of matches) {
        imageUrls.push(url.replace(/\\u0026/g, "&"));
      }
    }

    return unique(imageUrls);
  }

  function extractImages() {
    function normalizeAmazonImageUrl(url) {
      return cleanText(url || "").replace(/\._[^.]+_\.(jpg|jpeg|png|webp)$/i, ".$1");
    }

    const thumbnailImages = unique(
      [...document.querySelectorAll("ul[aria-label='Image thumbnails'] li img, #altImages li img")]
        .map((img) => normalizeAmazonImageUrl(img.getAttribute("src") || ""))
        .filter(Boolean)
    );
    return {
      mainImage: thumbnailImages[0] || "",
      allProductImages: thumbnailImages
    };
  }

  function extractRating() {
    const fromPopover = getAttribute("#acrPopover", "title");
    if (fromPopover) {
      return fromPopover;
    }
    return getText(".a-icon-alt");
  }

  function extractTotalReviews() {
    return getText("#acrCustomerReviewText");
  }

  function extractBrand() {
    return getText("#bylineInfo");
  }

  function extractAvailability() {
    return getText("#availability");
  }

  function extractCategoryBreadcrumbs() {
    const root = document.querySelector("#wayfinding-breadcrumbs_container");
    if (!root) {
      return [];
    }
    return unique(
      [...root.querySelectorAll("li, a, span")]
        .map((el) => cleanText(el.textContent || ""))
        .filter((text) => text && text !== "|")
    );
  }

  function scrapeAmazonProductData() {
    const images = extractImages();
    const data = {
      asin: extractAsin(),
      productTitle: extractTitle(),
      price: extractPrice(),
      originalPrice: extractOriginalPrice(),
      description: extractDescription(),
      bulletFeatures: extractBulletFeatures(),
      mainImage: images.mainImage,
      allProductImages: images.allProductImages,
      rating: extractRating(),
      totalReviews: extractTotalReviews(),
      brand: extractBrand(),
      availability: extractAvailability(),
      categoryBreadcrumbs: extractCategoryBreadcrumbs(),
      url: window.location.href,
      scrapedAt: new Date().toISOString()
    };
    return data;
  }

  window.AmazonProductScraper = {
    scrapeAmazonProductData
  };
})();
