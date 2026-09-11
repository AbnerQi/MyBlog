"""Build the public article and knowledge-base indexes from Markdown metadata."""

from __future__ import annotations

import json
import re
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse

import yaml


FRONT_MATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
TITLE = re.compile(r"^#\s+(.+)$", re.MULTILINE)


def _text_date(value: object) -> str:
    if isinstance(value, dict):
        value = value.get("created")
    if isinstance(value, (date, datetime)):
        return value.strftime("%Y-%m-%d")
    return str(value or "")[:10]


def _excerpt(markdown: str) -> str:
    source = markdown.split("<!-- more -->", 1)[0]
    source = TITLE.sub("", source, count=1)
    source = re.sub(r"```.*?```", "", source, flags=re.DOTALL)
    source = re.sub(r"[`*_>#\[\]()-]", " ", source)
    source = re.sub(r"\s+", " ", source).strip()
    return source[:120]


def on_post_build(config, **kwargs):
    docs_dir = Path(config.docs_dir)
    site_dir = Path(config.site_dir)
    knowledge_source = docs_dir / "assets" / "data" / "knowledge-bases.json"
    knowledge_bases = json.loads(knowledge_source.read_text(encoding="utf-8"))
    knowledge_by_name = {item["name"]: item for item in knowledge_bases}
    knowledge_by_id = {item["id"]: item for item in knowledge_bases}
    articles = []

    base_path = urlparse(config.site_url or "/").path.rstrip("/")
    posts_dir = docs_dir / "articles" / "posts"
    for path in sorted(posts_dir.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        match = FRONT_MATTER.match(raw)
        metadata = yaml.safe_load(match.group(1)) if match else {}
        body = raw[match.end():] if match else raw
        post_date = _text_date(metadata.get("date"))
        slug = str(metadata.get("slug") or path.stem)
        categories = metadata.get("categories") or []
        if isinstance(categories, str):
            categories = [categories]
        knowledge = next((knowledge_by_name[name] for name in categories if name in knowledge_by_name), None)
        tags = metadata.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]
        title_match = TITLE.search(body)
        title = title_match.group(1).strip() if title_match else slug
        article_url = f"{base_path}/articles/{post_date.replace('-', '/')}/{slug}/"
        articles.append(
            {
                "title": title,
                "slug": slug,
                "date": post_date,
                "excerpt": _excerpt(body),
                "tags": tags,
                "knowledgeId": knowledge["id"] if knowledge else "unfiled",
                "knowledgeName": knowledge["name"] if knowledge else "未归档",
                "url": article_url,
                "readMinutes": max(1, round(len(body) / 500)),
            }
        )

    articles.sort(key=lambda item: item["date"], reverse=True)
    for item in knowledge_bases:
        related = [article for article in articles if article["knowledgeId"] == item["id"]]
        item["articleCount"] = len(related)
        item["updatedAt"] = related[0]["date"] if related else "尚未发布"

    output = site_dir / "assets" / "data"
    output.mkdir(parents=True, exist_ok=True)
    (output / "articles.json").write_text(
        json.dumps(articles, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (output / "knowledge-bases.generated.json").write_text(
        json.dumps(knowledge_bases, ensure_ascii=False, indent=2), encoding="utf-8"
    )
