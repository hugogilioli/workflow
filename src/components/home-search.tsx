"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HomeSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get("q") ?? "";
  const [q, setQ] = useState(initial);

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search requests, materials, SAP PN..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const value = q.trim();
          router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
        }}
      >
        Search
      </Button>
    </div>
  );
}
