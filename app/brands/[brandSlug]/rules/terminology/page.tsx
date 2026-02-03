"use client";

// Client Component - Static HTML renders immediately
import { PreferredTerms } from "@/components/rules/terminology/preferred-terms";
import { ForbiddenWords } from "@/components/rules/terminology/forbidden-words";
import { BrandRules } from "@/components/rules/terminology/brand-rules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TerminologyPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Terminology</h1>
        <p className="text-muted-foreground">Manage your brand's terminology and lexicon.</p>
      </div>
      <Tabs defaultValue="preferred" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferred">Preferred Terms</TabsTrigger>
          <TabsTrigger value="forbidden">Forbidden Words</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
        </TabsList>
        <TabsContent value="preferred">
          <PreferredTerms />
        </TabsContent>
        <TabsContent value="forbidden">
          <ForbiddenWords />
        </TabsContent>
        <TabsContent value="brand">
          <BrandRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
