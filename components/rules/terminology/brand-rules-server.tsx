import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BrandRulesServerProps {
  brandId: string;
}

export async function BrandRulesServer({ brandId }: BrandRulesServerProps) {
  // Fetch brand-specific terminology rules
  const rules = await prisma.rule.findMany({
    where: {
      brandId,
      type: "TERMINOLOGY",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Brand Rules</h3>
        <p className="text-sm text-muted-foreground">
          Brand-specific terminology rules and guidelines.
        </p>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No brand rules</CardTitle>
            <CardDescription>No brand-specific terminology rules have been created yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule: { id: string; name: string; description: string | null }) => (
            <Card key={rule.id}>
              <CardHeader>
                <CardTitle>{rule.name}</CardTitle>
                {rule.description && (
                  <CardDescription>{rule.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



