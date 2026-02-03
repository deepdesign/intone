import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function ComingSoon() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Coming Soon</CardTitle>
        </div>
        <CardDescription>
          This feature is under development and will be available in a future release.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We're working hard to bring you this functionality. Check back soon!
        </p>
      </CardContent>
    </Card>
  );
}
