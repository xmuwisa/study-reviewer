import { createContext } from 'react'

import type { CategoryInput, EntryInput, RecordId, StudyData, TopicInput } from '@/lib/study-data'
import type { StudySettingsPatch } from '@/lib/study-operations'

export type StorageNotice = {
  kind: 'warning' | 'error'
  message: string
}

export type StudyContextValue = {
  data: StudyData
  storageNotice: StorageNotice | null
  clearStorageNotice: () => void
  createCategory: (input: CategoryInput) => boolean
  updateCategory: (categoryId: RecordId, input: CategoryInput) => boolean
  deleteCategory: (categoryId: RecordId) => boolean
  createTopic: (categoryId: RecordId, input: TopicInput) => boolean
  updateTopic: (topicId: RecordId, input: TopicInput) => boolean
  deleteTopic: (topicId: RecordId) => boolean
  createEntry: (topicId: RecordId, input: EntryInput) => boolean
  updateEntry: (entryId: RecordId, input: EntryInput) => boolean
  deleteEntry: (entryId: RecordId) => boolean
  openCategory: (categoryId: RecordId) => boolean
  openTopic: (topicId: RecordId) => boolean
  updateSettings: (patch: StudySettingsPatch) => boolean
}

export const StudyContext = createContext<StudyContextValue | null>(null)
