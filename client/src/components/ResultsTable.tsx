import { type Student } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface ResultsTableProps {
  data: Student[];
}

export function ResultsTable({ data }: ResultsTableProps) {
  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full glass-card rounded-2xl overflow-hidden flex flex-col max-h-[600px]"
    >
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Parsed Results Preview</h3>
        <Badge variant="secondary" className="font-mono">
          {data.length} Records
        </Badge>
      </div>
      
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader className="bg-muted/5 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow>
              <TableHead className="w-[120px] font-mono">Seat No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-center">Subjects</TableHead>
              <TableHead className="text-right">CGPI</TableHead>
              <TableHead className="text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((student, idx) => (
              <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono font-medium text-primary">
                  {student.seatNo}
                </TableCell>
                <TableCell className="font-medium text-foreground/80">
                  {student.name}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {student.subjects.length} Subjects
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {student.cgpi || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={
                      student.result?.includes("FAIL") ? "destructive" : 
                      student.result?.includes("PASS") ? "default" : "secondary"
                    }
                  >
                    {student.result || "UNKNOWN"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </motion.div>
  );
}
