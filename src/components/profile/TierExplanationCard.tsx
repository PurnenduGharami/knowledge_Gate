'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, BookOpen, BrainCircuit, Rocket, AlertTriangle, Settings, Sparkles } from 'lucide-react';

export function TierExplanationCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-500" /> Understanding AI Tiers</CardTitle>
        <CardDescription>Choose the right tool for the task — and spend your Chaos Sparks wisely.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        
        {/* Basic Tier */}
        <div className="flex items-start gap-4">
          <Lightbulb className="h-5 w-5 mt-1 text-green-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-base">Basic (Free & Low-Cost)</h4>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">Best For:</strong> Everyday use, quick questions, summaries, brainstorming, definitions. Great for casual exploration or rapid idea generation.
            </p>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">Cost:</strong> Typically costs less than 0.1 Spark per response.
            </p>
            <div className="mt-2 p-2 bg-muted/50 rounded-md flex items-start gap-2">
                <BrainCircuit className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Use this when speed and volume matter more than precision.</p>
            </div>
             <div className="mt-2 p-2 bg-primary/5 rounded-md flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                <p><strong className="font-semibold">Tip:</strong> Stick with Basic for general-purpose tasks — it’s efficient and often good enough.</p>
            </div>
          </div>
        </div>

        {/* Medium Tier */}
        <div className="flex items-start gap-4">
          <BookOpen className="h-5 w-5 mt-1 text-yellow-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-base">Medium (Balanced Tier)</h4>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">Best For:</strong> Thoughtful and structured outputs: Writing short essays, doing moderate research, analyzing problems.
            </p>
             <p className="text-muted-foreground mt-1">
                <strong className="text-foreground">Cost:</strong> Solid performance with reasonable cost — about 0.5–2 Sparks per result.
            </p>
            <div className="mt-2 p-2 bg-muted/50 rounded-md flex items-start gap-2">
                <BrainCircuit className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Use this when you want better depth, but don’t need perfection.</p>
            </div>
            <div className="mt-2 p-2 bg-yellow-500/10 rounded-md flex items-start gap-2 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                <p><strong className="font-semibold">Be Alert:</strong> Avoid running long chats or multi-source queries in this tier unless necessary — cost adds up faster than it seems.</p>
            </div>
          </div>
        </div>

        {/* Professional Tier */}
        <div className="flex items-start gap-4">
          <BrainCircuit className="h-5 w-5 mt-1 text-blue-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-base">Professional (High-Performance)</h4>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">Best For:</strong> Complex and professional work: Technical writing, detailed code generation, legal or academic tasks.
            </p>
             <p className="text-muted-foreground mt-1">
                <strong className="text-foreground">Cost:</strong> Premium quality, but each result may cost 3–8 Sparks or more.
            </p>
            <div className="mt-2 p-2 bg-muted/50 rounded-md flex items-start gap-2">
                <BrainCircuit className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Use this when accuracy, structure, and nuance are critical.</p>
            </div>
            <div className="mt-2 p-2 bg-blue-500/10 rounded-md flex items-start gap-2 border border-blue-500/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <p><strong className="font-semibold">Be Careful:</strong> Avoid testing or casual queries here — use only when you know the task requires precision.</p>
            </div>
          </div>
        </div>
        
        {/* Premium Tier */}
        <div className="flex items-start gap-4">
          <Rocket className="h-5 w-5 mt-1 text-red-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-base">Premium (Top AI Models)</h4>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">Best For:</strong> Cutting-edge use cases: Advanced reasoning, niche topics, multilingual support, SOTA models.
            </p>
             <p className="text-muted-foreground mt-1">
                <strong className="text-foreground">Cost:</strong> Powerful but expensive — 10+ Sparks per result isn't uncommon.
            </p>
            <div className="mt-2 p-2 bg-muted/50 rounded-md flex items-start gap-2">
                <BrainCircuit className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Use when the task justifies the cost: one perfect answer > five weak ones.</p>
            </div>
            <div className="mt-2 p-2 bg-destructive/10 rounded-md flex items-start gap-2 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                <p><strong className="font-semibold">Use Sparingly:</strong> Set a spending limit. Watch out for summary or multi-source queries in this tier — they burn Sparks fast.</p>
            </div>
          </div>
        </div>
        
        {/* General Advice */}
        <div className="flex items-start gap-4 pt-4 border-t">
          <Settings className="h-5 w-5 mt-1 text-primary shrink-0" />
          <div>
            <h4 className="font-semibold text-base">General Advice to Maximize Value</h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Use <strong className="text-foreground">Automatic Mode</strong> for smart balancing across tiers.</li>
                <li>Set custom limits on expensive tiers if you’re working on a budget.</li>
                <li>Check the Spark estimate before sending a large query.</li>
                <li>Avoid <strong className="text-foreground">Premium</strong> for small talk or repetitive tests.</li>
                <li>Use <strong className="text-foreground">Multi-Source</strong> carefully — it calls multiple models at once and compounds the cost.</li>
                <li>For long sessions, enable context compression to reduce token waste.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
