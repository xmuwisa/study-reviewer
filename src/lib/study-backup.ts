import {
  createEmptyStudyData,
  createStableId,
  STUDY_DATA_SCHEMA_VERSION,
  type Category,
  type Entry,
  type RecordId,
  type StudyData,
  type Topic,
} from '@/lib/study-data'
import { validateStudyData, type ValidationIssue } from '@/lib/study-validation'

export const STUDY_EXPORT_FORMAT = 'study-reviewer-json' as const
export const STUDY_EXPORT_FORMAT_VERSION = 1 as const

export type StudyExportKind = 'topic' | 'category' | 'full'
export type ContextualImportMode = 'add' | 'replace'

export type TopicExportPayload = {
  topic: Topic
  entries: Entry[]
}

export type CategoryExportPayload = {
  category: Category
  topics: Topic[]
  entries: Entry[]
}

export type StudyExportDocument = {
  format: typeof STUDY_EXPORT_FORMAT
  formatVersion: typeof STUDY_EXPORT_FORMAT_VERSION
  schemaVersion: typeof STUDY_DATA_SCHEMA_VERSION
  exportedAt: number
  kind: StudyExportKind
  payload: StudyData | TopicExportPayload | CategoryExportPayload
}

export type ParsedStudyExport = {
  ok: true
  document: StudyExportDocument
  summary: StudyExportSummary
}

export type StudyExportSummary = {
  kind: StudyExportKind
  categoryCount: number
  topicCount: number
  entryCount: number
}

export type StudyImportSummary = StudyExportSummary & {
  mode?: ContextualImportMode
  remappedIdCount: number
  replacedTopicCount: number
  replacedEntryCount: number
  timerReset: boolean
}

export type StudyImportResult =
  | { ok: true; data: StudyData; summary: StudyImportSummary }
  | { ok: false; message: string; issues?: ValidationIssue[] }

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function addIssue(issues: ValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function validateUniqueIdsAcrossRecords(
  records: Array<{ id: unknown }>,
  path: string,
  usedIds: Set<string>,
  issues: ValidationIssue[],
) {
  const localIds = new Set<string>()
  records.forEach((record, index) => {
    if (typeof record.id !== 'string') return
    if (localIds.has(record.id)) addIssue(issues, `${path}[${index}].id`, 'must be unique within the import')
    if (usedIds.has(record.id)) addIssue(issues, `${path}[${index}].id`, 'must be unique across the import')
    localIds.add(record.id)
    usedIds.add(record.id)
  })
}

function validateActivityRelationships(data: StudyData, issues: ValidationIssue[]) {
  const categoryIds = new Set(data.categories.map((category) => category.id))
  const topicIds = new Set(data.topics.map((topic) => topic.id))
  data.activity.recentlyAccessed.forEach((activity, index) => {
    const valid = activity.type === 'category' ? categoryIds.has(activity.recordId) : topicIds.has(activity.recordId)
    if (!valid) addIssue(issues, `payload.activity.recentlyAccessed[${index}].recordId`, 'must reference an existing record')
  })
}

function validateContextualPayload(
  kind: 'topic' | 'category',
  payload: unknown,
): { ok: true; payload: TopicExportPayload | CategoryExportPayload } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []

  if (!isRecord(payload)) {
    return { ok: false, issues: [{ path: 'payload', message: 'must be an object' }] }
  }

  const categories: Category[] = []
  const topics: Topic[] = []
  const entries: Entry[] = []

  if (kind === 'topic') {
    if (!isRecord(payload.topic)) addIssue(issues, 'payload.topic', 'must be an object')
    if (!Array.isArray(payload.entries)) addIssue(issues, 'payload.entries', 'must be an array')
    if (issues.length > 0) return { ok: false, issues }

    topics.push(payload.topic as Topic)
    entries.push(...(payload.entries as Entry[]))
    const placeholderCategory: Category = {
      id: (payload.topic as Topic).categoryId,
      name: 'Imported category',
      description: '',
      createdAt: (payload.topic as Topic).createdAt,
      updatedAt: (payload.topic as Topic).updatedAt,
      lastAccessedAt: null,
    }
    categories.push(placeholderCategory)
  } else {
    if (!isRecord(payload.category)) addIssue(issues, 'payload.category', 'must be an object')
    if (!Array.isArray(payload.topics)) addIssue(issues, 'payload.topics', 'must be an array')
    if (!Array.isArray(payload.entries)) addIssue(issues, 'payload.entries', 'must be an array')
    if (issues.length > 0) return { ok: false, issues }

    categories.push(payload.category as Category)
    topics.push(...(payload.topics as Topic[]))
    entries.push(...(payload.entries as Entry[]))
  }

  const candidate = {
    ...createEmptyStudyData(),
    categories,
    topics,
    entries,
  }
  const validation = validateStudyData(candidate)
  if (!validation.ok) issues.push(...validation.issues)

  const usedIds = new Set<string>()
  validateUniqueIdsAcrossRecords(categories, 'payload.category', usedIds, issues)
  validateUniqueIdsAcrossRecords(topics, 'payload.topics', usedIds, issues)
  validateUniqueIdsAcrossRecords(entries, 'payload.entries', usedIds, issues)

  if (kind === 'topic' && topics[0]) {
    const topicId = topics[0].id
    entries.forEach((entry, index) => {
      if (entry.topicId !== topicId) addIssue(issues, `payload.entries[${index}].topicId`, 'must reference the exported topic')
    })
  }

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, payload: kind === 'topic' ? { topic: topics[0], entries } : { category: categories[0], topics, entries } }
}

