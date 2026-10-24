import { Download, FileJson2, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Notification, type NotificationState } from '@/components/ui/notification'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  createCategoryExport,
  createFullBackup,
  createTopicExport,
  parseStudyExport,
  serializeStudyExport,
  summarizeStudyExport,
  type ContextualImportMode,
  type StudyExportDocument,
  type StudyExportKind,
  type StudyImportResult,
  type StudyImportSummary,
} from '@/lib/study-backup'
import { getEntriesForTopic, getTopicsForCategory, type StudyData, type Topic } from '@/lib/study-data'

function downloadJson(document: StudyExportDocument, filename: string) {
  const blob = new Blob([serializeStudyExport(document)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function getSummaryLabel(kind: StudyExportKind, summary: { categoryCount: number; topicCount: number; entryCount: number }) {
  if (kind === 'topic') return `${summary.entryCount} ${summary.entryCount === 1 ? 'entry' : 'entries'}`
  if (kind === 'category') return `${summary.topicCount} ${summary.topicCount === 1 ? 'topic' : 'topics'} · ${summary.entryCount} ${summary.entryCount === 1 ? 'entry' : 'entries'}`
  return `${summary.categoryCount} ${summary.categoryCount === 1 ? 'category' : 'categories'} · ${summary.topicCount} ${summary.topicCount === 1 ? 'topic' : 'topics'} · ${summary.entryCount} ${summary.entryCount === 1 ? 'entry' : 'entries'}`
}

function getImportSuccessMessage(summary: StudyImportSummary) {
  const imported = summary.kind === 'topic'
    ? `${summary.entryCount} ${summary.entryCount === 1 ? 'entry' : 'entries'}`
    : `${summary.topicCount} ${summary.topicCount === 1 ? 'topic' : 'topics'} and ${summary.entryCount} ${summary.entryCount === 1 ? 'entry' : 'entries'}`
  const mode = summary.mode === 'replace' ? 'replaced the destination content with' : 'added'
  const remapped = summary.remappedIdCount > 0 ? ` ${summary.remappedIdCount} conflicting ${summary.remappedIdCount === 1 ? 'ID was' : 'IDs were'} remapped safely.` : ''
  return `${mode[0].toUpperCase()}${mode.slice(1)} ${imported}.${remapped}`
}

function ContextualImportDialog({
  document,
  destinationName,
  destinationLabel,
  existingCount,
  onOpenChange,
  onImport,
}: {
  document: StudyExportDocument | null
  destinationName: string
  destinationLabel: 'entries' | 'topics'
  existingCount: number
  onOpenChange: (open: boolean) => void
  onImport: (mode: ContextualImportMode) => boolean
}) {
  const [mode, setMode] = useState<ContextualImportMode>('add')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const summary = document ? summarizeStudyExport(document) : null

  useEffect(() => {
    if (!document) return
    setMode('add')
    setConfirmOpen(false)
  }, [document])

  function handleOpenChange(open: boolean) {
    if (!open) setConfirmOpen(false)
    onOpenChange(open)
  }

  function confirmReplacement() {
    const succeeded = onImport('replace')
    if (succeeded) setConfirmOpen(false)
  }

  return (
    <>
      <Dialog open={Boolean(document)} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import into {destinationName}</DialogTitle>
            <DialogDescription>
              This {document?.kind ?? 'study'} export contains {summary ? getSummaryLabel(document?.kind ?? 'topic', summary) : 'study content'}.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldTitle>How should this import be applied?</FieldTitle>
              <ToggleGroup
                value={[mode]}
                onValueChange={(value) => {
                  const nextMode = value[0]
                  if (nextMode === 'add' || nextMode === 'replace') setMode(nextMode)
                }}
                aria-label="Import mode"
                className="w-full"
              >
                <ToggleGroupItem value="add" className="flex-1">Add</ToggleGroupItem>
                <ToggleGroupItem value="replace" className="flex-1">Replace</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                Add keeps the {destinationLabel} already in this {destinationLabel === 'entries' ? 'topic' : 'category'} and appends the imported content. Replace removes the existing {destinationLabel} first.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="button" variant={mode === 'replace' ? 'destructive' : 'default'} onClick={() => mode === 'replace' ? setConfirmOpen(true) : onImport('add')}>
              {mode === 'replace' ? 'Continue to replace' : 'Add import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing {destinationLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {existingCount} existing {destinationLabel} from <strong className="font-semibold text-foreground">{destinationName}</strong> before adding the imported content. This cannot be undone unless you have a backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep existing content</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmReplacement}>Replace {destinationLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CategoryExportDialog({
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
  topics: Array<{ topic: Topic; entryCount: number }>
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
          <DialogTitle>Choose topics to export</DialogTitle>
          <DialogDescription>
            Select one or more topics with entries from {categoryName}. The category context will stay with the export.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="max-h-[min(50vh,28rem)] overflow-y-auto pr-1">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{allSelected ? 'All topics selected' : `${selectedCount} of ${topics.length} topics selected`}</FieldTitle>
              <FieldDescription>Select all available topics at once.</FieldDescription>
            </FieldContent>
            <Toggle type="button" variant="outline" pressed={allSelected} onPressedChange={onToggleAll} aria-label={allSelected ? 'Clear all topics' : 'Select all topics'}>
              {allSelected ? 'Clear all' : 'Select all'}
            </Toggle>
          </Field>

          <FieldSet className="gap-2">
            <FieldLegend className="sr-only">Topics to export</FieldLegend>
            {topics.map(({ topic, entryCount }) => {
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
                  <Checkbox checked={selected} onCheckedChange={() => onToggleTopic(topic.id)} aria-label={`Include ${topic.name} in export`} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-base font-medium text-foreground">{topic.name}</span>
                    <span className="text-base leading-normal text-muted-foreground">{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
                  </span>
                </label>
              )
            })}
          </FieldSet>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={selectedCount === 0} onClick={onExport}>
            <Download aria-hidden="true" data-icon="inline-start" /> Export selected topics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ContextualDataTransfer({
  kind,
  data,
  destinationId,
  destinationName,
  existingCount,
  onImport,
  renderActions,
}: {
  kind: 'topic' | 'category'
  data: StudyData
  destinationId: string
  destinationName: string
  existingCount: number
  onImport: (document: StudyExportDocument, mode: ContextualImportMode) => StudyImportResult
  renderActions: (actions: {
    onImportJson: () => void
    onExportJson: () => void
    exportJsonDisabled: boolean
  }) => ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDocument, setPendingDocument] = useState<StudyExportDocument | null>(null)
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const [categoryExportOpen, setCategoryExportOpen] = useState(false)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const exportableTopics = kind === 'category'
    ? getTopicsForCategory(data, destinationId)
      .map((topic) => ({ topic, entryCount: getEntriesForTopic(data, topic.id).length }))
      .filter(({ entryCount }) => entryCount > 0)
    : []
  const topicExport = kind === 'topic' ? createTopicExport(data, destinationId) : null
  const exportAvailable = kind === 'topic' ? Boolean(topicExport && getEntriesForTopic(data, destinationId).length > 0) : exportableTopics.length > 0

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const parsed = parseStudyExport(await file.text())
      if (!parsed.ok) {
        setNotification({ kind: 'error', message: parsed.message })
        return
      }
      if (parsed.document.kind !== kind) {
        setNotification({ kind: 'error', message: `Choose a ${kind} export for this page.` })
        return
      }

      setNotification(null)
      setPendingDocument(parsed.document)
    } catch {
      setNotification({ kind: 'error', message: 'This JSON file could not be read.' })
    }
  }

  function applyImport(mode: ContextualImportMode) {
    if (!pendingDocument) return false
    const result = onImport(pendingDocument, mode)
    if (!result.ok) {
      setNotification({ kind: 'error', message: result.message })
      return false
    }

    setNotification({ kind: 'success', message: getImportSuccessMessage(result.summary) })
    setPendingDocument(null)
    return true
  }

  function openCategoryExport() {
    setSelectedTopicIds(new Set(exportableTopics.map(({ topic }) => topic.id)))
    setCategoryExportOpen(true)
  }

  function toggleTopic(topicId: string) {
    setSelectedTopicIds((current) => {
      const next = new Set(current)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  function toggleAllTopics() {
    setSelectedTopicIds((current) => current.size === exportableTopics.length
      ? new Set()
      : new Set(exportableTopics.map(({ topic }) => topic.id)))
  }

  function exportTopicOrCategory() {
    try {
      if (kind === 'topic') {
        if (!topicExport) throw new Error('The current topic could not be exported because it has no entries.')
        downloadJson(topicExport, `${destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'topic'}.json`)
        setNotification({ kind: 'success', message: `Exported ${getSummaryLabel('topic', summarizeStudyExport(topicExport))}.` })
        return
      }

      const validSelectedTopicIds = new Set(exportableTopics
        .filter(({ topic }) => selectedTopicIds.has(topic.id))
        .map(({ topic }) => topic.id))
      const categoryExport = createCategoryExport(data, destinationId, validSelectedTopicIds)
      if (!categoryExport) throw new Error('Select at least one topic with entries to export.')
      downloadJson(categoryExport, `${destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category'}.json`)
      setNotification({ kind: 'success', message: `Exported ${getSummaryLabel('category', summarizeStudyExport(categoryExport))}.` })
      setCategoryExportOpen(false)
    } catch (error) {
      setNotification({ kind: 'error', message: error instanceof Error ? error.message : 'The JSON export could not be created.' })
    }
  }

  return (
    <div className="contents">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
      <Input ref={inputRef} className="sr-only" type="file" accept=".json,application/json" aria-label={`Import ${kind} JSON`} onChange={handleFileChange} />
      {renderActions({
        onImportJson: () => inputRef.current?.click(),
        onExportJson: kind === 'category' ? openCategoryExport : exportTopicOrCategory,
        exportJsonDisabled: !exportAvailable,
      })}
      <ContextualImportDialog
        document={pendingDocument}
        destinationName={destinationName}
        destinationLabel={kind === 'topic' ? 'entries' : 'topics'}
        existingCount={existingCount}
        onOpenChange={(open) => { if (!open) setPendingDocument(null) }}
        onImport={applyImport}
      />
      {kind === 'category' && (
        <CategoryExportDialog
          open={categoryExportOpen}
          categoryName={destinationName}
          topics={exportableTopics}
          selectedTopicIds={selectedTopicIds}
          onOpenChange={setCategoryExportOpen}
          onToggleTopic={toggleTopic}
          onToggleAll={toggleAllTopics}
          onExport={exportTopicOrCategory}
        />
      )}
    </div>
  )
}

export function FullBackupControls({
  data,
  onRestore,
}: {
  data: StudyData
  onRestore: (document: StudyExportDocument) => StudyImportResult
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingBackup, setPendingBackup] = useState<StudyExportDocument | null>(null)
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const backup = createFullBackup(data)
  const summary = summarizeStudyExport(backup)
  const hasExportableContent = data.categories.length > 0 || data.topics.length > 0 || data.entries.length > 0

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const parsed = parseStudyExport(await file.text())
      if (!parsed.ok) {
        setNotification({ kind: 'error', message: parsed.message })
        return
      }
      if (parsed.document.kind !== 'full') {
        setNotification({ kind: 'error', message: 'Settings restore only accepts a complete Study Reviewer backup.' })
        return
      }

      setNotification(null)
      setPendingBackup(parsed.document)
    } catch {
      setNotification({ kind: 'error', message: 'This JSON file could not be read.' })
    }
  }

  function restoreBackup() {
    if (!pendingBackup) return
    const result = onRestore(pendingBackup)
    if (!result.ok) {
      setNotification({ kind: 'error', message: result.message })
      return
    }

    setNotification({ kind: 'success', message: `Full backup restored: ${result.summary.categoryCount} categories, ${result.summary.topicCount} topics, and ${result.summary.entryCount} entries. The active Pomodoro countdown was reset.` })
    setPendingBackup(null)
  }

  function exportBackup() {
    try {
      downloadJson(backup, 'study-reviewer-full-backup.json')
      setNotification({ kind: 'success', message: `Exported full backup with ${getSummaryLabel('full', summary)}.` })
    } catch {
      setNotification({ kind: 'error', message: 'The full JSON backup could not be created.' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
      <div className="flex flex-wrap items-center gap-2">
        <Input ref={inputRef} className="sr-only" type="file" accept=".json,application/json" aria-label="Restore full JSON backup" onChange={handleFileChange} />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload aria-hidden="true" data-icon="inline-start" /> Restore full backup
        </Button>
        <Button type="button" variant="outline" disabled={!hasExportableContent} onClick={exportBackup}>
          <FileJson2 aria-hidden="true" data-icon="inline-start" /> Export full backup
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">Current backup: {getSummaryLabel('full', summary)}. Full restore replaces all study data, settings, statistics, recent activity, and timer state.</p>

      <AlertDialog open={Boolean(pendingBackup)} onOpenChange={(open) => { if (!open) setPendingBackup(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all local study data?</AlertDialogTitle>
            <AlertDialogDescription>
              This full backup contains {pendingBackup ? getSummaryLabel('full', summarizeStudyExport(pendingBackup)) : 'your study data'}. Restoring it will permanently replace the current library, settings, statistics, recent activity, and timer state. Any active Pomodoro countdown will be reset. Export your current backup first if you may need it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel restore</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={restoreBackup}>Replace all data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
