const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

menuToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", isOpen);
});

// =========================
// APPLICATION STATE
// =========================

const app = {
  links: [],
};

// =========================
// CONSTANTS
// =========================

const STORAGE_KEY = "shortly-links";

// =========================
// DOM ELEMENTS
// =========================

const shortenerForm = document.querySelector(".shortener-form");
const urlInput = document.querySelector(".url-input");
const errorMessage = document.querySelector(".error-message");
const linksList = document.getElementById("links-list");
const submitButton = shortenerForm.querySelector(".shorten-btn");

// =========================
// LOCAL STORAGE
// =========================

function saveLinks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(app.links));
}

function loadLinks() {
  const savedLinks = localStorage.getItem(STORAGE_KEY);

  if (savedLinks) {
    app.links = JSON.parse(savedLinks);
  }

  renderLinks();
}

// =========================
// API
// =========================

async function shortenURL(url) {
  const response = await fetch(
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
  );

  if (!response.ok) {
    throw new Error("Unable to shorten URL");
  }

  const shortenedURL = await response.text();

  return shortenedURL;
}

// =========================
// VALIDATION
// =========================

function showError(message) {
  shortenerForm.classList.add("error");
  errorMessage.textContent = message;
}

function hideError() {
  shortenerForm.classList.remove("error");
  errorMessage.textContent = "";
}

// =========================
// RENDERING
// =========================

function createLinkHTML(link) {
  return `
    <div class="shortened-link">
      <p class="original-link">${link.original}</p>

      <div class="short-link-wrapper">
        <a
          href="${link.shortened}"
          target="_blank"
          rel="noopener noreferrer"
          class="short-link"
        >
          ${link.shortened}
        </a>

        <button
          type="button"
          class="copy-btn ${link.copied ? "copied" : ""}"
          data-id="${link.id}"
        >
          ${link.copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  `;
}

function renderLinks() {
  linksList.innerHTML = app.links.map(createLinkHTML).join("");
}

// =========================
// URL HELPERS
// =========================

function normalizeURL(url) {
  url = url.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

// =========================
// EVENT HANDLERS
// =========================

async function handleSubmit(event) {
  event.preventDefault();

  let url = urlInput.value.trim();

  if (url === "") {
    showError("Please add a link");
    return;
  }

  url = normalizeURL(url);

  const existingLink = app.links.find((link) => link.original === url);

  if (existingLink) {
    hideError();
    urlInput.value = "";
    return;
  }

  hideError();

  submitButton.disabled = true;
  submitButton.textContent = "Shortening...";

  try {
    const shortenedURL = await shortenURL(url);

    const newLink = {
      id: Date.now(),
      original: url,
      shortened: shortenedURL,
      copied: false,
    };

    app.links.unshift(newLink);

    urlInput.value = "";

    saveLinks();
    renderLinks();
  } catch (error) {
    showError("Something went wrong. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Shorten It!";
  }
}

async function handleCopy(event) {
  const button = event.target.closest(".copy-btn");

  if (!button) return;

  const id = Number(button.dataset.id);
  const selectedLink = app.links.find((link) => link.id === id);

  if (!selectedLink) return;

  try {
    await navigator.clipboard.writeText(selectedLink.shortened);

    app.links.forEach((link) => {
      link.copied = false;
    });

    selectedLink.copied = true;

    saveLinks();
    renderLinks();

    setTimeout(() => {
      selectedLink.copied = false;

      saveLinks();
      renderLinks();
    }, 2000);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

// =========================
// EVENT LISTENERS
// =========================

shortenerForm.addEventListener("submit", handleSubmit);
linksList.addEventListener("click", handleCopy);

// =========================
// INITIALIZATION
// =========================

loadLinks();