export function summarizeStudyExport(document: StudyExportDocument): StudyExportSummary {
  if (document.kind === 'full') {
    const payload = document.payload as StudyData
    return { kind: document.kind, categoryCount: payload.categories.length, topicCount: payload.topics.length, entryCount: payload.entries.length }
  }
  if (document.kind === 'topic') {
    const payload = document.payload as TopicExportPayload
    return { kind: document.kind, categoryCount: 0, topicCount: 1, entryCount: payload.entries.length }
  }
  const payload = document.payload as CategoryExportPayload
  return { kind: document.kind, categoryCount: 1, topicCount: payload.topics.length, entryCount: payload.entries.length }
}

function createDocument(
  kind: StudyExportKind,
  payload: StudyData | TopicExportPayload | CategoryExportPayload,
  exportedAt = Date.now(),
): StudyExportDocument {
  return {
    format: STUDY_EXPORT_FORMAT,
    formatVersion: STUDY_EXPORT_FORMAT_VERSION,
    schemaVersion: STUDY_DATA_SCHEMA_VERSION,
    exportedAt,
    kind,
    payload,
  }
}

export function createFullBackup(data: StudyData, exportedAt = Date.now()): StudyExportDocument {
  return createDocument('full', data, exportedAt)
}

export function createTopicExport(data: StudyData, topicId: RecordId, exportedAt = Date.now()): StudyExportDocument | null {
  const topic = data.topics.find((item) => item.id === topicId)
  if (!topic) return null

  return createDocument('topic', {
    topic,
    entries: data.entries.filter((entry) => entry.topicId === topicId),
  }, exportedAt)
}

export function createCategoryExport(
  data: StudyData,
  categoryId: RecordId,
  selectedTopicIds?: Iterable<RecordId>,
  exportedAt = Date.now(),
): StudyExportDocument | null {
  const category = data.categories.find((item) => item.id === categoryId)
  if (!category) return null

  const selectedIds = selectedTopicIds ? new Set(selectedTopicIds) : null
  const topics = data.topics.filter((topic) => topic.categoryId === categoryId
    && (!selectedIds || selectedIds.has(topic.id))
    && data.entries.some((entry) => entry.topicId === topic.id))
  if (topics.length === 0) return null

  const topicIds = new Set(topics.map((topic) => topic.id))
  return createDocument('category', {
    category,
    topics,
    entries: data.entries.filter((entry) => topicIds.has(entry.topicId)),
  }, exportedAt)
}

export function serializeStudyExport(document: StudyExportDocument): string {
  return JSON.stringify(document, null, 2)
}

