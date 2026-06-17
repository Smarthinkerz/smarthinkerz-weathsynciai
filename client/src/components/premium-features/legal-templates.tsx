import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Lock } from "lucide-react";

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  fields: string[];
}

export function LegalTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPremium = isHighTier(user?.subscriptionTier);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/legal-templates'],
    queryFn: async () => {
      const response = await fetch('/api/legal-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    enabled: isPremium
  });

  const handleDownload = async (template: Template) => {
    try {
      setDownloadingId(template.id);
      console.log("Downloading template:", template.id);

      const response = await fetch(`/api/legal-templates/${template.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to download template: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download template",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Premium Legal Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Upgrade to Premium to access advanced legal templates for your business.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      {templates?.map((template: Template) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{template.description}</p>
            <div className="text-sm text-muted-foreground mb-4">
              Required fields: {template.fields.join(', ')}
            </div>
            <Button
              onClick={() => handleDownload(template)}
              className="w-full"
              disabled={downloadingId === template.id}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloadingId === template.id ? 'Downloading...' : 'Download Template'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}