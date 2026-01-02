import * as pdfjsLib from "pdfjs-dist"

// ... (pdfjsLib setup remains the same)

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

const MAX_COURSES = 12;

export async function parseStudentResultsPDF(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let allRawText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // 1. Improved Sorting & Token Cleanup
    const items = textContent.items
      .filter((item: any) => "str" in item)
      .map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }))
      .sort((a, b) => (Math.abs(b.y - a.y) > 5 ? b.y - a.y : a.x - b.x));

    let pageText = "";
    let lastY = -1;
    for (const item of items) {
      if (lastY !== -1 && Math.abs(item.y - lastY) > 5) pageText += "\n";
      // Separate glued tokens like "41+16+" into "41+ 16+"
      const cleanedText = item.text.replace(/(\d+[+@E]*)([A-Z]|\d)/g, '$1 $2');
      pageText += cleanedText + " ";
      lastY = item.y;
    }
    allRawText += pageText + "\n--- PAGE_BREAK ---\n";
  }

  const students = parseStudentBlocks(allRawText);
  return { students, rawText: allRawText };
}

function parseStudentBlocks(text: string): StudentRecord[] {
  // Split by Seat Number (6-7 digits)
  const seatRegex = /(?:\n|^)\s*(\d{6,7})\s+/g;
  const blocks: string[] = [];
  let match;
  let lastIndex = 0;
  let lastSeat = "";

  while ((match = seatRegex.exec(text)) !== null) {
    if (lastSeat) {
      blocks.push(text.substring(lastIndex, match.index));
    }
    lastSeat = match[1];
    lastIndex = match.index;
  }
  blocks.push(text.substring(lastIndex));

  return blocks.map(block => parseStudentFromBlock(block)).filter(s => s !== null) as StudentRecord[];
}

function parseStudentFromBlock(block: string): StudentRecord | null {
  const cleanBlock = block.replace(/\s+/g, " ").trim();
  const tokens = cleanBlock.split(" ");
  
  const seatNo = tokens[0];
  if (!/^\d{6,7}$/.test(seatNo)) return null;

  // 2. Robust Name Extraction: Capture uppercase tokens until we hit a number or "ABC"
  let nameTokens: string[] = [];
  for (let i = 1; i < Math.min(tokens.length, 10); i++) {
    if (/^[A-Z/]+$/.test(tokens[i]) && !/ABC|SEM|CENTRE/.test(tokens[i])) {
      nameTokens.push(tokens[i]);
    } else if (nameTokens.length > 0) break;
  }

  const abcMatch = cleanBlock.match(/ABC\s?ID[:\s]*([0-9A-Z-]+)/i);
  const summaryMatch = cleanBlock.match(/(Semester\s[IVX]+[\s\S]*?)(?=\n|---|$)/i);

  // 3. Flexible Course Pattern Matcher
  // Look for: [Theory] [Internal] [Total] [Credits] [Grade] [GP] [CGP]
  const courses: CourseRecord[] = [];
  const coursePattern = /(\d{2,3}[+@E]*|--)\s+(\d{1,2}[+@E]*|--)\s+(\d{2,3}|--)\s+(\d)\s+([A-F|O][+]*)\s+(\d{1,2})\s+(\d{1,3})/g;
  
  let cMatch;
  while ((cMatch = coursePattern.exec(cleanBlock)) !== null && courses.length < MAX_COURSES) {
    courses.push({
      theory: cMatch[1], internal: cMatch[2], total: cMatch[3],
      credits: cMatch[4], grade: cMatch[5], gradePoints: cMatch[6],
      creditGradeProduct: cMatch[7]
    });
  }

  // Pad remaining courses
  while (courses.length < MAX_COURSES) {
    courses.push({ theory: "", internal: "", total: "", credits: "", grade: "", gradePoints: "", creditGradeProduct: "" });
  }

  return {
    seatNo,
    lastName: nameTokens[0] || "",
    firstName: nameTokens[1] || "",
    middleName: nameTokens.slice(2, -1).join(" "),
    mothersName: nameTokens[nameTokens.length - 1] || "",
    abcId: abcMatch ? abcMatch[1] : "",
    summary: summaryMatch ? summaryMatch[1].replace(/\s+/g, " ").trim() : "",
    rawBlock: cleanBlock.substring(0, 500),
    courses
  };
}
