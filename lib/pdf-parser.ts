import * as pdfjsLib from "pdfjs-dist"

// Helper to get the correct worker URL from the library version
const getWorkerUrl = (version: string) => 
  `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

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

export async function parseStudentResultsPDF(file: File): Promise<{
  students: StudentRecord[]
  subjectNames: string[]
  rawText: string
}> {
  // FIX: Ensure worker is set before any PDF operation to avoid "No GlobalWorkerOptions.workerSrc" error
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerUrl(pdfjsLib.version);
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    const items = textContent.items
      .filter((item): item is { str: string; transform: number[] } => "str" in item)
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }))
      .sort((a, b) => (Math.abs(b.y - a.y) > 5 ? b.y - a.y : a.x - b.x))

    let currentLine: string[] = []
    let currentY = items[0]?.y ?? 0

    for (const item of items) {
      if (Math.abs(item.y - currentY) > 5) {
        if (currentLine.length > 0) textParts.push(currentLine.join(" "))
        currentLine = [item.text]
        currentY = item.y
      } else {
        // Separates "glued" tokens like "41+16+" or "70A" into "41+ 16+" or "70 A"
        const cleaned = item.text.replace(/(\d+[+@E]*)([A-Z]|\d)/g, '$1 $2');
        currentLine.push(cleaned)
      }
    }
    if (currentLine.length > 0) textParts.push(currentLine.join(" "))
  }

  const rawText = textParts.join("\n")

  // DYNAMIC SUBJECT DETECTION: Finds patterns like "1: NAVIGATION" or "2: SHIPPING"
  const subjectRegex = /(\d+)\s*:\s*([A-Z][A-Z\s&-]+)(?=\s+\d+:|\s+COURSE|$)/g;
  const subjectMap = new Map<number, string>();
  let match;
  while ((match = subjectRegex.exec(rawText)) !== null) {
    const id = parseInt(match[1]);
    const name = match[2].trim();
    if (id > 0 && id <= 20) subjectMap.set(id, name);
  }

  const subjectNames = Array.from(subjectMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(entry => entry[1]);

  const students = parseStudentBlocks(rawText, subjectNames.length || 12);

  return { students, subjectNames, rawText }
}

function parseStudentBlocks(text: string, subjectCount: number): StudentRecord[] {
  const seatRegex = /(?:\n|^)\s*(\d{6,7})\s+/g
  const matches = [...text.matchAll(seatRegex)]
  const students: StudentRecord[] = []

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!
    const end = matches[i + 1] ? matches[i + 1].index! : text.length
    const block = text.substring(start, end).trim()
    
    const student = parseStudentFromBlock(block, subjectCount)
    if (student) students.push(student)
  }
  return students
}

function parseStudentFromBlock(block: string, subjectCount: number): StudentRecord | null {
  const cleanBlock = block.replace(/\s+/g, " ").trim()
  const tokens = cleanBlock.split(" ")
  if (tokens.length < 5) return null

  const seatNo = tokens[0]
  if (!/^\d{6,7}$/.test(seatNo)) return null

  // Capture name tokens (all consecutive uppercase words)
  let nameTokens: string[] = []
  for (let i = 1; i < 10; i++) {
    if (/^[A-Z/]+$/.test(tokens[i]) && !/ABC|SEM|CENTRE/.test(tokens[i])) {
      nameTokens.push(tokens[i])
    } else if (nameTokens.length > 0) break
  }

  const courses: CourseRecord[] = []
  // Matches Theory, Internal, Total, Credits, Grade, GP, CGP sequence
  const coursePattern = /(\d{2,3}[+@E]*|--)\s+(\d{1,2}[+@E]*|--)\s+(\d{2,3}|--)\s+(\d+)\s+([A-F|O][+]*)\s+(\d{1,2})\s+(\d{1,3})/g
  
  let match
  while ((match = coursePattern.exec(cleanBlock)) !== null && courses.length < subjectCount) {
    courses.push({
      theory: match[1], grade1: "", internal: match[2], grade2: "",
      total: match[3], credits: match[4], grade: match[5],
      gradePoints: match[6], creditGradeProduct: match[7]
    })
  }

  while (courses.length < subjectCount) {
    courses.push({ theory: "", grade1: "", internal: "", grade2: "", total: "", credits: "", grade: "", gradePoints: "", creditGradeProduct: "" })
  }

  return {
    seatNo,
    lastName: nameTokens[0] || "",
    firstName: nameTokens[1] || "",
    middleName: nameTokens.slice(2, -1).join(" "),
    mothersName: nameTokens[nameTokens.length - 1] || "",
    abcId: (cleanBlock.match(/ABC\s?ID[:\s]*([0-9A-Z-]+)/i) || [])[1] || "",
    summary: (cleanBlock.match(/(Semester\s[IVX]+[\s\S]*?)(?=\d{6,7}|$)/i) || [])[1]?.trim() || "",
    rawBlock: block.substring(0, 1000),
    courses,
  }
}
