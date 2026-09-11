---
title: 文章
hide:
  - toc
---

<section class="article-browser" id="article-browser" data-page-size="8" aria-labelledby="article-browser-title">
  <header class="portal-heading">
    <h1 id="article-browser-title">文章</h1>
    <div class="portal-heading__actions">
      <span class="portal-count" id="article-result-count">正在读取…</span>
      <a class="owner-write-link" href="../editor/">写文章</a>
    </div>
  </header>

  <div class="article-controls">
    <label class="article-search">
      <span class="visually-hidden">搜索文章</span>
      <span class="article-search__icon" aria-hidden="true"></span>
      <input id="article-search-input" type="search" placeholder="搜索标题、摘要或标签…" autocomplete="off">
    </label>
    <label class="article-select-wrap">
      <span class="visually-hidden">按知识库筛选</span>
      <select id="article-knowledge-filter" aria-label="按知识库筛选">
        <option value="all">全部知识库</option>
      </select>
    </label>
  </div>

  <div class="article-tag-filter" id="article-tag-filter" aria-label="按标签筛选"></div>
  <div class="article-portal-list" id="article-portal-list" aria-live="polite"></div>
  <p class="article-empty" id="article-empty" hidden>没有符合条件的文章。</p>

  <nav class="article-pagination" id="article-pagination" aria-label="文章分页" hidden>
    <div class="article-pages" id="article-pages"></div>
    <div class="article-page-jump">
      <label>跳至 <input id="article-page-input" type="number" min="1" value="1" aria-label="页码"> 页</label>
      <button id="article-page-go" type="button">前往</button>
      <span class="article-page-error" id="article-page-error" role="alert" hidden></span>
    </div>
  </nav>
</section>
