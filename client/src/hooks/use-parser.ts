"use client"

import { useState } from "react"
import { parsePdf } from "@/lib/mu-parser"
import * as XLSX from "xlsx"
import type { Student } from "@shared/schema"
import { useToast } from "@/hooks/use-toast"

export function useParser() {
  const [isParsing, setIsParsing] = useState(false)
  const [progress, setProgress] = useState("")
  const [parsedData, setParsedData] = useState<Student[]>([])
  const { toast } = useToast()

  const handleFile = async (file: File) => {
    setIsParsing(true)
    setProgress("Initializing worker...")
    setParsedData([])

    try {
      const result = await parsePdf(file, (msg) => setProgress(msg))
      setParsedData(result.students)
      setProgress(`Complete! Parsed ${result.students.length} records.`)
      toast({
        title: "Success",
        description: `Successfully extracted ${result.students.length} student records.`,
      })
    } catch (err: any) {
      console.error(err)
      setProgress("Error occurred.")
      toast({
        variant: "destructive",
        title: "Parsing Failed",
        description: err.message || "Unknown error occurred during parsing.",
      })
    } finally {
      setIsParsing(false)
    }
  }

  const exportToExcel = () => {
    if (parsedData.length === 0) return

    const rows = parsedData.map((student) => {
      const row: Record<string, string | number> = {
        "Seat No": student.seatNo,
        Name: student.name,
        "ABC ID": student.abcId || "",
        Result: student.result || "",
        CGPI: student.cgpi || "",
        Summary: (student as any).summary || "", // Include summary for export
      }

      student.subjects.forEach((subj) => {
        // Clean subject name: remove excessive underscores/special chars
        const cleanSubjName = subj.name.replace(/[_\s]+/g, " ").trim()

        // Add TH, IA/IN, and TOT columns per subject
        row[`${cleanSubjName}_TH`] = subj.heads["TH"] || "-"
        row[`${cleanSubjName}_IN`] = subj.heads["IN"] || subj.heads["IA"] || "-"
        row[`${cleanSubjName}_TOT`] = subj.total || "-"
      })

      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results")
    XLSX.writeFile(workbook, "MU_Results_Parsed.xlsx")

    toast({
      title: "Exported",
      description: "Excel file has been downloaded.",
    })
  }

  return {
    isParsing,
    progress,
    parsedData,
    handleFile,
    exportToExcel,
    reset: () => setParsedData([]),
  }
}
