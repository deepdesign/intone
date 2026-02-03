"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import { GradientMeshShaders } from "@/components/ui/gradient-mesh";
import {
  Sparkles,
  PenTool,
  CheckCircle2,
  GraduationCap,
  Plus,
  Share2,
  Settings,
  Users,
  Rocket,
  Target,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex items-center min-h-[600px] relative overflow-hidden">
          <GradientMeshShaders 
            className="absolute inset-0 opacity-30"
            speed={0.5}
            complexity={0.8}
            saturation={1.2}
            contrast={1.1}
            colorShift={0.8}
          />
          <div className="container mx-auto px-4 py-24 text-center w-full relative z-10">
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              A design system for language
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Define, enforce, and scale your brand's tone of voice, grammar, and writing conventions across product UI, marketing, support, and internal communications.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get started
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Product Overview Section */}
        <section className="bg-background flex items-center min-h-[600px]">
          <div className="container mx-auto px-4 py-24 w-full">
            <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to govern brand language
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Define and enforce consistent tone of voice and grammar rules across all written communications.
            </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Configure your brand language</CardTitle>
                <CardDescription>
                  Set up tone, grammar, and style rules through guided onboarding.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <PenTool className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Write and rewrite on-brand</CardTitle>
                <CardDescription>
                  Get intelligent suggestions and rewrite text to match your tone automatically.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Validate copy against rules</CardTitle>
                <CardDescription>
                  Check your copy against brand rules and get detailed feedback.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <GraduationCap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Learn from your existing content</CardTitle>
                <CardDescription>
                  Upload documents or link webpages to automatically discover rules.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Plus className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Add custom rules as you grow</CardTitle>
                <CardDescription>
                  Create terminology, forbidden words, and custom rules specific to your brand.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Share2 className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Export and share your language system</CardTitle>
                <CardDescription>
                  Share your brand language rules with your team and integrate with your tools.
                </CardDescription>
              </CardHeader>
            </Card>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="bg-muted/30 flex items-center min-h-[600px]">
          <div className="container mx-auto px-4 py-24 w-full">
            <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Built for teams that care about craft
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed for product designers, UX writers, design leads, and founders who want consistent brand language without the overhead.
            </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Product designers and UX writers</CardTitle>
                <CardDescription>
                  Maintain consistent voice across product UI and user-facing copy.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Brand and content teams</CardTitle>
                <CardDescription>
                  Scale brand voice across marketing, support, and internal communications.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Rocket className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Founders and early teams</CardTitle>
                <CardDescription>
                  Establish brand language from day one without hiring a copywriter.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Teams scaling written communication</CardTitle>
                <CardDescription>
                  Reduce rewrites and debates by making rules explicit and enforceable.
                </CardDescription>
              </CardHeader>
            </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-background flex items-center min-h-[600px]">
          <div className="container mx-auto px-4 py-24 w-full">
            <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works for you. All plans include core tone and grammar features.
            </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for individuals and evaluation</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">£0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">1 brand</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Tone onboarding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Grammar rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Manual rewrite and lint</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Limited monthly usage</span>
                  </li>
                </ul>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For senior designers and founders</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">£12</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Everything in Free</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Unlimited rewrites and linting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Full tone and grammar configuration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Custom rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Rule export (Markdown / JSON)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Multiple contexts (UI, marketing, support)</span>
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>For product teams and agencies</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">£35</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Multiple brands</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Team members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Rule set versioning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Review and approval (when launched)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">CMS, Figma, IDE plugins (when launched)</span>
                  </li>
                </ul>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
