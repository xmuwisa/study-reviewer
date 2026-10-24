import { findCategory, findTopic, type Category, type Entry, type RecordId, type StudyData, type Topic } from '@/lib/study-data'

export type StudyPdfTopic = {
  topic: Topic
  entries: Entry[]
}

export type StudyPdfDocument = {
  category: Category
  topics: StudyPdfTopic[]
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_LEFT = 42.52
const MARGIN_RIGHT = 42.52
const MARGIN_TOP = 45.35
const MARGIN_BOTTOM = 48.19
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const TABLE_HEADER_HEIGHT = 25
const CELL_PADDING = 10
const BODY_FONT_SIZE = 10.5
const BODY_LINE_HEIGHT = 14.5
const TOPIC_GAP = 18

type PdfFont = 'regular' | 'bold'
type PdfPage = string[]

const WIN_ANSI_REPLACEMENTS: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
}

function getEntriesByTopic(data: StudyData) {
  const entriesByTopic = new Map<RecordId, Entry[]>()
  data.entries.forEach((entry) => {
    const entries = entriesByTopic.get(entry.topicId) ?? []
    entries.push(entry)
    entriesByTopic.set(entry.topicId, entries)
  })
  return entriesByTopic
}

export function getPdfEligibleTopics(data: StudyData, categoryId: RecordId): StudyPdfTopic[] {
  const entriesByTopic = getEntriesByTopic(data)
  return data.topics
    .filter((topic) => topic.categoryId === categoryId)
    .map((topic) => ({ topic, entries: entriesByTopic.get(topic.id) ?? [] }))
    .filter(({ entries }) => entries.length > 0)
}

export function createTopicPdfDocument(
  data: StudyData,
  categoryId: RecordId,
  topicId: RecordId,
): StudyPdfDocument | null {
  const category = findCategory(data, categoryId)
  const topic = findTopic(data, topicId)
  if (!category || !topic || topic.categoryId !== categoryId) return null

  const entries = getEntriesByTopic(data).get(topicId) ?? []
  if (entries.length === 0) return null

  return { category, topics: [{ topic, entries }] }
}

export function createCategoryPdfDocument(
  data: StudyData,
  categoryId: RecordId,
  selectedTopicIds: Iterable<RecordId>,
): StudyPdfDocument | null {
  const category = findCategory(data, categoryId)
  if (!category) return null

  const selectedIds = new Set(selectedTopicIds)
  const topics = getPdfEligibleTopics(data, categoryId).filter(({ topic }) => selectedIds.has(topic.id))
  if (topics.length === 0) return null

  return { category, topics }
}

function getPdfFilename(document: StudyPdfDocument) {
  const topicSuffix = document.topics.length === 1 ? `-${document.topics[0].topic.name}` : ''
  const baseName = `${document.category.name}${topicSuffix}`
  return `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'study-reviewer'}.pdf`
}

function getWinAnsiCode(character: string) {
  const codePoint = character.codePointAt(0) ?? 0x3f
  if (codePoint >= 32 && codePoint <= 126) return codePoint
  if (codePoint >= 160 && codePoint <= 255) return codePoint
  return WIN_ANSI_REPLACEMENTS[character] ?? 0x3f
}

function escapePdfText(value: string) {
  let result = ''
  for (const character of value) {
    const code = getWinAnsiCode(character)
    if (code === 0x28 || code === 0x29 || code === 0x5c) result += `\\${String.fromCharCode(code)}`
    else result += String.fromCharCode(code)
  }
  return result
}

function getCharacterWidth(character: string, font: PdfFont) {
  if (/\s/.test(character)) return 0.25
  if ("ilI.,:;!|'`".includes(character)) return 0.25
  if ('mwMW@%&'.includes(character)) return 0.82
  if ('ABCDEFGHJKLMNOPQRSTUVXYZ'.includes(character)) return font === 'bold' ? 0.68 : 0.62
  if ('()[]{}<>/\\'.includes(character)) return 0.34
  if ('-_=+*'.includes(character)) return 0.42
  return font === 'bold' ? 0.56 : 0.52
}

