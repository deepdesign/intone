"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Trash2, Upload, Link as LinkIcon } from "lucide-react";

interface BrandFont {
  id: string;
  name: string;
  variant: string;
  downloadUrl: string | null;
  fileUrl: string | null;
  fileType: string | null;
}

interface FontDetailProps {
  font: BrandFont | null;
  brandId: string;
  onSave: () => void;
  onDelete: () => void;
}

export function FontDetail({ font, brandId, onSave, onDelete }: FontDetailProps) {
  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [inputMethod, setInputMethod] = useState<"url" | "upload">("url");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (font) {
      setName(font.name);
      setVariant(font.variant);
      setDownloadUrl(font.downloadUrl || "");
      setInputMethod(font.fileUrl ? "upload" : "url");
    } else {
      setName("");
      setVariant("");
      setDownloadUrl("");
      setInputMethod("url");
      setUploadedFile(null);
    }
  }, [font]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [".woff2", ".woff", ".ttf", ".otf"];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      if (allowedTypes.includes(extension)) {
        setUploadedFile(file);
      } else {
        alert(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
      }
    }
  };

  const handleSave = async () => {
    if (!name || !variant) return;
    if (inputMethod === "url" && !downloadUrl && !font?.downloadUrl) {
      alert("Please provide a download URL");
      return;
    }
    if (inputMethod === "upload" && !uploadedFile && !font?.fileUrl) {
      alert("Please upload a font file");
      return;
    }

    setSaving(true);
    try {
      let fileUrl: string | undefined;
      let fileType: string | undefined;

      // Upload file if needed
      if (inputMethod === "upload" && uploadedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("type", "font");

        const uploadResponse = await fetch(`/api/brands/${brandId}/assets/upload`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrl = uploadData.fileUrl;
          fileType = uploadData.fileType;
        } else {
          throw new Error("Failed to upload file");
        }
        setUploading(false);
      }

      const url = font
        ? `/api/brands/${brandId}/assets/fonts/${font.id}`
        : `/api/brands/${brandId}/assets/fonts`;
      
      const method = font ? "PUT" : "POST";
      const body: any = {
        name,
        variant,
      };

      if (inputMethod === "url") {
        body.downloadUrl = downloadUrl || null;
        body.fileUrl = font?.fileUrl || null; // Keep existing if switching to URL
      } else {
        body.downloadUrl = null;
        body.fileUrl = fileUrl || font?.fileUrl || null;
        body.fileType = fileType || font?.fileType || null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving font:", error);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!font) return;
    if (!confirm(`Are you sure you want to delete "${font.name}"?`)) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/assets/fonts/${font.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting font:", error);
    } finally {
      setSaving(false);
    }
  };

  // Generate @font-face for preview
  const fontFaceUrl = font?.fileUrl 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${font.fileUrl}`
    : font?.downloadUrl || null;

  if (!font && name === "") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Select a font to view or edit, or create a new one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{font ? "Edit Font" : "New Font"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Preview */}
        {fontFaceUrl && name && (
          <div className="p-6 bg-muted rounded-lg">
            <style dangerouslySetInnerHTML={{
              __html: `
                @font-face {
                  font-family: 'PreviewFont';
                  src: url('${fontFaceUrl.replace(/'/g, "\\'")}') format('${font?.fileType === "woff2" ? "woff2" : font?.fileType === "woff" ? "woff" : "truetype"}');
                }
              `
            }} />
            <p
              className="text-2xl"
              style={{ fontFamily: "'PreviewFont', sans-serif" }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </p>
            <p className="text-sm text-muted-foreground">
              0123456789 !@#$%^&*()
            </p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-name">Font Name *</Label>
            <Input
              id="font-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Inter, Roboto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-variant">Variant *</Label>
            <Input
              id="font-variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g., Regular, Bold, Light"
            />
          </div>

          <div className="space-y-2">
            <Label>Font Source</Label>
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "url" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2 mt-4">
                <Label htmlFor="font-url">Download URL</Label>
                <Input
                  id="font-url"
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://dropbox.com/... or https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Link to font file in Dropbox, Google Drive, or other cloud storage
                </p>
              </TabsContent>

              <TabsContent value="upload" className="space-y-2 mt-4">
                <Label htmlFor="font-file">Font File</Label>
                <Input
                  id="font-file"
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  onChange={handleFileSelect}
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a font file (WOFF2, WOFF, TTF, or OTF)
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving || uploading || !name || !variant || (inputMethod === "url" && !downloadUrl && !font?.downloadUrl) || (inputMethod === "upload" && !uploadedFile && !font?.fileUrl)}
          >
            {saving || uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {font ? "Save Changes" : "Create Font"}
              </>
            )}
          </Button>
          {font && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

