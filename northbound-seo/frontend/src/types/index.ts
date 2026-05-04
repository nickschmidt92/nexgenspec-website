export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  max_projects: number
  created_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

export interface Project {
  id: string
  tenant_id: string
  name: string
  url: string
  industry: string | null
  geography: string
  revenue_model: string | null
  business_info: Record<string, unknown>
  created_at: string
  updated_at: string
  latest_audit_score?: number | null
}

export interface ProjectOverview {
  score: number | null
  score_breakdown: ScoreBreakdown | null
  top_issues: AuditIssue[]
  recent_audits: Audit[]
  action_counts: ActionCounts
}

export interface ScoreBreakdown {
  technical: number
  on_page: number
  content: number
  performance: number
  mobile: number
}

export type AuditStatus = 'queued' | 'crawling' | 'analyzing' | 'completed' | 'failed'
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IssueCategory =
  | 'meta_tags'
  | 'headings'
  | 'content'
  | 'images'
  | 'links'
  | 'schema'
  | 'performance'
  | 'mobile'
  | 'security'
  | 'crawlability'
  | 'indexability'

export interface Audit {
  id: string
  project_id: string
  status: AuditStatus
  score: number | null
  score_breakdown: ScoreBreakdown | null
  pages_crawled: number
  summary: AuditSummary | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AuditSummary {
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  top_issue: string
  biggest_opportunity: string
}

export interface AuditIssue {
  id: string
  audit_id: string
  severity: IssueSeverity
  category: IssueCategory
  title: string
  description: string
  affected_url: string | null
  current_value: string | null
  recommended: string
  impact_score: number
  effort_score: number
}

export interface IssueSummary {
  by_severity: Record<IssueSeverity, number>
  by_category: Record<IssueCategory, number>
}

export type KeywordIntent = 'informational' | 'transactional' | 'navigational' | 'commercial'

export interface KeywordResearch {
  id: string
  project_id: string
  status: string
  seed_keywords: string[] | null
  summary: KeywordResearchSummary | null
  created_at: string
  completed_at: string | null
}

export interface KeywordResearchSummary {
  total_keywords: number
  primary_keywords: number
  secondary_keywords: number
  long_tail_keywords: number
  total_monthly_volume: number
  avg_difficulty: number
  opportunities_found: number
  clusters_count: number
}

export interface Keyword {
  id: string
  research_id: string
  keyword: string
  search_volume: number | null
  keyword_difficulty: number | null
  cpc: number | null
  intent: KeywordIntent | null
  tier: string
  cluster_id: string | null
  mapped_url: string | null
  opportunity: boolean
}

export interface KeywordCluster {
  id: string
  research_id: string
  name: string
  intent: KeywordIntent | null
  keyword_count: number
  total_volume: number
  avg_difficulty: number | null
  priority_score: number | null
}

export interface Competitor {
  id: string
  project_id: string
  url: string
  name: string | null
  is_auto_detected: boolean
  created_at: string
}

export interface CompetitorAnalysis {
  id: string
  project_id: string
  status: string
  summary: CompetitorSummary | null
  created_at: string
  completed_at: string | null
}

export interface CompetitorSummary {
  keyword_gaps: number
  content_gaps: number
  total_missed_volume: number
  top_opportunity: string
}

export type GapType = 'keyword' | 'content' | 'backlink' | 'technical'

export interface CompetitorGap {
  id: string
  analysis_id: string
  competitor_id: string
  gap_type: GapType
  title: string
  description: string | null
  competitor_value: string | null
  your_value: string | null
  opportunity_score: number | null
  keyword: string | null
  search_volume: number | null
}

export interface ContentPlan {
  id: string
  project_id: string
  name: string
  status: string
  summary: ContentPlanSummary | null
  created_at: string
}

export interface ContentPlanSummary {
  total_items: number
  phase_30_day: number
  phase_60_day: number
  phase_90_day: number
}

export type ContentType =
  | 'blog_post'
  | 'landing_page'
  | 'faq_page'
  | 'pillar_page'
  | 'comparison_page'
  | 'how_to_guide'
  | 'case_study'

export interface ContentItem {
  id: string
  plan_id: string
  title: string
  content_type: ContentType
  target_keywords: string[]
  target_intent: KeywordIntent | null
  suggested_url: string | null
  word_count_min: number | null
  word_count_max: number | null
  outline: Record<string, unknown> | null
  internal_links: string[]
  phase: '30_day' | '60_day' | '90_day'
  priority: string
  impact_score: number | null
  effort_score: number | null
  status: string
}

export type ActionCategory =
  | 'technical_seo'
  | 'on_page_seo'
  | 'content'
  | 'link_building'
  | 'schema_markup'
  | 'performance'

export interface ActionItem {
  id: string
  project_id: string
  source_type: string
  category: ActionCategory
  title: string
  description: string
  affected_urls: string[]
  impact_score: number
  effort_score: number
  roi_score: number
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'open' | 'in_progress' | 'done' | 'dismissed'
  created_at: string
}

export interface ActionCounts {
  P0: number
  P1: number
  P2: number
  P3: number
  total: number
}

export interface PagedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