function measureText(value: string, fontSize: number, font: PdfFont) {
  return [...value].reduce((width, character) => width + getCharacterWidth(character, font) * fontSize, 0)
}

function wrapText(value: string, maxWidth: number, fontSize: number, font: PdfFont) {
  const paragraphs = value.replace(/\r\n?/g, '\n').split('\n')
  const lines: string[] = []

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push('')
      return
    }

    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    let currentLine = ''
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word
      if (measureText(candidate, fontSize, font) <= maxWidth) {
        currentLine = candidate
        return
      }

      if (currentLine) lines.push(currentLine)
      currentLine = ''
      for (const character of word) {
        const candidateCharacter = `${currentLine}${character}`
        if (currentLine && measureText(candidateCharacter, fontSize, font) > maxWidth) {
          lines.push(currentLine)
          currentLine = character
        } else {
          currentLine = candidateCharacter
        }
      }
    })

    if (currentLine) lines.push(currentLine)
  })

  return lines.length > 0 ? lines : ['']
}

function roundPdfNumber(value: number) {
  return value.toFixed(2).replace(/\.00$/, '')
}

function drawText(page: PdfPage, value: string, x: number, top: number, fontSize: number, font: PdfFont, color = '0.12 0.12 0.12') {
  const fontName = font === 'bold' ? 'F2' : 'F1'
  const baseline = PAGE_HEIGHT - top - fontSize
  page.push(`${color} rg`)
  page.push(`BT /${fontName} ${roundPdfNumber(fontSize)} Tf 1 0 0 1 ${roundPdfNumber(x)} ${roundPdfNumber(baseline)} Tm (${escapePdfText(value)}) Tj ET`)
}

function drawLines(page: PdfPage, lines: string[], x: number, top: number, fontSize: number, lineHeight: number, font: PdfFont, color?: string) {
  lines.forEach((line, index) => drawText(page, line, x, top + index * lineHeight, fontSize, font, color))
}

function drawLine(page: PdfPage, x1: number, top1: number, x2: number, top2: number, color = '0.45 0.45 0.45', width = 0.6) {
  const y1 = PAGE_HEIGHT - top1
  const y2 = PAGE_HEIGHT - top2
  page.push(`${roundPdfNumber(width)} w ${color} RG ${roundPdfNumber(x1)} ${roundPdfNumber(y1)} m ${roundPdfNumber(x2)} ${roundPdfNumber(y2)} l S`)
}

function drawCell(page: PdfPage, x: number, top: number, width: number, height: number, fill?: string) {
  const y = PAGE_HEIGHT - top - height
  if (fill) page.push(`${fill} rg ${roundPdfNumber(x)} ${roundPdfNumber(y)} ${roundPdfNumber(width)} ${roundPdfNumber(height)} re f`)
  page.push(`0.58 0.58 0.58 RG 0.55 w ${roundPdfNumber(x)} ${roundPdfNumber(y)} ${roundPdfNumber(width)} ${roundPdfNumber(height)} re S`)
}

function getEntryLayout(entry: Entry, columnWidth: number) {
  const textWidth = columnWidth - CELL_PADDING * 2
  const leftLines = wrapText(entry.question, textWidth, BODY_FONT_SIZE, 'regular')
  const rightLines = wrapText(entry.answer, textWidth, BODY_FONT_SIZE, 'regular')
  const lineCount = Math.max(leftLines.length, rightLines.length, 1)
  const naturalHeight = lineCount * BODY_LINE_HEIGHT + CELL_PADDING * 2
  return {
    leftLines,
    rightLines,
    lineCount,
    height: naturalHeight,
  }
}

function drawTableHeader(page: PdfPage, top: number, columnWidth: number) {
  drawCell(page, MARGIN_LEFT, top, columnWidth, TABLE_HEADER_HEIGHT, '0.94 0.94 0.94')
  drawCell(page, MARGIN_LEFT + columnWidth, top, columnWidth, TABLE_HEADER_HEIGHT, '0.94 0.94 0.94')
  drawText(page, 'Question / Term', MARGIN_LEFT + CELL_PADDING, top + 7, 8.5, 'bold', '0.16 0.16 0.16')
  drawText(page, 'Answer / Definition', MARGIN_LEFT + columnWidth + CELL_PADDING, top + 7, 8.5, 'bold', '0.16 0.16 0.16')
}

