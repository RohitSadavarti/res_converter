"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { StudentRecord } from "@/lib/pdf-parser"

interface DataPreviewProps {
  students: StudentRecord[]
}

export function DataPreview({ students }: DataPreviewProps) {
  const [page, setPage] = useState(0)
  const pageSize = 10
  const totalPages = Math.ceil(students.length / pageSize)

  const currentStudents = students.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="space-y-4">
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
            {currentStudents.map((student, idx) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, students.length)} of {students.length}{" "}
          students
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
