"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApprovedCopy {
  id: string;
  text: string;
  source: string;
  sourceId?: string;
  context?: string;
  usageCount: number;
  createdAt: Date;
}

export default function ApprovedCopyPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [copies, setCopies] = useState<ApprovedCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApprovedCopies();
  }, [brandId]);

  const fetchApprovedCopies = async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}/approved-copies`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCopies(data);
    } catch (error) {
      console.error("Error fetching approved copies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this approved copy?")) return;
    
    try {
      const response = await fetch(`/api/brands/${brandId}/approved-copies/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      fetchApprovedCopies();
    } catch (error) {
      console.error("Error deleting approved copy:", error);
      alert("Failed to delete approved copy");
    }
  };

  const filteredCopies = copies.filter(copy =>
    copy.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    copy.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Approved copy</h1>
        <p className="text-muted-foreground">
          Manage your brand's approved copy library. These examples are used to suggest similar copy when writing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approved copy library</CardTitle>
              <CardDescription>
                {copies.length} approved copy{copies.length !== 1 ? "ies" : ""} in your library
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCopies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No approved copies match your search" : "No approved copies yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Text</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCopies.map((copy) => (
                  <TableRow key={copy.id}>
                    <TableCell className="max-w-md">
                      <p className="text-sm truncate" title={copy.text}>
                        {copy.text}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{copy.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {copy.context && <Badge variant="secondary">{copy.context}</Badge>}
                    </TableCell>
                    <TableCell>{copy.usageCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(copy.text)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(copy.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

