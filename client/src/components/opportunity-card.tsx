import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Bookmark, BookmarkPlus } from "lucide-react";
import { Opportunity, InsertOpportunity, isHighTier } from "@shared/schema";
import { OpportunityFormDialog } from "./opportunity-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OpportunityCardProps {
  opportunity: Opportunity & { relevanceScore?: number };
  onPursue: () => void;
  isPursuing: boolean;
  isAdmin?: boolean;
  showUnpursueButton?: boolean;
  isRecommended?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

export default function OpportunityCard({
  opportunity,
  onPursue,
  isPursuing,
  isAdmin,
  showUnpursueButton,
  isRecommended,
  isBookmarked = false,
  onBookmarkToggle
}: OpportunityCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const { user } = useAuth();

  const MATCH_THRESHOLD = 0.4;

  const handleUpdate = async (data: InsertOpportunity) => {
    try {
      setIsUpdating(true);
      await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, data);
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/opportunities/${opportunity.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    // Check bookmark limits for non-premium users
    if (!isBookmarked && !isHighTier(user.subscriptionTier)) {
      const { data: bookmarks } = await queryClient.fetchQuery({
        queryKey: ['/api/bookmarks'],
        queryFn: async () => {
          const response = await fetch('/api/bookmarks');
          if (!response.ok) throw new Error('Failed to fetch bookmarks');
          return response.json();
        }
      });

      if (bookmarks.length >= 5) {
        toast({
          title: "Bookmark Limit Reached",
          description: "Upgrade to Premium for unlimited bookmarks",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsBookmarking(true);
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${opportunity.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", {
          opportunity_id: opportunity.id
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      onBookmarkToggle?.();

      toast({
        title: "Success",
        description: isBookmarked ? "Bookmark removed" : "Opportunity bookmarked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const cardClasses = opportunity.status === "pursued"
    ? "bg-amber-50 border-amber-200"
    : isRecommended
      ? "bg-emerald-50 border-emerald-200"
      : opportunity.relevanceScore && opportunity.relevanceScore > MATCH_THRESHOLD
        ? "bg-emerald-50 border-emerald-200"
        : "";

  return (
    <Card className={`flex flex-col h-full ${cardClasses}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <CardTitle className="text-lg">{opportunity.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={opportunity.status === "available" ? "default" : "secondary"}>
              {opportunity.status}
            </Badge>
            {isRecommended && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                AI Recommended
              </Badge>
            )}
            {/* Data Source Badge */}
            {opportunity.source && (
              <Badge 
                variant="outline" 
                className={
                  opportunity.source === 'live_api' 
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : opportunity.source === 'government'
                      ? "bg-green-100 text-green-700 border-green-200"
                      : opportunity.source === 'client'
                        ? "bg-orange-100 text-orange-700 border-orange-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                }
              >
                {opportunity.source === 'live_api' && '🔴 Live API'}
                {opportunity.source === 'government' && '🏛️ Government'}
                {opportunity.source === 'client' && '👤 Client Submitted'}
                {opportunity.source === 'platform' && '🏢 Platform'}
                {!['live_api', 'government', 'client', 'platform'].includes(opportunity.source) && opportunity.source}
              </Badge>
            )}
            {!isAdmin && opportunity.relevanceScore && opportunity.relevanceScore > MATCH_THRESHOLD && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                {opportunity.relevanceScore > 0.6 ? "Strong" : "Good"} skill match
              </Badge>
            )}
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBookmark}
                      disabled={isBookmarking}
                      className="inline-flex hover:bg-primary/10 transition-colors"
                    >
                      {isBookmarking ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isBookmarked ? (
                        <Bookmark className="h-5 w-5 text-primary fill-primary" />
                      ) : (
                        <BookmarkPlus className="h-5 w-5 hover:text-primary transition-colors" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? "Remove bookmark" : "Add to bookmarks"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isAdmin && (
              <>
                <OpportunityFormDialog
                  opportunity={opportunity}
                  onSubmit={handleUpdate}
                  isSubmitting={isUpdating}
                />
                <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground mb-4">
          {opportunity.description}
        </p>
        
        {/* Source and Company Information */}
        <div className="mb-3 text-sm text-muted-foreground space-y-1">
          {opportunity.company && opportunity.company !== 'test' && (
            <p><strong>Company:</strong> {opportunity.company}</p>
          )}
          {opportunity.location && (
            <p><strong>Location:</strong> {opportunity.location}</p>
          )}
          {opportunity.url && opportunity.url !== 'https://www.google.com/' && (
            <p><strong>Source:</strong> <a href={opportunity.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Details</a></p>
          )}
          {opportunity.source === 'client' && (
            <p className="text-orange-600"><strong>Note:</strong> This is user-submitted content - please verify independently</p>
          )}
        </div>

        {opportunity.earnings && (
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">${opportunity.earnings.toLocaleString()}</p>
        )}
        {!isAdmin && opportunity.relevanceScore && opportunity.relevanceScore > MATCH_THRESHOLD && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Match strength: {Math.round(opportunity.relevanceScore * 100)}%</p>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-emerald-500 rounded-full h-2"
                style={{ width: `${Math.min(100, Math.round(opportunity.relevanceScore * 100))}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        {showUnpursueButton ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={onPursue}
            disabled={isPursuing}
          >
            {isPursuing ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Remove from Pursued"
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={onPursue}
            disabled={opportunity.status !== "available" || isPursuing}
          >
            {isPursuing ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Pursue Opportunity"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}