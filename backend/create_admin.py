import sys
import getpass
import os

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import SessionLocal, init_database
from app.services.auth_service import AuthService


def main():
    init_database()
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

        admin = AuthService.register_admin(db, username, password)
        print(f"✅ Administrator '{admin.username}' created successfully!")
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
