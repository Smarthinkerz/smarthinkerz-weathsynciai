import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, Trash2, ExternalLink, Star, Loader2 } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function PortfolioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("project");
  const [externalUrl, setExternalUrl] = useState("");
  const [tags, setTags] = useState("");

  const { data: items = [], isLoading } = useQuery({ queryKey: ["/api/portfolio"] });
  const { data: feedback = [] } = useQuery({ queryKey: ["/api/client-feedback"] });
  const { data: endorsementsData = [] } = useQuery({ queryKey: ["/api/endorsements"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/portfolio", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setOpen(false);
      setTitle(""); setDescription(""); setItemType("project"); setExternalUrl(""); setTags("");
      toast({ title: "Portfolio item added" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/portfolio/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Item removed" });
    }
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/client-feedback", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-feedback"] });
      toast({ title: "Feedback added" });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" /> Portfolio & Validation
            </h1>
            <p className="text-muted-foreground mt-1">Showcase your work, collect endorsements, and build credibility</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Portfolio Item</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project name" /></div>
                <div><Label>Type</Label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                      <SelectItem value="publication">Publication</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your work..." /></div>
                <div><Label>External URL</Label><Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." /></div>
                <div><Label>Tags (comma-separated)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="react, finance, AI" /></div>
                <Button className="w-full" disabled={createMutation.isPending || !title} onClick={() => createMutation.mutate({ title, description, itemType, externalUrl: externalUrl || null, tags: tags.split(",").map(t => t.trim()).filter(Boolean) })}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">Portfolio Items</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{(items as any[]).length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">Endorsements</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{(endorsementsData as any[]).length}</p></CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (items as any[]).length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No portfolio items yet. Add your first project to start building your professional profile.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {(items as any[]).map((item: any) => (
              <Card key={item.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{item.itemType}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                  {item.externalUrl && (
                    <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> View Project
                    </a>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Client Feedback & Reviews</h2>
          {(feedback as any[]).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No client feedback yet.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(feedback as any[]).map((fb: any) => (
                <Card key={fb.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{fb.projectName}</span>
                      <div className="flex">{Array.from({length: fb.rating}, (_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                    </div>
                    {fb.review && <p className="text-sm text-muted-foreground">{fb.review}</p>}
                    {fb.outcome && <p className="text-sm mt-2"><span className="font-medium">Outcome:</span> {fb.outcome}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
