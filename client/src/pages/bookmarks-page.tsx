import { BookmarkList } from "@/components/bookmark-list";
import { AddBookmarkForm } from "@/components/add-bookmark-form";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { isHighTier } from "@shared/schema";

export default function BookmarksPage() {
  const { user } = useAuth();
  const isPremium = isHighTier(user?.subscriptionTier);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Bookmarks</h1>
        <div className="flex items-center gap-4">
          <AddBookmarkForm />
          {isPremium ? (
            <Badge variant="secondary">Elite - Unlimited Bookmarks</Badge>
          ) : (
            <Badge variant="outline">Limited to 5 Bookmarks</Badge>
          )}
        </div>
      </div>
      <BookmarkList />
    </div>
  );
}
