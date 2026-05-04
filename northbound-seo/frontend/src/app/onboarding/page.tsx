'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { projectsApi, auditsApi, competitorsApi } from '@/lib/api'
import { setCurrentProjectId } from '@/lib/utils'

const STEPS = ['Website', 'Business Info', 'Competitors']

interface FormData {
  url: string
  name: string
  industry: string
  geography: string
  revenue_model: string
  competitors: string[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<FormData>({
    url: '',
    name: '',
    industry: '',
    geography: 'national',
    revenue_model: '',
    competitors: ['', '', ''],
  })

  const updateData = (field: keyof FormData, value: string | string[]) =>
    setData((prev) => ({ ...prev, [field]: value }))

  const updateCompetitor = (idx: number, value: string) => {
    const comps = [...data.competitors]
    comps[idx] = value
    setData((prev) => ({ ...prev, competitors: comps }))
  }

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!data.url) { setError('Please enter your website URL.'); return false }
      if (!data.name) { setError('Please enter your business name.'); return false }
      try { new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`) }
      catch { setError('Please enter a valid URL.'); return false }
    }
    if (step === 1) {
      if (!data.industry) { setError('Please select an industry.'); return false }
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep(step + 1)
  }

  const handleBack = () => setStep(step - 1)

  const handleSubmit = async (skipCompetitors = false) => {
    setLoading(true)
    setError('')
    try {
      const url = data.url.startsWith('http') ? data.url : `https://${data.url}`
      const project = await projectsApi.create({
        name: data.name,
        url,
        industry: data.industry || null,
        geography: data.geography,
        revenue_model: data.revenue_model || null,
      })

      setCurrentProjectId(project.id)

      // Trigger first audit
      await auditsApi.trigger(project.id)

      // Add competitors if provided
      if (!skipCompetitors) {
        const validComps = data.competitors.filter((c) => c.trim())
        await Promise.allSettled(
          validComps.map((url) =>
            competitorsApi.add(project.id, {
              url: url.startsWith('http') ? url : `https://${url}`,
            })
          )
        )
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#4f9cf7 1px, transparent 1px), linear-gradient(90deg, #4f9cf7 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <TrendingUp className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold font-mono text-accent">Northbound SEO</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-colors ${
                  i < step
                    ? 'bg-accent2 border-accent2 text-bg'
                    : i === step
                    ? 'bg-accent border-accent text-bg'
                    : 'bg-surface2 border-border text-dim'
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-mono hidden sm:block ${
                  i === step ? 'text-text' : 'text-dim'
                }`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < step ? 'bg-accent2' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xl">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold font-mono text-text mb-1">
                  Tell us about your website
                </h2>
                <p className="text-xs text-dim font-mono">
                  We'll analyze your site and generate a personalized SEO strategy.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  placeholder="https://yourbusiness.com"
                  value={data.url}
                  onChange={(e) => updateData('url', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold font-mono text-text mb-1">
                  Business details
                </h2>
                <p className="text-xs text-dim font-mono">
                  Help us tailor keyword recommendations to your business.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select value={data.industry} onValueChange={(v) => updateData('industry', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Agency">Agency</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                    <SelectItem value="Local Business">Local Business</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target Geography</Label>
                <Select value={data.geography} onValueChange={(v) => updateData('geography', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Revenue Model</Label>
                <Select value={data.revenue_model} onValueChange={(v) => updateData('revenue_model', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Lead Gen">Lead Gen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold font-mono text-text mb-1">
                  Add competitors{' '}
                  <span className="text-dim font-normal text-xs">(optional)</span>
                </h2>
                <p className="text-xs text-dim font-mono">
                  We'll analyze gaps between you and your top competitors.
                </p>
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <Label>Competitor {i + 1}</Label>
                    <Input
                      placeholder="https://competitor.com"
                      value={data.competitors[i]}
                      onChange={(e) => updateCompetitor(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
              <p className="text-xs text-danger font-mono">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <Button onClick={handleNext} className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button onClick={() => handleSubmit(false)} disabled={loading} className="gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Launch SEO Analysis
                </Button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="text-xs text-dim hover:text-text font-mono transition-colors"
                >
                  Skip competitors for now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
