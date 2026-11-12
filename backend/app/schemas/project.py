import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, AliasChoices, field_validator


class ProjectBase(BaseModel):
    name: str = Field(..., description="Project showcase name")
    category: str = Field(..., description="Category (Beauty, Healthcare, Automotive, etc.)")
    tagline: Optional[str] = Field(default="", description="Catchy one-line slogan")
    description: Optional[str] = Field(default="", description="Detailed portfolio description")
    url: str = Field(..., description="Live website URL")
    accent_color: Optional[str] = Field(default="#E52521", alias="accentColor")
    accent_badge: Optional[str] = Field(default=None, alias="accentBadge")
    year: Optional[str] = Field(default="2026")
    client: Optional[str] = Field(default="")
    domain: Optional[str] = Field(default="")
    image_url: Optional[str] = Field(default="", alias="imageUrl")
    tags: Optional[List[str]] = Field(default_factory=list)
    highlights: Optional[List[str]] = Field(default_factory=list)
    is_active: Optional[bool] = Field(default=True, alias="isActive")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ProjectCreate(ProjectBase):
    id: Optional[str] = Field(default=None, description="Unique slug or ID, generated if omitted")


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    accent_color: Optional[str] = Field(default=None, alias="accentColor")
    accent_badge: Optional[str] = Field(default=None, alias="accentBadge")
    year: Optional[str] = None
    client: Optional[str] = None
    domain: Optional[str] = None
    image_url: Optional[str] = Field(default=None, alias="imageUrl")
    tags: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    is_active: Optional[bool] = Field(default=None, alias="isActive")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ProjectResponse(BaseModel):
    id: str
    name: str
    category: str
    tagline: str = ""
    description: str = ""
    url: str
    accentColor: str = Field(default="#E52521", validation_alias=AliasChoices("accentColor", "accent_color"))
    accentBadge: str = Field(default="", validation_alias=AliasChoices("accentBadge", "accent_badge"))
    year: str = "2026"
    client: str = ""
    domain: str = ""
    imageUrl: str = Field(default="", validation_alias=AliasChoices("imageUrl", "image_url"))
    tags: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    isActive: bool = Field(default=True, validation_alias=AliasChoices("isActive", "is_active"))
    createdAt: Optional[str] = Field(default=None, validation_alias=AliasChoices("createdAt", "created_at"))
    updatedAt: Optional[str] = Field(default=None, validation_alias=AliasChoices("updatedAt", "updated_at"))

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("createdAt", "updatedAt", mode="before")
    @classmethod
    def serialize_datetime(cls, v):
        if isinstance(v, (datetime.datetime, datetime.date)):
            return v.isoformat()
        return v

    @field_validator("accentBadge", mode="before")
    @classmethod
    def default_accent_badge(cls, v, info):
        if not v:
            data = info.data
            return data.get("category", "")
        return v


class SeedResponse(BaseModel):
    success: bool
    message: str
    seededCount: int
    totalCount: int


class DeleteResponse(BaseModel):
    success: bool
    message: str
    id: str


class ScreenshotTriggerResponse(BaseModel):
    success: bool
    message: str
    id: str


class UploadResponse(BaseModel):
    success: bool
    url: str
    filename: str


class HealthResponse(BaseModel):
    status: str
    service: str
    databaseConnected: bool
    databaseType: str
