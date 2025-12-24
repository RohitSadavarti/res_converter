import * as pdfjsLib from "pdfjs-dist"

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs`
}

export interface CourseRecord {
  theory: string
  grade1: string
  internal: string
  grade2: string
  total: string
  credits: string
  grade: string
  gradePoints: string
  creditGradeProduct: string
}

export interface StudentRecord {
  seatNo: string
  lastName: string
  firstName: string
  middleName: string
  mothersName: string
  abcId: string
  summary: string
  rawBlock: string
  courses: CourseRecord[]
}

const MAX_COURSES = 12

export async function parseStudentResultsPDF(file: File): Promise<{
  students: StudentRecord[]
  rawText: string
}> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  console.log("[v0] PDF loaded, pages:", pdf.numPages)

  const textParts: string[] = []

  // Extract text from all pages
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Get text items sorted by position
    const items = textContent.items
      .filter((item): item is { str: string; transform: number[] } => "str" in item && typeof item.str === "string")
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }))
      .sort((a, b) => {
        // Sort by Y (descending) then X (ascending)
        const yDiff = b.y - a.y
        if (Math.abs(yDiff) > 5) return yDiff
        return a.x - b.x
      })

    // Group items into lines
    let currentLine: string[] = []
    let currentY = items[0]?.y ?? 0

    for (const item of items) {
      if (Math.abs(item.y - currentY) > 5) {
        // New line
        if (currentLine.length > 0) {
          textParts.push(currentLine.join(" "))
        }
        currentLine = [item.text]
        currentY = item.y
      } else {
        currentLine.push(item.text)
      }
    }

    if (currentLine.length > 0) {
      textParts.push(currentLine.join(" "))
    }
  }

  const rawText = textParts.join("\n")
  console.log("[v0] Raw text length:", rawText.length)
  console.log("[v0] First 2000 chars:", rawText.substring(0, 2000))

  // Parse student blocks from raw text
  const students = parseStudentBlocks(rawText)

  return { students, rawText }
}

function parseStudentBlocks(text: string): StudentRecord[] {
  // Normalize text
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Alternative approach: find all seat numbers and split
  const seatRegex = /(?:^|\n)\s*(\d{6,7})\s+/g
  const seatMatches: { index: number; seat: string }[] = []
  let match: RegExpExecArray | null

  while ((match = seatRegex.exec(normalizedText)) !== null) {
    seatMatches.push({ index: match.index, seat: match[1] })
  }

  console.log("[v0] Found seat numbers:", seatMatches.length)

  // Extract blocks between seat numbers
  const blocks: string[] = []
  for (let i = 0; i < seatMatches.length; i++) {
    const start = seatMatches[i].index
    const end = i + 1 < seatMatches.length ? seatMatches[i + 1].index : normalizedText.length
    const block = normalizedText.substring(start, end).trim()
    if (block) {
      blocks.push(block)
    }
  }

  console.log("[v0] Extracted blocks:", blocks.length)
  if (blocks.length > 0) {
    console.log("[v0] First block full content:", blocks[0])
  }

  // Parse each block into a student record
  const students: StudentRecord[] = []

  for (const block of blocks) {
    const student = parseStudentFromBlock(block)
    if (student) {
      students.push(student)
    }
  }

  console.log("[v0] Parsed students:", students.length)
  if (students.length > 0 && students[0].courses.length > 0) {
    console.log("[v0] First student courses sample:", students[0].courses.slice(0, 3))
  }

  return students
}

function parseStudentFromBlock(block: string): StudentRecord | null {
  // Normalize whitespace - convert all whitespace to single spaces
  const normalizedBlock = block.replace(/\s+/g, " ").trim()
  const tokens = normalizedBlock.split(" ")

  if (tokens.length < 5) return null

  // First token is seat number
  const seatNo = tokens[0]
  if (!/^\d{6,7}$/.test(seatNo)) return null

  // Find the 4 name tokens (lastName, firstName, middleName, mothersName)
  // Names are uppercase letters only, no numbers or symbols
  const startIdx = 1
  let lastName = tokens[startIdx] || ""

  // Remove "/" prefix from name if present (female indicator)
  if (lastName.startsWith("/")) {
    lastName = lastName.substring(1)
  }

  const firstName = tokens[startIdx + 1] || ""
  const middleName = tokens[startIdx + 2] || ""
  const mothersName = tokens[startIdx + 3] || ""

  // Course data starts at index 5 (after seatNo + 4 names)
  // Extract tokens from index 5 until we hit "ABC_ID"
  const courseDataStart = 5
  let courseDataEnd = tokens.length

  for (let i = courseDataStart; i < tokens.length; i++) {
    if (tokens[i].toUpperCase().includes("ABC")) {
      courseDataEnd = i
      break
    }
  }

  const courseTokens = tokens.slice(courseDataStart, courseDataEnd)
  console.log("[v0] Course tokens for seat", seatNo, ":", courseTokens.slice(0, 50).join(" "))

  // Extract ABC_ID
  const abcMatch = normalizedBlock.match(/ABC_ID\s*[:-]?\s*([0-9-]+|--)/i)
  const abcId = abcMatch ? abcMatch[1].trim() : ""

  // Extract summary (semester info)
  const summaryMatch = normalizedBlock.match(/(Semester[\s\S]*?)(?:$)/i)
  const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, " ").trim() : ""

  // Extract course data from the course tokens
  const courses = extractCoursesFromTokens(courseTokens)

  return {
    seatNo,
    lastName,
    firstName,
    middleName,
    mothersName,
    abcId,
    summary,
    rawBlock: block.substring(0, 4000),
    courses,
  }
}

function extractCoursesFromTokens(tokens: string[]): CourseRecord[] {
  const courses: CourseRecord[] = []

  // Each course typically has this pattern, but may vary:
  // THEORY(mark) GRADE INTERNAL(mark) GRADE TOTAL CREDITS GRADE GP C*GP
  // But the spacing and format varies significantly in the actual PDF data

  // New strategy: Look for sequences that match the credit pattern (single digit followed by grade info)
  // Credits are typically 2-10, followed by grade letter, then grade points

  const isTheoryMark = (t: string) => /^(\d{1,2}[EF+$@]*|A)$/i.test(t)
  const isInternalMark = (t: string) => /^(\d{1,2}[+$@]*|A)$/i.test(t)
  const isGrade = (t: string) => /^([A-Z][+$]*|F|O|--)$/i.test(t)
  const isTotal = (t: string) => /^(\d{2,3}|--|-|AB)$/i.test(t)
  const isCredits = (t: string) => /^(\d{1,2}|----|--)$/i.test(t) && Number.parseInt(t) >= 1 && Number.parseInt(t) <= 10
  const isGP = (t: string) => /^(\d{1,2}|--|-)$/i.test(t)
  const isCGP = (t: string) => /^(\d{1,3}|--|-)$/i.test(t)

  let i = 0
  let attemptCount = 0
  const maxAttempts = tokens.length * 2 // Prevent infinite loops

  while (i < tokens.length - 8 && courses.length < MAX_COURSES && attemptCount < maxAttempts) {
    attemptCount++

    // Look for a pattern that starts with a theory mark
    if (!isTheoryMark(tokens[i])) {
      i++
      continue
    }

    // Try to match the full 9-field sequence
    const candidate = tokens.slice(i, i + 9)

    // Validate the sequence more flexibly
    const looksLikeCourse =
      isTheoryMark(candidate[0]) &&
      isGrade(candidate[1]) &&
      isInternalMark(candidate[2]) &&
      isGrade(candidate[3]) &&
      isTotal(candidate[4]) &&
      isCredits(candidate[5]) &&
      isGrade(candidate[6]) &&
      isGP(candidate[7]) &&
      isCGP(candidate[8])

    if (looksLikeCourse) {
      courses.push({
        theory: candidate[0],
        grade1: candidate[1],
        internal: candidate[2],
        grade2: candidate[3],
        total: candidate[4],
        credits: candidate[5],
        grade: candidate[6],
        gradePoints: candidate[7],
        creditGradeProduct: candidate[8],
      })
      i += 9
      continue
    }

    // Alternative pattern: Sometimes data is compressed differently
    // Try pattern with embedded numbers: THEORY INTERNAL TOTAL CREDITS GRADE GP CGP
    // (skipping intermediate grades)
    if (i + 6 < tokens.length) {
      const alt = tokens.slice(i, i + 7)
      if (
        isTheoryMark(alt[0]) &&
        isInternalMark(alt[1]) &&
        isTotal(alt[2]) &&
        isCredits(alt[3]) &&
        isGrade(alt[4]) &&
        isGP(alt[5]) &&
        isCGP(alt[6])
      ) {
        courses.push({
          theory: alt[0],
          grade1: "",
          internal: alt[1],
          grade2: "",
          total: alt[2],
          credits: alt[3],
          grade: alt[4],
          gradePoints: alt[5],
          creditGradeProduct: alt[6],
        })
        i += 7
        continue
      }
    }

    i++
  }

  console.log("[v0] Extracted", courses.length, "courses from", tokens.length, "tokens")

  // Pad with empty courses up to MAX_COURSES
  while (courses.length < MAX_COURSES) {
    courses.push(createEmptyCourse())
  }

  return courses
}

function createEmptyCourse(): CourseRecord {
  return {
    theory: "",
    grade1: "",
    internal: "",
    grade2: "",
    total: "",
    credits: "",
    grade: "",
    gradePoints: "",
    creditGradeProduct: "",
  }
}
