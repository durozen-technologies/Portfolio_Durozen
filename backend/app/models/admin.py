import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="admin")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
