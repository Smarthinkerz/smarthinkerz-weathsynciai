import React, { useState, useEffect } from 'react';
import {  Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {  Button } from '@/components/ui/button';
import {  useToast } from '@/hooks/use-toast';
import {  useQuery, useMutation } from '@tanstack/react-query';
import {  queryClient } from '@/lib/queryClient';
import {  apiRequest } from '@/lib/queryClient';
import {  Loader2, PlusCircle, Edit, Trash, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {  Input } from '@/components/ui/input';
import {  Textarea } from '@/components/ui/textarea';
import {  zodResolver } from '@hookform/resolvers/zod';
import {  useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { ServiceType, PricingModel, isHighTier } from '@shared/schema';
import {  Alert, AlertDescription } from '@/components/ui/alert';
import {  useAuth } from '@/hooks/use-auth';

const serviceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  pricingModel: z.string().min(1, "Please select a pricing model"),
  priceAmount: z.number().min(0, "Price must be a positive number").optional(),
  priceUnit: z.string().optional(),
  leadTime: z.string().optional(),
  availability: z.string().optional(),
  features: z.preprocess(
    // Convert input to string for the form
    (val) => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.join(', ');
      return '';
    },
    z.string().optional()
  ).transform(val => 
    val ? val.split(',').map(feature => feature.trim()).filter(Boolean) : []
  ),
});

type CompanyService = z.infer<typeof serviceSchema> & {
  id: number;
  companyId: number;
  createdAt: string;
  updatedAt: string | null;
};

type ServiceLimitResponse = {
  canAddService: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  unlimited?: boolean;
};

// Define the expected API response structure
type ServicesResponse = {
  services: CompanyService[];
  limits: {
    total: number;
    limit: number | null;
    remaining: number | null;
    canAddMore: boolean;
  };
};

// Create a more flexible response type to handle unexpected structure
type AnyServicesResponse = {
  services: any[]; // Accept any array structure
  limits?: {
    total?: number;
    limit?: number | null;
    remaining?: number | null;
    canAddMore?: boolean;
  };
};

