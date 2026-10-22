import { ChevronRight } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { getPageTitle, productMark } from '@/app/routes'
import { PrimaryNav } from '@/components/navigation/PrimaryNav'
import { PomodoroPlaceholder } from '@/components/pomodoro/PomodoroPlaceholder'

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
      <span className="min-w-0">
        <span className="block truncate font-heading text-base font-semibold">Study Reviewer</span>
        <span className="block text-sm text-muted-foreground">Quiet study space</span>
      </span>
    </Link>
  )
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const title = getPageTitle(pathname)
  const isNested = title === 'Category detail' || title === 'Topic study'

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/">
        Home
      </Link>
      <ChevronRight aria-hidden="true" className="size-3" />
      {isNested && (
        <>
          <Link className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/categories">
            Categories
          </Link>
          <ChevronRight aria-hidden="true" className="size-3" />
        </>
      )}
      <span aria-current="page" className="text-foreground">{title}</span>
    </nav>
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3 sm:flex-nowrap sm:py-4">
            <Brand />
            <div className="min-w-0 flex-1 overflow-x-auto sm:justify-end sm:flex">
              <PrimaryNav />
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-8 pb-12 outline-none sm:px-7 sm:py-10 lg:px-10 lg:py-14 lg:pb-16">
        <div className="mb-8">
          <Breadcrumbs pathname={pathname} />
          <p className="mt-2 text-base text-muted-foreground">Make a little room for what you want to remember.</p>
        </div>
        <Outlet />
        <div className="mt-8 flex justify-end">
          <PomodoroPlaceholder />
        </div>
      </main>
    </div>
  )
}
