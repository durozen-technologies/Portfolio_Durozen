import uuid
import logging
from typing import List, Optional
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session
from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectUpdate
from ..core.utils import generate_slug, extract_domain

logger = logging.getLogger("durozen.project_service")

DEFAULT_PROJECTS = [
    {
        "id": "makeover",
        "name": "Makeover Studio",
        "category": "Beauty",
        "tagline": "Luxury makeup, beauty styling & personal makeover destination",
        "description": "A chic, high-fashion makeover and beauty consultation platform showcasing artist portfolios, transformation lookbooks, and customized packages.",
        "url": "https://makeeeover.netlify.app",
        "accent_color": "#FACC15",
        "accent_badge": "Beauty",
        "year": "2026",
        "tags": ["Beauty Styling", "Lookbook", "Personal Makeover", "Netlify Live"],
        "client": "Makeover Studio",
        "highlights": ["Transformation Gallery", "Artist Booking", "Custom Packages"],
        "domain": "makeeeover.netlify.app",
        "image_url": "/screenshots/makeover.jpg",
    },
    {
        "id": "eye-hospital",
        "name": "Eye Hospital",
        "category": "Healthcare",
        "tagline": "Advanced ophthalmology clinic, laser vision & surgical care",
        "description": "An institutional healthcare portal for eye care, cataract surgery, and retinal treatments featuring specialist directories and online appointment booking.",
        "url": "https://eyehospital1.netlify.app",
        "accent_color": "#22C55E",
        "accent_badge": "Healthcare",
        "year": "2026",
        "tags": ["Ophthalmology", "Doctor Directory", "Appointment Booking", "Netlify Live"],
        "client": "Apex Eye Hospital",
        "highlights": ["Specialist Profiles", "Online Appointment Booking", "Surgical Guides"],
        "domain": "eyehospital1.netlify.app",
        "image_url": "/screenshots/eye-hospital.jpg",
    },
    {
        "id": "salon",
        "name": "Salon Studio",
        "category": "Beauty",
        "tagline": "Premium hair styling, spa therapies & grooming experience",
        "description": "A contemporary salon web experience with service menus, pricing tiers, hair stylist selection, and automated slot reservations.",
        "url": "https://salonn1.netlify.app",
        "accent_color": "#E52521",
        "accent_badge": "Beauty",
        "year": "2026",
        "tags": ["Hair & Spa", "Service Menu", "Slot Booking", "Netlify Live"],
        "client": "Urban Salon Studio",
        "highlights": ["Slot Reservation", "Tiered Service Menu", "Stylist Portfolio"],
        "domain": "salonn1.netlify.app",
        "image_url": "/screenshots/salon.jpg",
    },
    {
        "id": "mmr-motor",
        "name": "MMR Motor",
        "category": "Automotive",
        "tagline": "Modern two-wheeler sales, maintenance & spare parts portal",
        "description": "A full-service two-wheeler automotive platform featuring interactive bike models, service booking schedules, and genuine spare parts catalog.",
        "url": "https://mmrmotor.netlify.app",
        "accent_color": "#E52521",
        "accent_badge": "Automotive",
        "year": "2026",
        "tags": ["Automotive", "Bike Service", "Parts Catalog", "Netlify Live"],
        "client": "MMR Motor Hub",
        "highlights": ["Instant Service Booking", "Multi-Brand Catalog", "Mobile First"],
        "domain": "mmrmotor.netlify.app",
        "image_url": "/screenshots/mmr-motor.jpg",
    },
    {
        "id": "scootyy",
        "name": "Scootyy",
        "category": "Automotive",
        "tagline": "Smart electric scooter rental, test drives & urban mobility",
        "description": "An eco-friendly electric scooter showcase featuring battery specs, range estimators, online test drive reservations, and urban dealership locators.",
        "url": "https://scootyy.netlify.app",
        "accent_color": "#2563EB",
        "accent_badge": "Automotive",
        "year": "2026",
        "tags": ["EV Mobility", "Scooter Rental", "Test Drive UI", "Netlify Live"],
        "client": "Scootyy Urban Mobility",
        "highlights": ["Range Calculator", "Test Ride Scheduler", "Interactive Fleet"],
        "domain": "scootyy.netlify.app",
        "image_url": "/screenshots/scootyy.jpg",
    },
    {
        "id": "bridal",
        "name": "Bridal Makeover",
        "category": "Beauty",
        "tagline": "Bespoke bridal makeover, couture beauty & wedding glam packages",
        "description": "An ethereal bridal platform highlighting wedding day looks, mehendi and reception styling packages, and client testimonial showcases.",
        "url": "https://bridall.netlify.app",
        "accent_color": "#FACC15",
        "accent_badge": "Beauty",
        "year": "2026",
        "tags": ["Bridal Glam", "Couture Styling", "Wedding Lookbook", "Netlify Live"],
        "client": "Bridal Makeover Atelier",
        "highlights": ["Wedding Day Lookbook", "Bridal Consultations", "Package Customizer"],
        "domain": "bridall.netlify.app",
        "image_url": "/screenshots/bridal.jpg",
    },
    {
        "id": "eye-care",
        "name": "Eye Care Center",
        "category": "Healthcare",
        "tagline": "Comprehensive optical diagnostics, contact lenses & eyewear",
        "description": "A modern vision care and optical dispensary website providing eye examinations, designer frames gallery, and prescription renewal support.",
        "url": "https://eyecareee.netlify.app",
        "accent_color": "#22C55E",
        "accent_badge": "Healthcare",
        "year": "2026",
        "tags": ["Optometry", "Eyewear Gallery", "Vision Check", "Netlify Live"],
        "client": "Vision Eye Care Center",
        "highlights": ["Vision Check Guidance", "Eyewear Catalog", "Prescription Care"],
        "domain": "eyecareee.netlify.app",
        "image_url": "/screenshots/eye-care.jpg",
    },
    {
        "id": "nurserie-plant",
        "name": "Nurserie Plant",
        "category": "Lifestyle",
        "tagline": "Botanical nursery, exotic indoor plants & landscape greens",
        "description": "A vibrant gardening and botanical nursery website showcasing rare indoor houseplants, bonsai trees, organic soils, and plant care instructions.",
        "url": "https://nurserieplant.netlify.app/",
        "accent_color": "#22C55E",
        "accent_badge": "Lifestyle",
        "year": "2026",
        "tags": ["Botanical Nursery", "Houseplants", "Garden Greens", "Netlify Live"],
        "client": "Nurserie Botanical Greens",
        "highlights": ["Plant Care Guides", "Rare Species Catalog", "Gardening Supplies"],
        "domain": "nurserieplant.netlify.app",
        "image_url": "/screenshots/nurserie-plant.jpg",
    },
    {
        "id": "resort",
        "name": "Resort Getaway",
        "category": "Hospitality",
        "tagline": "Luxury vacation retreat, villas, private dining & wellness spa",
        "description": "An immersive hospitality experience presenting luxury villa accommodations, beachfront suites, dining menus, and direct online suite booking.",
        "url": "https://resortt2.netlify.app/",
        "accent_color": "#2563EB",
        "accent_badge": "Hospitality",
        "year": "2026",
        "tags": ["Luxury Resort", "Villa Booking", "Dining & Spa", "Netlify Live"],
        "client": "Azure Bay Luxury Resort",
        "highlights": ["Direct Room Booking", "Virtual Villa Tour", "Spa Packages"],
        "domain": "resortt2.netlify.app",
        "image_url": "/screenshots/resort.jpg",
    },
    {
        "id": "mmr-motors",
        "name": "MMR Motors",
        "category": "Automotive",
        "tagline": "Premium pre-owned cars, vehicle trade-ins & certified auto dealership",
        "description": "A comprehensive automotive dealership platform with certified pre-owned vehicle listings, EMI financing calculators, and instant test drive bookings.",
        "url": "https://mmrmotors.uk",
        "accent_color": "#E52521",
        "accent_badge": "Automotive",
        "year": "2026",
        "tags": ["Pre-Owned Cars", "Auto Dealership", "EMI Calculator", "Netlify Live"],
        "client": "MMR Motors Dealership",
        "highlights": ["Certified Inventory", "Auto Financing Calculator", "Instant Vehicle Inspection"],
        "domain": "mmrmotors.uk",
        "image_url": "/screenshots/mmr-motors.jpg",
    },
]


