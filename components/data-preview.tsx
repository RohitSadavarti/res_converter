"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Ensure this file exists in components/ui
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { StudentRecord } from "@/lib/pdf-parser"

interface DataPreviewProps {
  students: StudentRecord[]
}

export function DataPreview({ students }: DataPreviewProps) {
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState("") // New state for search
  const pageSize = 10

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchStr = searchTerm.toLowerCase()
      return (
        student.seatNo.toLowerCase().includes(searchStr) ||
        student.firstName.toLowerCase().includes(searchStr) ||
        student.lastName.toLowerCase().includes(searchStr) ||
        (student.abcId && student.abcId.toLowerCase().includes(searchStr))
      )
    })
  }, [students, searchTerm])

  const totalPages = Math.ceil(filteredStudents.length / pageSize)
  const currentStudents = filteredStudents.slice(page * pageSize, (page + 1) * pageSize)

  // Reset page when search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(0)
  }

  return (
    <div className="space-y-4">
      {/* Search Bar Section */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Seat No, Name, or ABC ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10 max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Seat No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">ABC ID</TableHead>
              <TableHead className="w-24">Courses</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student, idx) => (
                <TableRow key={`${student.seatNo}-${idx}`}>
                  <TableCell className="font-mono">{student.seatNo}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      {student.middleName && <span className="text-muted-foreground ml-1">({student.middleName})</span>}
                    </div>
                    {student.mothersName && (
                      <div className="text-xs text-muted-foreground">Mother: {student.mothersName}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{student.abcId || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.courses.filter((c) => c.theory).length} courses</Badge>
                  </TableCell>
                  <TableCell>
                    {student.courses.some((c) => c.grade1 === "F") ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="default">Passed</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No students found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredStudents.length > 0 ? page * pageSize + 1 : 0} to{" "}
          {Math.min((page + 1) * pageSize, filteredStudents.length)} of {filteredStudents.length} students
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
