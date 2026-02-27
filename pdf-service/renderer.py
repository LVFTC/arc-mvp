"""HTML renderer — Jinja2 with autoescape=True."""
from jinja2 import Environment, PackageLoader, select_autoescape

from .models import ReportPayload
from .radar import radar_svg

_env = Environment(
    loader=PackageLoader("pdf_service", "templates"),
    autoescape=select_autoescape(["html", "xml"]),  # autoescape ON
)


def render_html(payload: ReportPayload) -> str:
    template = _env.get_template("report.html")

    scores_dict = payload.agilidades.model_dump()
    svg = radar_svg(scores_dict)

    bf = payload.big_five.model_dump()
    bf_max = 5.0
    big_five_bars = [
        {"label": "Abertura", "value": bf["abertura"], "pct": bf["abertura"] / bf_max * 100},
        {"label": "Conscienciosidade", "value": bf["conscienciosidade"], "pct": bf["conscienciosidade"] / bf_max * 100},
        {"label": "Extroversão", "value": bf["extroversao"], "pct": bf["extroversao"] / bf_max * 100},
        {"label": "Amabilidade", "value": bf["amabilidade"], "pct": bf["amabilidade"] / bf_max * 100},
        {"label": "Neuroticismo", "value": bf["neuroticismo"], "pct": bf["neuroticismo"] / bf_max * 100},
    ]

    return template.render(
        user_name=payload.user_name,
        archetype=payload.archetype,
        archetype_strengths=payload.archetype_strengths,
        archetype_tensions=payload.archetype_tensions,
        provocative_questions=payload.provocative_questions,
        radar_svg=svg,                   # server-generated SVG, safe to mark |safe in template
        big_five_bars=big_five_bars,
        ikigai=payload.ikigai,
        selected_zone=payload.selected_zone,
        plan=payload.plan,
    )
