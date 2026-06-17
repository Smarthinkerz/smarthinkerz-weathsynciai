import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, ThumbsUp, ChevronRight, Loader2, Users, Trash2 } from "lucide-react";
import { PageNavHeader } from "@/components/page-nav-header";

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [category, setCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState("discussion");
  const [replyContent, setReplyContent] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/community/posts", category === "all" ? undefined : category],
    queryFn: async () => {
      const params = category !== "all" ? `?category=${category}` : "";
      const res = await fetch(`/api/community/posts${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const { data: postDetail } = useQuery({
    queryKey: ["/api/community/posts", selectedPost?.id],
    queryFn: async () => {
      if (!selectedPost) return null;
      const res = await fetch(`/api/community/posts/${selectedPost.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedPost
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/community/posts", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setCreateOpen(false); setTitle(""); setContent(""); setPostCategory("discussion");
      toast({ title: "Post created" });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      await apiRequest("POST", `/api/community/posts/${postId}/replies`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", selectedPost?.id] });
      setReplyContent("");
      toast({ title: "Reply posted" });
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: async (postId: number) => { await apiRequest("POST", `/api/community/posts/${postId}/upvote`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] }); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => { await apiRequest("DELETE", `/api/community/posts/${postId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setSelectedPost(null);
      toast({ title: "Post deleted" });
    }
  });

  const categories = ["all", "discussion", "question", "announcement", "showcase", "feedback"];

  if (selectedPost && postDetail) {
    return (
      <div className="min-h-screen bg-background">
        <PageNavHeader />
        <div className="container mx-auto py-6 px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => setSelectedPost(null)} className="mb-4">&larr; Back to Community</Button>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">{postDetail.category}</Badge>
                  <CardTitle className="text-2xl">{postDetail.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{new Date(postDetail.createdAt).toLocaleDateString()} · {postDetail.upvotes} upvotes · {postDetail.replyCount} replies</p>
                </div>
                {user?.id === postDetail.userId && (
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(postDetail.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap mb-6">{postDetail.content}</p>
              {postDetail.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-6">{postDetail.tags.map((t: string, i: number) => <Badge key={i} variant="outline">{t}</Badge>)}</div>
              )}
              <hr className="my-6" />
              <h3 className="font-semibold mb-4">Replies ({postDetail.replies?.length || 0})</h3>
              <div className="space-y-4 mb-6">
                {(postDetail.replies || []).map((reply: any) => (
                  <Card key={reply.id} className="bg-muted/50">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-sm">{reply.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                        <span>· {reply.upvotes} upvotes</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." className="flex-1" />
                <Button disabled={!replyContent.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate({ postId: postDetail.id, content: replyContent })}>
                  {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
                </Button>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8 text-primary" /> Community</h1>
            <p className="text-muted-foreground mt-1">Connect, share insights, and grow with the WealthSync community</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Post</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" /></div>
                <div><Label>Category</Label>
                  <Select value={postCategory} onValueChange={setPostCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="showcase">Showcase</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Share your thoughts..." /></div>
                <Button className="w-full" disabled={!title.trim() || !content.trim() || createMutation.isPending} onClick={() => createMutation.mutate({ title, content, category: postCategory })}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Publish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(c => (
            <Button key={c} variant={category === c ? "default" : "outline"} size="sm" onClick={() => setCategory(c)} className="capitalize">{c}</Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (posts as any[]).length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No posts yet. Be the first to start a conversation!</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {(posts as any[]).map((post: any) => (
              <Card key={post.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedPost(post)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      {post.isPinned && <Badge className="text-xs">Pinned</Badge>}
                    </div>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <button className="flex items-center gap-1 hover:text-primary" onClick={e => { e.stopPropagation(); upvoteMutation.mutate(post.id); }}>
                        <ThumbsUp className="h-3 w-3" /> {post.upvotes}
                      </button>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.replyCount}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
