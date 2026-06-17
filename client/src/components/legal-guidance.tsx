import { isHighTier } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, AlertCircle, Lock } from 'lucide-react';
import { LegalDisclaimer } from "@/components/integrity/disclaimers";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LegalGuidanceProps {
  country: string | null;
}

interface Template {
  id: number;
  name: string;
  type: string;
  fields: string[];
}

export const LegalGuidance = ({ country }: LegalGuidanceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPremium = isHighTier(user?.subscriptionTier);

const handleTemplateDownload = async (template: Template) => {
  try {
    // Open in new window/tab to trigger download
    window.open(`/api/legal-templates/${template.id}`, '_blank');

    toast({
      title: "Success",
      description: "Template download started",
    });
  } catch (error) {
    console.error("Template download error:", error);
    toast({
      title: "Error",
      description: "Failed to download template. Please try again.",
      variant: "destructive",
    });
  }
};

  const { data: legalData, isLoading, error } = useQuery({
    queryKey: ['/api/legal-guidance', country],
    queryFn: async () => {
      const response = await fetch(`/api/legal-guidance/${encodeURIComponent(country!)}`);
      if (!response.ok) throw new Error('Failed to fetch legal guidance');
      return response.json();
    },
    enabled: !!country
  });

  if (!country) return null;
  if (isLoading) return <div className="text-center">Loading legal guidance...</div>;
  if (error) return <div className="text-center text-destructive">Error loading legal guidance</div>;
  if (!legalData) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Legal Guidance and Compliance - {country}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LegalDisclaimer className="mb-4" />
        <ScrollArea className="h-[400px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="requirements">
              <AccordionTrigger>General Requirements</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {legalData.general_requirements?.map((req: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="templates" className={!isPremium ? "opacity-75" : ""}>
              <AccordionTrigger className="flex justify-between">
                Document Templates
                {!isPremium && <Lock className="h-4 w-4 ml-2" />}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {isPremium ? (
                    [
                      {
                        id: 1,
                        name: "Investment Agreement Template",
                        type: "Legal",
                        fields: ["Investor Name", "Company Name", "Investment Amount", "Equity Percentage"]
                      },
                      {
                        id: 2,
                        name: "Partnership Agreement",
                        type: "Legal",
                        fields: ["Partner Names", "Profit Share", "Responsibilities", "Term Length"]
                      },
                      {
                        id: 3,
                        name: "Service Level Agreement",
                        type: "Business",
                        fields: ["Service Provider", "Client", "Service Levels", "Response Times"]
                      }
                    ].map((template: Template) => (
                      <div key={template.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge>{template.type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Required fields: {template.fields.join(', ')}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleTemplateDownload(template)}
                        >
                          Download Template
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4">
                      <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Upgrade to Premium to access advanced legal templates
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="updates">
              <AccordionTrigger>Regulatory Updates</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {legalData.regulatory_updates?.recent_changes?.map((update: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                      <div>
                        <div className="font-medium">{update.category}</div>
                        <div className="text-sm text-muted-foreground">{update.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(update.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LegalGuidance;