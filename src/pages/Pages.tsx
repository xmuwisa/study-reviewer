import { ArrowUpRight, BookOpenCheck, FolderPlus, Layers3, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function SectionLabel({ children }: { children: string }) {
  return <p className="text-sm font-medium text-muted-foreground">{children}</p>
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function FoundationNote() {
  return (
    <Card className="bg-secondary/35">
      <CardContent className="flex gap-3 p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Sparkles aria-hidden="true" className="size-4" />
        </div>
        <div>
          <p className="text-base font-semibold text-secondary-foreground">The foundation is in place.</p>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">The next features will add local study data, categories, and review modes one small piece at a time.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeading
        eyebrow="Dashboard"
        title="Your study space is ready."
        description="A calm home for the questions, terms, and explanations you want to keep close. Start small; let the library grow with you."
      />

      <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="relative gap-3 p-6 sm:p-8">
            <Badge variant="secondary" className="w-fit border-0 bg-primary-foreground/10 text-primary-foreground">Application foundation</Badge>
            <CardTitle className="max-w-md text-2xl leading-tight text-primary-foreground sm:text-3xl">A softer way to return to what matters.</CardTitle>
            <CardDescription className="max-w-lg text-base leading-relaxed text-primary-foreground/75">Navigation, responsive layouts, and accessible foundations are ready. Your study library will grow from here.</CardDescription>
          </CardHeader>
          <CardContent className="relative p-6 pt-0 sm:p-8 sm:pt-0">
            <Link to="/categories" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-foreground px-4 py-2.5 text-base font-semibold text-primary transition-colors hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground/60">
              Explore the library shell
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader className="p-6 pb-4">
            <SectionLabel>What is here now</SectionLabel>
            <CardTitle className="mt-2 text-xl">A clear starting point</CardTitle>
            <CardDescription className="leading-relaxed">The foundation keeps the core paths visible without pretending the data features exist yet.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-1">
            <ul className="flex flex-col gap-4 text-base">
              <li className="flex items-start gap-3"><BookOpenCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" /><span>Focused navigation for your workspace</span></li>
              <li className="flex items-start gap-3"><Layers3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" /><span>Responsive category and topic pathways</span></li>
              <li className="flex items-start gap-3"><Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" /><span>Local-first foundations for future study data</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">
        <FoundationNote />
      </div>
    </div>
  )
}

export function CategoriesPage() {
  return (
    <div>
      <PageHeading eyebrow="Library" title="Categories" description="Keep broad subjects together, then make each one easier to return to with focused topics." />
      <div className="mt-9 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
        <Card className="bg-card/65">
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <FolderPlus aria-hidden="true" className="size-6" strokeWidth={1.7} />
            </div>
            <h2 className="mt-5 font-heading text-lg font-semibold">Your categories will live here.</h2>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-muted-foreground">Category creation and topic organization will build on this route.</p>
            <Button className="mt-5" variant="secondary" disabled>New category · coming soon</Button>
          </CardContent>
        </Card>
        <FoundationNote />
      </div>
    </div>
  )
}

export function CategoryDetailPage() {
  const { categoryId } = useParams()

  return (
    <div>
      <PageHeading eyebrow="Category detail" title="A place for one subject." description={`This detail view is ready for a category${categoryId ? ` (${categoryId})` : ''}. Topics and entry management will build on this boundary.`} />
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <Card className="bg-card/80">
          <CardHeader className="p-6">
            <Badge variant="outline" className="w-fit">Categories</Badge>
            <CardTitle className="mt-3 text-xl">Topic organization</CardTitle>
            <CardDescription className="leading-relaxed">Search, sorting, counts, and safe category flows will be added without changing this route.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="p-6">
            <Badge variant="outline" className="w-fit">Study entries</Badge>
            <CardTitle className="mt-3 text-xl">Study entries</CardTitle>
            <CardDescription className="leading-relaxed">Questions, answers, and List Mode will build on the same category and topic boundary.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export function TopicStudyPage() {
  return (
    <div>
      <PageHeading eyebrow="Topic study" title="A focused review path." description="This is the future home for question-and-answer entries, List Mode, and Flashcard Mode." />
      <Card className="mt-9 bg-accent/35">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookOpenCheck aria-hidden="true" className="size-5" /></div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-accent-foreground">Study modes are deliberately next.</h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">The route is established so local data and study behavior can be added without reshaping the application shell.</p>
            </div>
          </div>
          <Link to="/categories" className="mt-6 inline-flex min-h-11 items-center rounded-xl px-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Back to categories</Link>
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div>
      <PageHeading eyebrow="Workspace" title="Settings" description="A small home for preferences that keep your review environment comfortable and local." />
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <Card className="bg-card/80">
          <CardHeader className="p-6">
            <SectionLabel>Coming later</SectionLabel>
            <CardTitle className="mt-2 text-xl">Appearance and study preferences</CardTitle>
            <CardDescription className="leading-relaxed">Themes, default study behavior, and accessibility preferences will arrive once local persistence is established.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="p-6">
            <SectionLabel>Local-first</SectionLabel>
            <CardTitle className="mt-2 text-xl">Your browser, your notes</CardTitle>
            <CardDescription className="leading-relaxed">Study Reviewer is designed to keep personal study data on this device. Backup and restore will be added before a substantial library is encouraged.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="max-w-xl">
      <PageHeading eyebrow="Not found" title="That page is not part of the study path." description="Use the navigation to return to your dashboard or library." />
      <Link to="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Return home</Link>
    </div>
  )
}
