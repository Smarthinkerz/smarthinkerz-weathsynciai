import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Inbox, Clock, CheckCircle2, MessageSquare, Mail, Phone, User, Calendar, DollarSign, FileText } from "lucide-react";

interface ClientRequest {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceType?: string;
  subject: string;
  description: string;
  budget?: string;
  timeline?: string;
  status: string;
  companyResponse?: string;
  respondedAt?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  responded: "bg-blue-100 text-blue-800 border-blue-300",
  accepted: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function ClientRequestsPage() {
  const { company } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("responded");

  if (!company) {
    setLocation("/company/auth");
    return null;
  }

  const { data: requests = [], isLoading } = useQuery<ClientRequest[]>({
    queryKey: ["/api/company/client-requests/"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response, status }: { id: number; response: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/company/client-requests/${id}/respond`, { response, status });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Response Sent", description: "Your response has been sent to the client." });
      queryClient.invalidateQueries({ queryKey: ["/api/company/client-requests/"] });
      setSelectedRequest(null);
      setResponseText("");
      setResponseStatus("responded");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Respond", description: error.message || "Something went wrong.", variant: "destructive" });
    },
  });

  const handleSubmitResponse = () => {
    if (!selectedRequest || !responseText.trim()) {
      toast({ title: "Response Required", description: "Please enter a response before submitting.", variant: "destructive" });
      return;
    }
    respondMutation.mutate({ id: selectedRequest.id, response: responseText, status: responseStatus });
  };

  const pending = requests.filter((r) => r.status === "pending");
  const responded = requests.filter((r) => r.status === "responded" || r.status === "accepted");
  const completed = requests.filter((r) => r.status === "completed");

  const filteredRequests =
    activeTab === "pending" ? pending :
    activeTab === "responded" ? responded :
    activeTab === "completed" ? completed :
    requests;

  const openRequest = (req: ClientRequest) => {
    setSelectedRequest(req);
    setResponseText(req.companyResponse || "");
    setResponseStatus(req.status === "pending" ? "responded" : req.status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/company/dashboard")} className="text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Requests & Bookings</h1>
            <p className="text-gray-600">Manage incoming client inquiries and service requests</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><Inbox className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "—" : requests.length}</p>
                <p className="text-sm text-gray-500">Total Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "—" : pending.length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><MessageSquare className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "—" : responded.length}</p>
                <p className="text-sm text-gray-500">Responded</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "—" : completed.length}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="responded">Responded ({responded.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No requests found</p>
                  <p className="text-sm text-gray-500">Client requests will appear here when received</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <Card
                    key={req.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openRequest(req)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{req.clientName}</span>
                            <Badge className={statusColors[req.status] || "bg-gray-100 text-gray-800"}>
                              {req.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.clientEmail}</span>
                            {req.serviceType && <Badge variant="outline" className="text-xs">{req.serviceType}</Badge>}
                          </div>
                          <p className="font-medium text-gray-800">{req.subject}</p>
                          <p className="text-sm text-gray-500 truncate">{req.description}</p>
                        </div>
                        <div className="text-right text-sm text-gray-400 ml-4 shrink-0">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedRequest.subject}
                  </DialogTitle>
                  <DialogDescription>
                    Request from {selectedRequest.clientName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Client Name</p>
                      <p className="flex items-center gap-1"><User className="h-4 w-4 text-gray-400" />{selectedRequest.clientName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="flex items-center gap-1"><Mail className="h-4 w-4 text-gray-400" />{selectedRequest.clientEmail}</p>
                    </div>
                    {selectedRequest.clientPhone && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="flex items-center gap-1"><Phone className="h-4 w-4 text-gray-400" />{selectedRequest.clientPhone}</p>
                      </div>
                    )}
                    {selectedRequest.serviceType && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Service Type</p>
                        <Badge variant="outline">{selectedRequest.serviceType}</Badge>
                      </div>
                    )}
                    {selectedRequest.budget && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Budget</p>
                        <p className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-gray-400" />{selectedRequest.budget}</p>
                      </div>
                    )}
                    {selectedRequest.timeline && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Timeline</p>
                        <p className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gray-400" />{selectedRequest.timeline}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={statusColors[selectedRequest.status] || "bg-gray-100 text-gray-800"}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Submitted</p>
                      <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.companyResponse && selectedRequest.respondedAt && (
                    <div className="space-y-1 border-t pt-4">
                      <p className="text-sm font-medium text-gray-500">Previous Response ({new Date(selectedRequest.respondedAt).toLocaleString()})</p>
                      <p className="text-gray-800 whitespace-pre-wrap bg-blue-50 rounded-lg p-3">{selectedRequest.companyResponse}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Respond to Request</h3>
                    <Textarea
                      placeholder="Type your response to the client..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                    />
                    <div className="flex items-center gap-3">
                      <Select value={responseStatus} onValueChange={setResponseStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="responded">Responded</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleSubmitResponse}
                        disabled={respondMutation.isPending || !responseText.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {respondMutation.isPending ? "Sending..." : "Send Response"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}