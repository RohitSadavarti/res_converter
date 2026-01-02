import * as pdfjsLib from "pdfjs-dist"

const getWorkerUrl = (version: string) => 
  `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export interface CourseRecord {
  theory: string; internal: string; total: string; 
  credits: string; grade: string; gradePoints: string; 
  creditGradeProduct: string;
}

export interface StudentRecord {
  seatNo: string; lastName: string; firstName: string;
  middleName: string; mothersName: string; abcId: string;
  summary: string; rawBlock: string; courses: CourseRecord[];
}

export async function parseStudentResultsPDF(file: File): Promise<{
  students: StudentRecord[]
  subjectNames: string[]
  rawText: string
}> {
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
        // Fix "glued" marks like 41+16+ -> 41+ 16+
        const cleaned = item.text.replace(/(\d+[+@E]*)([A-Z]|\d)/g, '$1 $2');
        currentLine.push(cleaned)
      }
    }
    if (currentLine.length > 0) textParts.push(currentLine.join(" "))
  }

  const rawText = textParts.join("\n")

  // Detect Subject Legend (e.g., 1: NAVIGATION IV)
  const subjectRegex = /(\d+)\s*:\s*([A-Z][A-Z\s&-]+)(?=\s+\d+:|\s+COURSE|$)/g;
  const subjectMap = new Map<number, string>();
  let match;
  while ((match = subjectRegex.exec(rawText)) !== null) {
    const id = parseInt(match[1]);
    const name = match[2].trim().replace(/\s+/g, ' '); // Clean double spaces
    if (id > 0 && id <= 20) subjectMap.set(id, name);
  }

  const subjectNames = Array.from(subjectMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(entry => entry[1]);

  const students = parseStudentBlocks(rawText, subjectNames.length || 10);
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
  const seatNo = tokens.find(t => /^\d{6,7}$/.test(t)) || tokens[0]
  if (!/^\d{6,7}$/.test(seatNo)) return null

  // Capture name
  let nameTokens: string[] = []
  for (let i = 0; i < 15; i++) {
    if (tokens[i] && /^[A-Z/]+$/.test(tokens[i]) && !/ABC|SEM|CENTRE|ID/i.test(tokens[i])) {
      nameTokens.push(tokens[i])
    } else if (nameTokens.length > 0) break
  }

  // RECTIFIED MARK EXTRACTION: Greedy capture of all score tokens
  const scoreRegex = /(\d{1,3}[+@E-]*|[A-F|O][+]*|AB|--)/gi;
  const scoreTokens = Array.from(cleanBlock.matchAll(scoreRegex))
    .map(m => m[0].trim())
    .filter(s => s !== seatNo && !/^[234]$/.test(s)); // Filter seat and credit counts

  const courses: CourseRecord[] = []
  let sIdx = 0;
  for (let i = 0; i < subjectCount; i++) {
    const course = { theory: "", internal: "", total: "", credits: "", grade: "", gradePoints: "", creditGradeProduct: "" };
    if (sIdx < scoreTokens.length) {
      course.theory = scoreTokens[sIdx++];
      // If next token is small or has +, it's likely the internal mark
      if (sIdx < scoreTokens.length && (/^\d{1,2}[+]*$/.test(scoreTokens[sIdx]) || scoreTokens[sIdx].length <= 3)) {
        course.internal = scoreTokens[sIdx++];
      }
      // Simple total calculation
      const t = parseInt(course.theory);
      const int = parseInt(course.internal);
      if (!isNaN(t) && !isNaN(int)) course.total = (t + int).toString();
    }
    courses.push(course);
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
