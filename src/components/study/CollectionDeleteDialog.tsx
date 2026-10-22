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

type CollectionDeleteDialogProps = {
  kind: 'category' | 'topic'
  name: string
  topicCount?: number
  entryCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => boolean
}

export function CollectionDeleteDialog({
  kind,
  name,
  topicCount = 0,
  entryCount,
  open,
  onOpenChange,
  onConfirm,
}: CollectionDeleteDialogProps) {
  const isCategory = kind === 'category'
  const nestedSummary = isCategory
    ? `${topicCount} ${topicCount === 1 ? 'topic' : 'topics'} and ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`
    : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`

  function handleConfirm() {
    if (onConfirm()) onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {isCategory ? 'category' : 'topic'}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove <strong className="font-semibold text-foreground">{name}</strong> and its {nestedSummary}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>Delete {isCategory ? 'category' : 'topic'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
