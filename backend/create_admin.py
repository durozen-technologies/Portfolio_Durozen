import sys
import uuid
import getpass
from app.database import SessionLocal, engine, Base
from app.models import AdminUser
from app.auth import hash_password

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if len(sys.argv) >= 3:
            username = sys.argv[1].strip()
            password = sys.argv[2].strip()
        elif len(sys.argv) == 2:
            username = sys.argv[1].strip()
            password = getpass.getpass("Enter password: ").strip()
        else:
            username = input("Enter admin username: ").strip()
            password = getpass.getpass("Enter admin password: ").strip()

        if len(username) < 3:
            print("❌ Error: Username must be at least 3 characters long.")
            sys.exit(1)
        if len(password) < 6:
            print("❌ Error: Password must be at least 6 characters long.")
            sys.exit(1)

        existing = db.query(AdminUser).filter(AdminUser.username == username).first()
        if existing:
            existing.password_hash = hash_password(password)
            db.commit()
            print(f"✅ Administrator '{username}' password updated successfully!")
            return

        new_admin = AdminUser(
            id=f"admin_{uuid.uuid4().hex[:12]}",
            username=username,
            password_hash=hash_password(password),
            role="admin"
        )
        db.add(new_admin)
        db.commit()
        print(f"✅ Administrator '{username}' created successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
