"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  Archive,
  Layers,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type ViewType = "all" | "approved" | "inferred" | "deprecated" | "clusters" | "conflicts";

interface RepositoryChunk {
  id: string;
  text: string;
  category: string | null;
  subCategory: string | null;
  channel: string | null;
  intent: string | null;
  toneTags: string[];
  status: "INFERRED" | "APPROVED" | "DEPRECATED";
  source: string;
  canonical: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  confidenceScore: number | null;
  clusterId: string | null;
  createdAt: string;
}

export default function RepositoryPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [view, setView] = useState<ViewType>("all");
  const [chunks, setChunks] = useState<RepositoryChunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<RepositoryChunk | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    intent: "all",
    channel: "all",
    source: "",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchChunks();
  }, [brandId, view, filters, sortBy, sortOrder, searchQuery]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(view !== "all" && { status: view.toUpperCase() }),
        ...(filters.category && filters.category !== "all" && { category: filters.category }),
        ...(filters.intent && filters.intent !== "all" && { intent: filters.intent }),
        ...(filters.channel && filters.channel !== "all" && { channel: filters.channel }),
        ...(filters.source && { source: filters.source }),
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        sortOrder,
        limit: "50",
      });

      const response = await fetch(`/api/brands/${brandId}/repository/chunks?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setChunks(data.chunks || []);
      }
    } catch (error) {
      console.error("Error fetching chunks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (chunkId: string) => {
    try {
      const response = await fetch(
        `/api/brands/${brandId}/repository/chunks/${chunkId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "APPROVED" }),
        }
      );

      if (response.ok) {
        await fetchChunks();
        if (selectedChunk?.id === chunkId) {
          const updated = await response.json();
          setSelectedChunk(updated);
        }
      }
    } catch (error) {
      console.error("Error approving chunk:", error);
    }
  };

  const handleDeprecate = async (chunkId: string) => {
    if (!confirm("Are you sure you want to deprecate this chunk?")) return;

    try {
      const response = await fetch(
        `/api/brands/${brandId}/repository/chunks/${chunkId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "DEPRECATED" }),
        }
      );

      if (response.ok) {
        await fetchChunks();
        if (selectedChunk?.id === chunkId) {
          setSelectedChunk(null);
        }
      }
    } catch (error) {
      console.error("Error deprecating chunk:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "DEPRECATED":
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "DEPRECATED":
        return <Badge variant="secondary">Deprecated</Badge>;
      default:
        return <Badge variant="outline">Inferred</Badge>;
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Navigation and Filters */}
      <div className="w-64 border-r pr-4 space-y-4 overflow-y-auto">
        <div>
          <h2 className="font-semibold mb-2">Views</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setView("all")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                view === "all"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              All copy
            </button>
            <button
              onClick={() => setView("approved")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                view === "approved"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setView("inferred")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                view === "inferred"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Inferred
            </button>
            <button
              onClick={() => setView("deprecated")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                view === "deprecated"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Deprecated
            </button>
            <button
              onClick={() => setView("clusters")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                view === "clusters"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Clusters
            </button>
            <button
              onClick={() => setView("conflicts")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                view === "conflicts"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Conflicts
            </button>
          </nav>
        </div>

        {view !== "clusters" && view !== "conflicts" && (
          <div>
            <h2 className="font-semibold mb-2">Filters</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="filter-category" className="text-xs">
                  Category
                </Label>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger id="filter-category" className="h-8">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="Headlines">Headlines</SelectItem>
                    <SelectItem value="CTAs">CTAs</SelectItem>
                    <SelectItem value="Product copy">Product copy</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Boilerplate">Boilerplate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-intent" className="text-xs">
                  Intent
                </Label>
                <Select
                  value={filters.intent || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, intent: value })
                  }
                >
                  <SelectTrigger id="filter-intent" className="h-8">
                    <SelectValue placeholder="All intents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All intents</SelectItem>
                    <SelectItem value="announce">Announce</SelectItem>
                    <SelectItem value="persuade">Persuade</SelectItem>
                    <SelectItem value="explain">Explain</SelectItem>
                    <SelectItem value="reassure">Reassure</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-channel" className="text-xs">
                  Channel
                </Label>
                <Select
                  value={filters.channel || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, channel: value })
                  }
                >
                  <SelectTrigger id="filter-channel" className="h-8">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="Web">Web</SelectItem>
                    <SelectItem value="iOS">iOS</SelectItem>
                    <SelectItem value="Android">Android</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="sort-by" className="text-xs">
            Sort by
          </Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Recently added</SelectItem>
              <SelectItem value="usageCount">Most used</SelectItem>
              <SelectItem value="lastUsedAt">Recently used</SelectItem>
              <SelectItem value="confidenceScore">Confidence score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Panel - Chunk List */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chunks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {view === "clusters" && (
          <ClustersView brandId={brandId} onSelectChunk={setSelectedChunk} />
        )}

        {view === "conflicts" && (
          <ConflictsView brandId={brandId} />
        )}

        {view !== "clusters" && view !== "conflicts" && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : chunks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No chunks found</p>
                </CardContent>
              </Card>
            ) : (
              chunks.map((chunk) => (
                <Card
                  key={chunk.id}
                  className={`cursor-pointer transition-colors ${
                    selectedChunk?.id === chunk.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedChunk(chunk)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm line-clamp-2">{chunk.text}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(chunk.status)}
                          {chunk.canonical && (
                            <Badge variant="outline">Canonical</Badge>
                          )}
                          {chunk.category && (
                            <Badge variant="secondary">{chunk.category}</Badge>
                          )}
                          {chunk.intent && (
                            <Badge variant="secondary">{chunk.intent}</Badge>
                          )}
                          {chunk.usageCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Used {chunk.usageCount}x
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(chunk.status)}
                        {chunk.status === "INFERRED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(chunk.id);
                            }}
                          >
                            Approve
                          </Button>
                        )}
                        {chunk.status !== "DEPRECATED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeprecate(chunk.id);
                            }}
                          >
                            Deprecate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Chunk Details */}
      {selectedChunk && view !== "clusters" && view !== "conflicts" && (
        <div className="w-96 border-l pl-4 overflow-y-auto">
          <ChunkDetailsPanel
            chunk={selectedChunk}
            brandId={brandId}
            onUpdate={fetchChunks}
          />
        </div>
      )}
    </div>
  );
}

