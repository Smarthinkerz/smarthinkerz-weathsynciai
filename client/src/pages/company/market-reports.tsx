import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, BarChart3, TrendingUp, Globe2, AlertCircle, Download, Calendar, DollarSign, Users, Target, X, Eye, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";

// Comprehensive list of countries for market report targeting
const COUNTRIES = [
  "Global", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger",
  "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

interface MarketReport {
  id: number;
  companyId: number;
  title: string;
  industry?: string;
  regions: string[];
  timeframe: string;
  reportData: {
    marketSize: Record<string, { size: string; growth: string }>;
    investmentActivity: Record<string, { deals: number; amount: string }>;
    competitorDensity: Record<string, string>;
  };
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface CompanyLimits {
  total: number;
  limit: number | null;
  remaining: number | null;
  canAddMore: boolean;
}

export default function CompanyMarketReportsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MarketReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: "",
    regions: ["Global"],
    industry: "",
    timeframe: "12months"
  });
  const [customIndustry, setCustomIndustry] = useState("");
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Fetch company authentication status
  const { data: company } = useQuery({
    queryKey: ["/api/company"],
    retry: false
  });

  // Fetch market reports and limits
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["/api/company/market-reports"],
    enabled: !!company
  });

  const reports: MarketReport[] = reportsData?.reports || [];
  const limits: CompanyLimits = reportsData?.limits || { total: 0, limit: 1, remaining: 1, canAddMore: true };

  const generateReportMutation = useMutation({
    mutationFn: async (formData: typeof reportForm) => {
      const response = await apiRequest("POST", "/api/company/market-report", formData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Market Report Generated",
        description: "Your market analysis report has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/market-reports"] });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate market report",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest("DELETE", `/api/company/market-report/${reportId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "The market report has been deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/market-reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete market report",
        variant: "destructive"
      });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (reportIds: number[]) => {
      const response = await apiRequest("DELETE", "/api/company/market-reports/bulk", { reportIds });
      return await response.json();
    },
    onSuccess: (_, reportIds) => {
      toast({
        title: "Reports Deleted",
        description: `${reportIds.length} reports deleted successfully`
      });
      setSelectedReportIds([]);
      setIsSelectAllChecked(false);
      queryClient.invalidateQueries({ queryKey: ["/api/company/market-reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete selected reports",
        variant: "destructive"
      });
    }
  });

  const handleGenerateReport = () => {
    if (!reportForm.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your market report",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    generateReportMutation.mutate(reportForm);
  };

  const handleViewReport = (report: MarketReport) => {
    setSelectedReport(report);
    setShowReportDialog(true);
  };

  const handleDownloadReport = (report: MarketReport) => {
    const reportContent = `# ${report.title}

**Generated:** ${new Date(report.createdAt).toLocaleDateString()}
**Industry Focus:** ${report.industry || 'General Market Analysis'}
**Target Regions:** ${report.regions.join(', ')}
**Analysis Timeframe:** ${report.timeframe}

## Executive Summary
This market analysis provides comprehensive insights into the ${report.industry || 'selected'} industry across ${report.regions.join(', ')} for a ${report.timeframe} period.

## Market Size Analysis
${Object.entries(report.reportData.marketSize || {}).map(([region, data]) => `
### ${region} - ${report.industry || 'Market'} Sector
- **Current Market Size:** ${data.size}
- **Annual Growth Rate:** ${data.growth}
- **Industry Focus:** ${report.industry || 'General Market'}
`).join('')}

## Investment Activity & Capital Flow
${Object.entries(report.reportData.investmentActivity || {}).map(([region, data]) => `
### ${region}
- **Active Investment Deals:** ${data.deals}
- **Total Investment Volume:** ${data.amount}
- **Sector Focus:** ${report.industry || 'Multi-sector'}
`).join('')}

## Competitive Landscape
${Object.entries(report.reportData.competitorDensity || {}).map(([region, density]) => `
### ${region}
- **Competition Level:** ${density}
- **Industry Maturity:** ${report.industry || 'General'} sector analysis
`).join('')}

## Market Insights
- **Primary Industry:** ${report.industry || 'Cross-sector analysis'}
- **Geographic Coverage:** ${report.regions.length} region${report.regions.length > 1 ? 's' : ''}
- **Analysis Period:** ${report.timeframe} projection

---
Generated by WealthSync AI Market Analysis | Industry-Specific Insights
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your market report has been downloaded successfully.",
    });
  };

  const handleDeleteReport = (report: MarketReport) => {
    if (window.confirm(`Are you sure you want to delete "${report.title}"? This action cannot be undone.`)) {
      deleteReportMutation.mutate(report.id);
    }
  };

  const handleSelectReport = (reportId: number, checked: boolean) => {
    setSelectedReportIds(prev => {
      if (checked) {
        return [...prev, reportId];
      } else {
        return prev.filter(id => id !== reportId);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setIsSelectAllChecked(checked);
    if (checked) {
      const allReportIds = reports?.map(report => report.id) || [];
      setSelectedReportIds(allReportIds);
    } else {
      setSelectedReportIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedReportIds.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    if (selectedReportIds.length === 0) return;
    setShowBulkDeleteDialog(false);
    bulkDeleteMutation.mutate(selectedReportIds);
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Authentication Required</h3>
                  <p className="text-red-600">Please log in to access market reports.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isPremium = isHighTier(company.subscriptionTier) || company.isPremium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/company/dashboard')}
              className="text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Market Reports</h1>
              <p className="text-gray-600">Generate comprehensive market analysis reports</p>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">Report Generation Limits</h3>
                  <p className="text-sm text-blue-600">
                    {isPremium ? (
                      "Unlimited reports with Premium subscription"
                    ) : (
                      `${limits.remaining || 0} of ${limits.limit || 1} reports remaining this month`
                    )}
                  </p>
                </div>
              </div>
              {!isPremium && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Basic Plan
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Generate New Report */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Generate New Report
              </CardTitle>
              <CardDescription>
                Create a comprehensive market analysis report for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Q1 2025 Technology Market Analysis"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry Focus</Label>
                <Select onValueChange={(value) => {
                  if (value === "custom") {
                    setShowCustomIndustry(true);
                    setReportForm({ ...reportForm, industry: "" });
                  } else {
                    setShowCustomIndustry(false);
                    setCustomIndustry("");
                    setReportForm({ ...reportForm, industry: value });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="custom">Other (Custom Industry)</SelectItem>
                  </SelectContent>
                </Select>
                
                {showCustomIndustry && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter your industry (e.g., Aerospace, Agriculture, etc.)"
                      value={customIndustry}
                      onChange={(e) => {
                        setCustomIndustry(e.target.value);
                        setReportForm({ ...reportForm, industry: e.target.value });
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeframe">Analysis Timeframe</Label>
                <Select 
                  value={reportForm.timeframe}
                  onValueChange={(value) => setReportForm({ ...reportForm, timeframe: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="12months">12 Months</SelectItem>
                    <SelectItem value="24months">24 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Regions</Label>
                <Select 
                  onValueChange={(value) => {
                    if (!reportForm.regions.includes(value)) {
                      setReportForm({ 
                        ...reportForm, 
                        regions: value === "Global" ? ["Global"] : [...reportForm.regions.filter(r => r !== "Global"), value]
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add target country or region" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((country) => (
                      <SelectItem 
                        key={country} 
                        value={country}
                        disabled={reportForm.regions.includes(country)}
                      >
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {reportForm.regions.map((region, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {region}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => {
                          const newRegions = reportForm.regions.filter((_, i) => i !== index);
                          setReportForm({ 
                            ...reportForm, 
                            regions: newRegions.length === 0 ? ["Global"] : newRegions
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || !limits.canAddMore}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Market Report
                  </>
                )}
              </Button>

              {!limits.canAddMore && !isPremium && (
                <p className="text-sm text-red-600 text-center">
                  Monthly limit reached. Upgrade to Premium for unlimited reports.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-blue-600" />
                Recent Reports
              </CardTitle>
              <CardDescription>
                Your previously generated market analysis reports
              </CardDescription>
              {reports.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={isSelectAllChecked}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="select-all" className="text-sm text-gray-600">
                      Select All ({reports.length} reports)
                    </label>
                  </div>
                  {selectedReportIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected ({selectedReportIds.length})
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No reports generated yet</p>
                  <p className="text-sm text-gray-500">Generate your first market report to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedReportIds.includes(report.id)}
                              onChange={(e) => handleSelectReport(report.id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(report.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Globe2 className="h-3 w-3" />
                                {report.regions.join(", ")}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              {report.regions.map((region, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {region}
                                </Badge>
                              ))}
                            </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReport(report)}
                              title="View Report"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadReport(report)}
                              title="Download Report"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteReport(report)}
                              title="Delete Report"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Features */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included in Your Market Reports</CardTitle>
            <CardDescription>
              Comprehensive analysis powered by authentic economic data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Market Size Analysis</h4>
                <p className="text-sm text-gray-600">Total addressable market and growth projections</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Investment Activity</h4>
                <p className="text-sm text-gray-600">Funding rounds, deals, and investor interest</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Competitor Analysis</h4>
                <p className="text-sm text-gray-600">Market density and competitive landscape</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2">Strategic Insights</h4>
                <p className="text-sm text-gray-600">Actionable recommendations and opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Viewing Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedReport?.title}
              </DialogTitle>
              <DialogDescription>
                Generated on {selectedReport && new Date(selectedReport.createdAt).toLocaleDateString()} • 
                Industry-specific analysis for {selectedReport?.regions.join(', ')}
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-6">
                {/* Report Details */}
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Industry Focus</h4>
                    <p className="text-gray-900 font-medium">{selectedReport.industry || 'General Market Analysis'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Analysis Timeframe</h4>
                    <p className="text-gray-900">{selectedReport.timeframe}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Status</h4>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>

                {/* Market Size Analysis */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    {selectedReport.industry || 'Market'} Size Analysis
                  </h3>
                  <div className="grid gap-4">
                    {Object.entries(selectedReport.reportData.marketSize || {}).map(([region, data]) => (
                      <Card key={region} className="border-gray-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-gray-900">{region} - {selectedReport.industry || 'Market'} Sector</h4>
                          <div className="grid md:grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">Market Size: </span>
                              <span className="font-medium">{data.size}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Growth Rate: </span>
                              <span className="font-medium text-green-600">{data.growth}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Industry: </span>
                              <span className="font-medium text-blue-600">{selectedReport.industry || 'General'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Investment Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    {selectedReport.industry || 'Market'} Investment Activity
                  </h3>
                  <div className="grid gap-4">
                    {Object.entries(selectedReport.reportData.investmentActivity || {}).map(([region, data]) => (
                      <Card key={region} className="border-gray-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-gray-900">{region} - {selectedReport.industry || 'Market'} Investment</h4>
                          <div className="grid md:grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">Active Deals: </span>
                              <span className="font-medium">{data.deals}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Investment Volume: </span>
                              <span className="font-medium text-blue-600">{data.amount}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Sector Focus: </span>
                              <span className="font-medium text-green-600">{selectedReport.industry || 'Multi-sector'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Competitor Density */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Competitor Analysis
                  </h3>
                  <div className="grid gap-4">
                    {Object.entries(selectedReport.reportData.competitorDensity || {}).map(([region, density]) => (
                      <Card key={region} className="border-gray-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-gray-900">{region}</h4>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Competitive Level: </span>
                            <span className="font-medium">{density}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReportDialog(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      handleDownloadReport(selectedReport);
                      setShowReportDialog(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Selected Reports
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedReportIds.length} selected report{selectedReportIds.length > 1 ? 's' : ''}? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteDialog(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex items-center gap-2"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete {selectedReportIds.length} Report{selectedReportIds.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}