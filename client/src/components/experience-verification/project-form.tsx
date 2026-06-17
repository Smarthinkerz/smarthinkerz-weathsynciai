import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertProject, insertProjectSchema, Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit2, Trash2, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ProjectForm() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [techInput, setTechInput] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);

  // Fetch projects
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      projectUrl: "",
      repositoryUrl: "",
      technologies: [],
      demoUrl: "",
      screenshots: [],
    },
  });

  // Add/Update project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      console.log('Making POST request to /api/projects with data:', data);
      const res = await apiRequest("POST", "/api/projects", data);
      console.log('API response status:', res.status);
      const result = await res.json();
      console.log('API response data:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Added",
        description: "Your project has been submitted for verification.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      const res = await apiRequest("PUT", `/api/projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Updated",
        description: "Your project has been updated successfully.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/projects/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Deleted",
        description: "Your project has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setTechnologies([]);
    setTechInput("");
    setShowForm(false);
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setTechnologies(project.technologies || []);
    form.reset({
      name: project.name,
      description: project.description,
      projectUrl: project.projectUrl || "",
      repositoryUrl: project.repositoryUrl || "",
      demoUrl: project.demoUrl || "",
      technologies: project.technologies || [],
      screenshots: project.screenshots || [],
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleTechAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault();
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (index: number) => {
    setTechnologies(technologies.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InsertProject) => {
    const projectData = {
      ...data,
      technologies,
    };

    if (editingProject) {
      updateProjectMutation.mutate({
        id: editingProject.id,
        data: projectData,
      });
    } else {
      addProjectMutation.mutate(projectData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Projects</h3>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Projects List */}
      <div className="grid gap-4">
        {projects?.map((project) => (
          <Card key={project.id} className="p-4">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={project.verificationStatus === "verified" ? "default" : "secondary"}
                    >
                      {project.verificationStatus || "pending"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    disabled={deleteProjectMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground mb-4">{project.description}</p>
              
              {project.technologies && project.technologies.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Technologies:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, index) => (
                      <Badge key={index} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {project.projectUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Project
                    </a>
                  </Button>
                )}
                {project.repositoryUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      Repository
                    </a>
                  </Button>
                )}
                {project.demoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Demo
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!projects || projects.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No projects added yet.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Add Your First Project
            </Button>
          </Card>
        )}
      </div>

      {/* Project Form Modal/Overlay */}
      {showForm && (
        <Card className="p-6 border-2">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h4>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log('Form validation errors:', errors);
            })} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter project name" />
                    </FormControl>
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
                      <Textarea {...field} placeholder="Describe your project..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://your-project.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repositoryUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://github.com/your-repo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Technologies Used</FormLabel>
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleTechAdd}
                  placeholder="Type and press Enter to add"
                />
                {technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {technologies.map((tech, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTech(index)}
                      >
                        {tech} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="demoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demo URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://demo.your-project.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addProjectMutation.isPending || updateProjectMutation.isPending}
                  className="flex-1"
                >
                  {(addProjectMutation.isPending || updateProjectMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingProject ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    editingProject ? "Update Project" : "Add Project"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}
    </div>
  );
}
