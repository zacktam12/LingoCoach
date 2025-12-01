import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TipCardProps {
  title: string;
  description: string;
}

export function TipCard({ title, description }: TipCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
