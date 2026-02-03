"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Download, Loader2, CheckCircle2, XCircle, Info, Sparkles } from "lucide-react";
import { getAllChannels, getChannel, getDefaultCharLimit, isStrictLimit } from "@/lib/channels/config";

interface Change {
  ruleKey: string;
  reason: string;
  original: string;
  revised: string;
}

interface RewriteResponse {
  output: string;
  charCount: number;
  variants?: string[];
  changes?: Change[];
  violationsInInput?: Change[];
  trimmedToFit?: boolean;
}

export function CreatePanel() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mode: rewrite, generate, shorten, or expand
  const [mode, setMode] = useState<"rewrite" | "generate" | "shorten" | "expand">("rewrite");
  const [operation, setOperation] = useState<"rewrite" | "shorten" | "expand">("rewrite");
  
  // Input text (for rewrite mode)
  const [input, setInput] = useState("");
  
  // Brief fields (for generate mode)
  const [brief, setBrief] = useState({
    topic: "",
    keyPoints: [""],
    cta: "",
    offer: "",
    links: [""],
  });

  // Channel and constraints
  const [channelId, setChannelId] = useState<string>("");
  const [charLimit, setCharLimit] = useState<number | undefined>(undefined);
  const [strictLimit, setStrictLimit] = useState(false);
  const [autoTrim, setAutoTrim] = useState(false);

  // Intent and style
  const [intent, setIntent] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [formality, setFormality] = useState<string>("");
  const [energy, setEnergy] = useState<string>("confident");

  // Variants
  const [variants, setVariants] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);

  // Output
  const [output, setOutput] = useState("");
  const [outputVariants, setOutputVariants] = useState<string[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [violationsInInput, setViolationsInInput] = useState<Change[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);

  // Settings
  const [applyAllRules, setApplyAllRules] = useState(true);
  const [explainChanges, setExplainChanges] = useState(true);
  const [highlightViolations, setHighlightViolations] = useState(true);

  const channels = getAllChannels();

  // Update char limit when channel changes
  useEffect(() => {
    if (channelId && channelId !== "none") {
      const channel = getChannel(channelId);
      if (channel) {
        setCharLimit(channel.charLimit);
        setStrictLimit(channel.strictLimit ?? false);
        setAutoTrim(channel.strictLimit ?? false);
      }
    } else {
      setCharLimit(undefined);
      setStrictLimit(false);
      setAutoTrim(false);
    }
  }, [channelId]);

  const inputCharCount = input.length;
  const outputCharCount = output.length;
  const remainingChars = charLimit ? charLimit - outputCharCount : null;
  const isOverLimit = charLimit ? outputCharCount > charLimit : false;

  const handleGenerate = async () => {
    if ((mode === "rewrite" || mode === "shorten" || mode === "expand") && !input.trim()) {
      setMessage({ type: "error", text: `Please enter text to ${mode}.` });
      return;
    }

    if (mode === "generate" && !brief.topic.trim()) {
      setMessage({ type: "error", text: "Please enter a topic for generation." });
      return;
    }

    setMessage(null);

    setLoading(true);
    setOutput("");
    setOutputVariants([]);
    setChanges([]);
    setViolationsInInput([]);

    try {
      // Map mode to API operation
      const apiMode = mode === "shorten" || mode === "expand" ? "rewrite" : mode;
      
      const requestBody: any = {
        mode: apiMode,
        channelId: channelId && channelId !== "none" ? channelId : undefined,
        charLimit: charLimit || undefined,
        strictLimit: strictLimit,
        intent: intent && intent !== "none" ? intent : undefined,
        audience: audience && audience !== "none" ? audience : undefined,
        formality: formality && formality !== "none" ? formality : undefined,
        energy: energy || undefined,
        variants: variants > 1 ? variants : undefined,
      };

      // Add operation-specific instructions
      if (mode === "shorten") {
        requestBody.input = input;
        requestBody.intent = "summarise"; // Force summarise intent for shorten
        if (!requestBody.charLimit && charLimit) {
          // If no explicit limit, try to shorten by ~30%
          requestBody.charLimit = Math.max(50, Math.floor(input.length * 0.7));
        }
      } else if (mode === "expand") {
        requestBody.input = input;
        requestBody.intent = "explain"; // Force explain intent for expand
        // Remove char limit for expand
        requestBody.charLimit = undefined;
        requestBody.strictLimit = false;
      } else if (mode === "rewrite") {
        requestBody.input = input;
      } else {
        requestBody.brief = {
          topic: brief.topic,
          keyPoints: brief.keyPoints.filter((kp) => kp.trim()),
          cta: brief.cta || undefined,
          offer: brief.offer || undefined,
          links: brief.links.filter((link) => link.trim()) || undefined,
        };
      }

      const response = await fetch(`/api/brands/${brandId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to generate");
      }

      const result: RewriteResponse = await response.json();
      setOutput(result.output);
      setOutputVariants(result.variants || []);
      setChanges(result.changes || []);
      setViolationsInInput(result.violationsInInput || []);
      setSelectedVariant(0);

      setMessage({ type: "success", text: "Copy generated successfully." });
    } catch (error) {
      console.error("Error generating:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to generate copy",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = outputVariants.length > 0 && selectedVariant < outputVariants.length
      ? outputVariants[selectedVariant]
      : output;
    
    navigator.clipboard.writeText(textToCopy);
    setMessage({ type: "success", text: "Output copied to clipboard." });
  };

  const handleAddKeyPoint = () => {
    setBrief({ ...brief, keyPoints: [...brief.keyPoints, ""] });
  };

  const handleRemoveKeyPoint = (index: number) => {
    setBrief({ ...brief, keyPoints: brief.keyPoints.filter((_, i) => i !== index) });
  };

  const handleAddLink = () => {
    setBrief({ ...brief, links: [...brief.links, ""] });
  };

  const handleRemoveLink = (index: number) => {
    setBrief({ ...brief, links: brief.links.filter((_, i) => i !== index) });
  };

  const currentOutput = outputVariants.length > 0 && selectedVariant < outputVariants.length
    ? outputVariants[selectedVariant]
    : output;

  return (
    <div className="space-y-6">
      {/* Message alert */}
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "error"
              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              message.type === "error"
                ? "text-red-800 dark:text-red-200"
                : "text-green-800 dark:text-green-200"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Mode selector */}
      <Card>
        <CardHeader>
          <CardTitle>Mode</CardTitle>
          <CardDescription>Choose how you want to create copy</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rewrite" id="rewrite" />
              <Label htmlFor="rewrite" className="cursor-pointer">
                Rewrite my text
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="generate" id="generate" />
              <Label htmlFor="generate" className="cursor-pointer">
                Generate from a brief
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shorten" id="shorten" />
              <Label htmlFor="shorten" className="cursor-pointer">
                Shorten text
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expand" id="expand" />
              <Label htmlFor="expand" className="cursor-pointer">
                Expand text
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Main content area - split layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Input</CardTitle>
                <CardDescription>
                  {mode === "rewrite" ? "Enter text to rewrite" : "Enter brief details"}
                </CardDescription>
              </div>
              {inputCharCount > 0 && (
                <Badge variant="outline">{inputCharCount} chars</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "rewrite" || mode === "shorten" || mode === "expand" ? (
              <div className="space-y-2">
                <Label htmlFor="input">
                  {mode === "rewrite" && "Text to rewrite"}
                  {mode === "shorten" && "Text to shorten"}
                  {mode === "expand" && "Text to expand"}
                </Label>
                <Textarea
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "rewrite" ? "Paste your text here..." :
                    mode === "shorten" ? "Enter text to make shorter..." :
                    "Enter text to expand with more detail..."
                  }
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    value={brief.topic}
                    onChange={(e) => setBrief({ ...brief, topic: e.target.value })}
                    placeholder="What is this about?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key points</Label>
                  {brief.keyPoints.map((kp, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={kp}
                        onChange={(e) => {
                          const newKeyPoints = [...brief.keyPoints];
                          newKeyPoints[index] = e.target.value;
                          setBrief({ ...brief, keyPoints: newKeyPoints });
                        }}
                        placeholder={`Key point ${index + 1}`}
                      />
                      {brief.keyPoints.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveKeyPoint(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddKeyPoint}>
                    Add key point
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta">Call to action (optional)</Label>
                  <Input
                    id="cta"
                    value={brief.cta}
                    onChange={(e) => setBrief({ ...brief, cta: e.target.value })}
                    placeholder="e.g., Sign up now"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer">Offer (optional)</Label>
                  <Input
                    id="offer"
                    value={brief.offer}
                    onChange={(e) => setBrief({ ...brief, offer: e.target.value })}
                    placeholder="e.g., 20% off first month"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Links (optional)</Label>
                  {brief.links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...brief.links];
                          newLinks[index] = e.target.value;
                          setBrief({ ...brief, links: newLinks });
                        }}
                        placeholder="https://..."
                        type="url"
                      />
                      {brief.links.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddLink}>
                    Add link
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Output */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Output</CardTitle>
                <CardDescription>Generated copy with brand rules applied</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {outputCharCount > 0 && (
                  <Badge variant={isOverLimit ? "destructive" : "outline"}>
                    {outputCharCount} {charLimit && `/${charLimit}`} chars
                  </Badge>
                )}
                {output && (
                  <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Generating copy...</p>
              </div>
            ) : output ? (
              <>
                {outputVariants.length > 1 && (
                  <div className="space-y-2">
                    <Label>Variants</Label>
                    <div className="flex gap-2 flex-wrap">
                      {outputVariants.map((_, index) => (
                        <Button
                          key={index}
                          variant={selectedVariant === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedVariant(index)}
                        >
                          Variant {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Generated copy</Label>
                  <div className="p-4 bg-muted rounded-md min-h-[300px] whitespace-pre-wrap text-sm">
                    {currentOutput}
                  </div>
                </div>
                {remainingChars !== null && (
                  <div className="text-sm">
                    {remainingChars >= 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        {remainingChars} characters remaining
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        {Math.abs(remainingChars)} characters over limit
                      </span>
                    )}
                  </div>
                )}
                {showReasoning && changes.length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="changes">
                      <AccordionTrigger>Changes made ({changes.length})</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {changes.map((change, index) => (
                            <div key={index} className="p-3 bg-muted rounded-md space-y-1">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{change.ruleKey}</p>
                                  <p className="text-xs text-muted-foreground">{change.reason}</p>
                                </div>
                              </div>
                              <div className="text-xs space-y-1 pl-6">
                                <p>
                                  <span className="text-red-600 dark:text-red-400">- {change.original}</span>
                                </p>
                                <p>
                                  <span className="text-green-600 dark:text-green-400">+ {change.revised}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                {highlightViolations && violationsInInput.length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="violations">
                      <AccordionTrigger>Rule violations in input ({violationsInInput.length})</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {violationsInInput.map((violation, index) => (
                            <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{violation.ruleKey}</p>
                                  <p className="text-xs text-muted-foreground">{violation.reason}</p>
                                  <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                                    Found: "{violation.original}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Generated copy will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls panel */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure channel, constraints, and style</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel and constraints */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channelId || "none"} onValueChange={(v) => setChannelId(v === "none" ? "" : v)}>
                <SelectTrigger id="channel">
                  <SelectValue placeholder="Select a channel (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (general)</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                      {channel.charLimit && ` (${channel.charLimit} chars)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {channelId && channelId !== "none" && (
              <div className="space-y-4 p-4 bg-muted rounded-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="charLimit">Character limit</Label>
                    <Badge variant="outline">
                      {charLimit ? `${charLimit} chars` : "No limit"}
                    </Badge>
                  </div>
                  <Input
                    id="charLimit"
                    type="number"
                    value={charLimit || ""}
                    onChange={(e) => setCharLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Auto (uses channel default)"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="strictLimit">Enforce hard limit</Label>
                    <p className="text-xs text-muted-foreground">
                      Strictly enforce character limit
                    </p>
                  </div>
                  <Switch
                    id="strictLimit"
                    checked={strictLimit}
                    onCheckedChange={setStrictLimit}
                  />
                </div>

                {strictLimit && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoTrim">Auto-trim to fit</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically trim output to fit limit
                      </p>
                    </div>
                    <Switch
                      id="autoTrim"
                      checked={autoTrim}
                      onCheckedChange={setAutoTrim}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Intent and style */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="intent">Intent</Label>
              <Select value={intent || "none"} onValueChange={(v) => setIntent(v === "none" ? "" : v)}>
                <SelectTrigger id="intent">
                  <SelectValue placeholder="Select intent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="announce">Announce</SelectItem>
                  <SelectItem value="educate">Educate</SelectItem>
                  <SelectItem value="persuade">Persuade</SelectItem>
                  <SelectItem value="invite">Invite</SelectItem>
                  <SelectItem value="apologise">Apologise</SelectItem>
                  <SelectItem value="summarise">Summarise</SelectItem>
                  <SelectItem value="explain">Explain</SelectItem>
                  <SelectItem value="compare">Compare</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Select value={audience || "none"} onValueChange={(v) => setAudience(v === "none" ? "" : v)}>
                <SelectTrigger id="audience">
                  <SelectValue placeholder="Select audience (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="informed">Informed</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formality">Formality</Label>
              <Select value={formality || "none"} onValueChange={(v) => setFormality(v === "none" ? "" : v)}>
                <SelectTrigger id="formality">
                  <SelectValue placeholder="Select formality (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="energy">Energy</Label>
              <Select value={energy} onValueChange={setEnergy}>
                <SelectTrigger id="energy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Variants */}
          <div className="space-y-2">
            <Label>Variants</Label>
            <div className="flex gap-2">
              {[1, 3, 5].map((num) => (
                <Button
                  key={num}
                  variant={variants === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVariants(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Generate multiple variations to choose from
            </p>
          </div>

          <Separator />

          {/* Brand rule settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="applyAllRules">Apply all brand rules</Label>
                <p className="text-xs text-muted-foreground">
                  Apply all active brand language rules
                </p>
              </div>
              <Switch
                id="applyAllRules"
                checked={applyAllRules}
                onCheckedChange={setApplyAllRules}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="explainChanges">Explain changes</Label>
                <p className="text-xs text-muted-foreground">
                  Show which rules were applied and why
                </p>
              </div>
              <Switch
                id="explainChanges"
                checked={explainChanges}
                onCheckedChange={(checked) => {
                  setExplainChanges(checked);
                  setShowReasoning(checked);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="highlightViolations">Highlight rule violations in input</Label>
                <p className="text-xs text-muted-foreground">
                  Show which rules were violated in the original text
                </p>
              </div>
              <Switch
                id="highlightViolations"
                checked={highlightViolations}
                onCheckedChange={setHighlightViolations}
              />
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={
              loading ||
              ((mode === "rewrite" || mode === "shorten" || mode === "expand") && !input.trim()) ||
              (mode === "generate" && !brief.topic.trim())
            }
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "shorten" ? "Shortening..." : mode === "expand" ? "Expanding..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {mode === "shorten" ? "Shorten" : mode === "expand" ? "Expand" : "Generate"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
