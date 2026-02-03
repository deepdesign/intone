"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PreferredTerm {
  id?: string;
  preferred: string;
  alternatives: string;
  notes: string;
}

const DEFAULT_TERMS: PreferredTerm[] = [
  { preferred: "login", alternatives: "log in", notes: "Use as noun" },
  { preferred: "markup", alternatives: "mark up", notes: "Use as noun" },
  { preferred: "dropdown", alternatives: "", notes: "One word, no hyphen" },
  { preferred: "email", alternatives: "", notes: "No hyphen" },
  { preferred: "wifi", alternatives: "", notes: "All lowercase" },
  { preferred: "driver licence", alternatives: "", notes: "No apostrophe" },
  { preferred: "text", alternatives: "", notes: "Not SMS or text message" },
  { preferred: "view", alternatives: "", notes: "Not 'see'" },
  { preferred: "select", alternatives: "choose", notes: "Prefer 'select' in UI" },
];

export function PreferredTerms() {
  const [terms, setTerms] = useState<PreferredTerm[]>(DEFAULT_TERMS);
  const [editingTerm, setEditingTerm] = useState<PreferredTerm | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAdd = () => {
    setEditingTerm({ preferred: "", alternatives: "", notes: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (term: PreferredTerm) => {
    setEditingTerm(term);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingTerm) return;

    if (editingTerm.id) {
      setTerms((prev) => prev.map((t) => (t.id === editingTerm.id ? editingTerm : t)));
    } else {
      setTerms((prev) => [...prev, { ...editingTerm, id: Date.now().toString() }]);
    }

    setIsDialogOpen(false);
    setEditingTerm(null);
  };

  const handleDelete = (index: number) => {
    setTerms((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Preferred Terms</h3>
          <p className="text-sm text-muted-foreground">
            Define preferred terms and their allowed alternatives.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTerm?.id ? "Edit Term" : "Add Term"}</DialogTitle>
              <DialogDescription>Define a preferred term and its alternatives.</DialogDescription>
            </DialogHeader>
            {editingTerm && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred">Preferred term</Label>
                  <Input
                    id="preferred"
                    value={editingTerm.preferred}
                    onChange={(e) => setEditingTerm({ ...editingTerm, preferred: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternatives">Allowed alternatives</Label>
                  <Input
                    id="alternatives"
                    value={editingTerm.alternatives}
                    onChange={(e) => setEditingTerm({ ...editingTerm, alternatives: e.target.value })}
                    placeholder="Comma-separated list"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editingTerm.notes}
                    onChange={(e) => setEditingTerm({ ...editingTerm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preferred term</TableHead>
              <TableHead>Allowed alternatives</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((term, index) => (
              <TableRow key={term.id || index}>
                <TableCell className="font-medium">{term.preferred}</TableCell>
                <TableCell>{term.alternatives || "-"}</TableCell>
                <TableCell>{term.notes || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(term)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

