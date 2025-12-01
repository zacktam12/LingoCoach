import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

export function ModuleCard({ icon, title, description, href }: ModuleCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="hover:bg-accent transition-colors">
        <CardHeader className="flex flex-row items-center space-x-4">
          {icon}
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
