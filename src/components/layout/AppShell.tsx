import { ChevronRight, X } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { getPageTitle, productMark } from '@/app/routes'
import { MobileNav, PrimaryNav } from '@/components/navigation/PrimaryNav'
import { PomodoroPlaceholder } from '@/components/pomodoro/PomodoroPlaceholder'
import { Button } from '@/components/ui/button'
import { useStudyData } from '@/lib/use-study-data'

function Brand() {
  const Mark = productMark

  return (
    <Link
      to="/"
      className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label="Study Reviewer home"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:-rotate-3">
        <Mark aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 truncate font-heading text-base font-semibold">Study Reviewer</span>
    </Link>
  )
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const title = getPageTitle(pathname)
  const isNested = title === 'Category detail' || title === 'Topic study'

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-base">
      <Link className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/">
        Home
      </Link>
      <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground/50" />
      {isNested && (
        <>
          <Link className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/categories">
            Categories
          </Link>
          <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground/50" />
        </>
      )}
      <span aria-current="page" className="font-medium text-primary">{title}</span>
    </nav>
  )
}

function StorageNotice() {
  const { storageNotice, clearStorageNotice } = useStudyData()
  if (!storageNotice) return null

  return (
    <div
      className="mt-5 flex items-start gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-base text-destructive"
      role={storageNotice.kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <p className="min-w-0 flex-1 leading-relaxed">{storageNotice.message} Changes stay in this session only until storage is available.</p>
      <Button aria-label="Dismiss storage notice" className="-mr-2 -mt-1 shrink-0" size="icon-sm" variant="ghost" onClick={clearStorageNotice}>
        <X aria-hidden="true" />
      </Button>
    </div>
  )
}

export function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-7 lg:px-10">
          <div className="flex items-center justify-between gap-6 py-3 sm:py-4">
            <Brand />
            <div className="flex min-w-0 flex-1 justify-end">
              <div className="hidden sm:block">
                <PrimaryNav />
              </div>
              <div className="sm:hidden">
                <MobileNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-8 pb-12 outline-none sm:px-7 sm:py-10 lg:px-10 lg:py-14 lg:pb-16">
        <div className="mb-6">
          <Breadcrumbs pathname={pathname} />
          <StorageNotice />
        </div>
        <Outlet />
        <div className="mt-8 flex justify-end">
          <PomodoroPlaceholder />
        </div>
      </main>
    </div>
  )
}
