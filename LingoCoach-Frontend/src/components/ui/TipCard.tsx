"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TipCardProps {
  title: string;
  description: string;
}

export function TipCard({ title, description }: TipCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <Card className="transition-colors">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
