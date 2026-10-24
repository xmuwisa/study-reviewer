import { Download } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field'
import { Notification, type NotificationState } from '@/components/ui/notification'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import {
  createCategoryPdfDocument,
  createTopicPdfDocument,
  getPdfEligibleTopics,
  downloadStudyPdf,
  type StudyPdfTopic,
} from '@/lib/study-pdf'
import type { StudyData } from '@/lib/study-data'

function TopicPdfExportDialog({
  open,
  topicName,
  onOpenChange,
  onExport,
}: {
  open: boolean
  topicName: string
  onOpenChange: (open: boolean) => void
  onExport: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export {topicName} as PDF</DialogTitle>
          <DialogDescription>The printable PDF includes all saved questions, terms, answers, and definitions from the currently opened topic.</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={onExport}>
            <Download aria-hidden="true" data-icon="inline-start" /> Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryPdfExportDialog({
  open,
  categoryName,
  topics,
  selectedTopicIds,
  onOpenChange,
  onToggleTopic,
  onToggleAll,
  onExport,
}: {
  open: boolean
  categoryName: string
  topics: StudyPdfTopic[]
  selectedTopicIds: Set<string>
  onOpenChange: (open: boolean) => void
  onToggleTopic: (topicId: string) => void
  onToggleAll: () => void
  onExport: () => void
}) {
  const selectedCount = topics.filter(({ topic }) => selectedTopicIds.has(topic.id)).length
  const allSelected = topics.length > 0 && selectedCount === topics.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Export {categoryName} as PDF</DialogTitle>
          <DialogDescription>Choose the topics for one printable PDF. Each selected topic includes all saved questions, terms, answers, and definitions.</DialogDescription>
        </DialogHeader>

        <FieldSet className="max-h-[min(38vh,22rem)] gap-2 overflow-y-auto pr-1">
          <FieldLegend className="sr-only">Topics to export</FieldLegend>
          <Field orientation="horizontal" className="rounded-lg border border-border bg-muted/35 px-3 py-2.5">
            <FieldContent>
              <FieldTitle>{allSelected ? 'All topics selected' : `${selectedCount} of ${topics.length} topics selected`}</FieldTitle>
              <FieldDescription>Select all available topics at once.</FieldDescription>
            </FieldContent>
            <Toggle type="button" variant="outline" size="sm" pressed={allSelected} onPressedChange={onToggleAll}>
              {allSelected ? 'Clear all' : 'Select all'}
            </Toggle>
          </Field>

          {topics.map(({ topic, entries }) => {
            const selected = selectedTopicIds.has(topic.id)
            return (
              <label
                key={topic.id}
                data-checked={selected}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                  selected ? 'border-primary bg-primary/5' : 'border-input bg-transparent hover:bg-muted/50',
                )}
              >
                <Checkbox checked={selected} onCheckedChange={() => onToggleTopic(topic.id)} aria-label={`Include ${topic.name} in PDF`} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-medium text-foreground">{topic.name}</span>
                  <span className="text-base leading-normal text-muted-foreground">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
                </span>
              </label>
            )
          })}
        </FieldSet>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={selectedCount === 0} onClick={onExport}>
            <Download aria-hidden="true" data-icon="inline-start" /> Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PdfExportControl({
  kind,
  data,
  categoryId,
  topicId,
  renderActions,
}: {
  kind: 'topic' | 'category'
  data: StudyData
  categoryId: string
  topicId?: string
  renderActions: (actions: {
    onExportPdf: () => void
    exportPdfDisabled: boolean
  }) => ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const eligibleTopics = getPdfEligibleTopics(data, categoryId)
  const currentTopic = topicId ? eligibleTopics.find(({ topic }) => topic.id === topicId) : undefined
  const exportAvailable = kind === 'category' ? eligibleTopics.length > 0 : Boolean(currentTopic)

  function openDialog() {
    if (kind === 'category') setSelectedTopicIds(new Set(eligibleTopics.map(({ topic }) => topic.id)))
    setDialogOpen(true)
  }

  function toggleTopic(topicIdToToggle: string) {
    setSelectedTopicIds((current) => {
      const next = new Set(current)
      if (next.has(topicIdToToggle)) next.delete(topicIdToToggle)
      else next.add(topicIdToToggle)
      return next
    })
  }

  function toggleAllTopics() {
    setSelectedTopicIds((current) => current.size === eligibleTopics.length
      ? new Set()
      : new Set(eligibleTopics.map(({ topic }) => topic.id)))
  }

  function exportPdf() {
    const document = kind === 'topic' && topicId
      ? createTopicPdfDocument(data, categoryId, topicId)
      : createCategoryPdfDocument(data, categoryId, selectedTopicIds)

    if (!document) {
      setNotification({ kind: 'error', message: 'Select at least one topic with entries to export.' })
      return
    }

    const result = downloadStudyPdf(document)
    if (!result.ok) {
      setNotification({ kind: 'error', message: result.message })
      return
    }

    setNotification({ kind: 'success', message: `Downloaded ${result.filename}.` })
    setDialogOpen(false)
  }

  return (
    <div className="contents">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
      {renderActions({ onExportPdf: openDialog, exportPdfDisabled: !exportAvailable })}
      {kind === 'topic' && currentTopic && (
        <TopicPdfExportDialog
          open={dialogOpen}
          topicName={currentTopic.topic.name}
          onOpenChange={setDialogOpen}
          onExport={exportPdf}
        />
      )}
      {kind === 'category' && (
        <CategoryPdfExportDialog
          open={dialogOpen}
          categoryName={data.categories.find((category) => category.id === categoryId)?.name ?? 'category'}
          topics={eligibleTopics}
          selectedTopicIds={selectedTopicIds}
          onOpenChange={setDialogOpen}
          onToggleTopic={toggleTopic}
          onToggleAll={toggleAllTopics}
          onExport={exportPdf}
        />
      )}
    </div>
  )
}