function drawEntrySegment(
  page: PdfPage,
  top: number,
  columnWidth: number,
  leftLines: string[],
  rightLines: string[],
  startLine: number,
  lineCount: number,
) {
  const segmentHeight = lineCount * BODY_LINE_HEIGHT + CELL_PADDING * 2
  drawCell(page, MARGIN_LEFT, top, columnWidth, segmentHeight)
  drawCell(page, MARGIN_LEFT + columnWidth, top, columnWidth, segmentHeight)
  drawLines(page, leftLines.slice(startLine, startLine + lineCount), MARGIN_LEFT + CELL_PADDING, top + CELL_PADDING, BODY_FONT_SIZE, BODY_LINE_HEIGHT, 'regular')
  drawLines(page, rightLines.slice(startLine, startLine + lineCount), MARGIN_LEFT + columnWidth + CELL_PADDING, top + CELL_PADDING, BODY_FONT_SIZE, BODY_LINE_HEIGHT, 'regular')
  return segmentHeight
}

function createPdfPages(document: StudyPdfDocument) {
  const columnWidth = CONTENT_WIDTH / 2
  const pages: PdfPage[] = [[]]
  let page = pages[0]
  let cursor = MARGIN_TOP

  function startPage() {
    page = []
    pages.push(page)
    cursor = MARGIN_TOP
  }

  function drawMainHeading() {
    drawText(page, 'STUDY REVIEWER', MARGIN_LEFT, cursor, 8, 'bold', '0.35 0.35 0.35')
    cursor += 15
    const categoryLines = wrapText(document.category.name, CONTENT_WIDTH, 22, 'bold')
    drawLines(page, categoryLines, MARGIN_LEFT, cursor, 22, 26, 'bold')
    cursor += categoryLines.length * 26
    const entryCount = document.topics.reduce((count, topic) => count + topic.entries.length, 0)
    drawText(page, `${document.topics.length} ${document.topics.length === 1 ? 'topic' : 'topics'} · ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`, MARGIN_LEFT, cursor + 5, 9, 'regular', '0.35 0.35 0.35')
    cursor += 31
  }

  function drawTopic(topic: StudyPdfTopic) {
    const titleLines = wrapText(topic.topic.name, CONTENT_WIDTH, 14, 'bold')
    const descriptionLines = topic.topic.description ? wrapText(topic.topic.description, CONTENT_WIDTH, 9, 'regular') : []
    const firstEntry = getEntryLayout(topic.entries[0], columnWidth)
    const estimatedHeight = titleLines.length * 17 + (descriptionLines.length * 13) + 13 + TABLE_HEADER_HEIGHT + firstEntry.height
    if (cursor + estimatedHeight > PAGE_HEIGHT - MARGIN_BOTTOM && cursor !== MARGIN_TOP) startPage()

    drawLines(page, titleLines, MARGIN_LEFT, cursor, 14, 17, 'bold')
    cursor += titleLines.length * 17
    drawLine(page, MARGIN_LEFT, cursor + 1, MARGIN_LEFT + CONTENT_WIDTH, cursor + 1, '0.14 0.14 0.14', 1.2)
    cursor += 8

    if (descriptionLines.length > 0) {
      drawLines(page, descriptionLines, MARGIN_LEFT, cursor, 9, 13, 'regular', '0.35 0.35 0.35')
      cursor += descriptionLines.length * 13 + 5
    }

    drawTableHeader(page, cursor, columnWidth)
    cursor += TABLE_HEADER_HEIGHT

    topic.entries.forEach((entry) => {
      const layout = getEntryLayout(entry, columnWidth)
      const availablePageHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

      if (layout.height <= availablePageHeight) {
        if (cursor + layout.height > PAGE_HEIGHT - MARGIN_BOTTOM) {
          startPage()
          drawTableHeader(page, cursor, columnWidth)
          cursor += TABLE_HEADER_HEIGHT
        }
        cursor += drawEntrySegment(page, cursor, columnWidth, layout.leftLines, layout.rightLines, 0, layout.lineCount)
        return
      }

      let startLine = 0
      while (startLine < layout.lineCount) {
        const availableHeight = PAGE_HEIGHT - MARGIN_BOTTOM - cursor
        const minimumSegmentHeight = BODY_LINE_HEIGHT + CELL_PADDING * 2
        if (availableHeight < minimumSegmentHeight && cursor !== MARGIN_TOP) {
          startPage()
          drawTableHeader(page, cursor, columnWidth)
          cursor += TABLE_HEADER_HEIGHT
          continue
        }
        const availableLines = Math.max(1, Math.floor((availableHeight - CELL_PADDING * 2) / BODY_LINE_HEIGHT))
        const segmentLineCount = Math.min(layout.lineCount - startLine, availableLines)
        cursor += drawEntrySegment(page, cursor, columnWidth, layout.leftLines, layout.rightLines, startLine, segmentLineCount)
        startLine += segmentLineCount
        if (startLine < layout.lineCount) {
          startPage()
          drawTableHeader(page, cursor, columnWidth)
          cursor += TABLE_HEADER_HEIGHT
        }
      }
    })

    cursor += TOPIC_GAP
  }

  drawMainHeading()
  document.topics.forEach(drawTopic)
  return pages
}

