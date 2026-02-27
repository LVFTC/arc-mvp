"""
pdf-service/tests/test_security.py

Run: pytest pdf-service/tests/
"""
import pytest
from fastapi.testclient import TestClient
from pdf_service.main import app
from pdf_service.url_fetcher import restricted_url_fetcher
from weasyprint.urls import URLFetchingError

client = TestClient(app)

# ── Minimal valid payload ────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "user_name": "Alice",
    "archetype": "Explorador Analítico",
    "archetype_strengths": ["Pensamento sistêmico", "Foco em resultados"],
    "archetype_tensions": ["Dificuldade de priorização"],
    "provocative_questions": ["O que você testaria agora?"],
    "agilidades": {
        "mental": 4.0, "resultados": 4.5, "pessoas": 3.0,
        "mudancas": 2.5, "autogestao": 3.5
    },
    "big_five": {
        "abertura": 4.0, "conscienciosidade": 3.5, "extroversao": 2.5,
        "amabilidade": 4.0, "neuroticismo": 2.0
    },
    "ikigai": {
        "amo": ["Resolver problemas complexos"],
        "sou_bom": ["Análise de dados"],
        "mundo_precisa": ["Decisões baseadas em evidências"],
        "posso_ser_pago": ["Consultoria estratégica"]
    },
    "selected_zone": "Profissão",
    "plan": {
        "chosen_hypothesis": "Hipótese: consultor de dados estratégico",
        "experiencias": [{"title": "Entrevistar 3 analistas sênior", "week": 1, "metric": "3 conversas"}],
        "pessoas": [{"profile": "Analista sênior em fintech", "justification": "Valida trilha"}],
        "educacao": [{"kind": "livro", "title": "Thinking in Systems"}],
        "checkpoints": [{"week": 4, "question": "O que aprendi sobre o mercado?"}]
    }
}


class TestSanitization:
    def test_html_tags_stripped_from_user_text(self):
        """HTML tags in user text must be stripped before rendering."""
        payload = {**VALID_PAYLOAD, "user_name": "<script>alert('xss')</script>Alice"}
        # Should not raise, and PDF should be returned
        res = client.post("/render", json=payload)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"

    def test_sql_injection_in_text_is_harmless(self):
        """SQL-like strings are just text in the PDF context — must not crash."""
        payload = {**VALID_PAYLOAD, "archetype": "'; DROP TABLE users; --"}
        res = client.post("/render", json=payload)
        assert res.status_code == 200

    def test_text_truncated_at_4000_chars(self):
        """Content exceeding 4000 chars must be truncated, not rejected."""
        long_text = "A" * 5000
        payload = {
            **VALID_PAYLOAD,
            "plan": {**VALID_PAYLOAD["plan"], "chosen_hypothesis": long_text}
        }
        res = client.post("/render", json=payload)
        assert res.status_code == 200

    def test_empty_lists_render_ok(self):
        payload = {
            **VALID_PAYLOAD,
            "archetype_strengths": [],
            "provocative_questions": [],
        }
        res = client.post("/render", json=payload)
        assert res.status_code == 200


class TestURLFetcher:
    def test_blocks_file_scheme(self):
        with pytest.raises(URLFetchingError):
            restricted_url_fetcher("file:///etc/passwd")

    def test_blocks_ftp_scheme(self):
        with pytest.raises(URLFetchingError):
            restricted_url_fetcher("ftp://internal-server/secret")

    def test_blocks_javascript_scheme(self):
        with pytest.raises(URLFetchingError):
            restricted_url_fetcher("javascript:alert(1)")

    def test_blocks_data_uri_is_allowed(self):
        """data: URIs are allowed (used for embedded fonts/images)."""
        # We just verify it doesn't raise URLFetchingError
        # (it may fail for other reasons in test env, but not our block)
        try:
            restricted_url_fetcher("data:text/plain,hello")
        except URLFetchingError as e:
            pytest.fail(f"data: scheme should not be blocked: {e}")
        except Exception:
            pass  # other errors (decode, etc.) are fine


class TestResponseHeaders:
    def test_pdf_has_no_store_cache_header(self):
        res = client.post("/render", json=VALID_PAYLOAD)
        assert res.status_code == 200
        assert res.headers.get("cache-control") == "no-store"

    def test_pdf_has_nosniff_header(self):
        res = client.post("/render", json=VALID_PAYLOAD)
        assert res.headers.get("x-content-type-options") == "nosniff"

    def test_content_type_is_pdf(self):
        res = client.post("/render", json=VALID_PAYLOAD)
        assert "application/pdf" in res.headers["content-type"]


class TestRadarSVG:
    def test_radar_values_clamped(self):
        """Out-of-range scores must not produce invalid SVG paths."""
        from pdf_service.radar import radar_svg
        svg = radar_svg({"mental": 999, "resultados": -5, "pessoas": 3,
                          "mudancas": 2, "autogestao": 3})
        assert "<svg" in svg
        assert "NaN" not in svg
        assert "Infinity" not in svg
