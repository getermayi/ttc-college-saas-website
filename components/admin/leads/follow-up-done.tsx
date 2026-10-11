"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { completeFollowUp } from "@/lib/admin/lead-actions";
import { Button } from "@/components/ui/button";

export function FollowUpDoneButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await completeFollowUp(id);
          if (!res.ok) toast.error(res.message);
          else toast.success(res.message);
          router.refresh();
        })
      }
    >
      <Check aria-hidden /> Done
    </Button>
  );
}
