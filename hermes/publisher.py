"""
Publisher module: POST/PATCH drafts to the blog API.
Also handles listing drafts for the Telegram bot.
"""

import logging

import httpx

import config
from writer import DraftPost

logger = logging.getLogger(__name__)

_HEADERS = lambda: {  # noqa: E731  (re-built each call so key rotations work)
    "Authorization": f"Bearer {config.BLOG_API_KEY}",
    "Content-Type": "application/json",
}


def publish_draft(post: DraftPost) -> tuple[str, str]:
    """
    POST a new draft to the blog API.
    Returns (post_id, preview_url).
    """
    payload = {
        "slug": post.slug,
        "title": post.title,
        "description": post.description,
        "dek": post.dek,
        "category": post.category,
        "tags": post.tags,
        "date": post.date,
        "reading_time": post.reading_time,
        "toc": post.toc,
        "content": post.content,
        "authored_by": "hermes",
    }
    resp = httpx.post(
        f"{config.BLOG_API_BASE}/api/blog/posts",
        headers=_HEADERS(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    post_id: str = data["post"]["id"]
    # Build preview URL with the public base (accessible from browser)
    preview_token: str = data["post"].get("preview_token", "")
    preview_url: str = (
        data.get("preview_url")
        or f"{config.BLOG_PUBLIC_BASE}/preview/{post_id}?token={preview_token}"
    )

    logger.info(f"Draft created: id={post_id}")
    return post_id, preview_url


def approve_draft(post_id: str) -> dict:
    """Publish a draft (make it live)."""
    resp = httpx.patch(
        f"{config.BLOG_API_BASE}/api/blog/posts/{post_id}",
        headers=_HEADERS(),
        json={"action": "publish"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def discard_draft(post_id: str) -> dict:
    """Discard a draft."""
    resp = httpx.patch(
        f"{config.BLOG_API_BASE}/api/blog/posts/{post_id}",
        headers=_HEADERS(),
        json={"action": "discard"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def list_drafts() -> list[dict]:
    """Fetch all pending drafts from the blog API."""
    resp = httpx.get(
        f"{config.BLOG_API_BASE}/api/blog/posts",
        params={"status": "draft"},
        headers={"Authorization": f"Bearer {config.BLOG_API_KEY}"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("posts", [])


def get_draft(post_id: str) -> dict:
    """Fetch a single post (any status) by id."""
    resp = httpx.get(
        f"{config.BLOG_API_BASE}/api/blog/posts/{post_id}",
        headers={"Authorization": f"Bearer {config.BLOG_API_KEY}"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["post"]


def update_draft(post_id: str, post: DraftPost) -> tuple[str, str]:
    """
    Update an existing draft's content/metadata.
    Returns (post_id, preview_url).
    """
    payload = {
        "action": "update",
        "title": post.title,
        "description": post.description,
        "dek": post.dek,
        "category": post.category,
        "tags": post.tags,
        "reading_time": post.reading_time,
        "toc": post.toc,
        "content": post.content,
    }
    resp = httpx.patch(
        f"{config.BLOG_API_BASE}/api/blog/posts/{post_id}",
        headers=_HEADERS(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    token = data["post"].get("preview_token", "")
    preview_url = f"{config.BLOG_PUBLIC_BASE}/preview/{post_id}?token={token}"
    return post_id, preview_url
