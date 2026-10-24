import { Download, FileJson2, MoreHorizontal, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function StudyDataActionsMenu({
  onImportJson,
  onExportJson,
  exportJsonDisabled,
  onExportPdf,
  exportPdfDisabled,
}: {
  onImportJson: () => void
  onExportJson: () => void
  exportJsonDisabled: boolean
  onExportPdf: () => void
  exportPdfDisabled: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Open import and export actions" />
        }
      >
        <MoreHorizontal aria-hidden="true" data-icon="inline-start" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2">
        <DropdownMenuGroup>
          <DropdownMenuItem className="min-h-10 whitespace-nowrap px-3" onClick={onImportJson}>
            <Upload aria-hidden="true" /> Import JSON
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-10 whitespace-nowrap px-3" onClick={onExportJson} disabled={exportJsonDisabled}>
            <FileJson2 aria-hidden="true" /> Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-10 whitespace-nowrap px-3" onClick={onExportPdf} disabled={exportPdfDisabled}>
            <Download aria-hidden="true" /> Export PDF
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
