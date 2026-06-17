import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Bookmark as BookmarkIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { EmptyState } from "@/components/empty-state";

export function BookmarkList() {
  const { toast } = useToast();
  
  const { data: bookmarks, isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks"],
  });

  const deleteBookmark = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Success",
        description: "Bookmark deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!bookmarks?.length) {
    return (
      <EmptyState
        icon={BookmarkIcon}
        title="No bookmarks yet"
        description="Save opportunities, companies, and funding programs you want to revisit. Use the Add Bookmark button above to get started."
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{bookmark.name}</h3>
              {bookmark.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {bookmark.description}
                </p>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                Type: {bookmark.type}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteBookmark.mutate(bookmark.id)}
              disabled={deleteBookmark.isPending}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete bookmark</span>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
