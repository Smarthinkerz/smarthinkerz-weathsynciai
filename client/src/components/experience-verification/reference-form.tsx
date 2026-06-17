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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { insertReferenceCheckSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function ReferenceForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(insertReferenceCheckSchema),
    defaultValues: {
      referentName: "",
      referentPosition: "",
      referentEmail: "",
      referentPhone: "",
      relationshipType: "manager",
    },
  });

  const { data: references, isLoading: referencesLoading } = useQuery({
    queryKey: ["/api/references"],
    queryFn: async () => {
      console.log("Fetching references...");
      console.log("Making GET request to /api/references");
      const res = await apiRequest("GET", "/api/references");
      const data = await res.json();
      console.log("References fetched:", data);
      return data;
    },
  });

  const addReferenceMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🚀 Add reference mutation started");
      console.log("📝 Form data received:", data);
      console.log("👤 Current user:", user);
      
      const referenceData = {
        ...data,
        userId: user?.id
      };
      console.log("📊 Reference data to send:", referenceData);
      
      try {
        console.log("📡 Making POST request to /api/references");
        const res = await apiRequest("POST", "/api/references", referenceData);
        console.log("✅ POST response status:", res.status);
        const responseData = await res.json();
        console.log("📄 POST response data:", responseData);
        return responseData;
      } catch (error) {
        console.error("❌ Add reference error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      setShowForm(false);
      form.reset();
      toast({
        title: "Reference Added",
        description: "Your reference will be contacted for verification.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Reference",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editReferenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const referenceData = {
        ...data,
        userId: user?.id
      };
      console.log("Editing reference", id, "with data:", referenceData);
      const res = await apiRequest("PUT", `/api/references/${id}`, referenceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      setEditingEntry(null);
      setShowForm(false);
      form.reset();
      toast({
        title: "Reference Updated",
        description: "Reference has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Reference",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Deleting reference:", id);
      const res = await apiRequest("DELETE", `/api/references/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      setShowDeleteDialog(false);
      setEntryToDelete(null);
      toast({
        title: "Reference Deleted",
        description: "Reference has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Reference",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (referencesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Professional References</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Reference
        </Button>
      </div>

      {references?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No references added yet. Add professional references to verify your experience.
        </p>
      ) : (
        <div className="space-y-4">
          {references?.map((reference: any) => (
            <div
              key={reference.id}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{reference.referentName}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reference.verificationStatus === "verified"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {reference.verificationStatus}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingEntry(reference);
                          form.reset({
                            referentName: reference.referentName,
                            referentPosition: reference.referentPosition,
                            referentEmail: reference.referentEmail,
                            referentPhone: reference.referentPhone,
                            relationshipType: reference.relationshipType,
                          });
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setEntryToDelete(reference);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {reference.referentPosition}
              </p>
              <p className="text-sm text-muted-foreground">
                {reference.referentEmail} • {reference.referentPhone}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {reference.relationshipType}
              </p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showForm} onOpenChange={setShowForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingEntry ? "Edit Professional Reference" : "Add Professional Reference"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingEntry 
                ? "Update the reference information below."
                : "Add a professional reference who can verify your work experience. They will be contacted for verification."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                console.log("🚀 Reference form submit triggered!");
                console.log("📝 Form data:", data);
                console.log("✏️ Editing entry:", editingEntry);
                console.log("🔍 Form validation errors:", form.formState.errors);
                
                if (editingEntry) {
                  console.log("📝 Calling edit mutation");
                  editReferenceMutation.mutate({ id: editingEntry.id, data });
                } else {
                  console.log("➕ Calling add mutation");
                  addReferenceMutation.mutate(data);
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="referentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter reference's full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referentPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position / Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter reference's position" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter reference's email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="Enter reference's phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationshipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setEditingEntry(null);
                  form.reset();
                }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  disabled={addReferenceMutation.isPending || editReferenceMutation.isPending}
                  onClick={async (e) => {
                    // Force validation and prevent default form submission
                    const isValid = await form.trigger();
                    e.preventDefault();
                    
                    if (!isValid) {
                      return;
                    }
                    
                    const formData = form.getValues();
                    
                    if (editingEntry) {
                      editReferenceMutation.mutate({ id: editingEntry.id, data: formData });
                    } else {
                      addReferenceMutation.mutate(formData);
                    }
                  }}
                >
                  {(addReferenceMutation.isPending || editReferenceMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingEntry ? (
                    "Update Reference"
                  ) : (
                    "Add Reference"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reference</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reference? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => entryToDelete && deleteReferenceMutation.mutate(entryToDelete.id)}
              disabled={deleteReferenceMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteReferenceMutation.isPending ? (
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
