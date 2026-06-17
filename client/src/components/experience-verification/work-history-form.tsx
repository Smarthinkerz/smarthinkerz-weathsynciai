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
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Upload, Link, X, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { insertWorkHistorySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export function WorkHistoryForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState<"file" | "url">("url");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(insertWorkHistorySchema),
    defaultValues: {
      companyName: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      currentlyWorking: false,
      verificationProof: "",
    },
  });

  const { data: workHistory, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ["/api/work-history"],
    queryFn: async () => {
      console.log("Fetching work history...");
      try {
        const res = await apiRequest("GET", "/api/work-history");
        if (!res.ok) {
          console.error("Work history fetch failed:", res.status, res.statusText);
          throw new Error(`Failed to fetch work history: ${res.status}`);
        }
        const data = await res.json();
        console.log("Work history fetched:", data);
        return data;
      } catch (error) {
        console.error("Work history query error:", error);
        throw error;
      }
    },
    retry: 1,
  });

  const addWorkHistoryMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting work history form data:", data);
      
      try {
        // First create the work history record
        const res = await apiRequest("POST", "/api/work-history", data);
        console.log("Work history POST response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Work history POST failed:", errorText);
          throw new Error(`Failed to create work history: ${res.status}`);
        }
        
        const workHistory = await res.json();
        console.log("Work history created:", workHistory);

        // If a file is selected, upload it as verification proof
        if (selectedFile && workHistory.id) {
          console.log("Uploading verification file:", selectedFile.name);
          const formData = new FormData();
          formData.append('proofFile', selectedFile);
          formData.append('workExperienceId', workHistory.id.toString());
          
          const uploadRes = await fetch("/api/work-experience/upload-proof", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            console.error("File upload failed:", errorData);
            throw new Error(errorData.error || 'Failed to upload verification proof');
          }
          
          const uploadResult = await uploadRes.json();
          console.log("File upload result:", uploadResult);
          return uploadResult.workExperience;
        }

        return workHistory;
      } catch (error) {
        console.error("Work history mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-history"] });
      setShowForm(false);
      setSelectedFile(null);
      setProofType("url");
      form.reset();
      toast({
        title: "Work History Added",
        description: "Your work experience has been submitted for verification.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Work History",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete work history mutation
  const deleteWorkHistoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/work-history/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete work history");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-history"] });
      setShowDeleteDialog(false);
      setEntryToDelete(null);
      toast({
        title: "Work History Deleted",
        description: "Your work experience has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Work History",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit work history mutation
  const editWorkHistoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log("Edit mutation called with:", { id, data });
      console.log("Making PUT request to:", `/api/work-history/${id}`);
      const res = await apiRequest("PUT", `/api/work-history/${id}`, data);
      console.log("PUT response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("PUT request failed:", errorText);
        throw new Error(`Failed to update work history: ${errorText}`);
      }
      const result = await res.json();
      console.log("PUT response data:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Edit mutation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/work-history"] });
      setEditingEntry(null);
      setShowForm(false);
      form.reset();
      toast({
        title: "Work History Updated",
        description: "Your work experience has been updated.",
      });
    },
    onError: (error: Error) => {
      console.error("Edit mutation error:", error);
      toast({
        title: "Failed to Update Work History",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions for edit and delete
  const handleEdit = (entry: any) => {
    console.log("🔧 handleEdit called with entry:", entry);
    setEditingEntry(entry);
    console.log("📝 editingEntry set to:", entry);
    
    const formData = {
      companyName: entry.companyName,
      position: entry.position,
      startDate: entry.startDate ? new Date(entry.startDate).toISOString().split('T')[0] : "",
      endDate: entry.endDate ? new Date(entry.endDate).toISOString().split('T')[0] : "",
      description: entry.description,
      currentlyWorking: entry.currentlyWorking,
      verificationProof: entry.verificationProof || "",
    };
    
    console.log("📋 Form data being set:", formData);
    form.reset(formData);
    setShowForm(true);
    console.log("✅ Edit form opened");
  };

  const handleDelete = (entry: any) => {
    setEntryToDelete(entry);
    setShowDeleteDialog(true);
  };

  const handleFormSubmit = (data: any) => {
    console.log("handleFormSubmit called with data:", data);
    console.log("Current editingEntry:", editingEntry);
    
    const transformedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      endDate: data.endDate && !data.currentlyWorking ? new Date(data.endDate).toISOString() : null,
      userId: user?.id, // Include userId for backend validation
      verificationProof: data.verificationProof || null, // Handle empty verification proof
    };
    
    console.log("Transformed data:", transformedData);

    if (editingEntry) {
      console.log("Calling editWorkHistoryMutation with ID:", editingEntry.id);
      editWorkHistoryMutation.mutate({ id: editingEntry.id, data: transformedData });
    } else {
      console.log("Calling addWorkHistoryMutation");
      addWorkHistoryMutation.mutate(transformedData);
    }
  };

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (historyError) {
    console.error("Work history error:", historyError);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Work Experience</h3>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800 text-sm">
            Unable to load work history. Please try refreshing the page.
          </p>
          <p className="text-red-600 text-xs mt-1">
            Error: {historyError instanceof Error ? historyError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {workHistory?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No work history added yet. Add your professional experience to get verified.
        </p>
      ) : (
        <div className="space-y-4">
          {workHistory?.map((history: any) => (
            <div
              key={history.id}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{history.position}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    history.verificationStatus === "verified"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {history.verificationStatus}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        console.log("🔄 Edit button clicked for history:", history);
                        handleEdit(history);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(history)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{history.companyName}</p>
              <p className="text-sm">
                {format(new Date(history.startDate), "MMM yyyy")} -{" "}
                {history.currentlyWorking
                  ? "Present"
                  : format(new Date(history.endDate), "MMM yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">{history.description}</p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showForm} onOpenChange={setShowForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingEntry ? "Edit Work Experience" : "Add Work Experience"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingEntry 
                ? "Update your professional experience details." 
                : "Add your professional experience. We'll verify this information through our verification process."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your position" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          disabled={form.watch("currentlyWorking")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currentlyWorking"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">I currently work here</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your responsibilities and achievements"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Verification Proof (Optional)</FormLabel>
                <Tabs value={proofType} onValueChange={(value) => setProofType(value as "file" | "url")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      URL Link
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="mt-4">
                    <FormField
                      control={form.control}
                      name="verificationProof"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="Link to offer letter, certificate, or other proof"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="file" className="mt-4">
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        {selectedFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{selectedFile.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload offer letter, certificate, or other proof
                            </p>
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedFile(file);
                                  // Clear URL field when file is selected
                                  form.setValue("verificationProof", "");
                                }
                              }}
                              className="max-w-xs mx-auto"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, DOC, DOCX, JPG, PNG (max 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setEditingEntry(null);
                  form.reset();
                }}>Cancel</AlertDialogCancel>
                <Button
                  type="submit"
                  disabled={addWorkHistoryMutation.isPending || editWorkHistoryMutation.isPending}
                  onClick={(e) => {
                    console.log("🚀 Submit button clicked!");
                    console.log("Current editingEntry:", editingEntry);
                    console.log("Form values:", form.getValues());
                    
                    // Prevent default button behavior
                    e.preventDefault();
                    
                    // Check form validity first
                    const isValid = form.trigger();
                    console.log("Form validation result:", isValid);
                    
                    if (isValid) {
                      console.log("Form is valid, calling handleFormSubmit directly");
                      const formData = form.getValues();
                      handleFormSubmit(formData);
                    } else {
                      console.log("Form validation failed:", form.formState.errors);
                    }
                  }}
                >
                  {(addWorkHistoryMutation.isPending || editWorkHistoryMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    editingEntry ? "Update Experience" : "Add Experience"
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Experience</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work experience entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (entryToDelete) {
                  deleteWorkHistoryMutation.mutate(entryToDelete.id);
                }
              }}
              disabled={deleteWorkHistoryMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteWorkHistoryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
