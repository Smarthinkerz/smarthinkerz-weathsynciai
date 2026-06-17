import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Edit, Check, RefreshCw, Globe, Building, Briefcase, CreditCard } from 'lucide-react';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BusinessLocation {
  id?: number;
  name: string;
  type: string;
  entityId: number;
  latitude: string;
  longitude: string;
  country: string;
  city: string;
  address?: string;
  industry?: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function BusinessLocationManagement({ companyId }: { companyId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<BusinessLocation | null>(null);
  const [formData, setFormData] = useState<BusinessLocation>({
    name: '',
    type: 'company',
    entityId: companyId,
    latitude: '',
    longitude: '',
    country: '',
    city: '',
    isPremium: true
  });

  // Fetch all locations owned by this company
  const { data: companyLocations, isLoading, error } = useQuery({
    queryKey: ['/api/business-map/locations', 'company'],
    queryFn: getQueryFn({ on401: "throw" }),
    // Filter only the locations where entityId matches the companyId and type is 'company'
    select: (data: BusinessLocation[]) => 
      data.filter(location => location.entityId === companyId && location.type === 'company')
  });

  // Create new location
  const createMutation = useMutation({
    mutationFn: async (data: BusinessLocation) => {
      const response = await apiRequest('POST', '/api/business-map/locations', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Location Added',
        description: 'Your business location has been added to the global map.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/business-map/locations'] });
      setIsAddingLocation(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add location',
        description: error.message || 'There was an error adding your location',
        variant: 'destructive',
      });
    }
  });

  // Update existing location
  const updateMutation = useMutation({
    mutationFn: async (data: BusinessLocation) => {
      if (!data.id) throw new Error('Location ID is required for updates');
      const response = await apiRequest('PUT', `/api/business-map/locations/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Location Updated',
        description: 'Your business location has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/business-map/locations'] });
      setIsEditingLocation(false);
      setCurrentLocation(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update location',
        description: error.message || 'There was an error updating your location',
        variant: 'destructive',
      });
    }
  });

  // Delete location
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/business-map/locations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Location Deleted',
        description: 'Your business location has been removed from the map.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/business-map/locations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete location',
        description: error.message || 'There was an error deleting the location',
        variant: 'destructive',
      });
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle switch toggle
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isPremium: checked
    });
  };

  // Reset form fields
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'company',
      entityId: companyId,
      latitude: '',
      longitude: '',
      country: '',
      city: '',
      isPremium: true,
      address: '',
      industry: '',
      description: '',
      logo: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingLocation && currentLocation?.id) {
      updateMutation.mutate({ ...formData, id: currentLocation.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Edit location
  const handleEditLocation = (location: BusinessLocation) => {
    setCurrentLocation(location);
    setFormData(location);
    setIsEditingLocation(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingLocation(false);
    setCurrentLocation(null);
    resetForm();
  };

  // Get location coordinates from address (simulated for now)
  const handleGeocoding = () => {
    // This is a placeholder. In a real implementation, this would call a geocoding API
    toast({
      title: 'Geocoding',
      description: 'Looking up coordinates for the entered address...'
    });
    
    // Simulate a geocoding response with a timeout
    setTimeout(() => {
      // These are example coordinates for demonstration
      setFormData({
        ...formData,
        latitude: '40.7128',
        longitude: '-74.0060'
      });
      
      toast({
        title: 'Coordinates Found',
        description: 'The address has been converted to map coordinates.',
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Global Business Map Locations</h2>
        <Sheet open={isAddingLocation} onOpenChange={setIsAddingLocation}>
          <SheetTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add New Business Location</SheetTitle>
              <SheetDescription>
                Add your business location to the global interactive map.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Location Type</Label>
                <Select 
                  name="type"
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="funding">Funding Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleGeocoding}
                  className="mt-1"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Coordinates from Address
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input 
                    id="latitude" 
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input 
                    id="longitude" 
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input 
                  id="industry" 
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input 
                    id="website" 
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input 
                    id="logo" 
                    name="logo"
                    value={formData.logo || ''}
                    onChange={handleInputChange}
                    placeholder="https://"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input 
                    id="contactEmail" 
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input 
                    id="contactPhone" 
                    name="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPremium" 
                  checked={formData.isPremium}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isPremium">Premium Listing (Highlighted on Map)</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingLocation(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Location
                    </>
                  )}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load your business locations. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="h-5 w-1/4 bg-muted rounded animate-pulse" />
              <div className="h-5 w-full bg-muted rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {companyLocations && companyLocations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Premium</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.city}, {location.country}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {location.type === 'company' && <Building className="mr-2 h-4 w-4 text-blue-500" />}
                        {location.type === 'opportunity' && <Briefcase className="mr-2 h-4 w-4 text-orange-500" />}
                        {location.type === 'funding' && <CreditCard className="mr-2 h-4 w-4 text-green-500" />}
                        {location.type}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {location.isPremium ? (
                        <Check className="mx-auto h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditLocation(location)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => location.id && deleteMutation.mutate(location.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-10 flex flex-col items-center justify-center">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No Business Locations Yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                  Add your business to the global interactive map to increase your visibility and connect with potential partners and clients worldwide.
                </p>
                <Button onClick={() => setIsAddingLocation(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Location
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Location Sheet */}
      <Sheet open={isEditingLocation} onOpenChange={setIsEditingLocation}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Business Location</SheetTitle>
            <SheetDescription>
              Update your business location details on the global map.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Business Name</Label>
              <Input 
                id="edit-name" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-type">Location Type</Label>
              <Select 
                name="type"
                value={formData.type}
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="opportunity">Opportunity</SelectItem>
                  <SelectItem value="funding">Funding Source</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input 
                  id="edit-country" 
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input 
                  id="edit-city" 
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input 
                id="edit-address" 
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleGeocoding}
                className="mt-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Coordinates from Address
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input 
                  id="edit-latitude" 
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input 
                  id="edit-longitude" 
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-industry">Industry</Label>
              <Input 
                id="edit-industry" 
                name="industry"
                value={formData.industry || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website URL</Label>
                <Input 
                  id="edit-website" 
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-logo">Logo URL</Label>
                <Input 
                  id="edit-logo" 
                  name="logo"
                  value={formData.logo || ''}
                  onChange={handleInputChange}
                  placeholder="https://"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input 
                  id="edit-contactEmail" 
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input 
                  id="edit-contactPhone" 
                  name="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-isPremium" 
                checked={formData.isPremium}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="edit-isPremium">Premium Listing (Highlighted on Map)</Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Location
                  </>
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}