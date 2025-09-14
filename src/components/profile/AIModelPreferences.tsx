
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AIModelSelector } from './AIModelSelector';

export function AIModelPreferences() {
  const modes: ("standard" | "multi" | "summary" | "conflict")[] = ["standard", "multi", "summary", "conflict"];

  const modeDetails = {
    standard: { title: "Standard Mode", description: "Choose one model for standard searches." },
    multi: { title: "Multi-Source Mode", description: "Choose up to 5 models from different families." },
    summary: { title: "Summary Mode", description: "Choose up to 10 models to be summarized." },
    conflict: { title: "Conflict Mode", description: "Choose up to 5 models from different families to compare." },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Preferences</CardTitle>
        <CardDescription>Customize which AI models are used for each search mode. Selections are saved automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue="standard">
          {modes.map(mode => (
            <AccordionItem key={mode} value={mode}>
              <AccordionTrigger>{modeDetails[mode].title}</AccordionTrigger>
              <AccordionContent className="p-1">
                <AIModelSelector mode={mode} description={modeDetails[mode].description} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
