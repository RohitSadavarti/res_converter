import type { StudentRecord } from "./pdf-parser"

export function exportToExcel(students: StudentRecord[], subjectNames: string[], filename: string) {
  const headers = buildHeaders(subjectNames)
  const rows = students.map((student) => buildRow(student, subjectNames.length))

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => escapeCSV(cell)).join(","))].join("\n")
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

function buildHeaders(subjectNames: string[]): string[] {
  const headers = ["SeatNo", "LastName", "FirstName", "MiddleName", "MothersName", "ABC_ID", "Summary"]
  subjectNames.forEach((name) => {
    // Clean name for header: only single underscore between words
    const cleanName = name.replace(/[:\s-]+/g, "_").replace(/^_|_$/g, "");
    headers.push(`${cleanName}_THEORY`, `${cleanName}_INTERNAL`, `${cleanName}_TOTAL`)
  })
  return headers
}

function buildRow(student: StudentRecord, subjectCount: number): string[] {
  const row = [student.seatNo, student.lastName, student.firstName, student.middleName, student.mothersName, student.abcId, student.summary]
  for (let i = 0; i < subjectCount; i++) {
    const course = student.courses[i] || { theory: "", internal: "", total: "" };
    row.push(course.theory, course.internal, course.total)
  }
  return row
}

function escapeCSV(value: string): string {
  if (!value) return ""
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
