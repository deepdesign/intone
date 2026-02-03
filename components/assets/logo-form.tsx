"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save, Trash2, Upload, Link as LinkIcon } from "lucide-react";

interface BrandLogo {
  id: string;
  name: string;
  variant: string;
  format: string;
  usage: string;
  fileUrl: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
}

interface LogoFormProps {
  brandId: string;
  logo?: BrandLogo | null;
  initialName?: string;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function LogoForm({
  brandId,
  logo,
  initialName,
  onSave,
  onDelete,
  onCancel,
}: LogoFormProps) {
  const [name, setName] = useState(initialName || logo?.name || "");
  const [variant, setVariant] = useState(logo?.variant || "");
  const [format, setFormat] = useState<"SVG" | "PNG">((logo?.format as "SVG" | "PNG") || "PNG");
  const [usage, setUsage] = useState<"print" | "web">((logo?.usage as "print" | "web") || "web");
  const [inputMethod, setInputMethod] = useState<"url" | "upload">(
    logo?.fileUrl.startsWith("http") ? "url" : "upload"
  );
  const [fileUrl, setFileUrl] = useState(logo?.fileUrl || "");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (logo) {
      setName(logo.name);
      setVariant(logo.variant);
      setFormat(logo.format as "SVG" | "PNG");
      setUsage(logo.usage as "print" | "web");
      setFileUrl(logo.fileUrl);
      setInputMethod(logo.fileUrl.startsWith("http") ? "url" : "upload");
    }
  }, [logo]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [".svg", ".png"];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      if (allowedTypes.includes(extension)) {
        setUploadedFile(file);
        if (extension === ".svg") {
          setFormat("SVG");
        } else {
          setFormat("PNG");
        }
      } else {
        alert(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
      }
    }
  };

  const handleSave = async () => {
    if (!name || !variant || !fileUrl) return;

    setSaving(true);
    try {
      let finalFileUrl = fileUrl;
      let fileSize: number | undefined;
      let width: number | undefined;
      let height: number | undefined;

      if (inputMethod === "upload" && uploadedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("type", "logo");

        const uploadResponse = await fetch(`/api/brands/${brandId}/assets/upload`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalFileUrl = uploadData.fileUrl;
          fileSize = uploadData.fileSize;
          width = uploadData.width;
          height = uploadData.height;
        } else {
          throw new Error("Failed to upload file");
        }
        setUploading(false);
      } else if (inputMethod === "url") {
        finalFileUrl = fileUrl;
      }

      const url = logo
        ? `/api/brands/${brandId}/assets/logos/${logo.id}`
        : `/api/brands/${brandId}/assets/logos`;
      
      const method = logo ? "PUT" : "POST";
      const body = {
        name,
        variant,
        format,
        usage,
        fileUrl: finalFileUrl,
        fileSize: fileSize || logo?.fileSize || null,
        width: width || logo?.width || null,
        height: height || logo?.height || null,
      };

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
      console.error("Error saving logo:", error);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!logo || !onDelete) return;
    if (!confirm(`Are you sure you want to delete "${logo.variant}"?`)) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/assets/logos/${logo.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
    } finally {
      setSaving(false);
    }
  };

  const isNew = !logo;
  const previewUrl = uploadedFile 
    ? URL.createObjectURL(uploadedFile)
    : fileUrl || logo?.fileUrl || null;

  return (
    <div className="space-y-6">
      {/* Logo Preview - Combined with form */}
      {previewUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[200px] bg-muted rounded-lg">
              <img
                src={previewUrl}
                alt={name || "Logo preview"}
                className="max-w-full max-h-48 object-contain"
              />
            </div>
            {logo && logo.width && logo.height && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Dimensions: {logo.width} × {logo.height} pixels
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Fields */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {isNew && (
            <div className="space-y-2">
              <Label htmlFor="logo-name">Logo Name *</Label>
              <Input
                id="logo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Logo, Icon"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="logo-variant">Variant *</Label>
            <Input
              id="logo-variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g., Full, Icon, Wordmark"
            />
          </div>

          <div className="space-y-3">
            <Label>Format *</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as "SVG" | "PNG")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SVG" id="format-svg" />
                <Label htmlFor="format-svg">SVG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PNG" id="format-png" />
                <Label htmlFor="format-png">PNG</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Usage *</Label>
            <RadioGroup value={usage} onValueChange={(v) => setUsage(v as "print" | "web")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="web" id="usage-web" />
                <Label htmlFor="usage-web">Web</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="usage-print" />
                <Label htmlFor="usage-print">Print</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Logo Source</Label>
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
                <Label htmlFor="logo-url">File URL</Label>
                <Input
                  id="logo-url"
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://dropbox.com/... or https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Link to logo file in Dropbox, Google Drive, or other cloud storage
                </p>
              </TabsContent>

              <TabsContent value="upload" className="space-y-2 mt-4">
                <Label htmlFor="logo-file">Logo File</Label>
                <Input
                  id="logo-file"
                  type="file"
                  accept=".svg,.png"
                  onChange={handleFileSelect}
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a logo file (SVG or PNG)
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving || uploading || !name || !variant || !fileUrl}
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "Create Logo" : "Save Changes"}
                </>
              )}
            </Button>
            {!isNew && onDelete && (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            {isNew && onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

