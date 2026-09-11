(function () {
  "use strict";

  const OWNER = "AbnerQi";
  const REPO = "AbnerQi/MyBlog";
  const TOKEN_KEY = "abner-myblog-owner-token";

  function siteRoot() {
    const logo = document.querySelector("a.md-logo");
    return new URL(logo ? logo.getAttribute("href") : "./", window.location.href);
  }

  function assetUrl(path) {
    return new URL(path, siteRoot()).toString();
  }

  function token() {
    return window.sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function utf8ToBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function base64ToUtf8(value) {
    const binary = atob(value.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function github(path, options = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token()}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const error = new Error(detail.message || `GitHub 请求失败（${response.status}）`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }

  async function authenticate(candidate) {
    window.sessionStorage.setItem(TOKEN_KEY, candidate.trim());
    try {
      const user = await github("/user");
      if (user.login !== OWNER) throw new Error(`当前账号不是 ${OWNER}`);
      return user;
    } catch (error) {
      window.sessionStorage.removeItem(TOKEN_KEY);
      throw error;
    }
  }

  function slugify(value) {
    const latin = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return latin || `knowledge-${Date.now()}`;
  }

  function ownerActive() {
    const localPreview = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) && new URLSearchParams(window.location.search).has("preview");
    return Boolean(token()) || localPreview;
  }

  function showToast(message, kind = "success") {
    let toast = document.querySelector(".liubai-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "liubai-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.dataset.kind = kind;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value || "尚未发布";
    const [, month, day] = value.split("-");
    return `${month} · ${day}`;
  }

  async function initKnowledgeBrowser() {
    const root = document.querySelector("#knowledge-browser");
    if (!root) return;
    document.body.classList.add("knowledge-browser-page");
    const grid = root.querySelector("#knowledge-library-grid");
    const count = root.querySelector("#knowledge-count");
    const ownerLink = root.querySelector(".owner-entry-link");
    ownerLink.textContent = ownerActive() ? "已进入站主模式" : "站主入口";

    let libraries = [];
    try {
      libraries = await fetch(assetUrl("assets/data/knowledge-bases.generated.json"), { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("知识库索引读取失败");
        return response.json();
      });
    } catch (error) {
      grid.innerHTML = '<p class="portal-error">知识库暂时无法读取，请稍后刷新。</p>';
      count.textContent = "读取失败";
      return;
    }

    function render() {
      grid.replaceChildren();
      libraries.forEach((library) => {
        const card = document.createElement("a");
        card.className = "knowledge-library-card";
        card.href = new URL(`articles/?knowledge=${encodeURIComponent(library.id)}`, siteRoot()).toString();
        card.innerHTML = `
          <span class="knowledge-library-card__title">${escapeHtml(library.name)}</span>
          <span class="knowledge-library-card__meta">
            <span>${library.articleCount} 篇文章</span>
            <span>更新于 ${escapeHtml(formatDate(library.updatedAt))}</span>
          </span>
          <span class="knowledge-library-card__arrow" aria-hidden="true">→</span>`;
        grid.appendChild(card);
      });
      if (ownerActive()) {
        const add = document.createElement("button");
        add.type = "button";
        add.className = "knowledge-library-add";
        add.innerHTML = '<span class="knowledge-library-add__inner"><span aria-hidden="true">＋</span><strong>新建知识库</strong></span>';
        add.addEventListener("click", openDialog);
        grid.appendChild(add);
      }
      count.textContent = `${libraries.length} 个知识库`;
    }

    const dialog = document.createElement("dialog");
    dialog.className = "knowledge-create-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="knowledge-create-form">
        <header><div><span class="form-eyebrow">站主管理</span><h2>新建知识库</h2></div><button type="button" class="dialog-close" aria-label="关闭">×</button></header>
        <label>知识库名称<input name="name" required maxlength="48" placeholder="例如：计算机网络"></label>
        <p class="form-note">文章数量和更新时间会根据文章自动生成。</p>
        <p class="form-error" role="alert" hidden></p>
        <footer><button type="button" class="dialog-cancel">取消</button><button type="submit" class="dialog-submit">创建并发布</button></footer>
      </form>`;
    document.body.appendChild(dialog);
    const form = dialog.querySelector("form");
    const error = dialog.querySelector(".form-error");

    function openDialog() {
      error.hidden = true;
      form.reset();
      dialog.showModal();
      form.elements.name.focus();
    }
    dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".dialog-cancel").addEventListener("click", () => dialog.close());

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = dialog.querySelector(".dialog-submit");
      const name = form.elements.name.value.trim();
      const id = slugify(name);
      if (!name) return;
      if (libraries.some((library) => library.id === id || library.name === name)) {
        error.textContent = "这个知识库已经存在。";
        error.hidden = false;
        return;
      }
      submit.disabled = true;
      submit.textContent = "正在创建…";
      try {
        const sourcePath = "docs/assets/data/knowledge-bases.json";
        const file = await github(`/repos/${REPO}/contents/${sourcePath}?ref=main`);
        const current = JSON.parse(base64ToUtf8(file.content));
        current.push({ id, name });
        await github(`/repos/${REPO}/contents/${sourcePath}`, {
          method: "PUT",
          body: JSON.stringify({
            message: `新增知识库：${name}`,
            branch: "main",
            sha: file.sha,
            content: utf8ToBase64(`${JSON.stringify(current, null, 2)}\n`),
          }),
        });
        libraries.push({ id, name, articleCount: 0, updatedAt: "尚未发布" });
        render();
        dialog.close();
        showToast("知识库已提交，网站将在约一分钟后更新。" );
      } catch (requestError) {
        error.textContent = requestError.message;
        error.hidden = false;
      } finally {
        submit.disabled = false;
        submit.textContent = "创建并发布";
      }
    });
    render();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function initArticleBrowser() {
    const root = document.querySelector("#article-browser");
    if (!root) return;
    document.body.classList.add("article-browser-page");
    document.querySelectorAll(".md-post, .md-pagination").forEach((element) => { element.hidden = true; });

    const list = root.querySelector("#article-portal-list");
    const empty = root.querySelector("#article-empty");
    const count = root.querySelector("#article-result-count");
    const search = root.querySelector("#article-search-input");
    const knowledgeSelect = root.querySelector("#article-knowledge-filter");
    const tagContainer = root.querySelector("#article-tag-filter");
    const pagination = root.querySelector("#article-pagination");
    const pages = root.querySelector("#article-pages");
    const pageInput = root.querySelector("#article-page-input");
    const pageError = root.querySelector("#article-page-error");
    const ownerLink = root.querySelector(".owner-write-link");
    ownerLink.textContent = ownerActive() ? "写文章" : "站主入口";
    let lastTotalPages = 1;

    const params = new URLSearchParams(window.location.search);
    const pageSize = Number(root.dataset.pageSize) || 8;
    let currentPage = Math.max(1, Number(params.get("page")) || 1);
    let activeTag = params.get("tag") || "all";
    search.value = params.get("q") || "";

    let articles = [];
    let libraries = [];
    try {
      [articles, libraries] = await Promise.all([
        fetch(assetUrl("assets/data/articles.json"), { cache: "no-store" }).then((response) => response.json()),
        fetch(assetUrl("assets/data/knowledge-bases.generated.json"), { cache: "no-store" }).then((response) => response.json()),
      ]);
    } catch (error) {
      list.innerHTML = '<p class="portal-error">文章索引暂时无法读取，请稍后刷新。</p>';
      count.textContent = "读取失败";
      return;
    }

    libraries.forEach((library) => knowledgeSelect.add(new Option(library.name, library.id)));
    if (articles.some((article) => article.knowledgeId === "unfiled")) knowledgeSelect.add(new Option("未归档", "unfiled"));
    knowledgeSelect.value = params.get("knowledge") || "all";
    if (!knowledgeSelect.value) knowledgeSelect.value = "all";

    const tags = Array.from(new Set(articles.flatMap((article) => article.tags))).sort((a, b) => a.localeCompare(b, "zh-CN"));
    [{ value: "all", label: "全部" }, ...tags.map((tag) => ({ value: tag, label: tag }))].forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.tag = tag.value;
      button.textContent = tag.label;
      button.addEventListener("click", () => { activeTag = tag.value; currentPage = 1; render(); });
      tagContainer.appendChild(button);
    });

    function syncUrl() {
      const next = new URLSearchParams();
      if (search.value.trim()) next.set("q", search.value.trim());
      if (knowledgeSelect.value !== "all") next.set("knowledge", knowledgeSelect.value);
      if (activeTag !== "all") next.set("tag", activeTag);
      if (currentPage > 1) next.set("page", String(currentPage));
      const query = next.toString();
      history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }

    function renderPages(totalPages) {
      pages.replaceChildren();
      pagination.hidden = totalPages <= 1;
      pageInput.max = String(Math.max(totalPages, 1));
      pageInput.value = String(currentPage);
      pageError.hidden = true;
      if (totalPages <= 1) return;

      const addButton = (label, destination, ariaLabel, disabled = false) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.disabled = disabled;
        button.className = destination === currentPage && /^\d+$/.test(label) ? "is-active" : "";
        if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
        button.addEventListener("click", () => { currentPage = destination; render(); });
        pages.appendChild(button);
      };
      addButton("‹", currentPage - 1, "上一页", currentPage === 1);
      for (let page = 1; page <= totalPages; page += 1) addButton(String(page), page, `第 ${page} 页`);
      addButton("›", currentPage + 1, "下一页", currentPage === totalPages);
    }

    function render() {
      const query = search.value.trim().toLocaleLowerCase("zh-CN");
      const filtered = articles.filter((article) => {
        const text = `${article.title} ${article.excerpt} ${article.tags.join(" ")}`.toLocaleLowerCase("zh-CN");
        return (!query || text.includes(query)) &&
          (knowledgeSelect.value === "all" || article.knowledgeId === knowledgeSelect.value) &&
          (activeTag === "all" || article.tags.includes(activeTag));
      });
      const totalPages = Math.ceil(filtered.length / pageSize);
      lastTotalPages = Math.max(totalPages, 1);
      currentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
      const first = (currentPage - 1) * pageSize;
      const current = filtered.slice(first, first + pageSize);

      list.replaceChildren();
      current.forEach((article, index) => {
        const row = document.createElement("a");
        row.className = "article-portal-row";
        row.href = article.url;
        row.innerHTML = `
          <span class="article-portal-row__index">${String(first + index + 1).padStart(2, "0")}</span>
          <span class="article-portal-row__body"><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.knowledgeName)} · ${formatDate(article.date)} · ${article.readMinutes} 分钟</small></span>
          <span class="article-portal-row__tags">${article.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</span>
          <span class="article-portal-row__arrow" aria-hidden="true">→</span>`;
        list.appendChild(row);
      });
      empty.hidden = filtered.length !== 0;
      count.textContent = `${filtered.length} 篇`;
      tagContainer.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.tag === activeTag));
      renderPages(totalPages);
      syncUrl();
    }

    let searchTimer;
    search.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => { currentPage = 1; render(); }, 120);
    });
    knowledgeSelect.addEventListener("change", () => { currentPage = 1; render(); });
    root.querySelector("#article-page-go").addEventListener("click", () => {
      const requested = Number(pageInput.value);
      if (!Number.isInteger(requested) || requested < 1 || requested > lastTotalPages) {
        pageInput.setAttribute("aria-invalid", "true");
        pageError.textContent = `请输入 1–${lastTotalPages} 之间的页码`;
        pageError.hidden = false;
        return;
      }
      pageInput.removeAttribute("aria-invalid");
      currentPage = requested;
      render();
    });
    pageInput.addEventListener("input", () => {
      pageInput.removeAttribute("aria-invalid");
      pageError.hidden = true;
    });
    render();
  }

  window.AbnerOwner = {
    OWNER,
    REPO,
    TOKEN_KEY,
    assetUrl,
    authenticate,
    base64ToUtf8,
    github,
    isAuthenticated: ownerActive,
    logout() { window.sessionStorage.removeItem(TOKEN_KEY); },
    token,
    utf8ToBase64,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initKnowledgeBrowser();
    initArticleBrowser();
  });
})();