function ChunkDetailsPanel({
  chunk,
  brandId,
  onUpdate,
}: {
  chunk: RepositoryChunk;
  brandId: string;
  onUpdate: () => void;
}) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [chunk.id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/repository/chunks/${chunk.id}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      }
    } catch (error) {
      console.error("Error fetching chunk details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-2">Chunk Details</h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Text</Label>
              <p className="text-sm mt-1">{chunk.text}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {chunk.category && (
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="text-sm mt-1">{chunk.category}</p>
                </div>
              )}
              {chunk.intent && (
                <div>
                  <Label className="text-xs text-muted-foreground">Intent</Label>
                  <p className="text-sm mt-1">{chunk.intent}</p>
                </div>
              )}
              {chunk.channel && (
                <div>
                  <Label className="text-xs text-muted-foreground">Channel</Label>
                  <p className="text-sm mt-1">{chunk.channel}</p>
                </div>
              )}
              {chunk.source && (
                <div>
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <p className="text-sm mt-1">{chunk.source}</p>
                </div>
              )}
            </div>

            {chunk.toneTags && chunk.toneTags.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Tone Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {chunk.toneTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {details?.cluster && (
              <div>
                <Label className="text-xs text-muted-foreground">Cluster</Label>
                <p className="text-sm mt-1">
                  {details.cluster.chunks?.length || 0} variants
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClustersView({
  brandId,
  onSelectChunk,
}: {
  brandId: string;
  onSelectChunk: (chunk: RepositoryChunk) => void;
}) {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClusters();
  }, [brandId]);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/repository/clusters`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setClusters(data.clusters || []);
      }
    } catch (error) {
      console.error("Error fetching clusters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCanonical = async (clusterId: string, chunkId: string) => {
    try {
      const response = await fetch(
        `/api/brands/${brandId}/repository/clusters/${clusterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ canonicalChunkId: chunkId }),
        }
      );

      if (response.ok) {
        await fetchClusters();
        if (selectedCluster?.id === clusterId) {
          const updated = await response.json();
          setSelectedCluster(updated);
        }
      }
    } catch (error) {
      console.error("Error setting canonical:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No clusters found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      {clusters.map((cluster) => (
        <Card
          key={cluster.id}
          className={selectedCluster?.id === cluster.id ? "ring-2 ring-primary" : ""}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    Cluster ({cluster.chunks?.length || 0} variants)
                  </h3>
                  {cluster.conceptSummary && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {cluster.conceptSummary}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedCluster(
                      selectedCluster?.id === cluster.id ? null : cluster
                    )
                  }
                >
                  {selectedCluster?.id === cluster.id ? "Hide" : "Show"} variants
                </Button>
              </div>

              {cluster.chunks && cluster.chunks.length > 0 && (
                <div className="space-y-2">
                  {cluster.chunks.map((chunk: any, idx: number) => (
                    <div
                      key={chunk.id}
                      className={`p-3 rounded-md border ${
                        chunk.canonical
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {chunk.canonical && (
                            <Badge className="mb-1 bg-green-600">Canonical</Badge>
                          )}
                          <p className="text-sm">{chunk.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {chunk.status === "APPROVED" && (
                              <Badge variant="default" className="bg-green-600">
                                Approved
                              </Badge>
                            )}
                            {chunk.usageCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Used {chunk.usageCount}x
                              </span>
                            )}
                          </div>
                        </div>
                        {!chunk.canonical && chunk.status === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetCanonical(cluster.id, chunk.id)}
                          >
                            Set canonical
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCluster?.id === cluster.id && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Recommendations: Review variants and keep one canonical version.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ConflictsView({ brandId }: { brandId: string }) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, [brandId, showResolved]);

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        resolved: showResolved.toString(),
      });
      const response = await fetch(
        `/api/brands/${brandId}/repository/conflicts?${params}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error("Error fetching conflicts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: string, resolved: boolean) => {
    try {
      const response = await fetch(
        `/api/brands/${brandId}/repository/conflicts/${conflictId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ resolved }),
        }
      );

      if (response.ok) {
        await fetchConflicts();
      }
    } catch (error) {
      console.error("Error resolving conflict:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-600";
      case "medium":
        return "bg-amber-600";
      default:
        return "bg-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Conflicts</h2>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-resolved"
            checked={showResolved}
            onCheckedChange={(checked) => setShowResolved(checked as boolean)}
          />
          <Label htmlFor="show-resolved" className="text-sm">
            Show resolved
          </Label>
        </div>
      </div>

      {conflicts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {showResolved ? "No resolved conflicts" : "No conflicts found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        conflicts.map((conflict) => (
          <Card key={conflict.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(conflict.severity)}>
                      {conflict.severity}
                    </Badge>
                    <Badge variant="outline">{conflict.conflictType}</Badge>
                  </div>
                  {!conflict.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(conflict.id, true)}
                    >
                      Mark resolved
                    </Button>
                  )}
                  {conflict.resolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResolve(conflict.id, false)}
                    >
                      Reopen
                    </Button>
                  )}
                </div>

                <p className="text-sm">{conflict.description}</p>

                {conflict.chunk1 && conflict.chunk2 && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Chunk 1
                      </Label>
                      <Card className="mt-1">
                        <CardContent className="p-3">
                          <p className="text-sm">{conflict.chunk1.text}</p>
                          <div className="flex gap-1 mt-2">
                            {conflict.chunk1.status === "APPROVED" && (
                              <Badge variant="default" className="bg-green-600">
                                Approved
                              </Badge>
                            )}
                            {conflict.chunk1.toneTags?.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Chunk 2
                      </Label>
                      <Card className="mt-1">
                        <CardContent className="p-3">
                          <p className="text-sm">{conflict.chunk2.text}</p>
                          <div className="flex gap-1 mt-2">
                            {conflict.chunk2.status === "APPROVED" && (
                              <Badge variant="default" className="bg-green-600">
                                Approved
                              </Badge>
                            )}
                            {conflict.chunk2.toneTags?.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