class ProjectService:
    @staticmethod
    def get_projects(
        db: Session,
        category: Optional[str] = None,
        include_inactive: bool = False,
        search: Optional[str] = None,
    ) -> List[Project]:
        query = db.query(Project)
        if not include_inactive:
            query = query.filter(Project.is_active == True)  # noqa: E712

        if category and category.strip() and category.strip().lower() != "all":
            query = query.filter(Project.category.ilike(category.strip()))

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Project.name.ilike(term),
                    Project.tagline.ilike(term),
                    Project.description.ilike(term),
                    Project.client.ilike(term),
                    Project.domain.ilike(term),
                    cast(Project.tags, String).ilike(term),
                )
            )

        return query.order_by(Project.created_at.desc()).all()

    @staticmethod
    def get_project_by_id(db: Session, project_id: str) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def create_project(db: Session, data: ProjectCreate) -> Project:
        project_id = data.id.strip() if data.id else generate_slug(data.name)

        # Ensure ID uniqueness
        existing = db.query(Project).filter(Project.id == project_id).first()
        if existing:
            project_id = f"{project_id}-{str(uuid.uuid4())[:4]}"

        domain = (data.domain or "").strip() or extract_domain(data.url)
        accent_badge = (data.accent_badge or "").strip() or data.category.strip()
        image_url = data.image_url.strip() if data.image_url else f"/screenshots/{project_id}.jpg"

        project = Project(
            id=project_id,
            name=data.name.strip(),
            category=data.category.strip(),
            tagline=(data.tagline or "").strip(),
            description=(data.description or "").strip(),
            url=data.url.strip(),
            accent_color=(data.accent_color or "#E52521").strip(),
            accent_badge=accent_badge,
            year=(data.year or "2026").strip(),
            client=(data.client or "").strip(),
            domain=domain,
            image_url=image_url,
            tags=data.tags or [],
            highlights=data.highlights or [],
            is_active=data.is_active if data.is_active is not None else True,
        )

        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def update_project(db: Session, project_id: str, data: ProjectUpdate) -> Optional[Project]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        # Clean string values
        for k, v in list(update_dict.items()):
            if isinstance(v, str):
                update_dict[k] = v.strip()

        # If URL is being updated and no explicit domain was provided, auto-compute domain
        if "url" in update_dict and update_dict["url"] and not update_dict.get("domain"):
            update_dict["domain"] = extract_domain(update_dict["url"])

        for field, value in update_dict.items():
            setattr(project, field, value)

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False
        db.delete(project)
        db.commit()
        return True

    @staticmethod
    def seed_default_projects(db: Session, force: bool = False) -> int:
        count = db.query(Project).count()
        if count > 0 and not force:
            return 0

        added = 0
        for item in DEFAULT_PROJECTS:
            existing = db.query(Project).filter(Project.id == item["id"]).first()
            if existing and not force:
                continue

            if existing and force:
                for k, v in item.items():
                    setattr(existing, k, v)
            else:
                proj = Project(**item)
                db.add(proj)
                added += 1

        db.commit()
        logger.info(f"Seeded {added} default projects into database.")
        return added
