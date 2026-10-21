import {
  ArrowLeft,
  ArrowDownAZ,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FolderPlus,
  FolderOpen,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Shuffle,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, KeyboardEvent, ReactNode, SetStateAction } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { CollectionDeleteDialog } from '@/components/study/CollectionDeleteDialog'
import { CollectionFormDialog, type CollectionFormValues } from '@/components/study/CollectionFormDialog'
import { EntryDeleteDialog } from '@/components/study/EntryDeleteDialog'
import { EntryFormDialog, type EntryFormValues } from '@/components/study/EntryFormDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { findCategory, findTopic, getEntriesForTopic, getTopicsForCategory, type Category, type Entry, type FlashcardFrontSide, type StudyMode, type Topic } from '@/lib/study-data'
import { useStudyData } from '@/lib/use-study-data'
import {
  filterAndSortCategories,
  filterAndSortEntries,
  filterAndSortTopics,
  type CategorySort,
  type EntrySort,
  type TopicSort,
} from '@/lib/study-operations'

const EMPTY_FORM_VALUES: CollectionFormValues = { name: '', description: '' }
const EMPTY_ENTRY_FORM_VALUES: EntryFormValues = { type: 'question-answer', question: '', answer: '' }

function SectionLabel({ children }: { children: string }) {
  return <p className="text-base font-medium text-muted-foreground">{children}</p>
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
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
          <p className="text-base font-semibold text-secondary-foreground">Your study space is taking shape.</p>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">Categories and topics now provide a calm structure for the questions and answers that arrive next.</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatFocusMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

function formatActivityDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp)
}

function DashboardStatCard({
  label,
  value,
  description,
  icon,
  to,
}: {
  label: string
  value: string | number
  description: string
  icon: ReactNode
  to?: string
}) {
  const card = (
      <Card className="h-full bg-card/80 transition-colors group-hover:bg-card">
        <CardHeader className="flex-row items-start justify-between gap-3 p-5 pb-3">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-2 text-3xl tracking-tight">{value}</CardTitle>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
  )

  return to ? <Link to={to} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{card}</Link> : card
}

function SortSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={<Button id={id} aria-label={label} size="icon-sm" variant="ghost" />}
            />
          }
        >
          <ArrowDownAZ aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>{`${label}: ${selectedOption?.label ?? ''}`}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CollectionToolbar({
  search,
  onSearchChange,
  sort,
  sortOptions,
  onSortChange,
  placeholder,
  label,
  rightControls,
}: {
  search: string
  onSearchChange: (value: string) => void
  sort: string
  sortOptions: Array<{ value: string; label: string }>
  onSortChange: (value: string) => void
  placeholder: string
  label: string
  rightControls?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card/60 p-2 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={label} className="h-11 border-0 bg-background/70 pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={placeholder} />
        </div>
        <SortSelect id={`${label.toLowerCase().replaceAll(' ', '-')}-sort`} label={`Sort ${label.toLowerCase()}`} value={sort} options={sortOptions} onChange={onSortChange} />
      </div>
      {rightControls && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{rightControls}</div>}
    </div>
  )
}

function CountLabel({ count, singular, plural }: { count: number; singular: string; plural: string }) {
  return <span>{count} {count === 1 ? singular : plural}</span>
}

