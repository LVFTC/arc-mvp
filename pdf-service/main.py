"""
ARC PDF Microservice — WeasyPrint + FastAPI
Receives JSON report data, returns PDF bytes.
"""
import re
import io
import math
import logging
from typing import Any

import bleach
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, field_validator
from weasyprint import HTML, CSS
from weasyprint.urls import URLFetchingError

from .models import ReportPayload
from .renderer import render_html
from .url_fetcher import restricted_url_fetcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ARC PDF Service", docs_url=None, redoc_url=None)

# Only accept calls from internal network (extra defence-in-depth)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # tighten in prod


@app.post("/render", response_class=Response)
async def render_pdf(payload: ReportPayload) -> Response:
    try:
        html_content = render_html(payload)
        pdf_bytes = (
            HTML(string=html_content, url_fetcher=restricted_url_fetcher)
            .write_pdf(
                presentational_hints=True,
                optimize_images=True,
            )
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-store",
            },
        )
    except URLFetchingError as e:
        logger.warning("Blocked URL fetch attempt: %s", e)
        raise HTTPException(status_code=400, detail="Blocked external resource")
    except Exception as e:
        logger.exception("PDF render failed")
        raise HTTPException(status_code=500, detail="Render failed")


@app.get("/health")
def health():
    return {"status": "ok"}
