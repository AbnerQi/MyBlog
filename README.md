# 留白

一个基于 MkDocs Material 的“东方留白”个人博客与知识库。

## 本地预览

建议使用 Python 3.11 或 3.12：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
mkdocs serve
```

打开终端显示的本地网址即可预览。修改 Markdown 后，页面会自动刷新。

## 写一篇文章

在 `docs/articles/posts` 中新建 Markdown 文件：

```markdown
---
date: 2026-09-08
categories:
  - 技术
tags:
  - 示例标签
---

# 文章标题

摘要会显示在文章列表中。

<!-- more -->

这里是正文。
```

## 发布到 GitHub Pages

1. 使用公开仓库 `AbnerQi/MyBlog`。
2. 将本项目推送到仓库的 `main` 分支。
3. 在仓库的 **Settings → Pages** 中，将 **Source** 选择为 **GitHub Actions**。
4. 等待“发布博客”流程完成，访问 `https://abnerqi.github.io/MyBlog/`。

当前站点已经配置为：

```yaml
site_url: https://abnerqi.github.io/MyBlog/
repo_url: https://github.com/AbnerQi/MyBlog
repo_name: AbnerQi/MyBlog
```

## 内容结构

- `docs/articles/posts`：按时间发布的文章；分类、归档和分页自动生成。
- `docs/knowledge`：按主题组织、持续修订的知识库。
- `docs/tags.md`：聚合文章和知识页的标签。
- `docs/stylesheets/extra.css`：东方留白主题的颜色、字体和布局。