function encodePdfBytes(value: string) {
  const bytes = new Uint8Array(value.length)
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff
  return bytes
}

function joinBytes(chunks: Uint8Array[]) {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const result = new Uint8Array(size)
  let offset = 0
  chunks.forEach((chunk) => {
    result.set(chunk, offset)
    offset += chunk.length
  })
  return result
}

function buildPdfBytes(document: StudyPdfDocument) {
  const pages = createPdfPages(document)
  const objectCount = 4 + pages.length * 2
  const objectBodies: Uint8Array[] = new Array(objectCount + 1)
  const pageObjectIds = pages.map((_, index) => 6 + index * 2)

  objectBodies[1] = encodePdfBytes('<< /Type /Catalog /Pages 2 0 R >>')
  objectBodies[2] = encodePdfBytes(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`)
  objectBodies[3] = encodePdfBytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objectBodies[4] = encodePdfBytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')

  pages.forEach((commands, index) => {
    const contentObjectId = 5 + index * 2
    const pageObjectId = contentObjectId + 1
    const stream = encodePdfBytes(commands.join('\n'))
    objectBodies[contentObjectId] = joinBytes([
      encodePdfBytes(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      encodePdfBytes('\nendstream'),
    ])
    objectBodies[pageObjectId] = encodePdfBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`)
  })

  const chunks: Uint8Array[] = [encodePdfBytes('%PDF-1.4\n%\xff\xff\xff\xff\n')]
  const offsets = new Array<number>(objectCount + 1).fill(0)
  let byteLength = chunks[0].length

  for (let objectId = 1; objectId <= objectCount; objectId += 1) {
    offsets[objectId] = byteLength
    const objectStart = encodePdfBytes(`${objectId} 0 obj\n`)
    const objectEnd = encodePdfBytes('\nendobj\n')
    chunks.push(objectStart, objectBodies[objectId], objectEnd)
    byteLength += objectStart.length + objectBodies[objectId].length + objectEnd.length
  }

  const crossReferenceOffset = byteLength
  chunks.push(encodePdfBytes(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`))
  for (let objectId = 1; objectId <= objectCount; objectId += 1) {
    chunks.push(encodePdfBytes(`${String(offsets[objectId]).padStart(10, '0')} 00000 n \n`))
  }
  chunks.push(encodePdfBytes(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`))
  return joinBytes(chunks)
}

export function downloadStudyPdf(document: StudyPdfDocument): { ok: true; filename: string } | { ok: false; message: string } {
  if (typeof window === 'undefined') return { ok: false, message: 'PDF export is only available in the browser.' }

  try {
    const filename = getPdfFilename(document)
    const blob = new Blob([buildPdfBytes(document)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = filename
    link.className = 'sr-only'
    window.document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    return { ok: true, filename }
  } catch {
    return { ok: false, message: 'The PDF could not be generated locally.' }
  }
}
