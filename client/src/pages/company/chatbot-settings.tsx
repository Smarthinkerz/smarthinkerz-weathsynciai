import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Plus, Trash2, Edit, Bot, Clock, BarChart3, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface ChatbotPreset {
  id: number;
  companyId: number;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface ChatbotInteraction {
  id: number;
  visitorName: string;
  message: string;
  response: string;
  matched: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "services", label: "Services" },
  { value: "pricing", label: "Pricing" },
  { value: "hours", label: "Hours" },
  { value: "contact", label: "Contact" },
];

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800",
  services: "bg-green-100 text-green-800",
  pricing: "bg-purple-100 text-purple-800",
  hours: "bg-orange-100 text-orange-800",
  contact: "bg-pink-100 text-pink-800",
};

export default function ChatbotSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { company } = useAuth();
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ChatbotPreset | null>(null);
  const [presetForm, setPresetForm] = useState({ question: "", answer: "", category: "general" });

  const { data: presetsData, isLoading: presetsLoading } = useQuery<{ presets: ChatbotPreset[] } | ChatbotPreset[]>({
    queryKey: ["/api/company/chatbot/presets"],
    enabled: !!company,
  });

  const { data: interactionsData, isLoading: interactionsLoading } = useQuery<{ interactions: ChatbotInteraction[]; usage?: { count: number; limit: number } }>({
    queryKey: ["/api/company/chatbot/interactions"],
    enabled: !!company,
  });

  const { data: usageData } = useQuery<{ count: number; limit: number }>({
    queryKey: ["/api/company/chatbot/usage"],
    enabled: !!company,
  });

  const presets: ChatbotPreset[] = (presetsData && "presets" in presetsData ? presetsData.presets : presetsData as ChatbotPreset[]) || [];
  const interactions: ChatbotInteraction[] = interactionsData?.interactions || [];
  const usage = usageData || { count: 0, limit: 50 };

  const isPremium = isHighTier(company?.subscriptionTier);

  const createPresetMutation = useMutation({
    mutationFn: async (data: typeof presetForm) => {
      const res = await apiRequest("POST", "/api/company/chatbot/presets", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Preset Created", description: "FAQ preset has been added successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/company/chatbot/presets"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create preset", variant: "destructive" });
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; question?: string; answer?: string; category?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/company/chatbot/presets/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Preset Updated", description: "FAQ preset has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/company/chatbot/presets"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update preset", variant: "destructive" });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/company/chatbot/presets/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Preset Deleted", description: "FAQ preset has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/company/chatbot/presets"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete preset", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setPresetForm({ question: "", answer: "", category: "general" });
    setEditingPreset(null);
    setShowPresetDialog(false);
  };

  const handleOpenCreate = () => {
    setEditingPreset(null);
    setPresetForm({ question: "", answer: "", category: "general" });
    setShowPresetDialog(true);
  };

  const handleOpenEdit = (preset: ChatbotPreset) => {
    setEditingPreset(preset);
    setPresetForm({ question: preset.question, answer: preset.answer, category: preset.category });
    setShowPresetDialog(true);
  };

  const handleSubmitPreset = () => {
    if (!presetForm.question.trim() || !presetForm.answer.trim()) {
      toast({ title: "Validation Error", description: "Question and answer are required.", variant: "destructive" });
      return;
    }
    if (editingPreset) {
      updatePresetMutation.mutate({ id: editingPreset.id, ...presetForm });
    } else {
      createPresetMutation.mutate(presetForm);
    }
  };

  const handleToggleActive = (preset: ChatbotPreset) => {
    updatePresetMutation.mutate({ id: preset.id, isActive: !preset.isActive });
  };

  const handleDeletePreset = (preset: ChatbotPreset) => {
    if (window.confirm(`Delete preset "${preset.question}"? This cannot be undone.`)) {
      deletePresetMutation.mutate(preset.id);
    }
  };

  if (!company) {
    setLocation("/company/auth");
    return null;
  }

  const usagePercent = isPremium ? 100 : Math.min((usage.count / 50) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/company/dashboard")} className="text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="h-8 w-8 text-blue-600" />
              AI Chatbot Settings
            </h1>
            <p className="text-gray-600">Manage your FAQ chatbot presets and view interaction history</p>
          </div>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">Monthly Interactions</h3>
                  <p className="text-sm text-blue-600">
                    {isPremium ? "Unlimited interactions with Premium" : `${usage.count}/50 interactions used this month`}
                  </p>
                </div>
              </div>
              {!isPremium && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">Basic Plan</Badge>
              )}
              {isPremium && (
                <Badge className="bg-purple-600 text-white">Premium</Badge>
              )}
            </div>
            {!isPremium && (
              <Progress value={usagePercent} className="h-2" />
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="presets">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              FAQ Presets
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Interaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">FAQ Presets</h2>
              <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Preset
              </Button>
            </div>

            {presetsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : presets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No FAQ presets yet</p>
                  <p className="text-sm text-gray-500 mt-1">Add presets to help your chatbot answer common questions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {presets.map((preset) => (
                  <Card key={preset.id} className={!preset.isActive ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{preset.question}</h3>
                            <Badge className={categoryColors[preset.category] || "bg-gray-100 text-gray-800"}>
                              {preset.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{preset.answer}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${preset.id}`} className="text-xs text-gray-500">Active</Label>
                            <Switch
                              id={`active-${preset.id}`}
                              checked={preset.isActive}
                              onCheckedChange={() => handleToggleActive(preset)}
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(preset)}>
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePreset(preset)} disabled={deletePresetMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Interactions</h2>

            {interactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/6" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : interactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No interactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Chatbot interactions will appear here once visitors start using it</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <Card key={interaction.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{interaction.visitorName || "Anonymous"}</span>
                            <Badge variant={interaction.matched ? "default" : "secondary"}>
                              {interaction.matched ? "Matched" : "Unmatched"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Q:</span> {interaction.message}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">A:</span> {interaction.response}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(interaction.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPreset ? "Edit Preset" : "Add FAQ Preset"}</DialogTitle>
              <DialogDescription>
                {editingPreset ? "Update this FAQ preset for your chatbot." : "Create a new FAQ preset for your chatbot to use."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  placeholder="e.g., What are your business hours?"
                  value={presetForm.question}
                  onChange={(e) => setPresetForm({ ...presetForm, question: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  placeholder="e.g., We are open Monday to Friday, 9am to 5pm."
                  value={presetForm.answer}
                  onChange={(e) => setPresetForm({ ...presetForm, answer: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={presetForm.category} onValueChange={(value) => setPresetForm({ ...presetForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button
                  onClick={handleSubmitPreset}
                  disabled={createPresetMutation.isPending || updatePresetMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {(createPresetMutation.isPending || updatePresetMutation.isPending) ? "Saving..." : editingPreset ? "Update Preset" : "Create Preset"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}