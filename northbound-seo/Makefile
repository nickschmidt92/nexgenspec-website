.PHONY: help install dev migrate test lint docker-up docker-down

help:
	@echo "Northbound SEO — available commands:"
	@echo "  make install        Install all dependencies"
	@echo "  make dev-backend    Run backend dev server (port 8000)"
	@echo "  make dev-frontend   Run frontend dev server (port 3000)"
	@echo "  make migrate        Run database migrations"
	@echo "  make migrate-new    Create new migration (name=<name>)"
	@echo "  make test           Run backend tests"
	@echo "  make lint           Run linters"
	@echo "  make docker-up      Start all services with Docker"
	@echo "  make docker-down    Stop all Docker services"

install-backend:
	cd backend && pip install poetry && poetry install
	cd backend && poetry run playwright install chromium --with-deps

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend

dev-backend:
	cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

migrate:
	cd backend && poetry run alembic upgrade head

migrate-new:
	cd backend && poetry run alembic revision --autogenerate -m "$(name)"

migrate-down:
	cd backend && poetry run alembic downgrade -1

test-backend:
	cd backend && poetry run pytest -v

lint-backend:
	cd backend && poetry run ruff check .

lint-frontend:
	cd frontend && npm run lint

lint: lint-backend lint-frontend

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down -v

setup-firebase:
	@echo "Go to https://console.firebase.google.com"
	@echo "Create project: northbound-seo"
	@echo "Enable Authentication > Email/Password"
	@echo "Copy config to frontend/.env.local"

setup-supabase:
	@echo "Go to https://supabase.com"
	@echo "Create project: northbound-seo"
	@echo "Go to Settings > Database"
	@echo "Copy connection string to backend/.env"
	@echo "Run: make migrate"

setup: setup-firebase setup-supabase
	@echo ""
	@echo "After setup, run: make dev-backend & make dev-frontend"