export const ServiceManagement = () => {
  const { toast } = useToast();
  const { company } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<CompanyService | null>(null);
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [showEditCustomTypeInput, setShowEditCustomTypeInput] = useState(false);
  const isPremium = isHighTier(company?.subscriptionTier);

  // Fetch service limit information
  const { data: limitInfo, isLoading: isLimitLoading } = useQuery<ServiceLimitResponse>({
    queryKey: ['/api/company/check-service-limit'],
    retry: 1,
  });

  // Fetch company services with more flexible handling
  const { data: servicesData, isLoading: isServicesLoading, error, refetch: refetchServices } = useQuery<AnyServicesResponse>({
    queryKey: ['/api/company/services'],
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Force refetch every time component mounts
    gcTime: 1000, // Very short cache time to avoid stale data (was cacheTime in v4)
    // Handle any response structure that has a services array
    select: (data: any) => {
      // Ensure we have a properly structured response
      if (!data) return { services: [] };
      
      // If services exists but isn't an array, convert it to an array
      if (data.services && !Array.isArray(data.services)) {
        console.warn('Services is not an array, converting', data.services);
        return { 
          ...data, 
          services: [data.services]
        };
      }
      
      // If no services property at all, create an empty array
      if (!data.services) {
        console.warn('No services in response', data);
        return { ...data, services: [] };
      }
      
      // Return the data as-is if everything is fine
      return data;
    }
  });
  
  // Debug logging for services data
  useEffect(() => {
    console.log('Services data status:', { 
      isLoading: isServicesLoading, 
      hasError: !!error, 
      hasData: !!servicesData,
      serviceCount: servicesData?.services?.length || 0
    });
    if (servicesData) {
      console.log('Received services data:', servicesData);
    }
    if (error) {
      console.error('Services data error:', error);
    }
  }, [servicesData, isServicesLoading, error]);

  const createForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      serviceType: '',
      pricingModel: '',
      priceAmount: 0,
      priceUnit: '',
      leadTime: '',
      availability: '',
      features: [] as string[], // Initialize as empty array
    },
  });
  
  // Monitor the service type field to toggle custom input field
  const createServiceType = useWatch({
    control: createForm.control,
    name: "serviceType"
  });
  
  useEffect(() => {
    setShowCustomTypeInput(
      createServiceType === ServiceType.OTHER || 
      createServiceType === ServiceType.CUSTOM
    );
  }, [createServiceType]);

  const editForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      serviceType: '',
      pricingModel: '',
      priceAmount: 0,
      priceUnit: '',
      leadTime: '',
      availability: '',
      features: [] as string[], // Initialize as empty array
    },
  });
  
  // Monitor the service type field in edit form
  const editServiceType = useWatch({
    control: editForm.control,
    name: "serviceType"
  });
  
  useEffect(() => {
    setShowEditCustomTypeInput(
      editServiceType === ServiceType.OTHER || 
      editServiceType === ServiceType.CUSTOM
    );
  }, [editServiceType]);

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceSchema>) => {
      console.log('Making POST request to /api/company/services');
      const response = await apiRequest('POST', '/api/company/services', data);
      const result = await response.json();
      console.log('Service creation response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Service created successfully:', data);
      toast({
        title: 'Success',
        description: 'Service was created successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/check-service-limit'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      console.error('Service creation error:', error);
      toast({
        title: 'Error',
        description: `Failed to create service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Edit service mutation
  const editServiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceSchema> & { id: number }) => {
      const { id, ...serviceData } = data;
      console.log('Updating service:', id, 'with data:', serviceData);
      const response = await apiRequest('PATCH', `/api/company/services/${id}`, serviceData);
      const result = await response.json();
      console.log('Service update response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Service updated successfully:', data);
      toast({
        title: 'Success',
        description: 'Service was updated successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/services'] });
      setIsEditDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      console.error('Service update error:', error);
      toast({
        title: 'Error',
        description: `Failed to update service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting service:', id);
      const response = await apiRequest('DELETE', `/api/company/services/${id}`);
      const result = await response.json().catch(() => ({})); // Some DELETE responses might not have a body
      console.log('Service deletion response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Service deleted successfully:', data);
      toast({
        title: 'Success',
        description: 'Service was deleted successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/check-service-limit'] });
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      console.error('Service deletion error:', error);
      toast({
        title: 'Error',
        description: `Failed to delete service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: z.infer<typeof serviceSchema>) {
    // Handle features correctly for TypeScript
    let processedFeatures: string[] = [];
    
    // Cast to any first to avoid TypeScript errors
    const featuresValue = values.features as any;
    
    if (Array.isArray(featuresValue)) {
      processedFeatures = featuresValue;
    } else if (typeof featuresValue === 'string') {
      if (featuresValue.trim() !== '') {
        processedFeatures = featuresValue.split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '');
      }
    }
    
    // Make sure we have the serviceType field correctly mapped
    const serviceData = {
      ...values,
      // Ensure serviceType is included and properly mapped
      serviceType: values.serviceType,
      features: processedFeatures,
    };
    
    console.log('Submitting service data:', serviceData);
    createServiceMutation.mutate(serviceData);
  }

  function onEditSubmit(values: z.infer<typeof serviceSchema>) {
    if (selectedService) {
      // Handle features correctly for TypeScript
      let processedFeatures: string[] = [];
      
      // Cast to any first to avoid TypeScript errors
      const featuresValue = values.features as any;
      
      if (Array.isArray(featuresValue)) {
        processedFeatures = featuresValue;
      } else if (typeof featuresValue === 'string') {
        if (featuresValue.trim() !== '') {
          processedFeatures = featuresValue.split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s !== '');
        }
      }
      
      // Ensure serviceType is properly included in the update
      const serviceData = {
        ...values,
        serviceType: values.serviceType,
        features: processedFeatures,
        id: selectedService.id,
      };
      
      console.log('Updating service data:', serviceData);
      editServiceMutation.mutate(serviceData);
    }
  }

  function handleEdit(service: CompanyService) {
    setSelectedService(service);
    
    // Check if this service has a custom type
    const isCustomType = 
      service.serviceType === ServiceType.OTHER || 
      service.serviceType === ServiceType.CUSTOM ||
      !Object.values(ServiceType).includes(service.serviceType as any);
    
    // If it's a custom type that doesn't match our enum values, we'll show the input
    setShowEditCustomTypeInput(isCustomType);
    
    editForm.reset({
      name: service.name,
      description: service.description,
      serviceType: service.serviceType as any, // Cast to any to work around TypeScript issues
      pricingModel: service.pricingModel,
      priceAmount: service.priceAmount || 0,
      priceUnit: service.priceUnit || '',
      leadTime: service.leadTime || '',
      availability: service.availability || '',
      features: service.features || [], // Use the feature array directly
    });
    
    setIsEditDialogOpen(true);
  }

  function handleDelete(service: CompanyService) {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedService) {
      deleteServiceMutation.mutate(selectedService.id);
    }
  }

  // Only consider isServicesLoading for this main display
  const isLoading = isServicesLoading;
  const createPending = createServiceMutation.isPending;
  const editPending = editServiceMutation.isPending;
  const deletePending = deleteServiceMutation.isPending;
  
  const canAddService = isPremium || (limitInfo?.canAddService || false);

  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Service Management</CardTitle>
          <CardDescription>
            {isPremium 
              ? 'Manage your company services without limits' 
              : 'Basic plan allows up to 3 services'}
          </CardDescription>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          disabled={!canAddService || createPending}
          className="flex items-center"
        >
          {createPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Add Service
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Debug information - only in development */}
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <div>Loading: {isLoading ? 'true' : 'false'}</div>
          <div>Has error: {error ? 'true' : 'false'}</div>
          <div>Has data: {servicesData ? 'true' : 'false'}</div>
          <div>Has services array: {servicesData && servicesData.services ? 'true' : 'false'}</div>
          <div>Services count: {servicesData?.services?.length || 0}</div>
          <div>Raw services data: {servicesData?.services ? JSON.stringify(servicesData.services).substring(0, 100) + '...' : 'No data yet'}</div>
        </div>

        {false && isLoading ? (
          // Loading state - temporarily disabled until we figure out the loading issue
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          // Error state
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading services: {error.message || "Please try again."}
            </AlertDescription>
          </Alert>
        ) : (
          // Show services directly - regardless of loading state
          <div>
            {(!servicesData || !Array.isArray(servicesData?.services)) ? (
              // No data yet
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading services...</p>
              </div>
            ) : servicesData.services.length === 0 ? (
              // Empty services list
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven't added any services yet.</p>
                {!canAddService && (
                  <p className="mt-2 text-sm">
                    You've reached your plan limit. Upgrade to add more services.
                  </p>
                )}
              </div>
            ) : (
              // Display services - force render regardless of loading state
              <div className="space-y-4">
                {servicesData.services.map((service: any) => (
              <div 
                key={service.id} 
                className="border rounded-md p-4 flex flex-col md:flex-row justify-between"
              >
                <div className="flex-grow mr-4">
                  <div className="flex items-center mb-1">
                    <h3 className="text-lg font-medium">{service.name}</h3>
                    <span className="ml-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {service.serviceType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Pricing:</span>
                    <span className="ml-1">
                      {service.priceAmount ? `$${service.priceAmount} ${service.priceUnit || ''}` : 'Contact for pricing'}
                    </span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="font-medium">Model:</span>
                    <span className="ml-1">{service.pricingModel.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(service)}
                    disabled={editPending}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(service)}
                    disabled={deletePending}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Add a new service that your company offers to clients.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)] pr-2">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Business Consulting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ServiceType).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {showCustomTypeInput && (
                        <div className="mt-2">
                          <Input 
                            placeholder="Enter custom service type"
                            onChange={(e) => {
                              // Update the service type with the custom value
                              // but keep the 'other' or 'custom' as the selected dropdown value
                              const customType = e.target.value;
                              field.onChange(customType || field.value);
                            }}
                          />
                          <FormDescription>
                            Enter your custom service type
                          </FormDescription>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a pricing model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PricingModel).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="priceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        />
                      </FormControl>
                      <FormDescription>Leave at 0 for "Contact for pricing"</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="priceUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="per hour, per project, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="leadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2-3 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mon-Fri, 9am-5pm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the service in detail..." 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List features separated by commas..." 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter features separated by commas, e.g., "Initial consultation, Weekly reports, 24/7 Support"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPending}>
                  {createPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Service'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update your service information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)] pr-2">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Business Consulting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ServiceType).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {showEditCustomTypeInput && (
                        <div className="mt-2">
                          <Input 
                            placeholder="Enter custom service type"
                            onChange={(e) => {
                              // Update the service type with the custom value
                              // but keep the 'other' or 'custom' as the selected dropdown value
                              const customType = e.target.value;
                              field.onChange(customType || field.value);
                            }}
                          />
                          <FormDescription>
                            Enter your custom service type
                          </FormDescription>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a pricing model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PricingModel).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="priceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        />
                      </FormControl>
                      <FormDescription>Leave at 0 for "Contact for pricing"</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="priceUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="per hour, per project, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="leadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2-3 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mon-Fri, 9am-5pm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the service in detail..." 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List features separated by commas..." 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter features separated by commas, e.g., "Initial consultation, Weekly reports, 24/7 Support"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editPending}>
                  {editPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Service'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the service 
              "{selectedService?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deletePending}
            >
              {deletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Service'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};