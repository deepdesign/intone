"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomRule {
  id: string;
  name: string;
  description: string;
  type: string;
  value: any;
  surfaces: string[];
  status: string;
}

export default function CustomRulesPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "toggle",
    value: true,
    surfaces: [] as string[],
  });

  useEffect(() => {
    fetchCustomRules();
  }, [brandId]);

  const fetchCustomRules = async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}/rules?type=CUSTOM`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Error fetching custom rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/brands/${brandId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: "CUSTOM",
          status: "ACTIVE",
          scope: "GLOBAL",
          surfaces: formData.surfaces,
          controlType: formData.type,
          value: formData.value,
          category: "custom",
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          description: "",
          type: "toggle",
          value: true,
          surfaces: [],
        });
        fetchCustomRules();
      }
    } catch (error) {
      console.error("Error creating custom rule:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this custom rule?")) return;

    try {
      const response = await fetch(`/api/brands/${brandId}/rules/${ruleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCustomRules();
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const toggleSurface = (surface: string) => {
    setFormData((prev) => ({
      ...prev,
      surfaces: prev.surfaces.includes(surface)
        ? prev.surfaces.filter((s) => s !== surface)
        : [...prev.surfaces, surface],
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom rules</h1>
          <p className="text-muted-foreground">
            Create custom rules specific to your brand that aren't covered by the standard rules.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add custom rule
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create custom rule</CardTitle>
            <CardDescription>
              Add a rule that's specific to your brand's language requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Always use 'we' instead of 'I'"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what this rule enforces..."
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Control type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toggle">Toggle (on/off)</SelectItem>
                    <SelectItem value="select">Select (dropdown)</SelectItem>
                    <SelectItem value="text">Text input</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Applies to</Label>
                <div className="space-y-2">
                  {["ui", "marketing", "support", "legal", "internal"].map((surface) => (
                    <div key={surface} className="flex items-center space-x-2">
                      <Checkbox
                        id={`surface-${surface}`}
                        checked={formData.surfaces.includes(surface)}
                        onCheckedChange={() => toggleSurface(surface)}
                      />
                      <Label
                        htmlFor={`surface-${surface}`}
                        className="text-sm font-normal cursor-pointer capitalize"
                      >
                        {surface}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create rule"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      name: "",
                      description: "",
                      type: "toggle",
                      value: true,
                      surfaces: [],
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No custom rules yet. Click "Add custom rule" to create one.
              </p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription className="mt-1">{rule.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {rule.surfaces.map((surface) => (
                    <Badge key={surface} variant="outline" className="capitalize">
                      {surface}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

