"use client";

import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminLink() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/session");
        if (res.ok) {
          const data = await res.json();
          setIsOwner(data.role === "OWNER");
        }
      } catch (err) {
        console.error("Erro ao verificar role:", err);
      } finally {
        setLoading(false);
      }
    }

    void checkRole();
  }, []);

  if (loading || !isOwner) return null;

  return (
    <Link href="/admin">
      <Button variant="outline" className="gap-2">
        <Shield className="h-4 w-4" />
        Admin
      </Button>
    </Link>
  );
}
