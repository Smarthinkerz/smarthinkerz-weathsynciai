import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, company, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  return (
    <Route path={path}>
      {(params) => {
        // Only redirect once we know we're not logged in
        if (!isLoading && !user && !company) {
          // Use window.location for a hard redirect instead of React router
          // to break the potential infinite loop
          window.location.href = "/auth";
          return (
            <div className="flex items-center justify-center min-h-screen">
              <p>Redirecting to login...</p>
            </div>
          );
        }

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // We have a user or company, render the component
        return <Component />;
      }}
    </Route>
  );
}
