import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Plus, Trash2, User, Award, FileCheck, ArrowLeft, Clock } from "lucide-react";

interface Verification {
  id: number;
  employeeName: string;
  employeeRole: string;
  skills: string[];
  licenseType?: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  documentUrl?: string;
  expiryDate?: string;
  status: string;
  createdAt: string;
}

interface VerificationLimits {
  total: number;
  limit: number | null;
  remaining: number | null;
  canAddMore: boolean;
}

export default function EmployeeVerificationsPage() {
  const { company } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeRole: "",
    skills: "",
    licenseType: "",
    licenseNumber: "",
    issuingAuthority: "",
    documentUrl: "",
    expiryDate: "",
  });

  if (!company) {
    setLocation("/company/auth");
    return null;
  }

  const isPremium = isHighTier(company.subscriptionTier);

  const { data, isLoading } = useQuery<{ verifications: Verification[]; limits: VerificationLimits }>({
    queryKey: ["/api/company/employee-verifications/"],
    enabled: !!company,
  });

  const verifications = data?.verifications || [];
  const limits: VerificationLimits = data?.limits || { total: 0, limit: 2, remaining: 2, canAddMore: true };

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/company/employee-verifications/", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Verification Added", description: "Employee verification has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employee-verifications/"] });
      setShowAddDialog(false);
      setFormData({ employeeName: "", employeeRole: "", skills: "", licenseType: "", licenseNumber: "", issuingAuthority: "", documentUrl: "", expiryDate: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Add Verification", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/company/employee-verifications/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Verification Deleted", description: "Employee verification has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employee-verifications/"] });
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.employeeName.trim() || !formData.employeeRole.trim()) {
      toast({ title: "Required Fields", description: "Employee Name and Role are required.", variant: "destructive" });
      return;
    }
    const payload: Record<string, unknown> = {
      employeeName: formData.employeeName.trim(),
      employeeRole: formData.employeeRole.trim(),
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (formData.licenseType) payload.licenseType = formData.licenseType;
    if (formData.licenseNumber) payload.licenseNumber = formData.licenseNumber;
    if (formData.issuingAuthority) payload.issuingAuthority = formData.issuingAuthority;
    if (formData.documentUrl) payload.documentUrl = formData.documentUrl;
    if (formData.expiryDate) payload.expiryDate = formData.expiryDate;
    createMutation.mutate(payload);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  const formatLicenseType = (type?: string) => {
    if (!type) return null;
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const usedCount = limits.total;
  const maxCount = limits.limit ?? 0;
  const progressValue = isPremium ? 0 : maxCount > 0 ? (usedCount / maxCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/company/dashboard")} className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                Employee Skill & Service Verification
              </h1>
              <p className="text-gray-600">Manage employee skill verifications and license uploads</p>
            </div>
          </div>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">Verification Limits</h3>
                  <p className="text-sm text-blue-600">
                    {isPremium ? "Unlimited employee verifications with Premium subscription" : `${usedCount}/2 employee verifications used`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {isPremium ? "Premium Plan" : "Basic Plan"}
              </Badge>
            </div>
            {!isPremium && <Progress value={progressValue} className="h-2" />}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => setShowAddDialog(true)} disabled={!isPremium && !limits.canAddMore} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Verification
          </Button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No employee verifications yet</p>
              <p className="text-sm text-gray-500">Add your first employee verification to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {verifications.map((v) => (
              <Card key={v.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{v.employeeName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(v.status)}
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMutation.mutate(v.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{v.employeeRole}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {v.skills && v.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {v.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {v.licenseType && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileCheck className="h-4 w-4" />
                      <span>{formatLicenseType(v.licenseType)}</span>
                      {v.licenseNumber && <span className="text-gray-400">• #{v.licenseNumber}</span>}
                    </div>
                  )}
                  {v.issuingAuthority && (
                    <div className="text-sm text-gray-500">
                      <Award className="h-3 w-3 inline mr-1" />
                      {v.issuingAuthority}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                    <Clock className="h-3 w-3" />
                    <span>Added {new Date(v.createdAt).toLocaleDateString()}</span>
                    {v.expiryDate && <span>• Expires {new Date(v.expiryDate).toLocaleDateString()}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                Add Employee Verification
              </DialogTitle>
              <DialogDescription>Add a new employee skill verification or license record.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input id="employeeName" placeholder="e.g., John Smith" value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeRole">Employee Role *</Label>
                <Input id="employeeRole" placeholder="e.g., Senior Engineer" value={formData.employeeRole} onChange={(e) => setFormData({ ...formData, employeeRole: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input id="skills" placeholder="e.g., JavaScript, React, Node.js" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type</Label>
                <Select value={formData.licenseType} onValueChange={(value) => setFormData({ ...formData, licenseType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional_license">Professional License</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="degree">Degree</SelectItem>
                    <SelectItem value="trade_license">Trade License</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input id="licenseNumber" placeholder="e.g., LIC-12345" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                  <Input id="issuingAuthority" placeholder="e.g., IEEE" value={formData.issuingAuthority} onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentUrl">Document URL</Label>
                <Input id="documentUrl" placeholder="https://example.com/certificate.pdf" value={formData.documentUrl} onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending ? "Adding..." : "Add Verification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
