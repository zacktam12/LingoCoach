"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

export function ModuleCard({ icon, title, description, href }: ModuleCardProps) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <Card className="hover:bg-accent/80 transition-colors">
          <CardHeader className="flex flex-row items-center space-x-4">
            {icon}
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
