import {
  createEmptyStudyData,
  STUDY_DATA_STORAGE_KEY,
  type StudyData,
} from '@/lib/study-data'
import {
  migrateStudyData,
  validateStudyData,
  type ValidationIssue,
} from '@/lib/study-validation'

export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>

export type LoadStudyDataResult =
  | { status: 'empty' | 'loaded'; data: StudyData }
  | { status: 'invalid' | 'unavailable'; data: StudyData; message: string; issues?: ValidationIssue[] }

export type SaveStudyDataResult =
  | { ok: true }
  | { ok: false; status: 'invalid' | 'unavailable' | 'storage-error'; message: string; issues?: ValidationIssue[] }

export type ExportStudyDataResult =
  | { ok: true; json: string }
  | { ok: false; status: 'invalid'; message: string; issues: ValidationIssue[] }

export type StudyRepository = {
  load: () => LoadStudyDataResult
  save: (data: StudyData) => SaveStudyDataResult
  export: (data: StudyData) => ExportStudyDataResult
}

export function getLocalStorageAdapter(): StorageAdapter | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadStudyData(storage: StorageAdapter | null = getLocalStorageAdapter()): LoadStudyDataResult {
  const emptyData = createEmptyStudyData()
  if (!storage) {
    return { status: 'unavailable', data: emptyData, message: 'Local storage is unavailable.' }
  }

  let rawValue: string | null
  try {
    rawValue = storage.getItem(STUDY_DATA_STORAGE_KEY)
  } catch {
    return { status: 'unavailable', data: emptyData, message: 'Local storage could not be read.' }
  }

  if (rawValue === null) return { status: 'empty', data: emptyData }

  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(rawValue)
  } catch {
    return { status: 'invalid', data: emptyData, message: 'Stored study data is not valid JSON.' }
  }

  const migration = migrateStudyData(parsedValue)
  if (!migration.ok) return { status: 'invalid', data: emptyData, message: migration.message }

  const validation = validateStudyData(migration.value)
  if (!validation.ok) {
    return {
      status: 'invalid',
      data: emptyData,
      message: 'Stored study data failed validation.',
      issues: validation.issues,
    }
  }

  return { status: 'loaded', data: validation.data }
}

export function saveStudyData(data: StudyData, storage: StorageAdapter | null = getLocalStorageAdapter()): SaveStudyDataResult {
  const validation = validateStudyData(data)
  if (!validation.ok) return { ok: false, status: 'invalid', message: 'Study data failed validation.', issues: validation.issues }
  if (!storage) return { ok: false, status: 'unavailable', message: 'Local storage is unavailable.' }

  try {
    storage.setItem(STUDY_DATA_STORAGE_KEY, JSON.stringify(validation.data))
    return { ok: true }
  } catch {
    return { ok: false, status: 'storage-error', message: 'Study data could not be saved to local storage.' }
  }
}

export function exportStudyData(data: StudyData): ExportStudyDataResult {
  const validation = validateStudyData(data)
  if (!validation.ok) return { ok: false, status: 'invalid', message: 'Study data failed validation.', issues: validation.issues }

  return { ok: true, json: JSON.stringify(validation.data, null, 2) }
}

export function createStudyRepository(storage: StorageAdapter | null = getLocalStorageAdapter()): StudyRepository {
  return {
    load: () => loadStudyData(storage),
    save: (data) => saveStudyData(data, storage),
    export: (data) => exportStudyData(data),
  }
}
