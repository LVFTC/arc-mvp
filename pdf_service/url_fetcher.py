"""
Restricted URL fetcher for WeasyPrint.
Blocks: file://, ftp://, and any non-http(s)/data scheme.
"""
from urllib.parse import urlparse
from weasyprint.urls import default_url_fetcher, URLFetchingError

_ALLOWED_SCHEMES = {"http", "https", "data"}


def restricted_url_fetcher(url: str, timeout: int = 10, **kwargs):
    scheme = urlparse(url).scheme.lower()
    if scheme not in _ALLOWED_SCHEMES:
        raise URLFetchingError(
            f"Scheme '{scheme}' is not allowed by ARC security policy"
        )
    return default_url_fetcher(url, timeout=timeout, **kwargs)
