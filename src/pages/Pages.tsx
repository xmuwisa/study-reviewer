import {
  ArrowLeft,
  ArrowDownAZ,
  ArrowUpRight,
  BookOpenCheck,
  FolderPlus,
  Layers3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { CollectionDeleteDialog } from '@/components/study/CollectionDeleteDialog'
import { CollectionFormDialog, type CollectionFormValues } from '@/components/study/CollectionFormDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { findCategory, findTopic, getEntriesForTopic, getTopicsForCategory, type Category, type Topic } from '@/lib/study-data'
import { useStudyData } from '@/lib/use-study-data'
import {
  filterAndSortCategories,
  filterAndSortTopics,
  type CategorySort,
  type TopicSort,
} from '@/lib/study-operations'

const EMPTY_FORM_VALUES: CollectionFormValues = { name: '', description: '' }

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
}: {
  search: string
  onSearchChange: (value: string) => void
  sort: string
  sortOptions: Array<{ value: string; label: string }>
  onSortChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="flex justify-end">
      <div className="flex w-full items-center gap-3 rounded-2xl bg-card/60 p-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={label} className="h-11 border-0 bg-background/70 pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={placeholder} />
        </div>
        <SortSelect id={`${label.toLowerCase().replaceAll(' ', '-')}-sort`} label={`Sort ${label.toLowerCase()}`} value={sort} options={sortOptions} onChange={onSortChange} />
      </div>
    </div>
  )
}

function CountLabel({ count, singular, plural }: { count: number; singular: string; plural: string }) {
  return <span>{count} {count === 1 ? singular : plural}</span>
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
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeading
        title="Your study space is ready."
        description="A calm home for the questions, terms, and explanations you want to keep close. Start small; let the library grow with you."
      />

      <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="relative gap-3 p-6 sm:p-8">
            <Badge variant="secondary" className="w-fit border-0 bg-primary-foreground/10 text-primary-foreground">Phase 3 · Categories</Badge>
            <CardTitle className="max-w-md text-2xl leading-tight text-primary-foreground sm:text-3xl">A softer way to return to what matters.</CardTitle>
            <CardDescription className="max-w-lg text-base leading-relaxed text-primary-foreground/75">Categories and topics are ready for your first layer of local study organization.</CardDescription>
          </CardHeader>
          <CardContent className="relative p-6 pt-0 sm:p-8 sm:pt-0">
            <Button render={<Link to="/categories" />} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:ring-primary-foreground/60" size="lg">
              Open categories
              <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader className="p-6 pb-4">
            <SectionLabel>What is here now</SectionLabel>
            <CardTitle className="mt-2 text-xl">A clear starting point</CardTitle>
            <CardDescription className="leading-relaxed">The core structure is ready without rushing ahead into entry study flows.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-1">
            <ul className="flex flex-col gap-4 text-base">
              <li className="flex items-start gap-3"><BookOpenCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" /><span>Categories with search, sorting, and safe deletion</span></li>
              <li className="flex items-start gap-3"><Layers3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" /><span>Topics connected to their parent category</span></li>
              <li className="flex items-start gap-3"><Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" /><span>Local-first persistence with recent access activity</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5"><FoundationNote /></div>
    </div>
  )
}

export function CategoriesPage() {
  const navigate = useNavigate()
  const { data, createCategory, updateCategory, deleteCategory, openCategory } = useStudyData()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CategorySort>('alphabetical')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const categories = useMemo(() => filterAndSortCategories(data, search, sort), [data, search, sort])

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
        <CollectionToolbar search={search} onSearchChange={setSearch} sort={sort} onSortChange={(value) => setSort(value as CategorySort)} sortOptions={[{ value: 'alphabetical', label: 'Name: A–Z' }, { value: 'reverse-alphabetical', label: 'Name: Z–A' }, { value: 'recent', label: 'Most recent' }]} placeholder="Search categories" label="Category search" />
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
        <CollectionToolbar search={search} onSearchChange={setSearch} sort={sort} onSortChange={(value) => setSort(value as TopicSort)} sortOptions={[{ value: 'alphabetical', label: 'Name: A–Z' }, { value: 'reverse-alphabetical', label: 'Name: Z–A' }, { value: 'recent', label: 'Most recent' }]} placeholder="Search topics" label="Topic search" />
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
  const { data, openTopic } = useStudyData()
  const category = findCategory(data, categoryId)
  const topic = findTopic(data, topicId)
  const openedTopicId = useRef<string | null>(null)

  useEffect(() => {
    if (topic && topic.categoryId === categoryId && openedTopicId.current !== topic.id) {
      openedTopicId.current = topic.id
      openTopic(topic.id)
    }
  }, [categoryId, openTopic, topic])

  if (!category || !topic || topic.categoryId !== category.id) return <NotFoundPage />

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading title={topic.name} description={topic.description || 'A focused review path for questions and explanations.'} />
        <div className="flex w-full text-base text-muted-foreground sm:w-auto sm:justify-end">
          <CountLabel count={getEntriesForTopic(data, topic.id).length} singular="question" plural="questions" />
        </div>
      </div>
      <Card className="mt-9 bg-accent/35">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookOpenCheck aria-hidden="true" className="size-5" /></div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-accent-foreground">Your topic is ready for entries.</h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">Entry management and List Mode arrive in Phase 4. This topic already has a stable place in your local study library.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-8">
        <Link to={`/categories/${category.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><ArrowLeft aria-hidden="true" data-icon="inline-start" /> Back to topics</Link>
      </div>
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
