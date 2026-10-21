import { useContext } from 'react'

import { StudyContext } from '@/lib/study-context'

export function useStudyData() {
  const context = useContext(StudyContext)
  if (!context) throw new Error('useStudyData must be used within StudyProvider')
  return context
}
