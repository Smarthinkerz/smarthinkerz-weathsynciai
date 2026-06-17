import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, FileUp, X, Eye, MoreVertical, Edit, Trash2 } from "lucide-react";
import { insertCertificateSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function CertificateForm() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<any>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(insertCertificateSchema),
    defaultValues: {
      name: "",
      issuingAuthority: "",
      issueDate: "",
      expiryDate: "",
      verificationId: "",
    },
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ["/api/certificates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/certificates");
      return res.json();
    },
  });

  const addCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('addCertificateMutation called with data:', data);
      
      if (certificateFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined && data[key] !== "") {
            console.log(`Adding field ${key}: ${data[key]}`);
            formData.append(key, data[key]);
          }
        });
        formData.append('certificateFile', certificateFile);
        
        console.log('Making API request to /api/certificates with file');
        const res = await apiRequest('POST', '/api/certificates', formData, { formData: true });
        console.log('API response status:', res.status);
        const result = await res.json();
        console.log('API response data:', result);
        return result;
      } else {
        // Use JSON for data without files
        console.log('Making API request to /api/certificates without file');
        const res = await apiRequest('POST', '/api/certificates', data);
        console.log('API response status:', res.status);
        const result = await res.json();
        console.log('API response data:', result);
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setShowForm(false);
      setEditingCertificate(null);
      form.reset();
      setCertificateFile(null);
      setPreviewUrl(null);
      toast({
        title: "Certificate Added",
        description: "Your certificate has been submitted for verification.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      if (certificateFile) {
        formData.append('certificateFile', certificateFile);
      }

      const res = await apiRequest('PUT', `/api/certificates/${editingCertificate.id}`, formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setShowForm(false);
      setEditingCertificate(null);
      form.reset();
      setCertificateFile(null);
      setPreviewUrl(null);
      toast({
        title: "Certificate Updated",
        description: "Your certificate has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/certificates/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificate Deleted",
        description: "Certificate has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file (JPEG, PNG)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }

      setCertificateFile(file);

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const onSubmit = (data: any) => {
    console.log('Form submitted with data:', data);
    console.log('Certificate file:', certificateFile);
    console.log('Editing certificate:', editingCertificate);
    
    if (editingCertificate) {
      console.log('Calling update mutation');
      updateCertificateMutation.mutate(data);
    } else {
      console.log('Calling add mutation');
      addCertificateMutation.mutate(data);
    }
  };

  const handleEdit = (certificate: any) => {
    setEditingCertificate(certificate);
    form.reset({
      name: certificate.name,
      issuingAuthority: certificate.issuingAuthority,
      issueDate: format(new Date(certificate.issueDate), 'yyyy-MM-dd'),
      expiryDate: certificate.expiryDate ? format(new Date(certificate.expiryDate), 'yyyy-MM-dd') : '',
      verificationId: certificate.verificationId || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this certificate?')) {
      deleteCertificateMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCertificate(null);
    form.reset();
    setCertificateFile(null);
    setPreviewUrl(null);
  };

  if (certificatesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Professional Certificates</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      {certificates?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No certificates added yet. Add your professional certifications for verification.
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {certificates?.map((certificate: any) => (
            <div
              key={certificate.id}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{certificate.name}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    certificate.verificationStatus === "verified"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {certificate.verificationStatus}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(certificate)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(certificate.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {certificate.issuingAuthority}
              </p>
              <p className="text-sm">
                Issued: {format(new Date(certificate.issueDate), "MMM yyyy")}
                {certificate.expiryDate && (
                  <> · Expires: {format(new Date(certificate.expiryDate), "MMM yyyy")}</>
                )}
              </p>
              {certificate.certificateFile && (
                <a
                  href={certificate.certificateFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Certificate
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showForm} onOpenChange={setShowForm}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingCertificate ? "Edit Certificate" : "Add Certificate"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingCertificate 
                ? "Update your professional certificate information." 
                : "Add your professional certificates and credentials for verification."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  console.log('Form validation errors:', errors);
                })}
                className="space-y-4"
              >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter certificate name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuingAuthority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Authority</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter issuing organization" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Upload Certificate</FormLabel>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="w-full cursor-pointer">
                      <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload PDF or image (max 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {certificateFile && (
                    <div className="mt-4 p-2 bg-secondary/10 rounded flex items-center justify-between">
                      <span className="text-sm truncate">{certificateFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCertificateFile(null);
                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                            setPreviewUrl(null);
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {previewUrl && (
                    <div className="mt-4">
                      <img
                        src={previewUrl}
                        alt="Certificate preview"
                        className="max-h-40 mx-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="verificationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification ID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Enter certificate verification ID"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editingCertificate ? updateCertificateMutation.isPending : addCertificateMutation.isPending}
                >
                  {(editingCertificate ? updateCertificateMutation.isPending : addCertificateMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    editingCertificate ? "Update Certificate" : "Add Certificate"
                  )}
                </Button>
              </div>

              </form>
            </Form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}