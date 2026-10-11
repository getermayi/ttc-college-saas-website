"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  return (
    <Accordion type="single" collapsible>
      {items.map((f) => (
        <AccordionItem key={f.id} value={f.id}>
          <AccordionTrigger>{f.question}</AccordionTrigger>
          <AccordionContent>
            {f.answer.split(/\n{2,}/).map((p, i) => (
              <p key={i} className={i ? "mt-3" : undefined}>
                {p}
              </p>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
