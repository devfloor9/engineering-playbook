"""
Data models for the validation system
"""
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field


DocumentCategory = Literal[
    "eks", "gpu", "inference", "vector-db", 
    "agent-framework", "model-serving", "mlops", "overview"
]

IssueSeverity = Literal["critical", "important", "minor"]
IssueCategory = Literal["accuracy", "version", "best-practice", "code", "cross-ref", "metadata"]
ValidationStatus = Literal["pass", "needs-update", "fail"]
RecommendationType = Literal["add", "update", "remove"]


class DocumentEntry(BaseModel):
    """Represents a document to be validated"""
    id: str
    path: str
    category: DocumentCategory
    language: Literal["ko", "en"]
    translation_path: Optional[str] = None
    priority: Literal["critical", "high", "medium", "low"]
    last_modified: str
    frontmatter: dict = Field(default_factory=dict)


class ValidationManifest(BaseModel):
    """Manifest of all documents to validate"""
    version: str = "1.0"
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    documents: List[DocumentEntry]


class ReferenceSource(BaseModel):
    """Reference source for an issue"""
    type: Literal["aws", "cncf", "oss", "blog"]
    url: str
    title: str


class IssueLocation(BaseModel):
    """Location of an issue in a document"""
    section: Optional[str] = None
    line_number: Optional[int] = None
    code_block: Optional[int] = None


class Issue(BaseModel):
    """Represents a validation issue"""
    id: str
    severity: IssueSeverity
    category: IssueCategory
    location: IssueLocation
    description: str
    current_content: str
    expected_content: Optional[str] = None
    reference_source: ReferenceSource


class Recommendation(BaseModel):
    """Represents a recommendation for improvement"""
    type: RecommendationType
    section: str
    description: str
    suggested_content: Optional[str] = None
    rationale: str


class IssueSummary(BaseModel):
    """Summary of issues found"""
    total_issues: int = 0
    critical_issues: int = 0
    important_issues: int = 0
    minor_issues: int = 0


class CorrectionReport(BaseModel):
    """Report for a single document validation"""
    document_id: str
    document_path: str
    validation_date: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: ValidationStatus
    summary: IssueSummary
    issues: List[Issue] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)


class SearchResult(BaseModel):
    """Search result from reference source"""
    title: str
    url: str
    excerpt: str
    relevance: float = Field(ge=0.0, le=1.0)


class VersionInfo(BaseModel):
    """Version information from reference source"""
    service: str
    version: str
    release_date: str
    deprecations: List[str] = Field(default_factory=list)
