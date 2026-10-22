import { useEffect, useState, type ClipboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { EntryType } from '@/lib/study-data'

export type EntryFormValues = {
  type: EntryType
  question: string
  answer: string
}

type EntryFormDialogProps = {
  open: boolean
  initialValues?: EntryFormValues
  allowCopyPaste?: boolean
  spellcheck?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: EntryFormValues) => boolean
}

const EMPTY_ENTRY_VALUES: EntryFormValues = { type: 'question-answer', question: '', answer: '' }

export function EntryFormDialog({
  open,
  initialValues = EMPTY_ENTRY_VALUES,
  allowCopyPaste = true,
  spellcheck = true,
  onOpenChange,
  onSubmit,
}: EntryFormDialogProps) {
  const [values, setValues] = useState(initialValues)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const isEditing = Boolean(initialValues.question || initialValues.answer)
  const isTermDefinition = values.type === 'term-definition'
  const leftLabel = isTermDefinition ? 'Term' : 'Question'
  const rightLabel = isTermDefinition ? 'Definition' : 'Answer'
  const entryTypeLabel = isTermDefinition ? 'term and definition' : 'question and answer'

  function preventClipboardAction(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (!allowCopyPaste) event.preventDefault()
  }

  useEffect(() => {
    if (open) {
      setValues(initialValues)
      setQuestionError(null)
      setAnswerError(null)
      setSaveError(null)
    }
  }, [initialValues, open])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = values.question.trim()
    const answer = values.answer.trim()
    const nextQuestionError = question ? null : 'Enter a question or term.'
    const nextAnswerError = answer ? null : 'Enter an answer or explanation.'

    setQuestionError(nextQuestionError)
    setAnswerError(nextAnswerError)
    if (nextQuestionError || nextAnswerError) return

    const saved = onSubmit({ type: values.type, question, answer })
    if (!saved) {
      setSaveError('This entry could not be saved. Check local storage availability and try again.')
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit entry' : 'Create entry'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the ${entryTypeLabel} without changing this entry’s place in the topic.` : `Add a ${entryTypeLabel} to build this topic’s study list.`}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="entry-type">Entry type</FieldLabel>
              <Select
                value={values.type}
                onValueChange={(value) => {
                  if (value === 'question-answer' || value === 'term-definition') {
                    setValues((current) => ({ ...current, type: value }))
                  }
                }}
              >
                <SelectTrigger id="entry-type" className="w-full border-0 bg-muted/45">
                  <SelectValue>{isTermDefinition ? 'Term & Definition' : 'Question & Answer'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="question-answer">Question &amp; Answer</SelectItem>
                    <SelectItem value="term-definition">Term &amp; Definition</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={Boolean(questionError)}>
              <FieldLabel htmlFor="entry-question">{leftLabel}</FieldLabel>
              <Textarea
                id="entry-question"
                className="border-0 bg-muted/45"
                aria-invalid={Boolean(questionError)}
                autoFocus
                spellCheck={spellcheck}
                onCopy={preventClipboardAction}
                onCut={preventClipboardAction}
                onPaste={preventClipboardAction}
                value={values.question}
                onChange={(event) => setValues((current) => ({ ...current, question: event.target.value }))}
                placeholder={isTermDefinition ? 'e.g. Spaced repetition' : 'e.g. What is spaced repetition?'}
                rows={3}
              />
              <FieldError>{questionError}</FieldError>
            </Field>

            <Field data-invalid={Boolean(answerError)}>
              <FieldLabel htmlFor="entry-answer">{rightLabel}</FieldLabel>
              <Textarea
                id="entry-answer"
                className="border-0 bg-muted/45"
                aria-invalid={Boolean(answerError)}
                spellCheck={spellcheck}
                onCopy={preventClipboardAction}
                onCut={preventClipboardAction}
                onPaste={preventClipboardAction}
                value={values.answer}
                onChange={(event) => setValues((current) => ({ ...current, answer: event.target.value }))}
                placeholder={isTermDefinition ? 'Write the definition you want to remember' : 'Write the explanation you want to remember'}
                rows={5}
              />
              <FieldError>{answerError}</FieldError>
            </Field>
          </FieldGroup>

          {saveError && <FieldError>{saveError}</FieldError>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEditing ? 'Save changes' : 'Create entry'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
