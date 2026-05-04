from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.common.exceptions import register_exception_handlers
from app.common.middleware import RequestLoggingMiddleware
from app.auth.router import router as auth_router
from app.tenants.router import router as tenants_router
from app.projects.router import router as projects_router
from app.audits.router import router as audits_router
from app.keywords.router import router as keywords_router
from app.competitors.router import router as competitors_router
from app.content.router import router as content_router
from app.actions.router import router as actions_router
from app.exports.router import router as exports_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Northbound SEO API",
        version="1.0.0",
        description="Northbound SEO Intelligence Platform",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)

    register_exception_handlers(app)

    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(tenants_router, prefix="/tenants", tags=["tenants"])
    app.include_router(projects_router, prefix="", tags=["projects"])
    app.include_router(audits_router, prefix="", tags=["audits"])
    app.include_router(keywords_router, prefix="", tags=["keywords"])
    app.include_router(competitors_router, prefix="", tags=["competitors"])
    app.include_router(content_router, prefix="", tags=["content"])
    app.include_router(actions_router, prefix="", tags=["actions"])
    app.include_router(exports_router, prefix="", tags=["exports"])

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