export function parseStudyExport(json: string): ParsedStudyExport | { ok: false; message: string; issues?: ValidationIssue[] } {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, message: 'This file is not valid JSON.' }
  }

  if (!isRecord(parsed)) return { ok: false, message: 'This file must contain a JSON object.' }
  const issues: ValidationIssue[] = []
  if (parsed.format !== STUDY_EXPORT_FORMAT) addIssue(issues, 'format', `must be ${STUDY_EXPORT_FORMAT}`)
  if (parsed.formatVersion !== STUDY_EXPORT_FORMAT_VERSION) addIssue(issues, 'formatVersion', `must be ${STUDY_EXPORT_FORMAT_VERSION}`)
  if (parsed.schemaVersion !== STUDY_DATA_SCHEMA_VERSION) addIssue(issues, 'schemaVersion', `must be ${STUDY_DATA_SCHEMA_VERSION}`)
  if (!isTimestamp(parsed.exportedAt)) addIssue(issues, 'exportedAt', 'must be a timestamp')
  if (parsed.kind !== 'topic' && parsed.kind !== 'category' && parsed.kind !== 'full') addIssue(issues, 'kind', 'must be topic, category, or full')
  if (issues.length > 0) return { ok: false, message: 'This file uses an unsupported or invalid export format.', issues }

  const exportedAt = parsed.exportedAt as number
  const kind = parsed.kind as StudyExportKind

  if (kind === 'full') {
    const validation = validateStudyData(parsed.payload)
    if (!validation.ok) return { ok: false, message: 'This full backup failed study data validation.', issues: validation.issues }

    const payload = validation.data
    const usedIds = new Set<string>()
    const fullIssues: ValidationIssue[] = []
    validateUniqueIdsAcrossRecords(payload.categories, 'payload.categories', usedIds, fullIssues)
    validateUniqueIdsAcrossRecords(payload.topics, 'payload.topics', usedIds, fullIssues)
    validateUniqueIdsAcrossRecords(payload.entries, 'payload.entries', usedIds, fullIssues)
    validateActivityRelationships(payload, fullIssues)
    if (fullIssues.length > 0) return { ok: false, message: 'This full backup contains duplicate record IDs.', issues: fullIssues }

    const document = createDocument('full', payload, exportedAt)
    return { ok: true, document, summary: summarizeStudyExport(document) }
  }

  const payloadValidation = validateContextualPayload(kind, parsed.payload)
  if (!payloadValidation.ok) return { ok: false, message: `This ${kind} export failed validation.`, issues: payloadValidation.issues }
  const document = createDocument(kind, payloadValidation.payload, exportedAt)
  return { ok: true, document, summary: summarizeStudyExport(document) }
}

function remapId(originalId: RecordId, usedIds: Set<RecordId>) {
  if (!usedIds.has(originalId)) {
    usedIds.add(originalId)
    return { id: originalId, remapped: false }
  }

  let nextId = createStableId()
  while (usedIds.has(nextId)) nextId = createStableId()
  usedIds.add(nextId)
  return { id: nextId, remapped: true }
}

function getAllUsedIds(data: StudyData) {
  return new Set([...data.categories, ...data.topics, ...data.entries].map((record) => record.id))
}

export function importTopicExport(
  data: StudyData,
  topicId: RecordId,
  document: StudyExportDocument,
  mode: ContextualImportMode,
): StudyImportResult {
  if (document.kind !== 'topic') return { ok: false, message: 'Choose a topic export for this topic.' }
  const topic = data.topics.find((item) => item.id === topicId)
  if (!topic) return { ok: false, message: 'The current topic could not be found.' }

  const payload = document.payload as TopicExportPayload
  const usedIds = getAllUsedIds(data)
  const importedEntries = payload.entries.map((entry) => {
    const nextId = remapId(entry.id, usedIds)
    return { ...entry, id: nextId.id, topicId }
  })
  const replacedEntryCount = mode === 'replace' ? data.entries.filter((entry) => entry.topicId === topicId).length : 0
  const nextData: StudyData = {
    ...data,
    entries: [
      ...data.entries.filter((entry) => mode !== 'replace' || entry.topicId !== topicId),
      ...importedEntries,
    ],
  }

  return {
    ok: true,
    data: nextData,
    summary: {
      ...summarizeStudyExport(document),
      mode,
      remappedIdCount: importedEntries.filter((entry, index) => entry.id !== payload.entries[index].id).length,
      replacedTopicCount: 0,
      replacedEntryCount,
      timerReset: false,
    },
  }
}

