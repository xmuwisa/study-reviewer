import { useEffect, useState } from 'react'

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
import { Textarea } from '@/components/ui/textarea'

export type EntryFormValues = {
  question: string
  answer: string
}

type EntryFormDialogProps = {
  open: boolean
  initialValues?: EntryFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: EntryFormValues) => boolean
}

const EMPTY_ENTRY_VALUES: EntryFormValues = { question: '', answer: '' }

export function EntryFormDialog({
  open,
  initialValues = EMPTY_ENTRY_VALUES,
  onOpenChange,
  onSubmit,
}: EntryFormDialogProps) {
  const [values, setValues] = useState(initialValues)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const isEditing = Boolean(initialValues.question || initialValues.answer)

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

    const saved = onSubmit({ question, answer })
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
            {isEditing ? 'Update the question or answer without changing this entry’s place in the topic.' : 'Add a question and answer to build this topic’s study list.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(questionError)}>
              <FieldLabel htmlFor="entry-question">Question or term</FieldLabel>
              <Textarea
                id="entry-question"
                className="border-0 bg-muted/45"
                aria-invalid={Boolean(questionError)}
                autoFocus
                value={values.question}
                onChange={(event) => setValues((current) => ({ ...current, question: event.target.value }))}
                placeholder="e.g. What is spaced repetition?"
                rows={3}
              />
              <FieldError>{questionError}</FieldError>
            </Field>

            <Field data-invalid={Boolean(answerError)}>
              <FieldLabel htmlFor="entry-answer">Answer or explanation</FieldLabel>
              <Textarea
                id="entry-answer"
                className="border-0 bg-muted/45"
                aria-invalid={Boolean(answerError)}
                value={values.answer}
                onChange={(event) => setValues((current) => ({ ...current, answer: event.target.value }))}
                placeholder="Write the explanation you want to remember"
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
