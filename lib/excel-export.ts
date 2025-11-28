import type { StudentRecord } from "./pdf-parser"

const MAX_COURSES = 12

export function exportToExcel(students: StudentRecord[], filename: string) {
  // Build CSV content (can be opened in Excel)
  const headers = buildHeaders()
  const rows = students.map((student) => buildRow(student))

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => escapeCSV(cell)).join(","))].join("\n")

  // Create and download file
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function buildHeaders(): string[] {
  const headers = ["SeatNo", "LastName", "FirstName", "MiddleName", "MothersName", "ABC_ID", "Summary", "RawBlock"]

  // Add course columns
  for (let i = 1; i <= MAX_COURSES; i++) {
    headers.push(
      `Course${i}_THEORY`,
      `Course${i}_Grade1`,
      `Course${i}_Internal`,
      `Course${i}_Grade2`,
      `Course${i}_Total`,
      `Course${i}_C`,
      `Course${i}_G`,
      `Course${i}_GP`,
      `Course${i}_C*GP`,
    )
  }

  return headers
}

function buildRow(student: StudentRecord): string[] {
  const row = [
    student.seatNo,
    student.lastName,
    student.firstName,
    student.middleName,
    student.mothersName,
    student.abcId,
    student.summary,
    student.rawBlock,
  ]

  // Add course data
  for (let i = 0; i < MAX_COURSES; i++) {
    const course = student.courses[i] || {
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

    row.push(
      course.theory,
      course.grade1,
      course.internal,
      course.grade2,
      course.total,
      course.credits,
      course.grade,
      course.gradePoints,
      course.creditGradeProduct,
    )
  }

  return row
}

function escapeCSV(value: string): string {
  if (!value) return ""

  // If value contains comma, newline, or quotes, wrap in quotes and escape internal quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
