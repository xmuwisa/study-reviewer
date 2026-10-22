import { useCallback, useMemo, useState, type ReactNode } from 'react'

import type { CategoryInput, RecordId, StudyData, TopicInput } from '@/lib/study-data'
import {
  createCategory,
  createTopic,
  deleteCategory,
  deleteTopic,
  markCategoryAccessed,
  markTopicAccessed,
  updateCategory,
  updateTopic,
} from '@/lib/study-operations'
import { StudyContext, type StorageNotice, type StudyContextValue } from '@/lib/study-context'
import { createStudyRepository } from '@/lib/study-storage'

function getInitialNotice(status: ReturnType<ReturnType<typeof createStudyRepository>['load']>['status'], message?: string) {
  if (status === 'invalid' || status === 'unavailable') {
    return { kind: 'warning' as const, message: message ?? 'Local study data could not be loaded.' }
  }

  return null
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const repository = useMemo(() => createStudyRepository(), [])
  const [initialLoad] = useState(() => repository.load())
  const [data, setData] = useState(initialLoad.data)
  const [storageNotice, setStorageNotice] = useState<StorageNotice | null>(() =>
    getInitialNotice(initialLoad.status, 'message' in initialLoad ? initialLoad.message : undefined),
  )

  const commit = useCallback(
    (nextData: StudyData) => {
      const result = repository.save(nextData)
      if (!result.ok) {
        setStorageNotice({ kind: 'error', message: result.message })
        return false
      }

      setData(nextData)
      setStorageNotice(null)
      return true
    },
    [repository],
  )

  const createCategoryAction = useCallback((input: CategoryInput) => commit(createCategory(data, input)), [commit, data])
  const updateCategoryAction = useCallback(
    (categoryId: RecordId, input: CategoryInput) => commit(updateCategory(data, categoryId, input)),
    [commit, data],
  )
  const deleteCategoryAction = useCallback((categoryId: RecordId) => commit(deleteCategory(data, categoryId)), [commit, data])
  const createTopicAction = useCallback(
    (categoryId: RecordId, input: TopicInput) => commit(createTopic(data, categoryId, input)),
    [commit, data],
  )
  const updateTopicAction = useCallback(
    (topicId: RecordId, input: TopicInput) => commit(updateTopic(data, topicId, input)),
    [commit, data],
  )
  const deleteTopicAction = useCallback((topicId: RecordId) => commit(deleteTopic(data, topicId)), [commit, data])
  const openCategory = useCallback((categoryId: RecordId) => commit(markCategoryAccessed(data, categoryId)), [commit, data])
  const openTopic = useCallback((topicId: RecordId) => commit(markTopicAccessed(data, topicId)), [commit, data])
  const clearStorageNotice = useCallback(() => setStorageNotice(null), [])

  const value = useMemo<StudyContextValue>(
    () => ({
      data,
      storageNotice,
      clearStorageNotice,
      createCategory: createCategoryAction,
      updateCategory: updateCategoryAction,
      deleteCategory: deleteCategoryAction,
      createTopic: createTopicAction,
      updateTopic: updateTopicAction,
      deleteTopic: deleteTopicAction,
      openCategory,
      openTopic,
    }),
    [
      clearStorageNotice,
      createCategoryAction,
      data,
      deleteCategoryAction,
      deleteTopicAction,
      openCategory,
      openTopic,
      storageNotice,
      updateCategoryAction,
      updateTopicAction,
      createTopicAction,
    ],
  )

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}
