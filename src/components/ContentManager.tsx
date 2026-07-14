"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Book,
  Pencil,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  Phone,
  Copy,
  AudioLines,
  Baby,
  Plus,
  Clock,
} from "lucide-react";
import {
  type HealthTip,
  type Mother,
  type DispatchPayload,
  loadTips,
  saveTips,
  loadMothers,
  buildDispatchPayload,
  generateGatewaySnippet,
  generateId,
  getTrimester,
} from "@/utils/maternalData";
import { toast } from "sonner";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

const LANG_CODES = ["en", "ha", "yo", "ig"] as const;
type LangCode = (typeof LANG_CODES)[number];

interface Props {
  mothers: Mother[];
}

export default function ContentManager({ mothers }: Props) {
  const [tips, setTips] = useState<HealthTip[]>(() => loadTips());
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    // Default to most common week among mothers
    if (mothers.length > 0) {
      const avg = Math.round(
        mothers.reduce((s, m) => s + m.pregnancyWeek, 0) / mothers.length
      );
      return Math.min(40, Math.max(1, avg));
    }
    return 12;
  });
  const [activeLang, setActiveLang] = useState<LangCode>("en");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [gatewayTab, setGatewayTab] = useState<"preview" | "code">("preview");
  const [selectedMotherId, setSelectedMotherId] = useState<string>("");

  const currentTip = tips.find((t) => t.week === selectedWeek);

  // Build preview payload for selected mother
  const previewPayload = useMemo(() => {
    const mother = mothers.find((m) => m.id === selectedMotherId);
    if (!mother || !currentTip) return null;
    const msg = currentTip[activeLang as keyof HealthTip] || currentTip.en;
    return buildDispatchPayload(mother, msg);
  }, [mothers, selectedMotherId, currentTip, activeLang]);

  const handleSaveTip = () => {
    if (!draft.trim()) {
      toast.error("Tip content cannot be empty");
      return;
    }
    const updated = tips.map((t) =>
      t.week === selectedWeek ? { ...t, [activeLang]: draft.trim() } : t
    );
    saveTips(updated);
    setTips(updated);
    setEditing(false);
    toast.success(`Week ${selectedWeek} tip (${LANG_LABELS[activeLang]}) saved`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success("Gateway code copied to clipboard");
    });
  };

  const tipForSelectedWeek = currentTip;

  const mothersForWeek = mothers.filter(
    (m) => m.pregnancyWeek === selectedWeek
  );

  return (
    <div className="space-y-6">
      {/* Week Selector + Language Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Book className="h-4 w-4 text-teal-600" />
                Weekly Health Tips
              </CardTitle>
              <CardDescription>
                Edit and preview SMS/Voice content for each pregnancy week
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {mothersForWeek.length} mother{mothersForWeek.length !== 1 ? "s" : ""} at Week{" "}
              {selectedWeek}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Week Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium shrink-0">Week:</label>
            <div className="flex gap-1 flex-wrap">
              {[1, 8, 16, 24, 32, 40].map((w) => (
                <Button
                  key={w}
                  variant={selectedWeek === w ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setSelectedWeek(w);
                    setEditing(false);
                  }}
                >
                  {w}
                </Button>
              ))}
              <span className="text-xs text-muted-foreground self-center mx-1">or</span>
              <Input
                type="number"
                min={1}
                max={40}
                value={selectedWeek}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 40) {
                    setSelectedWeek(v);
                    setEditing(false);
                  }
                }}
                className="w-16 h-7 text-xs"
              />
            </div>
          </div>

          <Separator />

          {/* Language Tabs */}
          <Tabs
            value={activeLang}
            onValueChange={(v) => {
              setActiveLang(v as LangCode);
              setEditing(false);
            }}
          >
            <TabsList className="grid grid-cols-4 w-full">
              {LANG_CODES.map((code) => (
                <TabsTrigger key={code} value={code} className="text-xs">
                  {LANG_LABELS[code]}
                </TabsTrigger>
              ))}
            </TabsList>

            {LANG_CODES.map((code) => (
              <TabsContent key={code} value={code} className="pt-4">
                <div className="space-y-3">
                  {editing && code === activeLang ? (
                    <>
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={4}
                        className="text-sm"
                        placeholder="Type your health tip here..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveTip}
                          className="gap-1 bg-teal-600 hover:bg-teal-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(false)}
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-lg bg-muted/30 border text-sm leading-relaxed min-h-[80px]">
                        {tipForSelectedWeek
                          ? tipForSelectedWeek[code as keyof HealthTip] || tipForSelectedWeek.en
                          : "No tip configured for this week yet."}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDraft(
                            tipForSelectedWeek
                              ? (tipForSelectedWeek[code as keyof HealthTip] ||
                                  tipForSelectedWeek.en)
                              : ""
                          );
                          setEditing(true);
                        }}
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit{" "}
                        {LANG_LABELS[code]}
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Gateway Integration Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AudioLines className="h-4 w-4 text-emerald-600" />
            Gateway Integration Preview
          </CardTitle>
          <CardDescription>
            Preview the dispatch payload and gateway code for Africa's Talking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Mother */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium shrink-0">Test with:</label>
            <Select value={selectedMotherId} onValueChange={setSelectedMotherId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a mother..." />
              </SelectTrigger>
              <SelectContent>
                {mothers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — Week {m.pregnancyWeek} — {m.language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {previewPayload ? (
            <Tabs
              value={gatewayTab}
              onValueChange={(v) => setGatewayTab(v as "preview" | "code")}
            >
              <TabsList className="grid grid-cols-2 w-48">
                <TabsTrigger value="preview" className="text-xs">
                  Payload
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs">
                  Gateway Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="pt-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-mono">{previewPayload.to}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Mother</span>
                    <span>{previewPayload.motherName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Week</span>
                    <span>{previewPayload.week}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Channel</span>
                    <Badge
                      variant="outline"
                      className={
                        previewPayload.channel === "Voice"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-blue-50 text-blue-700"
                      }
                    >
                      {previewPayload.channel === "Voice" ? (
                        <Phone className="h-3 w-3 mr-1" />
                      ) : (
                        <MessageSquare className="h-3 w-3 mr-1" />
                      )}
                      {previewPayload.channel}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Language</span>
                    <span>{previewPayload.language}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Gateway</span>
                    <span className="font-mono text-xs">{previewPayload.gateway}</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Message:</p>
                    <p className="text-sm leading-relaxed p-2 rounded bg-muted/20">
                      {previewPayload.message}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code" className="pt-3">
                <div className="relative">
                  <pre className="text-xs font-mono bg-muted/30 border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {generateGatewaySnippet(previewPayload)}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7"
                    onClick={() =>
                      handleCopyCode(generateGatewaySnippet(previewPayload))
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Select a mother to preview the dispatch payload</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}