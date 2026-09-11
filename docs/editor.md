---
title: 写文章
hide:
  - navigation
  - toc
  - footer
---

<section class="owner-studio" id="owner-studio">
  <section class="owner-login" id="owner-login" aria-labelledby="owner-login-title">
    <span class="studio-eyebrow">OWNER STUDIO</span>
    <h1 id="owner-login-title">进入写作室</h1>
    <p>这里不会保存密码。验证信息只停留在当前浏览器标签页，关闭后自动清除。</p>
    <form id="owner-login-form">
      <label>
        <span>GitHub 细粒度令牌</span>
        <input id="owner-token-input" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" required>
      </label>
      <button type="submit">验证并进入</button>
      <p class="studio-form-error" id="owner-login-error" role="alert" hidden></p>
    </form>
    <details>
      <summary>第一次使用，令牌需要什么权限？</summary>
      <p>只授权 <strong>AbnerQi/MyBlog</strong>，Repository permissions 中将 <strong>Contents</strong> 设为 Read and write。无需其他权限。</p>
    </details>
  </section>

  <section class="markdown-studio" id="markdown-studio" hidden aria-labelledby="studio-title">
    <header class="studio-header">
      <div>
        <span class="studio-eyebrow">ABNER’S WRITING ROOM</span>
        <h1 id="studio-title">写文章</h1>
      </div>
      <div class="studio-header__actions">
        <span class="studio-owner-state" id="studio-owner-state">站主已验证</span>
        <button class="studio-quiet-button" id="studio-logout" type="button">退出</button>
      </div>
    </header>

    <div class="studio-meta">
      <label class="studio-meta__title">
        <span>文章标题</span>
        <input id="article-title" type="text" maxlength="100" placeholder="给这篇文章一个名字">
      </label>
      <label>
        <span>路径</span>
        <input id="article-slug" type="text" maxlength="80" placeholder="自动生成，可修改" spellcheck="false">
      </label>
      <label>
        <span>知识库</span>
        <select id="article-knowledge"><option value="">请选择知识库</option></select>
      </label>
      <label>
        <span>标签</span>
        <input id="article-tags" type="text" placeholder="算法, 图论, 最短路">
      </label>
    </div>

    <div class="studio-shell" id="studio-shell">
      <div class="studio-toolbar" id="studio-toolbar" role="toolbar" aria-label="Markdown 工具栏">
        <div class="studio-toolbar__group">
          <button type="button" data-action="h1" title="一级标题">H<sup>1</sup></button>
          <button type="button" data-action="h2" title="二级标题">H<sup>2</sup></button>
          <button type="button" data-action="hr" title="分隔线">—</button>
        </div>
        <div class="studio-toolbar__group">
          <button type="button" data-action="bold" title="粗体"><strong>B</strong></button>
          <button type="button" data-action="italic" title="斜体"><em>I</em></button>
          <button type="button" data-action="strike" title="删除线"><s>S</s></button>
          <button type="button" data-action="math" title="行内公式">√x</button>
        </div>
        <div class="studio-toolbar__group">
          <button type="button" data-action="link" title="链接">↗</button>
          <button type="button" data-action="image" title="图片">▧</button>
          <button type="button" data-action="code" title="代码">&lt;/&gt;</button>
          <button type="button" data-action="table" title="表格">▦</button>
        </div>
        <div class="studio-toolbar__group">
          <button type="button" data-action="quote" title="引用">❝</button>
          <button type="button" data-action="ul" title="无序列表">•☰</button>
          <button type="button" data-action="ol" title="有序列表">1☰</button>
          <button type="button" data-action="task" title="任务列表">☑</button>
        </div>
        <div class="studio-toolbar__group studio-toolbar__views">
          <button type="button" data-view="edit" title="仅编辑">编</button>
          <button class="is-active" type="button" data-view="split" title="分栏">双</button>
          <button type="button" data-view="preview" title="仅预览">阅</button>
          <button type="button" data-action="fullscreen" title="沉浸写作">□</button>
          <button type="button" data-action="help" title="Markdown 帮助">?</button>
        </div>
      </div>

      <div class="studio-workspace">
        <div class="studio-editor-pane">
          <pre class="studio-line-numbers" id="studio-line-numbers" aria-hidden="true">1</pre>
          <textarea id="markdown-source" aria-label="Markdown 正文" spellcheck="false" placeholder="从这里开始写作……"></textarea>
        </div>
        <article class="studio-preview md-typeset" id="markdown-preview" aria-label="实时预览"></article>
      </div>

      <footer class="studio-statusbar">
        <span id="studio-word-count">0 字 · 1 行</span>
        <span class="studio-autosave-state" id="studio-autosave-state">草稿仅保存在本机</span>
        <label><input id="studio-scroll-sync" type="checkbox" checked> 同步滚动</label>
      </footer>
    </div>

    <aside class="studio-help" id="studio-help" hidden>
      <div><span class="studio-eyebrow">QUICK GUIDE</span><h2>Markdown 快速参考</h2></div>
      <button type="button" id="studio-help-close" aria-label="关闭帮助">×</button>
      <dl>
        <dt># 标题</dt><dd>一至六个井号表示不同层级</dd>
        <dt>**粗体**</dt><dd>强调重要内容</dd>
        <dt>[文字](网址)</dt><dd>插入链接</dd>
        <dt>![说明](图片网址)</dt><dd>插入网络图片</dd>
        <dt>```语言</dt><dd>插入代码块，并以三个反引号结束</dd>
      </dl>
    </aside>

    <div class="studio-publish-bar">
      <div>
        <strong id="studio-publish-title">准备发布</strong>
        <span id="studio-publish-message">确认标题、知识库与正文后提交。</span>
      </div>
      <div>
        <button class="studio-secondary-button" id="studio-export" type="button">导出 .md</button>
        <button class="studio-publish-button" id="studio-publish" type="button">发布文章</button>
      </div>
    </div>
  </section>
</section>
