"""Pydantic models for the PDF report payload."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, field_validator
import bleach

_MAX_TEXT = 4000
_ALLOWED_TAGS: list[str] = []   # zero HTML tags allowed in user text


def _sanitize(value: str | None) -> str:
    if value is None:
        return ""
    cleaned = bleach.clean(str(value), tags=_ALLOWED_TAGS, strip=True)
    return cleaned[:_MAX_TEXT]


def _sanitize_list(values: list[str] | None) -> list[str]:
    return [_sanitize(v) for v in (values or [])]


class AgilitiesScores(BaseModel):
    mental: float
    resultados: float
    pessoas: float
    mudancas: float
    autogestao: float


class BigFiveScores(BaseModel):
    abertura: float
    conscienciosidade: float
    extroversao: float
    amabilidade: float
    neuroticismo: float


class IkigaiInputs(BaseModel):
    amo: list[str]
    sou_bom: list[str]
    mundo_precisa: list[str]
    posso_ser_pago: list[str]

    @field_validator("amo", "sou_bom", "mundo_precisa", "posso_ser_pago", mode="before")
    @classmethod
    def sanitize_lists(cls, v):
        return _sanitize_list(v)


class Experiment(BaseModel):
    title: str
    week: int
    metric: str

    @field_validator("title", "metric", mode="before")
    @classmethod
    def sanitize_str(cls, v):
        return _sanitize(v)


class ContactProfile(BaseModel):
    profile: str
    justification: str

    @field_validator("profile", "justification", mode="before")
    @classmethod
    def sanitize_str(cls, v):
        return _sanitize(v)


class EducationItem(BaseModel):
    kind: str   # "livro" | "curso"
    title: str

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_str(cls, v):
        return _sanitize(v)


class Checkpoint(BaseModel):
    week: int
    question: str

    @field_validator("question", mode="before")
    @classmethod
    def sanitize_str(cls, v):
        return _sanitize(v)


class Plan90Days(BaseModel):
    chosen_hypothesis: str
    experiencias: list[Experiment]
    pessoas: list[ContactProfile]
    educacao: list[EducationItem]
    checkpoints: list[Checkpoint]

    @field_validator("chosen_hypothesis", mode="before")
    @classmethod
    def sanitize_str(cls, v):
        return _sanitize(v)


class ReportPayload(BaseModel):
    user_name: str
    archetype: str
    archetype_strengths: list[str]
    archetype_tensions: list[str]
    provocative_questions: list[str]
    agilidades: AgilitiesScores
    big_five: BigFiveScores
    ikigai: IkigaiInputs
    selected_zone: str
    plan: Plan90Days

    @field_validator(
        "user_name", "archetype", "selected_zone", mode="before"
    )
    @classmethod
    def sanitize_str(cls, v):
        return _sanitize(v)

    @field_validator(
        "archetype_strengths",
        "archetype_tensions",
        "provocative_questions",
        mode="before",
    )
    @classmethod
    def sanitize_lists(cls, v):
        return _sanitize_list(v)
