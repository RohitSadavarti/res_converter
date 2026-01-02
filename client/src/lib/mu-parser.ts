import * as pdfjsLib from "pdfjs-dist"
import type { Student, Subject } from "@shared/schema"

// Set worker source to local file
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"

interface ParseResult {
  students: Student[]
  subjects: Record<string, string> // code -> name
  log: string[]
}

interface TextItem {
  str: string
  x: number
  y: number
  w: number
  h: number
}

// Regex Patterns
const SEAT_NO_REGEX = /^\d{7}$/ // 7-digit seat number
const MARKS_REGEX = /^(\d{1,3}[+@E-]*|[A-F|O][+]*|AB|--)$/
const SUBJECT_LEGEND_REGEX = /(\d+)\s*:\s*([A-Z][A-Za-z\s&./()-]+)(?=\s+\d+:|\s+COURSE|---|\n|$)/g
const GLUED_TOKENS_REGEX = /(\d{1,3}[+@E-]*)([A-F|O][+]*|AB|--)/g
const ABC_ID_REGEX = /ABC\s*ID\s*[:\s]*(\d{12})/i

export async function parsePdf(file: File, onProgress: (msg: string) => void): Promise<ParseResult> {
  const log: string[] = []
  const students: Student[] = []
  const subjectMap: Record<string, string> = {}

  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument(arrayBuffer)
    const pdf = await loadingTask.promise

    onProgress(`Loaded PDF with ${pdf.numPages} pages.`)

    let fullText = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress(`Scanning page ${i} of ${pdf.numPages}...`)
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()

      // Sort items on this page by Y (top-down) then X (left-right)
      const items = content.items
        .map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }))
        .sort((a, b) => {
          // Sort by Y descending (top to bottom)
          if (Math.abs(a.y - b.y) > 5) {
            // Threshold for same line
            return b.y - a.y
          }
          // Then by X ascending (left to right)
          return a.x - b.x
        })

      // Build page text with spacing heuristic
      let pageText = ""
      items.forEach((item, idx) => {
        pageText += item.str
        if (idx < items.length - 1) {
          const nextItem = items[idx + 1]
          if (nextItem.x - (item.x + item.str.length * 4) > 5) {
            pageText += " "
          }
        }
      })

      fullText += pageText + "\n---PAGE_BREAK---\n"

      // Extract Subject Legend from this page
      let match
      while ((match = SUBJECT_LEGEND_REGEX.exec(pageText)) !== null) {
        if (!subjectMap[match[1]]) {
          subjectMap[match[1]] = match[2].trim()
        }
      }
    }

    onProgress(`Detected ${Object.keys(subjectMap).length} subjects.`)

    const processedText = fullText
      .replace(/\s+/g, " ")
      .split(" ")
      .map((token) => {
        // Split glued tokens like "41+16+" into "41+" "16+"
        if (GLUED_TOKENS_REGEX.test(token) && !MARKS_REGEX.test(token)) {
          return token.replace(/(\d{1,3}[+@E-]*)([A-F|O][+]*|AB|--)/g, "$1 $2")
        }
        return token
      })
      .join(" ")

    const tokens = processedText.split(" ").filter((t) => t.length > 0)

    let currentStudent: Partial<Student> | null = null
    let buffer: string[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim()

      if (SEAT_NO_REGEX.test(token)) {
        // Found a new seat number -> Save previous student if exists
        if (currentStudent && currentStudent.seatNo) {
          finalizeStudent(currentStudent, buffer, subjectMap, students)
        }

        // Start new student
        currentStudent = {
          seatNo: token,
          subjects: [],
        }
        buffer = []
      } else {
        if (currentStudent) {
          buffer.push(token)
        }
      }
    }

    // Finalize last student
    if (currentStudent) {
      finalizeStudent(currentStudent, buffer, subjectMap, students)
    }

    onProgress(`Parsed ${students.length} student records.`)
    return { students, subjects: subjectMap, log }
  } catch (error: any) {
    console.error("PDF Parse Error", error)
    throw new Error(`Failed to parse PDF: ${error.message}`)
  }
}

function finalizeStudent(
  student: Partial<Student>,
  tokens: string[],
  subjectMap: Record<string, string>,
  students: Student[],
) {
  const nameParts = []
  let tokenIdx = 0

  while (tokenIdx < tokens.length) {
    const t = tokens[tokenIdx]

    // Stop at page break
    if (t === "---PAGE_BREAK---") {
      tokenIdx++
      continue
    }

    // Stop at marks, numbers that look like seat no, or known technical labels
    if (MARKS_REGEX.test(t)) break
    if (/^\d{7}$/.test(t)) break // Another seat number
    if (t.includes("PRN:") || t.includes("ABC") || t.toUpperCase() === "ABC") break

    // Accept uppercase words or words with / (for female candidate indicators)
    if (/^[A-Z][A-Za-z/]*$/.test(t)) {
      nameParts.push(t)
      tokenIdx++
    } else {
      break
    }
  }
  student.name = nameParts.join(" ")

  const fullBuffer = tokens.join(" ")
  const abcMatch = fullBuffer.match(ABC_ID_REGEX)
  if (abcMatch) {
    student.abcId = abcMatch[1]
  }

  const rawMarks: string[] = []
  const summaryTokens: string[] = []
  let foundResult = false

  for (let i = tokenIdx; i < tokens.length; i++) {
    const t = tokens[i]

    // Capture result status
    if (["PASS", "FAIL", "ATKT", "PASSES", "FAILS"].includes(t.toUpperCase())) {
      student.result = t.toUpperCase()
      foundResult = true
      continue
    }

    // Capture CGPI (decimal number < 10.01)
    if (t.includes(".") && !isNaN(Number.parseFloat(t)) && Number.parseFloat(t) <= 10) {
      student.cgpi = t
      continue
    }

    // Collect marks
    if (MARKS_REGEX.test(t)) {
      rawMarks.push(t)
    }

    // After result status, collect semester/summary info
    if (foundResult && !MARKS_REGEX.test(t) && t !== "---PAGE_BREAK---") {
      summaryTokens.push(t)
    }
  }

  // Store summary for later Excel export (hidden from preview per requirements)
  if (summaryTokens.length > 0) {
    ;(student as any).summary = summaryTokens.join(" ")
  }

  const subjectKeys = Object.keys(subjectMap).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  const subjectsCount = subjectKeys.length

  // Estimate marks per subject based on typical patterns
  // Usually: Theory, Internal, Total (3 marks) or Theory, Total (2 marks) or variable
  let marksPerSubject = 3 // Default assumption
  if (rawMarks.length > 0 && subjectsCount > 0) {
    marksPerSubject = Math.ceil(rawMarks.length / subjectsCount)
  }

  let markIdx = 0
  subjectKeys.forEach((code, idx) => {
    const subj: Subject = {
      name: subjectMap[code] || `Subject ${code}`,
      heads: {},
    }

    // Assign marks to this subject based on pattern
    const markLabels = ["TH", "IN", "TOT"] // Standard pattern

    for (let j = 0; j < marksPerSubject && markIdx < rawMarks.length; j++) {
      const label = markLabels[j] || `M${j}`
      const mark = rawMarks[markIdx]

      if (j === marksPerSubject - 1) {
        // Last mark is typically the total
        subj.total = mark
      } else {
        subj.heads[label] = mark
      }
      markIdx++
    }

    // Only add subject if we found at least one mark
    if (Object.keys(subj.heads).length > 0 || subj.total) {
      student.subjects?.push(subj)
    }
  })

  // Basic Validation
  if (student.name && student.seatNo) {
    students.push(student as Student)
  }
}