function EntryActions({ entry, onEdit, onDelete }: { entry: Entry; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0" role="group" aria-label="Entry actions">
      <Button aria-label={`Edit entry: ${entry.question}`} size="icon-sm" variant="ghost" onClick={onEdit}>
        <Pencil aria-hidden="true" />
      </Button>
      <Button aria-label={`Delete entry: ${entry.question}`} size="icon-sm" variant="ghost" onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
}

function EntryEmptyState({ hasSearch, onCreate, onClearSearch }: { hasSearch: boolean; onCreate: () => void; onClearSearch: () => void }) {
  return (
    <Card className="bg-card/60">
      <Empty className="min-h-64 p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon"><BookOpenCheck aria-hidden="true" /></EmptyMedia>
          <EmptyTitle>{hasSearch ? 'No entries found' : 'No entries yet'}</EmptyTitle>
          <EmptyDescription>
            {hasSearch ? 'Try a different search term or clear the search to see every question.' : 'Add your first question and answer to start studying this topic.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {hasSearch ? <Button variant="outline" onClick={onClearSearch}>Clear search</Button> : <Button onClick={onCreate}><Plus aria-hidden="true" data-icon="inline-start" /> Create entry</Button>}
        </EmptyContent>
      </Empty>
    </Card>
  )
}

function EntryList({
  entries,
  hiddenLeft,
  hiddenRight,
  onToggleLeft,
  onToggleRight,
  onEdit,
  onDelete,
}: {
  entries: Entry[]
  hiddenLeft: Set<string>
  hiddenRight: Set<string>
  onToggleLeft: (entryId: string) => void
  onToggleRight: (entryId: string) => void
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => {
        const leftHidden = hiddenLeft.has(entry.id)
        const rightHidden = hiddenRight.has(entry.id)
        const leftLabel = entry.type === 'term-definition' ? 'Term' : 'Question'
        const rightLabel = entry.type === 'term-definition' ? 'Definition' : 'Answer'

        return (
          <Card key={entry.id} className="relative overflow-hidden bg-transparent py-0">
            <CardContent className="p-0">
              <div className="grid gap-px bg-background/70 sm:grid-cols-2">
                <div className="min-w-0 bg-card">
                  <div className="rounded-t-2xl bg-secondary/55 px-5 py-3 text-base font-semibold text-foreground sm:rounded-tr-none">{leftLabel}</div>
                  <div className="p-5">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto min-h-20 w-full justify-start whitespace-normal rounded-xl bg-card p-5 text-left text-base font-normal leading-relaxed hover:bg-muted/20"
                      aria-expanded={!leftHidden}
                      aria-label={`${leftHidden ? 'Reveal' : 'Hide'} ${leftLabel.toLowerCase()} for ${entry.question}`}
                      onClick={() => onToggleLeft(entry.id)}
                    >
                      {leftHidden ? <span className="text-muted-foreground">{leftLabel} hidden · Reveal</span> : <span className="whitespace-pre-wrap">{entry.question}</span>}
                    </Button>
                  </div>
                </div>
                <div className="min-w-0 bg-card">
                  <div className="rounded-t-none bg-secondary/55 px-5 py-3 text-base font-semibold text-foreground sm:rounded-tl-none sm:rounded-tr-2xl">{rightLabel}</div>
                  <div className="p-5">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto min-h-20 w-full justify-start whitespace-normal rounded-xl bg-card p-5 text-left text-base font-normal leading-relaxed hover:bg-muted/20"
                      aria-expanded={!rightHidden}
                      aria-label={`${rightHidden ? 'Reveal' : 'Hide'} ${rightLabel.toLowerCase()} for ${entry.question}`}
                      onClick={() => onToggleRight(entry.id)}
                    >
                      {rightHidden ? <span className="text-muted-foreground">{rightLabel} hidden · Reveal</span> : <span className="whitespace-pre-wrap">{entry.answer}</span>}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-4 opacity-100 sm:opacity-0 sm:transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100">
                <EntryActions entry={entry} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function getFlashcardLabel(entry: Entry, side: FlashcardFrontSide) {
  if (entry.type === 'term-definition') return side === 'left' ? 'Term' : 'Definition'
  return side === 'left' ? 'Question' : 'Answer'
}

function getFlashcardText(entry: Entry, side: FlashcardFrontSide) {
  return side === 'left' ? entry.question : entry.answer
}

function FlashcardMode({
  entries,
  frontByEntryType,
  onEdit,
  onDelete,
}: {
  entries: Entry[]
  frontByEntryType: Record<Entry['type'], FlashcardFrontSide>
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}) {
  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries])
  const entryIdentity = entryIds.join('|')
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(() => entryIds[0] ?? null)
  const [flipped, setFlipped] = useState(false)
  const [sessionOrder, setSessionOrder] = useState<string[] | null>(null)
  const previousEntryIdsRef = useRef(entryIds)
  const currentEntryIdRef = useRef(currentEntryId)
  currentEntryIdRef.current = currentEntryId

  useEffect(() => {
    const previousIndex = previousEntryIdsRef.current.indexOf(currentEntryIdRef.current ?? '')
    const nextEntryId = entryIds.includes(currentEntryIdRef.current ?? '')
      ? currentEntryIdRef.current
      : entryIds[Math.min(Math.max(previousIndex, 0), entryIds.length - 1)] ?? null

    currentEntryIdRef.current = nextEntryId
    setCurrentEntryId(nextEntryId)
    setFlipped(false)
    setSessionOrder(null)
    previousEntryIdsRef.current = entryIds
  }, [entryIdentity, entryIds])

  const orderedEntries = useMemo(() => {
    if (!sessionOrder) return entries

    const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
    return sessionOrder.flatMap((entryId) => {
      const entry = entriesById.get(entryId)
      return entry ? [entry] : []
    })
  }, [entries, sessionOrder])

  const currentIndex = Math.max(0, orderedEntries.findIndex((entry) => entry.id === currentEntryId))
  const currentEntry = orderedEntries[currentIndex]

  function moveTo(index: number) {
    const nextEntry = orderedEntries[index]
    if (!nextEntry) return
    setCurrentEntryId(nextEntry.id)
    setFlipped(false)
  }

  function shuffleCards() {
    const shuffled = entries.map((entry) => entry.id)
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      const currentEntryId = shuffled[index]
      shuffled[index] = shuffled[randomIndex]
      shuffled[randomIndex] = currentEntryId
    }
    setSessionOrder(shuffled)
    setCurrentEntryId(shuffled[0] ?? null)
    setFlipped(false)
  }

  if (!currentEntry) return null

  const defaultFront: FlashcardFrontSide = currentEntry.type === 'term-definition' ? 'right' : 'left'
  const frontSide = frontByEntryType[currentEntry.type] ?? defaultFront
  const backSide: FlashcardFrontSide = frontSide === 'left' ? 'right' : 'left'
  const visibleSide = flipped ? backSide : frontSide
  const visibleLabel = getFlashcardLabel(currentEntry, visibleSide)
  const visibleText = getFlashcardText(currentEntry, visibleSide)

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden bg-card/80">
        <CardHeader className="flex-row items-start justify-between gap-4 p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit border-0 bg-secondary/70">{flipped ? 'Back' : 'Front'}</Badge>
            <CardTitle className="text-2xl sm:text-3xl">{visibleLabel}</CardTitle>
          </div>
          <EntryActions entry={currentEntry} onEdit={() => onEdit(currentEntry)} onDelete={() => onDelete(currentEntry)} />
        </CardHeader>
        <CardContent className="p-0">
          <button
            type="button"
            className="flex min-h-72 w-full flex-col items-center justify-center gap-6 bg-card px-6 py-12 text-center transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-96 sm:px-16"
            aria-label={`${flipped ? 'Show front' : 'Show back'} of ${visibleLabel.toLowerCase()}`}
            aria-keyshortcuts="Space ArrowLeft ArrowRight"
            onClick={() => setFlipped((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveTo(currentIndex - 1)
              }
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveTo(currentIndex + 1)
              }
            }}
          >
            <span className="text-base font-semibold uppercase tracking-[0.16em] text-primary">{visibleLabel}</span>
            <span className="max-w-3xl whitespace-pre-wrap text-2xl font-semibold leading-tight text-foreground sm:text-4xl">{visibleText}</span>
            <span className="text-base text-muted-foreground">Click or press Space to flip</span>
          </button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <Button type="button" variant="secondary" disabled={currentIndex === 0} onClick={() => moveTo(currentIndex - 1)}>
            <ChevronLeft aria-hidden="true" data-icon="inline-start" /> Previous
          </Button>
          <Button type="button" variant="secondary" disabled={currentIndex === orderedEntries.length - 1} onClick={() => moveTo(currentIndex + 1)}>
            Next <ChevronRight aria-hidden="true" data-icon="inline-end" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="text-base font-medium text-muted-foreground" aria-live="polite">Card {currentIndex + 1} of {orderedEntries.length}</p>
          <Button type="button" variant="ghost" onClick={shuffleCards}>
            <Shuffle aria-hidden="true" data-icon="inline-start" /> Shuffle
          </Button>
          <Button type="button" variant="ghost" onClick={() => setFlipped((current) => !current)}>
            <RotateCcw aria-hidden="true" data-icon="inline-start" /> Flip
          </Button>
        </div>
      </div>
    </div>
  )
}

function CategoryCard({
  category,
  topicCount,
  entryCount,
  onOpen,
  onEdit,
  onDelete,
}: {
  category: Category
  topicCount: number
  entryCount: number
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <Card role="link" tabIndex={0} aria-label={`Open category ${category.name}`} onClick={onOpen} onKeyDown={handleCardKeyDown} className="group cursor-pointer gap-0 py-0 bg-card/80 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <CardHeader className="gap-3 p-5 pb-3 pl-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-xl transition-colors group-hover:text-primary">{category.name}</CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-0">
            <Button aria-label={`Edit ${category.name}`} size="icon-sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onEdit() }}>
              <Pencil aria-hidden="true" />
            </Button>
            <Button aria-label={`Delete ${category.name}`} size="icon-sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onDelete() }}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
        <CardDescription>{category.description || 'A focused place for related study topics.'}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4 p-5 pt-0 pl-7">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-muted-foreground">
          <CountLabel count={topicCount} singular="topic" plural="topics" />
          <CountLabel count={entryCount} singular="entry" plural="entries" />
        </div>
      </CardContent>
    </Card>
  )
}

function TopicCard({
  topic,
  entryCount,
  onOpen,
  onEdit,
  onDelete,
}: {
  topic: Topic
  entryCount: number
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <Card role="link" tabIndex={0} aria-label={`Open topic ${topic.name}`} onClick={onOpen} onKeyDown={handleCardKeyDown} className="group cursor-pointer gap-0 py-0 bg-card/80 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <CardHeader className="gap-3 p-5 pb-3 pl-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-xl transition-colors group-hover:text-primary">{topic.name}</CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-0">
            <Button aria-label={`Edit ${topic.name}`} size="icon-sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onEdit() }}>
              <Pencil aria-hidden="true" />
            </Button>
            <Button aria-label={`Delete ${topic.name}`} size="icon-sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onDelete() }}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
        <CardDescription>{topic.description || 'A focused path for questions and explanations.'}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4 p-5 pt-0 pl-7 text-base text-muted-foreground">
        <CountLabel count={entryCount} singular="question" plural="questions" />
      </CardContent>
    </Card>
  )
}

function EmptyCollection({
  kind,
  hasSearch,
  onCreate,
  onClearSearch,
}: {
  kind: 'category' | 'topic'
  hasSearch: boolean
  onCreate: () => void
  onClearSearch: () => void
}) {
  const isCategory = kind === 'category'
  return (
    <Card className="bg-card/60">
      <Empty className="min-h-64 p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {isCategory ? <FolderPlus aria-hidden="true" /> : <Layers3 aria-hidden="true" />}
          </EmptyMedia>
          <EmptyTitle>{hasSearch ? `No ${isCategory ? 'categories' : 'topics'} found` : `No ${isCategory ? 'categories' : 'topics'} yet`}</EmptyTitle>
          <EmptyDescription>
            {hasSearch ? 'Try a different search term or clear the search to see everything.' : `Create your first ${kind} to give your study library a little structure.`}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {hasSearch ? <Button variant="outline" onClick={onClearSearch}>Clear search</Button> : <Button onClick={onCreate}><Plus aria-hidden="true" data-icon="inline-start" /> Create {kind}</Button>}
        </EmptyContent>
      </Empty>
    </Card>
  )
}

export function DashboardPage() {
  const { data } = useStudyData()
  const categoryById = useMemo(() => new Map(data.categories.map((category) => [category.id, category])), [data.categories])
  const topicById = useMemo(() => new Map(data.topics.map((topic) => [topic.id, topic])), [data.topics])
  const recentItems = useMemo(() => data.activity.recentlyAccessed.flatMap((activity) => {
    if (activity.type === 'category') {
      const category = categoryById.get(activity.recordId)
      return category ? [{
        id: activity.recordId,
        name: category.name,
        kind: 'Category',
        detail: category.description || 'Category overview',
        accessedAt: activity.accessedAt,
        to: `/categories/${category.id}`,
      }] : []
    }

    const topic = topicById.get(activity.recordId)
    const category = topic ? categoryById.get(topic.categoryId) : undefined
    return topic && category ? [{
      id: activity.recordId,
      name: topic.name,
      kind: 'Topic',
      detail: category.name,
      accessedAt: activity.accessedAt,
      to: `/categories/${category.id}/topics/${topic.id}`,
    }] : []
  }), [categoryById, data.activity.recentlyAccessed, topicById])

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeading
        title="Your study space, at a glance."
        description="See the shape of your local library, return to recent study paths, and keep moving through what you want to remember."
      />

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard label="Categories" value={data.categories.length} description="Organized study areas" icon={<FolderOpen aria-hidden="true" />} to="/categories" />
        <DashboardStatCard label="Topics" value={data.topics.length} description="Focused paths to revisit" icon={<Layers3 aria-hidden="true" />} to="/categories" />
        <DashboardStatCard label="Study entries" value={data.entries.length} description="Questions, terms, and answers" icon={<BookOpenCheck aria-hidden="true" />} to="/categories" />
        <DashboardStatCard label="Focus sessions" value={data.activity.completedFocusSessions} description="Completed Pomodoro sessions" icon={<CheckCircle2 aria-hidden="true" />} />
        <DashboardStatCard label="Focus time" value={formatFocusMinutes(data.activity.completedFocusMinutes)} description="Recorded completed minutes" icon={<Clock3 aria-hidden="true" />} />
      </div>

      <Card className="mt-8 bg-card/80">
        <CardHeader className="flex-row items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <CardDescription>Recent activity</CardDescription>
            <CardTitle className="mt-2 text-2xl">Return to a familiar path</CardTitle>
          </div>
          {recentItems.length > 0 && <Badge variant="secondary">{recentItems.length} recent</Badge>}
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {recentItems.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {recentItems.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  to={item.to}
                  className="group flex min-w-0 items-center justify-between gap-4 rounded-xl bg-background/70 px-4 py-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-foreground">{item.name}</span>
                    <span className="mt-1 block truncate text-base text-muted-foreground">{item.kind} · {item.detail}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatActivityDate(item.accessedAt)}</span>
                    <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty className="min-h-56 rounded-2xl bg-background/50 p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Sparkles aria-hidden="true" /></EmptyMedia>
                <EmptyTitle>No recent study paths yet</EmptyTitle>
                <EmptyDescription>Open a category or topic and it will appear here for an easy return.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link to="/categories" />}>Open categories <ArrowUpRight aria-hidden="true" data-icon="inline-end" /></Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function CategoriesPage() {
  const navigate = useNavigate()
  const { data, createCategory, updateCategory, deleteCategory, openCategory } = useStudyData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CategorySort>('alphabetical')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const categories = useMemo(() => filterAndSortCategories(data, search, sort), [data, search, sort])

  useEffect(() => {
    if (searchParams.get('action') !== 'create') return
    setEditingCategory(null)
    setFormOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  function openCategoryPage(categoryId: string) {
    openCategory(categoryId)
    navigate(`/categories/${categoryId}`)
  }

  function showCreateForm() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function submitCategory(values: CollectionFormValues) {
    return editingCategory ? updateCategory(editingCategory.id, values) : createCategory(values)
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading title="Categories" description="Keep broad subjects together, then make each one easier to return to with focused topics." />
        <Button className="w-full sm:w-auto" onClick={showCreateForm}><Plus aria-hidden="true" data-icon="inline-start" /> New category</Button>
      </div>

      <div className="mt-9 flex flex-col gap-5">
        <CollectionToolbar search={search} onSearchChange={setSearch} sort={sort} onSortChange={(value) => setSort(value as CategorySort)} sortOptions={[{ value: 'alphabetical', label: 'Name: A–Z' }, { value: 'reverse-alphabetical', label: 'Name: Z–A' }, { value: 'recent', label: 'Most recent' }]} placeholder="Search" label="Category search" />
        {categories.length === 0 ? (
          <EmptyCollection kind="category" hasSearch={Boolean(search.trim())} onCreate={showCreateForm} onClearSearch={() => setSearch('')} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {categories.map((category) => {
              const topicCount = getTopicsForCategory(data, category.id).length
              const entryCount = getTopicsForCategory(data, category.id).reduce((total, topic) => total + getEntriesForTopic(data, topic.id).length, 0)
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  topicCount={topicCount}
                  entryCount={entryCount}
                  onOpen={() => openCategoryPage(category.id)}
                  onEdit={() => { setEditingCategory(category); setFormOpen(true) }}
                  onDelete={() => setDeletingCategory(category)}
                />
              )
            })}
          </div>
        )}
      </div>

      <CollectionFormDialog
        kind="category"
        open={formOpen}
        initialValues={editingCategory ? { name: editingCategory.name, description: editingCategory.description } : EMPTY_FORM_VALUES}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingCategory(null) }}
        onSubmit={submitCategory}
      />
      {deletingCategory && (
        <CollectionDeleteDialog
          kind="category"
          name={deletingCategory.name}
          topicCount={getTopicsForCategory(data, deletingCategory.id).length}
          entryCount={getTopicsForCategory(data, deletingCategory.id).reduce((total, topic) => total + getEntriesForTopic(data, topic.id).length, 0)}
          open
          onOpenChange={(open) => { if (!open) setDeletingCategory(null) }}
          onConfirm={() => deleteCategory(deletingCategory.id)}
        />
      )}

      <div className="mt-5"><FoundationNote /></div>
    </div>
  )
}

export function CategoryDetailPage() {
  const { categoryId = '' } = useParams()
  const navigate = useNavigate()
  const { data, createTopic, updateTopic, deleteTopic, openCategory, openTopic } = useStudyData()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = findCategory(data, categoryId)
  const openedCategoryId = useRef<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<TopicSort>('alphabetical')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null)
  const topics = useMemo(() => filterAndSortTopics(data, categoryId, search, sort), [categoryId, data, search, sort])

  useEffect(() => {
    if (category && openedCategoryId.current !== category.id) {
      openedCategoryId.current = category.id
      openCategory(category.id)
    }
  }, [category, openCategory])

  useEffect(() => {
    if (searchParams.get('action') !== 'create') return
    setEditingTopic(null)
    setFormOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  if (!category) return <NotFoundPage />

  function openTopicPage(topicId: string) {
    openTopic(topicId)
    navigate(`/categories/${categoryId}/topics/${topicId}`)
  }

  function showCreateForm() {
    setEditingTopic(null)
    setFormOpen(true)
  }

  function submitTopic(values: CollectionFormValues) {
    return editingTopic ? updateTopic(editingTopic.id, values) : createTopic(categoryId, values)
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading title={category.name} description={category.description || 'Organize focused study topics in this category.'} />
        <Button className="w-full sm:w-auto" onClick={showCreateForm}><Plus aria-hidden="true" data-icon="inline-start" /> New topic</Button>
      </div>

      <div className="mt-7 flex flex-col gap-5">
        <CollectionToolbar search={search} onSearchChange={setSearch} sort={sort} onSortChange={(value) => setSort(value as TopicSort)} sortOptions={[{ value: 'alphabetical', label: 'Name: A–Z' }, { value: 'reverse-alphabetical', label: 'Name: Z–A' }, { value: 'recent', label: 'Most recent' }]} placeholder="Search" label="Topic search" />
        {topics.length === 0 ? (
          <EmptyCollection kind="topic" hasSearch={Boolean(search.trim())} onCreate={showCreateForm} onClearSearch={() => setSearch('')} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                entryCount={getEntriesForTopic(data, topic.id).length}
                onOpen={() => openTopicPage(topic.id)}
                onEdit={() => { setEditingTopic(topic); setFormOpen(true) }}
                onDelete={() => setDeletingTopic(topic)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link to="/categories" className="inline-flex min-h-9 items-center gap-2 rounded-lg text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><ArrowLeft aria-hidden="true" data-icon="inline-start" /> Back to categories</Link>
      </div>

      <CollectionFormDialog
        kind="topic"
        open={formOpen}
        initialValues={editingTopic ? { name: editingTopic.name, description: editingTopic.description } : EMPTY_FORM_VALUES}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingTopic(null) }}
        onSubmit={submitTopic}
      />
      {deletingTopic && (
        <CollectionDeleteDialog
          kind="topic"
          name={deletingTopic.name}
          entryCount={getEntriesForTopic(data, deletingTopic.id).length}
          open
          onOpenChange={(open) => { if (!open) setDeletingTopic(null) }}
          onConfirm={() => deleteTopic(deletingTopic.id)}
        />
      )}
    </div>
  )
}

export function TopicStudyPage() {
  const { categoryId = '', topicId = '' } = useParams()
  const { data, createEntry, updateEntry, deleteEntry, openTopic } = useStudyData()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = findCategory(data, categoryId)
  const topic = findTopic(data, topicId)
  const openedTopicId = useRef<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<EntrySort>('newest')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<Entry | null>(null)
  const [studyMode, setStudyMode] = useState<StudyMode>(() => data.settings.defaultStudyMode)
  const topicEntryIds = useMemo(() => getEntriesForTopic(data, topicId).map((entry) => entry.id), [data, topicId])
  const [hiddenLeft, setHiddenLeft] = useState<Set<string>>(() => new Set())
  const [hiddenRight, setHiddenRight] = useState<Set<string>>(() => new Set(topicEntryIds))
  const [visibilityTopicId, setVisibilityTopicId] = useState(topicId)
  const topicEntryIdsRef = useRef(topicEntryIds)
  const entries = useMemo(() => filterAndSortEntries(data, topicId, search, sort), [data, search, sort, topicId])

  topicEntryIdsRef.current = topicEntryIds

  useEffect(() => {
    if (topic && topic.categoryId === categoryId && openedTopicId.current !== topic.id) {
      openedTopicId.current = topic.id
      openTopic(topic.id)
    }
  }, [categoryId, openTopic, topic])

  useEffect(() => {
    setVisibilityTopicId(topicId)
    setHiddenLeft(new Set())
    setHiddenRight(new Set(topicEntryIdsRef.current))
  }, [topicId])

  useEffect(() => {
    if (searchParams.get('action') !== 'create') return
    setEditingEntry(null)
    setFormOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  if (!category || !topic || topic.categoryId !== category.id) return <NotFoundPage />
  const currentTopic = topic

  function showCreateForm() {
    setEditingEntry(null)
    setFormOpen(true)
  }

  function submitEntry(values: EntryFormValues) {
    return editingEntry ? updateEntry(editingEntry.id, values) : createEntry(currentTopic.id, values)
  }

  function toggleHiddenEntry(setHiddenEntries: Dispatch<SetStateAction<Set<string>>>, entryId: string) {
    setHiddenEntries((current) => {
      const next = new Set(current)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  function toggleAllHidden(setHiddenEntries: Dispatch<SetStateAction<Set<string>>>, hiddenEntries: Set<string>) {
    const allEntriesAreHidden = entries.length > 0 && entries.every((entry) => hiddenEntries.has(entry.id))
    setHiddenEntries(allEntriesAreHidden ? new Set() : new Set(entries.map((entry) => entry.id)))
  }

  const effectiveHiddenLeft = visibilityTopicId === topicId ? hiddenLeft : new Set<string>()
  const effectiveHiddenRight = visibilityTopicId === topicId ? hiddenRight : new Set(topicEntryIds)
  const allLeftHidden = entries.length > 0 && entries.every((entry) => effectiveHiddenLeft.has(entry.id))
  const allRightHidden = entries.length > 0 && entries.every((entry) => effectiveHiddenRight.has(entry.id))

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading title={topic.name} description={topic.description || 'A focused review path for questions and explanations.'} />
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <ToggleGroup
            value={[studyMode]}
            onValueChange={(value) => {
              const nextMode = value[0]
              if (nextMode === 'list' || nextMode === 'flashcard') setStudyMode(nextMode)
            }}
            aria-label="Study mode"
            className="w-full justify-end sm:w-auto"
          >
            <ToggleGroupItem value="list" aria-label="List mode" className="flex-1 sm:flex-none">
              <Layers3 aria-hidden="true" data-icon="inline-start" /> List
            </ToggleGroupItem>
            <ToggleGroupItem value="flashcard" aria-label="Flashcard mode" className="flex-1 sm:flex-none">
              <BookOpenCheck aria-hidden="true" data-icon="inline-start" /> Flashcards
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="text-base text-muted-foreground sm:text-right">
            <CountLabel count={getEntriesForTopic(data, topic.id).length} singular="question" plural="questions" />
          </div>
          <Button className="w-full sm:w-auto" onClick={showCreateForm}><Plus aria-hidden="true" data-icon="inline-start" /> New entry</Button>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-5">
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={(value) => setSort(value as EntrySort)}
          sortOptions={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'alphabetical', label: 'Question: A–Z' }]}
          placeholder="Search"
          label="Entry search"
          rightControls={studyMode === 'list' ? (
            <>
              <Button type="button" size="sm" variant={allLeftHidden ? 'ghost' : 'secondary'} aria-pressed={!allLeftHidden} disabled={entries.length === 0} onClick={() => toggleAllHidden(setHiddenLeft, effectiveHiddenLeft)}>
                {allLeftHidden ? <Eye aria-hidden="true" data-icon="inline-start" /> : <EyeOff aria-hidden="true" data-icon="inline-start" />}
                {allLeftHidden ? 'Reveal Left' : 'Hide Left'}
              </Button>
              <Button type="button" size="sm" variant={allRightHidden ? 'ghost' : 'secondary'} aria-pressed={!allRightHidden} disabled={entries.length === 0} onClick={() => toggleAllHidden(setHiddenRight, effectiveHiddenRight)}>
                {allRightHidden ? <Eye aria-hidden="true" data-icon="inline-start" /> : <EyeOff aria-hidden="true" data-icon="inline-start" />}
                {allRightHidden ? 'Reveal Right' : 'Hide Right'}
              </Button>
            </>
          ) : undefined}
        />

        {entries.length === 0 ? (
          <EntryEmptyState hasSearch={Boolean(search.trim())} onCreate={showCreateForm} onClearSearch={() => setSearch('')} />
        ) : studyMode === 'list' ? (
          <EntryList
            entries={entries}
            hiddenLeft={effectiveHiddenLeft}
            hiddenRight={effectiveHiddenRight}
            onToggleLeft={(entryId) => toggleHiddenEntry(setHiddenLeft, entryId)}
            onToggleRight={(entryId) => toggleHiddenEntry(setHiddenRight, entryId)}
            onEdit={(entry) => { setEditingEntry(entry); setFormOpen(true) }}
            onDelete={setDeletingEntry}
          />
        ) : (
          <FlashcardMode
            entries={entries}
            frontByEntryType={data.settings.flashcardFrontByEntryType}
            onEdit={(entry) => { setEditingEntry(entry); setFormOpen(true) }}
            onDelete={setDeletingEntry}
          />
        )}
      </div>

      <div className="mt-8">
        <Link to={`/categories/${category.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><ArrowLeft aria-hidden="true" data-icon="inline-start" /> Back to topics</Link>
      </div>

      <EntryFormDialog
        open={formOpen}
        initialValues={editingEntry ? { type: editingEntry.type, question: editingEntry.question, answer: editingEntry.answer } : EMPTY_ENTRY_FORM_VALUES}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingEntry(null) }}
        onSubmit={submitEntry}
      />
      {deletingEntry && (
        <EntryDeleteDialog
          question={deletingEntry.question}
          open
          onOpenChange={(open) => { if (!open) setDeletingEntry(null) }}
          onConfirm={() => deleteEntry(deletingEntry.id)}
        />
      )}
    </div>
  )
}

export function SettingsPage() {
  return (
    <div>
      <PageHeading title="Settings" description="A small home for preferences that keep your review environment comfortable and local." />
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <Card className="bg-card/80">
          <CardHeader className="p-6">
            <SectionLabel>Coming later</SectionLabel>
            <CardTitle className="mt-2 text-xl">Appearance and study preferences</CardTitle>
            <CardDescription className="leading-relaxed">Themes, default study behavior, and accessibility preferences will arrive in a later phase.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="p-6">
            <SectionLabel>Local-first</SectionLabel>
            <CardTitle className="mt-2 text-xl">Your browser, your notes</CardTitle>
            <CardDescription className="leading-relaxed">Study Reviewer keeps personal study data on this device. JSON backup and restore will be added before a substantial library is encouraged.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="max-w-xl">
      <PageHeading title="That page is not part of the study path." description="Use the navigation to return to your dashboard or library." />
      <Link to="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Return home</Link>
    </div>
  )
}
