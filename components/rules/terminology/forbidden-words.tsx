"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ForbiddenWord {
  id: string;
  description: string;
  pattern?: string;
  replacement?: string;
  appliesTo: string[];
  metadata?: {
    whyAvoided?: string;
    useInstead?: string;
    examplesGood?: string;
    examplesBad?: string;
    severity?: "warn" | "block";
    exceptions?: string;
  };
}

const DEFAULT_FORBIDDEN: Omit<ForbiddenWord, "id">[] = [
  {
    description: "etc.",
    pattern: "etc\\.|etc",
    metadata: {
      whyAvoided: "Too vague and informal",
      useInstead: "Be specific or omit",
      examplesGood: "We offer email, chat, and phone support.",
      examplesBad: "We offer email, chat, phone, etc.",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "and more",
    pattern: "and more",
    metadata: {
      whyAvoided: "Too vague",
      useInstead: "List specific items or omit",
      examplesGood: "Features include email, chat, and phone support.",
      examplesBad: "Features include email, chat, and more.",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing"],
  },
  {
    description: "e.g.",
    pattern: "e\\.g\\.|eg",
    metadata: {
      whyAvoided: "Too academic",
      useInstead: "For example, or specific examples",
      examplesGood: "For example, email and chat support.",
      examplesBad: "Support options, e.g., email and chat.",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "click (UI)",
    pattern: "click",
    metadata: {
      whyAvoided: "Not accessible - assumes mouse interaction",
      useInstead: "Select, choose, or tap",
      examplesGood: "Select 'Add new' to continue.",
      examplesBad: "Click 'Add new' to continue.",
      severity: "block",
      exceptions: "Help articles only",
    },
    appliesTo: ["ui"],
  },
  {
    description: "percent",
    pattern: "percent",
    metadata: {
      whyAvoided: "Use symbol for better readability",
      useInstead: "%",
      examplesGood: "You're 75% complete.",
      examplesBad: "You're 75 percent complete.",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "SMS / text message",
    pattern: "SMS|text message",
    metadata: {
      whyAvoided: "Too technical or wordy",
      useInstead: "text",
      examplesGood: "Contact us by text.",
      examplesBad: "Send us a text message or SMS.",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "Wi-Fi / WIFI",
    pattern: "Wi-Fi|WIFI|Wi Fi",
    metadata: {
      whyAvoided: "Inconsistent formatting",
      useInstead: "wifi (all lowercase)",
      examplesGood: "Connect to wifi.",
      examplesBad: "Connect to Wi-Fi or WIFI.",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "driver's licence",
    pattern: "driver'?s? licence|driving licence",
    metadata: {
      whyAvoided: "Incorrect spelling",
      useInstead: "driver licence",
      examplesGood: "You need a driver licence.",
      examplesBad: "You need a driver's licence.",
      severity: "block",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "emojis (global)",
    pattern: "[\\u{1F300}-\\u{1F9FF}]",
    metadata: {
      whyAvoided: "Difficult to localise and not accessible",
      useInstead: "Words instead",
      examplesGood: "Great job! Your profile is complete.",
      examplesBad: "Great job! Your profile is complete. ✨",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
  {
    description: "excessive punctuation",
    pattern: "[!?]{2,}",
    metadata: {
      whyAvoided: "Reduces credibility",
      useInstead: "Single punctuation mark",
      examplesGood: "Welcome.",
      examplesBad: "Welcome!!!",
      severity: "warn",
    },
    appliesTo: ["ui", "marketing", "support"],
  },
];

export function ForbiddenWords() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [words, setWords] = useState<ForbiddenWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<ForbiddenWord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Partial<ForbiddenWord> | null>(null);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/rules/terminology`)
      .then(async (res) => {
        if (!res.ok) {
          // If no rules exist, use defaults
          return [];
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return [];
        }
        return res.json();
      })
      .then((data: any[]) => {
        const forbiddenWords = data
          .filter((r) => r.type === "forbidden")
          .map((r) => {
            let metadata;
            try {
              metadata = r.description ? JSON.parse(r.description) : undefined;
            } catch {
              // If description is not JSON, use it as the word description
              metadata = undefined;
            }
            return {
              id: r.id,
              description: metadata?.word || r.description,
              pattern: r.pattern,
              replacement: r.replacement,
              appliesTo: r.appliesTo || [],
              metadata: metadata || {
                whyAvoided: "",
                useInstead: r.replacement || "",
                examplesGood: "",
                examplesBad: "",
                severity: "warn" as const,
                exceptions: "",
              },
            };
          });

        if (forbiddenWords.length === 0) {
          // Initialize with defaults
          const defaultWords: ForbiddenWord[] = DEFAULT_FORBIDDEN.map((w, i) => ({
            ...w,
            id: `default-${i}`,
            metadata: w.metadata || {},
          }));
          setWords(defaultWords);
          if (defaultWords.length > 0) {
            setSelectedWord(defaultWords[0]);
          }
        } else {
          setWords(forbiddenWords);
          if (forbiddenWords.length > 0) {
            setSelectedWord(forbiddenWords[0]);
          }
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching forbidden words:", error);
        setLoading(false);
      });
  }, [brandId]);

  const filteredWords = words.filter((w) =>
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectWord = (word: ForbiddenWord) => {
    setSelectedWord(word);
  };

  const handleAdd = () => {
    setEditingWord({
      description: "",
      pattern: "",
      replacement: "",
      appliesTo: [],
      metadata: {
        whyAvoided: "",
        useInstead: "",
        examplesGood: "",
        examplesBad: "",
        severity: "warn",
        exceptions: "",
      },
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingWord) return;

    try {
      const response = await fetch(`/api/brands/${brandId}/rules/terminology`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "forbidden",
          description: editingWord.description || "",
          pattern: editingWord.pattern,
          replacement: editingWord.replacement || editingWord.metadata?.useInstead,
          appliesTo: editingWord.appliesTo || [],
        }),
      });

      if (response.ok) {
        const newWord = await response.json();
        setWords((prev) => [...prev, { ...editingWord, id: newWord.id } as ForbiddenWord]);
        setIsDialogOpen(false);
        setEditingWord(null);
      }
    } catch (error) {
      console.error("Error saving forbidden word:", error);
    }
  };

  const handleDelete = async (wordId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/rules/terminology/${wordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWords((prev) => {
          const filtered = prev.filter((w) => w.id !== wordId);
          if (selectedWord?.id === wordId) {
            setSelectedWord(filtered.length > 0 ? filtered[0] : null);
          }
          return filtered;
        });
      }
    } catch (error) {
      console.error("Error deleting forbidden word:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Forbidden Words</h3>
          <p className="text-sm text-muted-foreground">
            Define words and phrases your brand should avoid.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add forbidden word
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Forbidden Word</DialogTitle>
              <DialogDescription>Define a word or phrase to avoid.</DialogDescription>
            </DialogHeader>
            {editingWord && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Word or phrase</Label>
                  <Input
                    id="description"
                    value={editingWord.description || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern (regex, optional)</Label>
                  <Input
                    id="pattern"
                    value={editingWord.pattern || ""}
                    onChange={(e) => setEditingWord({ ...editingWord, pattern: e.target.value })}
                    placeholder="e.g., etc\\.|etc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replacement">What to use instead</Label>
                  <Input
                    id="replacement"
                    value={editingWord.replacement || editingWord.metadata?.useInstead || ""}
                    onChange={(e) =>
                      setEditingWord({
                        ...editingWord,
                        replacement: e.target.value,
                        metadata: { ...editingWord.metadata, useInstead: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whyAvoided">Why this word is avoided</Label>
                  <Textarea
                    id="whyAvoided"
                    value={editingWord.metadata?.whyAvoided || ""}
                    onChange={(e) =>
                      setEditingWord({
                        ...editingWord,
                        metadata: { ...editingWord.metadata, whyAvoided: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examplesGood">Do example</Label>
                  <Input
                    id="examplesGood"
                    value={editingWord.metadata?.examplesGood || ""}
                    onChange={(e) =>
                      setEditingWord({
                        ...editingWord,
                        metadata: { ...editingWord.metadata, examplesGood: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examplesBad">Don't example</Label>
                  <Input
                    id="examplesBad"
                    value={editingWord.metadata?.examplesBad || ""}
                    onChange={(e) =>
                      setEditingWord({
                        ...editingWord,
                        metadata: { ...editingWord.metadata, examplesBad: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={editingWord.metadata?.severity || "warn"}
                    onValueChange={(value: "warn" | "block") =>
                      setEditingWord({
                        ...editingWord,
                        metadata: { ...editingWord.metadata, severity: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appliesTo">Scope</Label>
                  <div className="space-y-2">
                    {["ui", "marketing", "support"].map((scope) => (
                      <div key={scope} className="flex items-center space-x-2">
                        <Checkbox
                          id={`scope-${scope}`}
                          checked={(editingWord.appliesTo || []).includes(scope)}
                          onCheckedChange={(checked) => {
                            const current = editingWord.appliesTo || [];
                            setEditingWord({
                              ...editingWord,
                              appliesTo: checked
                                ? [...current, scope]
                                : current.filter((s) => s !== scope),
                            });
                          }}
                        />
                        <Label htmlFor={`scope-${scope}`} className="font-normal">
                          {scope}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exceptions">Exceptions</Label>
                  <Textarea
                    id="exceptions"
                    value={editingWord.metadata?.exceptions || ""}
                    onChange={(e) =>
                      setEditingWord({
                        ...editingWord,
                        metadata: { ...editingWord.metadata, exceptions: e.target.value },
                      })
                    }
                    rows={2}
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

      <div className="grid grid-cols-2 gap-4 h-[600px]">
        {/* Left panel - searchable list */}
        <div className="border rounded-lg flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forbidden words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y">
              {filteredWords.map((word) => (
                <button
                  key={word.id}
                  onClick={() => handleSelectWord(word)}
                  className={`w-full text-left p-4 hover:bg-muted ${
                    selectedWord?.id === word.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{word.description}</span>
                    {word.metadata?.severity && (
                      <Badge variant={word.metadata.severity === "block" ? "destructive" : "secondary"}>
                        {word.metadata.severity}
                      </Badge>
                    )}
                  </div>
                  {word.metadata?.useInstead && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Use: {word.metadata.useInstead}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - detail view */}
        <div className="border rounded-lg p-6 overflow-y-auto">
          {selectedWord ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg">{selectedWord.description}</h4>
                {selectedWord.metadata?.severity && (
                  <Badge
                    variant={selectedWord.metadata.severity === "block" ? "destructive" : "secondary"}
                    className="mt-2"
                  >
                    {selectedWord.metadata.severity}
                  </Badge>
                )}
              </div>

              {selectedWord.metadata?.whyAvoided && (
                <div>
                  <Label className="text-sm font-medium">Why this word is avoided</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedWord.metadata.whyAvoided}
                  </p>
                </div>
              )}

              {selectedWord.metadata?.useInstead && (
                <div>
                  <Label className="text-sm font-medium">What to use instead</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedWord.metadata.useInstead}
                  </p>
                </div>
              )}

              {selectedWord.metadata?.examplesGood && (
                <div>
                  <Label className="text-sm font-medium">Do</Label>
                  <div className="p-3 bg-muted rounded-md mt-1">
                    <p className="text-sm">{selectedWord.metadata.examplesGood}</p>
                  </div>
                </div>
              )}

              {selectedWord.metadata?.examplesBad && (
                <div>
                  <Label className="text-sm font-medium">Don't</Label>
                  <div className="p-3 bg-muted rounded-md mt-1">
                    <p className="text-sm">{selectedWord.metadata.examplesBad}</p>
                  </div>
                </div>
              )}

              {selectedWord.appliesTo && selectedWord.appliesTo.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Scope</Label>
                  <div className="flex gap-2 mt-1">
                    {selectedWord.appliesTo.map((scope) => (
                      <Badge key={scope} variant="outline">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedWord.metadata?.exceptions && (
                <div>
                  <Label className="text-sm font-medium">Exceptions</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedWord.metadata.exceptions}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedWord.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a forbidden word to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

