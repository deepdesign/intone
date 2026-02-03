"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, FileText, Loader2 } from "lucide-react";

export default function LearnPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [activeTab, setActiveTab] = useState<"url" | "upload" | "link">("url");
  const [url, setUrl] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleStartLearn = async (sourceType: "url" | "upload" | "link") => {
    setProcessing(true);
    try {
      const formData = new FormData();
      
      if (sourceType === "url") {
        formData.append("sourceType", "URL");
        formData.append("sourceUrl", url);
      } else if (sourceType === "link") {
        formData.append("sourceType", "FILE_LINK");
        formData.append("sourceUrl", fileLink);
      } else {
        // File upload will be handled separately
        return;
      }

      const response = await fetch(`/api/brands/${brandId}/learn`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to start learning session");
      }

      const data = await response.json();
      setCurrentSessionId(data.sessionId);
      
      // Poll for results
      pollLearnStatus(data.sessionId);
    } catch (error) {
      console.error("Error starting learn session:", error);
      setProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("sourceType", "FILE_UPLOAD");
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("fileType", file.type || file.name.split(".").pop() || "");

      const response = await fetch(`/api/brands/${brandId}/learn`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setCurrentSessionId(data.sessionId);
      
      // Poll for results
      pollLearnStatus(data.sessionId);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploading(false);
      setProcessing(false);
    }
  };

  const pollLearnStatus = async (sessionId: string) => {
    const maxAttempts = 120; // 10 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/brands/${brandId}/learn/${sessionId}`);
        if (!response.ok) return;

        const data = await response.json();
        
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setProcessing(false);
          setUploading(false);
          // TODO: Show discovered rules
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setProcessing(false);
          setUploading(false);
        }
      } catch (error) {
        console.error("Error polling learn status:", error);
        setProcessing(false);
        setUploading(false);
      }
    };

    poll();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Learn from your content</h1>
        <p className="text-muted-foreground">
          Upload a document or link to an HTML page, and we'll analyze it to discover your brand's language rules and conventions.
        </p>
      </div>

      {!currentSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Start learning session</CardTitle>
            <CardDescription>
              Choose how you want to provide content for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "url" | "upload" | "link")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="link">File Link</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={processing}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a URL to a webpage. We'll analyze the content to discover language patterns and rules.
                  </p>
                </div>
                <Button
                  onClick={() => handleStartLearn("url")}
                  disabled={!url || processing}
                  className="w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Start Learning
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload document</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOCX, TXT, MD, and more
                        </p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.doc,.txt,.md,.html"
                        disabled={processing}
                      />
                    </label>
                  </div>
            <p className="text-sm text-muted-foreground">
                    Upload a document containing your brand's content. We'll analyze it to discover language patterns and rules.
            </p>
                </div>
                {uploading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fileLink">File URL or Link</Label>
                  <Input
                    id="fileLink"
                    type="url"
                    placeholder="https://example.com/document.pdf"
                    value={fileLink}
                    onChange={(e) => setFileLink(e.target.value)}
                    disabled={processing}
                  />
            <p className="text-sm text-muted-foreground">
                    Enter a direct link to a document file. We'll download and analyze it to discover language patterns and rules.
            </p>
                </div>
                <Button
                  onClick={() => handleStartLearn("link")}
                  disabled={!fileLink || processing}
                  className="w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Start Learning
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {processing && !currentSessionId && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
                Analyzing your content. This may take a few minutes...
            </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Learning session in progress</CardTitle>
            <CardDescription>
              We're analyzing your content to discover language rules and patterns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
                This may take a few minutes. We'll notify you when the analysis is complete.
            </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

