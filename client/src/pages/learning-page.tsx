import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, BookOpen, Award, Clock, Loader2, ChevronRight, Users } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function LearningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  const { data: tracks = [], isLoading } = useQuery({ queryKey: ["/api/learning-tracks"] });
  const { data: myProgress = [] } = useQuery({ queryKey: ["/api/learning/my-progress"] });

  const { data: trackDetail } = useQuery({
    queryKey: ["/api/learning-tracks", selectedTrack?.id],
    queryFn: async () => {
      const res = await fetch(`/api/learning-tracks/${selectedTrack.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTrack
  });

  const enrollMutation = useMutation({
    mutationFn: async (trackId: number) => { await apiRequest("POST", `/api/learning-tracks/${trackId}/enroll`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning/my-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning-tracks", selectedTrack?.id] });
      toast({ title: "Enrolled successfully" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  });

  const progressUpdateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => { await apiRequest("PATCH", `/api/learning-progress/${id}`, updates); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning/my-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning-tracks", selectedTrack?.id] });
      toast({ title: "Progress updated" });
    }
  });

  const getProgressForTrack = (trackId: number) => (myProgress as any[]).find((p: any) => p.trackId === trackId);
  const difficultyColors: Record<string, string> = { beginner: "bg-green-100 text-green-800", intermediate: "bg-yellow-100 text-yellow-800", advanced: "bg-red-100 text-red-800" };

  if (selectedTrack && trackDetail) {
    const progress = trackDetail.progress || getProgressForTrack(trackDetail.id);
    const modules = trackDetail.modules || [];
    return (
      <div className="min-h-screen bg-background">
        <PageNavHeader />
        <div className="container mx-auto py-6 px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => setSelectedTrack(null)} className="mb-4">&larr; Back to Tracks</Button>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={difficultyColors[trackDetail.difficulty] || ""}>{trackDetail.difficulty}</Badge>
                <Badge variant="outline">{trackDetail.category}</Badge>
                {trackDetail.certificationName && <Badge variant="secondary"><Award className="h-3 w-3 mr-1" /> Certificate</Badge>}
              </div>
              <CardTitle className="text-2xl">{trackDetail.title}</CardTitle>
              <CardDescription>{trackDetail.description}</CardDescription>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {trackDetail.estimatedHours}h</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {trackDetail.enrollmentCount} enrolled</span>
              </div>
            </CardHeader>
            <CardContent>
              {progress ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                  {(progress.certificateEarned || progress.progress === 100) && (
                    <a href={`/api/learning/certificate/${progress.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="mt-3 w-full border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900">
                        🏆 Download Your Certificate
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <Button className="mb-6" onClick={() => enrollMutation.mutate(trackDetail.id)} disabled={enrollMutation.isPending}>
                  {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />} Enroll Now
                </Button>
              )}
              <h3 className="font-semibold mb-4">Modules ({modules.length})</h3>
              <div className="space-y-3">
                {modules.map((mod: any, idx: number) => {
                  const isCompleted = progress?.completedModules?.includes(idx);
                  const isCurrent = progress && idx === progress.currentModule;
                  return (
                    <Card key={idx} className={`${isCurrent ? "border-primary" : ""} ${isCompleted ? "bg-muted/50" : ""}`}>
                      <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted ? "bg-green-100 text-green-700" : isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{mod.title || `Module ${idx + 1}`}</p>
                            {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                          </div>
                        </div>
                        {progress && isCurrent && (
                          <Button size="sm" onClick={() => {
                            const completed = [...(progress.completedModules || []), idx];
                            const nextModule = Math.min(idx + 1, modules.length - 1);
                            const newProgress = Math.round((completed.length / modules.length) * 100);
                            progressUpdateMutation.mutate({ id: progress.id, updates: { completedModules: completed, currentModule: nextModule, progress: newProgress, certificateEarned: newProgress === 100 } });
                          }}>Complete</Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageNavHeader />
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-8 w-8 text-primary" /> Learning Center</h1>
          <p className="text-muted-foreground mt-1">Master business intelligence with structured learning tracks and certifications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Available Tracks</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{(tracks as any[]).length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Enrolled</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{(myProgress as any[]).length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Completed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{(myProgress as any[]).filter((p: any) => p.certificateEarned).length}</p></CardContent></Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (tracks as any[]).length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No learning tracks available yet. Check back soon!</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(tracks as any[]).map((track: any) => {
              const progress = getProgressForTrack(track.id);
              return (
                <Card key={track.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedTrack(track)}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={difficultyColors[track.difficulty] || ""}>{track.difficulty}</Badge>
                      <Badge variant="outline">{track.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{track.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{track.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {track.estimatedHours}h</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {track.enrollmentCount}</span>
                      {track.certificationName && <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Cert</span>}
                    </div>
                    {progress && (
                      <div>
                        <Progress value={progress.progress} className="h-1.5 mb-1" />
                        <p className="text-xs text-muted-foreground">{progress.progress}% complete</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="text-xs capitalize">{track.requiredTier}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