export function importCategoryExport(
  data: StudyData,
  categoryId: RecordId,
  document: StudyExportDocument,
  mode: ContextualImportMode,
): StudyImportResult {
  if (document.kind !== 'category') return { ok: false, message: 'Choose a category export for this category.' }
  if (!data.categories.some((category) => category.id === categoryId)) return { ok: false, message: 'The current category could not be found.' }

  const payload = document.payload as CategoryExportPayload
  const usedIds = getAllUsedIds(data)
  const topicIdMap = new Map<RecordId, RecordId>()
  let remappedIdCount = 0
  const importedTopics = payload.topics.map((sourceTopic) => {
    const nextId = remapId(sourceTopic.id, usedIds)
    if (nextId.remapped) remappedIdCount += 1
    topicIdMap.set(sourceTopic.id, nextId.id)
    return { ...sourceTopic, id: nextId.id, categoryId }
  })
  const importedEntries = payload.entries.map((sourceEntry) => {
    const nextId = remapId(sourceEntry.id, usedIds)
    if (nextId.remapped) remappedIdCount += 1
    const nextTopicId = topicIdMap.get(sourceEntry.topicId)
    if (!nextTopicId) return null
    return { ...sourceEntry, id: nextId.id, topicId: nextTopicId }
  })
  if (importedEntries.some((entry) => entry === null)) return { ok: false, message: 'The category export contains an invalid topic relationship.' }

  const existingTopicIds = new Set(data.topics.filter((topic) => topic.categoryId === categoryId).map((topic) => topic.id))
  const replacedEntryCount = mode === 'replace'
    ? data.entries.filter((entry) => existingTopicIds.has(entry.topicId)).length
    : 0
  const replacedTopicCount = mode === 'replace' ? existingTopicIds.size : 0
  const nextData: StudyData = {
    ...data,
    topics: [
      ...data.topics.filter((topic) => mode !== 'replace' || topic.categoryId !== categoryId),
      ...importedTopics,
    ],
    entries: [
      ...data.entries.filter((entry) => mode !== 'replace' || !existingTopicIds.has(entry.topicId)),
      ...(importedEntries as Entry[]),
    ],
    activity: mode === 'replace'
      ? { ...data.activity, recentlyAccessed: data.activity.recentlyAccessed.filter((activity) => !existingTopicIds.has(activity.recordId)) }
      : data.activity,
  }

  return {
    ok: true,
    data: nextData,
    summary: {
      ...summarizeStudyExport(document),
      mode,
      remappedIdCount,
      replacedTopicCount,
      replacedEntryCount,
      timerReset: false,
    },
  }
}

export function restoreFullBackup(document: StudyExportDocument): StudyImportResult {
  if (document.kind !== 'full') return { ok: false, message: 'Choose a complete Study Reviewer backup.' }
  const payload = document.payload as StudyData
  const validation = validateStudyData(payload)
  if (!validation.ok) return { ok: false, message: 'This full backup failed study data validation.', issues: validation.issues }
  const importIssues: ValidationIssue[] = []
  const usedIds = new Set<string>()
  validateUniqueIdsAcrossRecords(validation.data.categories, 'payload.categories', usedIds, importIssues)
  validateUniqueIdsAcrossRecords(validation.data.topics, 'payload.topics', usedIds, importIssues)
  validateUniqueIdsAcrossRecords(validation.data.entries, 'payload.entries', usedIds, importIssues)
  validateActivityRelationships(validation.data, importIssues)
  if (importIssues.length > 0) return { ok: false, message: 'This full backup contains invalid record relationships or duplicate IDs.', issues: importIssues }

  return {
    ok: true,
    data: {
      ...validation.data,
      timer: {
        ...validation.data.timer,
        activeSession: null,
      },
    },
    summary: {
      ...summarizeStudyExport(document),
      remappedIdCount: 0,
      replacedTopicCount: validation.data.topics.length,
      replacedEntryCount: validation.data.entries.length,
      timerReset: true,
    },
  }
}
