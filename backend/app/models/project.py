import datetime
from typing import List, Optional
from sqlalchemy import String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Lifestyle")
    tagline: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    accent_color: Mapped[Optional[str]] = mapped_column(String(20), default="#E52521")
    accent_badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    year: Mapped[Optional[str]] = mapped_column(String(10), default="2026")
    client: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    highlights: Mapped[List[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "tagline": self.tagline or "",
            "description": self.description or "",
            "url": self.url,
            "accentColor": self.accent_color or "#E52521",
            "accentBadge": self.accent_badge or self.category,
            "year": self.year or "2026",
            "client": self.client or "",
            "domain": self.domain or "",
            "imageUrl": self.image_url or "",
            "tags": self.tags or [],
            "highlights": self.highlights or [],
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
