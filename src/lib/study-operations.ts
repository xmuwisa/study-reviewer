import {
  createCategoryRecord,
  createTopicRecord,
  type Category,
  type CategoryInput,
  type RecordId,
  type StudyData,
  type Timestamp,
  type Topic,
  type TopicInput,
} from '@/lib/study-data'

export type CategorySort = 'alphabetical' | 'reverse-alphabetical' | 'recent'
export type TopicSort = 'alphabetical' | 'reverse-alphabetical' | 'recent'

const MAX_RECENT_ACTIVITY = 20

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase()
}

function compareAlphabetically(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' })
}

function getRecentTimestamp(record: Category | Topic) {
  return record.lastAccessedAt ?? record.updatedAt ?? record.createdAt
}

function sortByRecent<T extends Category | Topic>(records: T[]) {
  return [...records].sort((left, right) => {
    const timestampDifference = getRecentTimestamp(right) - getRecentTimestamp(left)
    return timestampDifference || compareAlphabetically(left.name, right.name) || left.id.localeCompare(right.id)
  })
}

function sortByName<T extends Category | Topic>(records: T[], direction: 'ascending' | 'descending') {
  const multiplier = direction === 'ascending' ? 1 : -1
  return [...records].sort((left, right) => multiplier * (compareAlphabetically(left.name, right.name) || left.id.localeCompare(right.id)))
}

function removeRecentActivity(data: StudyData, removedIds: Set<RecordId>) {
  return data.activity.recentlyAccessed.filter((activity) => !removedIds.has(activity.recordId))
}

function updateRecentActivity(data: StudyData, type: 'category' | 'topic', recordId: RecordId, accessedAt: Timestamp) {
  const nextActivity = [{ type, recordId, accessedAt }, ...data.activity.recentlyAccessed.filter((item) => item.recordId !== recordId)]
  return nextActivity.slice(0, MAX_RECENT_ACTIVITY)
}

export function createCategory(data: StudyData, input: CategoryInput, now = Date.now()): StudyData {
  const record = createCategoryRecord(input, now)
  if (!record.name) return data

  return { ...data, categories: [...data.categories, record] }
}

export function updateCategory(data: StudyData, categoryId: RecordId, input: CategoryInput, now = Date.now()): StudyData {
  const name = input.name.trim()
  if (!name || !data.categories.some((category) => category.id === categoryId)) return data

  return {
    ...data,
    categories: data.categories.map((category) =>
      category.id === categoryId
        ? { ...category, name, description: input.description?.trim() ?? '', updatedAt: now }
        : category,
    ),
  }
}

export function deleteCategory(data: StudyData, categoryId: RecordId): StudyData {
  if (!data.categories.some((category) => category.id === categoryId)) return data

  const topicIds = new Set(data.topics.filter((topic) => topic.categoryId === categoryId).map((topic) => topic.id))
  const removedIds = new Set([categoryId, ...topicIds])

  return {
    ...data,
    categories: data.categories.filter((category) => category.id !== categoryId),
    topics: data.topics.filter((topic) => topic.categoryId !== categoryId),
    entries: data.entries.filter((entry) => !topicIds.has(entry.topicId)),
    activity: {
      ...data.activity,
      recentlyAccessed: removeRecentActivity(data, removedIds),
    },
  }
}

export function createTopic(data: StudyData, categoryId: RecordId, input: TopicInput, now = Date.now()): StudyData {
  const record = createTopicRecord(categoryId, input, now)
  if (!record.name || !data.categories.some((category) => category.id === categoryId)) return data

  return { ...data, topics: [...data.topics, record] }
}

export function updateTopic(data: StudyData, topicId: RecordId, input: TopicInput, now = Date.now()): StudyData {
  const name = input.name.trim()
  if (!name || !data.topics.some((topic) => topic.id === topicId)) return data

  return {
    ...data,
    topics: data.topics.map((topic) =>
      topic.id === topicId ? { ...topic, name, description: input.description?.trim() ?? '', updatedAt: now } : topic,
    ),
  }
}

export function deleteTopic(data: StudyData, topicId: RecordId): StudyData {
  if (!data.topics.some((topic) => topic.id === topicId)) return data

  return {
    ...data,
    topics: data.topics.filter((topic) => topic.id !== topicId),
    entries: data.entries.filter((entry) => entry.topicId !== topicId),
    activity: {
      ...data.activity,
      recentlyAccessed: removeRecentActivity(data, new Set([topicId])),
    },
  }
}

export function markCategoryAccessed(data: StudyData, categoryId: RecordId, accessedAt = Date.now()): StudyData {
  if (!data.categories.some((category) => category.id === categoryId)) return data

  return {
    ...data,
    categories: data.categories.map((category) =>
      category.id === categoryId ? { ...category, lastAccessedAt: accessedAt } : category,
    ),
    activity: {
      ...data.activity,
      recentlyAccessed: updateRecentActivity(data, 'category', categoryId, accessedAt),
    },
  }
}

export function markTopicAccessed(data: StudyData, topicId: RecordId, accessedAt = Date.now()): StudyData {
  if (!data.topics.some((topic) => topic.id === topicId)) return data

  return {
    ...data,
    topics: data.topics.map((topic) => (topic.id === topicId ? { ...topic, lastAccessedAt: accessedAt } : topic)),
    activity: {
      ...data.activity,
      recentlyAccessed: updateRecentActivity(data, 'topic', topicId, accessedAt),
    },
  }
}

export function filterAndSortCategories(data: StudyData, searchTerm: string, sort: CategorySort): Category[] {
  const normalizedTerm = normalizeSearchTerm(searchTerm)
  const filtered = data.categories.filter((category) => category.name.toLocaleLowerCase().includes(normalizedTerm))

  if (sort === 'recent') return sortByRecent(filtered)

  return sortByName(filtered, sort === 'reverse-alphabetical' ? 'descending' : 'ascending')
}

export function filterAndSortTopics(data: StudyData, categoryId: RecordId, searchTerm: string, sort: TopicSort): Topic[] {
  const normalizedTerm = normalizeSearchTerm(searchTerm)
  const filtered = data.topics.filter(
    (topic) => topic.categoryId === categoryId && topic.name.toLocaleLowerCase().includes(normalizedTerm),
  )

  if (sort === 'recent') return sortByRecent(filtered)

  return sortByName(filtered, sort === 'reverse-alphabetical' ? 'descending' : 'ascending')
}
