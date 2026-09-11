(function () {
  "use strict";

  const DRAFT_KEY = "abner-myblog-editor-draft-v1";

  function initEditor() {
    const root = document.querySelector("#owner-studio");
    if (!root || !window.AbnerOwner) return;
    document.body.classList.add("owner-studio-page");

    const api = window.AbnerOwner;
    const login = root.querySelector("#owner-login");
    const loginForm = root.querySelector("#owner-login-form");
    const tokenInput = root.querySelector("#owner-token-input");
    const loginError = root.querySelector("#owner-login-error");
    const studio = root.querySelector("#markdown-studio");
    const title = root.querySelector("#article-title");
    const slug = root.querySelector("#article-slug");
    const knowledge = root.querySelector("#article-knowledge");
    const tags = root.querySelector("#article-tags");
    const source = root.querySelector("#markdown-source");
    const preview = root.querySelector("#markdown-preview");
    const lineNumbers = root.querySelector("#studio-line-numbers");
    const shell = root.querySelector("#studio-shell");
    const wordCount = root.querySelector("#studio-word-count");
    const autosaveState = root.querySelector("#studio-autosave-state");
    const scrollSync = root.querySelector("#studio-scroll-sync");
    const publishTitle = root.querySelector("#studio-publish-title");
    const publishMessage = root.querySelector("#studio-publish-message");
    const publishButton = root.querySelector("#studio-publish");
    const localPreview = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) && new URLSearchParams(window.location.search).has("preview");
    let titleChangedSlug = false;
    let libraries = [];
    let saveTimer;
    let syncLock = false;

    function makeSlug(value) {
      return value.trim().toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    function yamlText(value) {
      return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }

    function parsedTags() {
      return Array.from(new Set(tags.value.split(/[,，、\n]+/).map((item) => item.trim()).filter(Boolean)));
    }

    function buildMarkdown() {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());
      const tagLines = parsedTags().map((tag) => `  - ${yamlText(tag)}`).join("\n") || "  - 随笔";
      return `---\ndate: ${today}\nslug: ${slug.value.trim()}\ncategories:\n  - ${yamlText(knowledge.options[knowledge.selectedIndex]?.text || "未归档")}\ntags:\n${tagLines}\n---\n\n# ${title.value.trim()}\n\n${source.value.trim()}\n`;
    }

    function updatePreview() {
      const heading = title.value.trim() ? `# ${title.value.trim()}\n\n` : "";
      const markdown = `${heading}${source.value}`;
      if (window.marked && window.DOMPurify) {
        window.marked.setOptions({ gfm: true, breaks: true });
        preview.innerHTML = window.DOMPurify.sanitize(window.marked.parse(markdown));
      } else {
        preview.textContent = markdown || "预览将在这里出现。";
      }
      const lines = source.value.split("\n").length;
      lineNumbers.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
      wordCount.textContent = `${source.value.replace(/\s/g, "").length} 字 · ${lines} 行`;
      window.clearTimeout(saveTimer);
      autosaveState.textContent = "正在保存草稿…";
      saveTimer = window.setTimeout(saveDraft, 350);
    }

    function saveDraft() {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title: title.value,
        slug: slug.value,
        knowledge: knowledge.value,
        tags: tags.value,
        source: source.value,
      }));
      autosaveState.textContent = `草稿已保存 · ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    }

    function restoreDraft() {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (!draft) return;
        title.value = draft.title || "";
        slug.value = draft.slug || "";
        tags.value = draft.tags || "";
        source.value = draft.source || "";
        knowledge.value = draft.knowledge || "";
        titleChangedSlug = Boolean(draft.slug);
      } catch (_) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    function insert(before, after = "", sample = "文字") {
      const start = source.selectionStart;
      const end = source.selectionEnd;
      const selected = source.value.slice(start, end) || sample;
      source.setRangeText(`${before}${selected}${after}`, start, end, "end");
      source.focus();
      updatePreview();
    }

    const actions = {
      h1: () => insert("# ", "", "一级标题"),
      h2: () => insert("## ", "", "二级标题"),
      hr: () => insert("\n\n---\n\n", "", ""),
      bold: () => insert("**", "**", "粗体文字"),
      italic: () => insert("*", "*", "斜体文字"),
      strike: () => insert("~~", "~~", "删除内容"),
      math: () => insert("$", "$", "E = mc^2"),
      link: () => insert("[", "](https://)", "链接文字"),
      image: () => insert("![", "](https://)", "图片说明"),
      code: () => insert("\n```text\n", "\n```\n", "代码"),
      table: () => insert("\n| 列一 | 列二 |\n| --- | --- |\n| ", " | 内容 |\n", "内容"),
      quote: () => insert("> ", "", "引用内容"),
      ul: () => insert("- ", "", "列表项"),
      ol: () => insert("1. ", "", "列表项"),
      task: () => insert("- [ ] ", "", "待办事项"),
    };

    function setView(view) {
      shell.dataset.view = view;
      root.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
    }

    async function loadLibraries() {
      libraries = await fetch(api.assetUrl("assets/data/knowledge-bases.generated.json"), { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("知识库读取失败");
        return response.json();
      });
      libraries.forEach((library) => knowledge.add(new Option(library.name, library.id)));
    }

    async function enterStudio() {
      login.hidden = true;
      studio.hidden = false;
      await loadLibraries();
      restoreDraft();
      updatePreview();
      title.focus();
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = loginForm.querySelector("button[type='submit']");
      loginError.hidden = true;
      button.disabled = true;
      button.textContent = "正在验证…";
      try {
        await api.authenticate(tokenInput.value);
        tokenInput.value = "";
        await enterStudio();
      } catch (error) {
        loginError.textContent = error.message === "Bad credentials" ? "令牌无效，请检查后重试。" : error.message;
        loginError.hidden = false;
      } finally {
        button.disabled = false;
        button.textContent = "验证并进入";
      }
    });

    title.addEventListener("input", () => {
      if (!titleChangedSlug) slug.value = makeSlug(title.value);
      updatePreview();
    });
    slug.addEventListener("input", () => { titleChangedSlug = true; updatePreview(); });
    [knowledge, tags].forEach((field) => field.addEventListener("input", updatePreview));
    source.addEventListener("input", updatePreview);
    source.addEventListener("scroll", () => { lineNumbers.scrollTop = source.scrollTop; });

    root.querySelector("#studio-toolbar").addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.view) return setView(button.dataset.view);
      const action = button.dataset.action;
      if (actions[action]) return actions[action]();
      if (action === "fullscreen") shell.classList.toggle("is-fullscreen");
      if (action === "help") root.querySelector("#studio-help").hidden = false;
    });
    root.querySelector("#studio-help-close").addEventListener("click", () => { root.querySelector("#studio-help").hidden = true; });

    function mirrorScroll(from, to) {
      if (!scrollSync.checked || syncLock) return;
      const available = Math.max(1, from.scrollHeight - from.clientHeight);
      syncLock = true;
      to.scrollTop = (from.scrollTop / available) * Math.max(0, to.scrollHeight - to.clientHeight);
      requestAnimationFrame(() => { syncLock = false; });
    }
    source.addEventListener("scroll", () => mirrorScroll(source, preview));
    preview.addEventListener("scroll", () => mirrorScroll(preview, source));

    root.querySelector("#studio-logout").addEventListener("click", () => {
      api.logout();
      studio.hidden = true;
      login.hidden = false;
      loginError.hidden = true;
      tokenInput.focus();
    });

    root.querySelector("#studio-export").addEventListener("click", () => {
      if (!title.value.trim() || !slug.value.trim()) {
        publishTitle.textContent = "还差一点";
        publishMessage.textContent = "请先填写标题，系统会自动生成文章路径。";
        return;
      }
      const blob = new Blob([buildMarkdown()], { type: "text/markdown;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${slug.value.trim()}.md`;
      link.click();
      URL.revokeObjectURL(link.href);
    });

    publishButton.addEventListener("click", async () => {
      const articleTitle = title.value.trim();
      const articleSlug = makeSlug(slug.value);
      if (!articleTitle || !articleSlug || !knowledge.value || !source.value.trim()) {
        publishTitle.textContent = "信息不完整";
        publishMessage.textContent = "标题、路径、知识库和正文都需要填写。";
        return;
      }
      const selectedLibrary = libraries.find((library) => library.id === knowledge.value);
      if (!selectedLibrary) return;
      slug.value = articleSlug;
      const path = `docs/articles/posts/${articleSlug}.md`;
      publishButton.disabled = true;
      publishButton.textContent = "正在发布…";
      publishTitle.textContent = "正在提交到 GitHub";
      publishMessage.textContent = "请保持当前页面打开。";
      try {
        try {
          await api.github(`/repos/${api.REPO}/contents/${path}?ref=main`);
          throw new Error("这个路径已经存在，请修改文章路径后再发布。");
        } catch (checkError) {
          if (checkError.status !== 404) throw checkError;
        }
        await api.github(`/repos/${api.REPO}/contents/${path}`, {
          method: "PUT",
          body: JSON.stringify({
            message: `发布文章：${articleTitle}`,
            branch: "main",
            content: api.utf8ToBase64(buildMarkdown()),
          }),
        });
        localStorage.removeItem(DRAFT_KEY);
        publishTitle.textContent = "文章已经提交";
        publishMessage.textContent = "GitHub 正在构建网站，通常约一分钟后即可访问。";
        publishButton.textContent = "已发布";
      } catch (error) {
        publishTitle.textContent = "发布没有完成";
        publishMessage.textContent = error.message;
        publishButton.disabled = false;
        publishButton.textContent = "重新发布";
      }
    });

    if (localPreview) {
      root.querySelector("#studio-owner-state").textContent = "本地预览模式";
      enterStudio();
    } else if (api.isAuthenticated()) {
      api.github("/user")
        .then((user) => {
          if (user.login !== api.OWNER) throw new Error("账号不匹配");
          return enterStudio();
        })
        .catch(() => api.logout());
    }
  }

  document.addEventListener("DOMContentLoaded", initEditor);
})();
