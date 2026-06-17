import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  MapPin,
  Building2,
  FileText,
  Calendar
} from "lucide-react";

interface PursueOpportunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityData: {
    type: "funding_opportunity" | "regular_opportunity" | "country_funding_exploration" | "no_country_funding_exploration" | "live_country_funding_exploration";
    message: string;
    opportunity: any;
    countryContext?: {
      selectedCountry: string;
      totalOpportunities: number;
      availableFunding: number;
      allPrograms?: Array<{
        name: string;
        amount: number;
        provider: string;
        type: string;
        isLiveData?: boolean;
        apiSource?: string;
      }>;
    };
    dataSource?: {
      type: 'live_api' | 'database_fallback' | 'no_data';
      provider: string;
      timestamp: string;
      isRealTime: boolean;
    };
    nextSteps?: {
      title: string;
      steps: Array<{
        step: number;
        title: string;
        description: string;
        url?: string;
        action: string;
      }>;
      additionalInfo: any;
    };
  } | null;
}

export function PursueOpportunityDialog({ 
  isOpen, 
  onClose, 
  opportunityData 
}: PursueOpportunityDialogProps) {
  if (!opportunityData) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case "external_link": return <ExternalLink className="h-4 w-4" />;
      case "required": return <CheckCircle className="h-4 w-4" />;
      case "time_sensitive": return <Clock className="h-4 w-4" />;
      case "user_preparation": return <FileText className="h-4 w-4" />;
      case "research": return <Users className="h-4 w-4" />;
      case "networking": return <Users className="h-4 w-4" />;
      case "user_tracking": return <Calendar className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "external_link": return "default";
      case "required": return "destructive";
      case "time_sensitive": return "destructive";
      case "user_preparation": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {opportunityData.type === "live_country_funding_exploration" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  📡 LIVE Funding Programs - {opportunityData.countryContext?.selectedCountry}
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Real-time API
                  </Badge>
                </div>
              </>
            )}
            {opportunityData.type === "country_funding_exploration" && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                🏛️ Authentic Funding Programs - {opportunityData.countryContext?.selectedCountry}
              </>
            )}
            {opportunityData.type === "no_country_funding_exploration" && (
              <>
                <MapPin className="h-5 w-5 text-orange-600" />
                Research Guide - {opportunityData.countryContext?.selectedCountry}
              </>
            )}
            {(opportunityData.type === "funding_opportunity" || opportunityData.type === "regular_opportunity") && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                {opportunityData.type === "funding_opportunity" ? "Funding Application Guide" : "Opportunity Pursued"}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {opportunityData.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Source Indicator for Live API */}
          {opportunityData.dataSource && (
            <div className={`p-3 rounded-lg border-l-4 ${
              opportunityData.dataSource.type === 'live_api' 
                ? 'bg-green-50 border-green-500' 
                : opportunityData.dataSource.type === 'database_fallback'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-orange-50 border-orange-500'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                {opportunityData.dataSource.type === 'live_api' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-800">Live API Data</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                      {opportunityData.dataSource.provider}
                    </Badge>
                  </>
                )}
                {opportunityData.dataSource.type === 'database_fallback' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Verified Database</span>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                      {opportunityData.dataSource.provider}
                    </Badge>
                  </>
                )}
                {opportunityData.dataSource.type === 'no_data' && (
                  <>
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-800">No Verified Data</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Updated: {new Date(opportunityData.dataSource.timestamp).toLocaleString()}
                {opportunityData.dataSource.isRealTime && (
                  <span className="ml-2 text-green-600 font-medium">• Real-time</span>
                )}
              </div>
            </div>
          )}
          {/* Country Context for Funding Exploration */}
          {opportunityData.countryContext && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                {opportunityData.countryContext.selectedCountry} Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Programs:</span>
                  <span>{opportunityData.countryContext.totalOpportunities}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Funding:</span>
                  <span>${opportunityData.countryContext.availableFunding.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Status:</span>
                  <span>Authentic Only</span>
                </div>
              </div>
              {opportunityData.countryContext.allPrograms && opportunityData.countryContext.allPrograms.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-blue-700 mb-2">Available Programs:</p>
                  <div className="space-y-1">
                    {opportunityData.countryContext.allPrograms.map((program, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{program.name}</span> - 
                            <span className="text-green-600"> ${program.amount?.toLocaleString ? program.amount.toLocaleString() : program.amount}</span> - 
                            <span className="text-gray-600">{program.provider}</span>
                          </div>
                          {program.isLiveData && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              LIVE
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opportunity Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{opportunityData.opportunity.name}</h3>
            {opportunityData.opportunity.description && (
              <p className="text-sm text-muted-foreground mb-3">{opportunityData.opportunity.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {opportunityData.nextSteps?.additionalInfo?.amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Amount:</span>
                  <span>{opportunityData.nextSteps.additionalInfo.amount}</span>
                </div>
              )}
              {opportunityData.nextSteps?.additionalInfo?.provider && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Provider:</span>
                  <span className="text-xs">{opportunityData.nextSteps.additionalInfo.provider}</span>
                </div>
              )}
              {opportunityData.nextSteps.additionalInfo.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Company:</span>
                  <span>{opportunityData.nextSteps.additionalInfo.company}</span>
                </div>
              )}
              {opportunityData.nextSteps.additionalInfo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Location:</span>
                  <span>{opportunityData.nextSteps.additionalInfo.location}</span>
                </div>
              )}
              {opportunityData.nextSteps.additionalInfo.type && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Type:</span>
                  <span>{opportunityData.nextSteps.additionalInfo.type}</span>
                </div>
              )}
              {opportunityData.nextSteps.additionalInfo.sector && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">Sector:</span>
                  <span>{opportunityData.nextSteps.additionalInfo.sector}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Next Steps */}
          {opportunityData.nextSteps && (
            <div>
              <h3 className="font-semibold text-lg mb-4">{opportunityData.nextSteps.title}</h3>
              <div className="space-y-4">
                {opportunityData.nextSteps.steps.map((step) => (
                  <div key={step.step} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{step.title}</h4>
                      <Badge variant={getActionBadgeVariant(step.action)} className="text-xs">
                        <div className="flex items-center gap-1">
                          {getActionIcon(step.action)}
                          {step.action.replace("_", " ")}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        asChild
                      >
                        <a href={step.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {step.action === "external_link" ? "Open Application" : "Visit Link"}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Got It
            </Button>
            {/* Country Funding Exploration Application Button */}
            {(opportunityData.type === "country_funding_exploration" && opportunityData.opportunity.applicationUrl) && (
              <Button asChild>
                <a 
                  href={opportunityData.opportunity.applicationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply Now - {opportunityData.countryContext?.selectedCountry}
                </a>
              </Button>
            )}
            {/* Regular Funding Opportunity Application Button */}
            {(opportunityData.type === "funding_opportunity" && opportunityData.opportunity.applicationUrl) && (
              <Button asChild>
                <a 
                  href={opportunityData.opportunity.applicationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Start Application
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}