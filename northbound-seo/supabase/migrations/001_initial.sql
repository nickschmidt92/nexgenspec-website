-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TENANTS & USERS
-- =============================================

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'free',
    max_projects    INT NOT NULL DEFAULT 3,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    firebase_uid    TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    full_name       TEXT,
    role            TEXT NOT NULL DEFAULT 'owner',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ
);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_firebase ON users(firebase_uid);

-- =============================================
-- PROJECTS
-- =============================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    url             TEXT NOT NULL,
    industry        TEXT,
    geography       TEXT NOT NULL DEFAULT 'national',
    revenue_model   TEXT,
    business_info   JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- =============================================
-- SEO AUDITS
-- =============================================

CREATE TYPE audit_status AS ENUM ('queued', 'crawling', 'analyzing', 'completed', 'failed');
CREATE TYPE issue_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE issue_category AS ENUM (
    'meta_tags', 'headings', 'content', 'images',
    'links', 'schema', 'performance', 'mobile',
    'security', 'crawlability', 'indexability'
);

CREATE TABLE audits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          audit_status NOT NULL DEFAULT 'queued',
    score           INT,
    score_breakdown JSONB,
    pages_crawled   INT DEFAULT 0,
    summary         JSONB,
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audits_project ON audits(project_id);
CREATE INDEX idx_audits_tenant ON audits(tenant_id);
CREATE INDEX idx_audits_status ON audits(status);

CREATE TABLE audit_issues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    severity        issue_severity NOT NULL,
    category        issue_category NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    affected_url    TEXT,
    current_value   TEXT,
    recommended     TEXT NOT NULL,
    impact_score    INT NOT NULL CHECK (impact_score BETWEEN 1 AND 10),
    effort_score    INT NOT NULL CHECK (effort_score BETWEEN 1 AND 10),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_issues_audit ON audit_issues(audit_id);
CREATE INDEX idx_issues_severity ON audit_issues(severity);

-- =============================================
-- KEYWORD INTELLIGENCE
-- =============================================

CREATE TYPE keyword_intent AS ENUM ('informational', 'transactional', 'navigational', 'commercial');

CREATE TABLE keyword_research (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'queued',
    seed_keywords   TEXT[],
    config          JSONB DEFAULT '{}',
    summary         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_kr_project ON keyword_research(project_id);

CREATE TABLE keyword_clusters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id     UUID NOT NULL REFERENCES keyword_research(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    intent          keyword_intent,
    keyword_count   INT NOT NULL DEFAULT 0,
    total_volume    INT NOT NULL DEFAULT 0,
    avg_difficulty  INT,
    priority_score  NUMERIC(4,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kc_research ON keyword_clusters(research_id);

CREATE TABLE keywords (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id     UUID NOT NULL REFERENCES keyword_research(id) ON DELETE CASCADE,
    keyword         TEXT NOT NULL,
    search_volume   INT,
    keyword_difficulty INT,
    cpc             NUMERIC(8,2),
    intent          keyword_intent,
    tier            TEXT NOT NULL DEFAULT 'secondary',
    cluster_id      UUID REFERENCES keyword_clusters(id) ON DELETE SET NULL,
    mapped_url      TEXT,
    opportunity     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_keywords_research ON keywords(research_id);
CREATE INDEX idx_keywords_cluster ON keywords(cluster_id);
CREATE INDEX idx_keywords_opportunity ON keywords(opportunity) WHERE opportunity = true;

-- =============================================
-- COMPETITOR ANALYSIS
-- =============================================

CREATE TYPE gap_type AS ENUM ('keyword', 'content', 'backlink', 'technical');

CREATE TABLE competitors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    name            TEXT,
    is_auto_detected BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_competitors_project ON competitors(project_id);

CREATE TABLE competitor_analyses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'queued',
    competitor_ids  UUID[] NOT NULL DEFAULT '{}',
    summary         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_ca_project ON competitor_analyses(project_id);

CREATE TABLE competitor_gaps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id     UUID NOT NULL REFERENCES competitor_analyses(id) ON DELETE CASCADE,
    competitor_id   UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    gap_type        gap_type NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    competitor_value TEXT,
    your_value      TEXT,
    opportunity_score INT CHECK (opportunity_score BETWEEN 1 AND 10),
    keyword         TEXT,
    search_volume   INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gaps_analysis ON competitor_gaps(analysis_id);
CREATE INDEX idx_gaps_opportunity ON competitor_gaps(opportunity_score DESC);

-- =============================================
-- CONTENT STRATEGY
-- =============================================

CREATE TYPE content_type AS ENUM (
    'blog_post', 'landing_page', 'faq_page', 'pillar_page',
    'comparison_page', 'how_to_guide', 'case_study'
);

CREATE TABLE content_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT '30/60/90 Day Plan',
    status          TEXT NOT NULL DEFAULT 'queued',
    config          JSONB DEFAULT '{}',
    summary         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_cp_project ON content_plans(project_id);

CREATE TABLE content_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID NOT NULL REFERENCES content_plans(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    content_type    content_type NOT NULL,
    target_keywords TEXT[] DEFAULT '{}',
    target_intent   keyword_intent,
    suggested_url   TEXT,
    word_count_min  INT,
    word_count_max  INT,
    outline         JSONB,
    internal_links  TEXT[] DEFAULT '{}',
    phase           TEXT NOT NULL CHECK (phase IN ('30_day', '60_day', '90_day')),
    priority        TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    impact_score    INT CHECK (impact_score BETWEEN 1 AND 10),
    effort_score    INT CHECK (effort_score BETWEEN 1 AND 10),
    status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'published')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ci_plan ON content_items(plan_id);
CREATE INDEX idx_ci_phase ON content_items(phase);
CREATE INDEX idx_ci_priority ON content_items(priority);

-- =============================================
-- ACTION ITEMS
-- =============================================

CREATE TYPE action_category AS ENUM (
    'technical_seo', 'on_page_seo', 'content',
    'link_building', 'schema_markup', 'performance'
);

CREATE TABLE action_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type     TEXT NOT NULL CHECK (source_type IN ('audit', 'keyword', 'competitor', 'content')),
    source_id       UUID,
    category        action_category NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    affected_urls   TEXT[] DEFAULT '{}',
    impact_score    INT NOT NULL CHECK (impact_score BETWEEN 1 AND 10),
    effort_score    INT NOT NULL CHECK (effort_score BETWEEN 1 AND 10),
    priority        TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'dismissed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_actions_project ON action_items(project_id);
CREATE INDEX idx_actions_priority ON action_items(priority);
CREATE INDEX idx_actions_status ON action_items(status);

-- =============================================
-- EXPORTS
-- =============================================

CREATE TABLE exports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    export_type     TEXT NOT NULL CHECK (export_type IN ('pdf_audit', 'csv_keywords', 'csv_actions', 'json_full')),
    status          TEXT NOT NULL DEFAULT 'queued',
    file_url        TEXT,
    file_size_bytes BIGINT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exports_project ON exports(project_id);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     UUID,
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
