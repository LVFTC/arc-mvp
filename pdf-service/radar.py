"""
SVG radar chart generator — purely server-side, no user input touches SVG paths.
"""
import math

_DIMS = ["Mental", "Resultados", "Pessoas", "Mudanças", "Autogestão"]
_CX, _CY, _R = 160, 160, 120
_COLORS = {
    "fill": "rgba(99,102,241,0.25)",
    "stroke": "#6366f1",
    "axis": "#cbd5e1",
    "label": "#1e293b",
    "grid": "#e2e8f0",
}


def _polar(angle_rad: float, r: float) -> tuple[float, float]:
    return _CX + r * math.cos(angle_rad), _CY + r * math.sin(angle_rad)


def radar_svg(scores: dict[str, float], max_val: float = 5.0) -> str:
    n = len(_DIMS)
    angles = [2 * math.pi * i / n - math.pi / 2 for i in range(n)]

    # Grid rings
    rings = ""
    for level in [0.2, 0.4, 0.6, 0.8, 1.0]:
        pts = " ".join(f"{_polar(a, _R * level)[0]:.2f},{_polar(a, _R * level)[1]:.2f}" for a in angles)
        rings += f'<polygon points="{pts}" fill="none" stroke="{_COLORS["grid"]}" stroke-width="1"/>\n'

    # Axes
    axes = ""
    for a in angles:
        x, y = _polar(a, _R)
        axes += f'<line x1="{_CX}" y1="{_CY}" x2="{x:.2f}" y2="{y:.2f}" stroke="{_COLORS["axis"]}" stroke-width="1"/>\n'

    # Score polygon — values come from our own calculation, not user input
    score_vals = [
        scores.get("mental", 0),
        scores.get("resultados", 0),
        scores.get("pessoas", 0),
        scores.get("mudancas", 0),
        scores.get("autogestao", 0),
    ]
    # Clamp values server-side regardless of origin
    score_vals = [max(0.0, min(float(v), max_val)) for v in score_vals]

    poly_pts = " ".join(
        f"{_polar(a, _R * (v / max_val))[0]:.2f},{_polar(a, _R * (v / max_val))[1]:.2f}"
        for a, v in zip(angles, score_vals)
    )
    polygon = (
        f'<polygon points="{poly_pts}" '
        f'fill="{_COLORS["fill"]}" stroke="{_COLORS["stroke"]}" stroke-width="2.5"/>\n'
    )

    # Labels (static text, not user-provided)
    labels = ""
    for dim, angle in zip(_DIMS, angles):
        lx, ly = _polar(angle, _R + 22)
        anchor = "middle" if abs(lx - _CX) < 10 else ("start" if lx > _CX else "end")
        labels += (
            f'<text x="{lx:.2f}" y="{ly:.2f}" '
            f'text-anchor="{anchor}" dominant-baseline="middle" '
            f'font-size="12" font-family="Inter,sans-serif" fill="{_COLORS["label"]}">'
            f"{dim}</text>\n"
        )

    # Score dots
    dots = ""
    for a, v in zip(angles, score_vals):
        dx, dy = _polar(a, _R * (v / max_val))
        dots += f'<circle cx="{dx:.2f}" cy="{dy:.2f}" r="4" fill="{_COLORS["stroke"]}"/>\n'

    return (
        f'<svg width="320" height="320" viewBox="0 0 320 320" '
        f'xmlns="http://www.w3.org/2000/svg">\n'
        f"{rings}{axes}{polygon}{dots}{labels}"
        f"</svg>"
    )
