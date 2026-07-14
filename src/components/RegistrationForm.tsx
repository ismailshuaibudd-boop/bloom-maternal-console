"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Baby,
  Heart,
  Phone,
  MessageSquare,
  Search,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Filter,
  Users,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  type Mother,
  loadMothers,
  saveMothers,
  generateId,
  formatPhone,
  validatePhone,
  calcWeekFromEDD,
  getTrimester,
  saveLogs,
  loadLogs,
  generateId as genId,
} from "@/utils/maternalData";
import { toast } from "sonner";

const LANGUAGES = ["English", "Hausa", "Yoruba", "Igbo"] as const;
const PREFERENCES = ["SMS", "Voice"] as const;

interface Props {
  mothers: Mother[];
  onMothersChange: (m: Mother[]) => void;
}

export default function RegistrationForm({ mothers, onMothersChange }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<string>("English");
  const [preference, setPreference] = useState<string>("SMS");
  const [edd, setEdd] = useState("");
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<string>("all");
  const [filterTri, setFilterTri] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null);

  const filteredMothers = useMemo(() => {
    return mothers.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search);
      const matchLang = filterLang === "all" || m.language === filterLang;
      const tri = getTrimester(m.pregnancyWeek);
      const matchTri = filterTri === "all" || String(tri) === filterTri;
      return matchSearch && matchLang && matchTri;
    });
  }, [mothers, search, filterLang, filterTri]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setLanguage("English");
    setPreference("SMS");
    setEdd("");
    setEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter the mother's name");
      return;
    }
    if (!validatePhone(phone)) {
      toast.error("Please enter a valid Nigerian phone number (e.g., 2348023456789)");
      return;
    }
    if (!edd) {
      toast.error("Please select an estimated delivery date");
      return;
    }

    const week = calcWeekFromEDD(edd);
    if (week < 1 || week > 42) {
      toast.error("Estimated delivery date seems unreasonable. Check the date.");
      return;
    }

    if (editing) {
      // Update existing
      const updated = mothers.map((m) =>
        m.id === editing
          ? { ...m, name: name.trim(), phone, language: language as Mother["language"], preference: preference as Mother["preference"], pregnancyWeek: week, edd }
          : m
      );
      saveMothers(updated);
      onMothersChange(updated);
      toast.success(`Updated ${name.trim()}'s record`);
    } else {
      // Create new
      const newMother: Mother = {
        id: generateId(),
        name: name.trim(),
        phone,
        language: language as Mother["language"],
        preference: preference as Mother["preference"],
        pregnancyWeek: week,
        edd,
        registeredAt: new Date().toISOString(),
      };

      const updated = [...mothers, newMother];
      saveMothers(updated);
      onMothersChange(updated);

      // Log registration
      const logs = loadLogs();
      logs.unshift({
        id: genId(),
        type: "registration",
        motherId: newMother.id,
        motherName: newMother.name,
        message: `Registered — Week ${newMother.pregnancyWeek}, ${newMother.language}, ${newMother.preference}`,
        timestamp: new Date().toISOString(),
        status: "delivered",
      });
      saveLogs(logs);

      toast.success("Mother registered successfully!");
    }

    resetForm();
  };

  const handleEdit = (mother: Mother) => {
    setEditing(mother.id);
    setName(mother.name);
    setPhone(mother.phone);
    setLanguage(mother.language);
    setPreference(mother.preference);
    setEdd(mother.edd);
  };

  const handleDelete = (id: string) => {
    const updated = mothers.filter((m) => m.id !== id);
    saveMothers(updated);
    onMothersChange(updated);
    toast.success("Mother removed from registry");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Registration Form */}
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-600" />
            {editing ? "Edit Mother" : "Register New Mother"}
          </CardTitle>
          <CardDescription>
            {editing
              ? "Update the mother's details below"
              : "Add a new mother to the SMS/Voice program"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="e.g., Aisha Bello"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="e.g., 2348023456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nigerian format: 234XXXXXXXXXX (no leading +)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preference</label>
                <Select value={preference} onValueChange={setPreference}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFERENCES.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Delivery Date</label>
              <Input
                type="date"
                value={edd}
                onChange={(e) => setEdd(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
              >
                {editing ? (
                  <>
                    <Check className="h-4 w-4" /> Update
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Register
                  </>
                )}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Mother Directory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            Mother Directory
            <Badge variant="secondary" className="ml-auto text-xs">
              {mothers.length}
            </Badge>
          </CardTitle>
          <CardDescription>Registered mothers in the program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or phone..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterLang} onValueChange={setFilterLang}>
              <SelectTrigger className="w-28">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lang</SelectItem>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTri} onValueChange={setFilterTri}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Trimester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tri</SelectItem>
                <SelectItem value="1">T1 (1-13)</SelectItem>
                <SelectItem value="2">T2 (14-27)</SelectItem>
                <SelectItem value="3">T3 (28-40)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          <ScrollArea className="h-[400px] pr-2">
            <AnimatePresence mode="popLayout">
              {filteredMothers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {mothers.length === 0
                    ? "No mothers registered yet. Use the form to add one."
                    : "No mothers match your filters."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredMothers.map((mother) => (
                    <motion.div
                      key={mother.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
                    >
                      <div className="p-2 rounded-full bg-teal-50 text-teal-600">
                        <Baby className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mother.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPhone(mother.phone)}
                        </p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Week {mother.pregnancyWeek}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {mother.language}
                          </Badge>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              mother.preference === "Voice"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {mother.preference === "Voice" ? (
                              <Phone className="h-2.5 w-2.5 mr-0.5" />
                            ) : (
                              <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                            )}
                            {mother.preference}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(mother)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(mother.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}