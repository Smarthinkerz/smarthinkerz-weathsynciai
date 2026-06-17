import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ProfileFormData = {
  skills: string;
  assets: string;
  preferredRegion: string;
  businessType: string;
};

const REGIONS = [
  "Africa",
  "Middle East",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Australia",
];

const BUSINESS_TYPES = [
  "startup",
  "small_business",
  "tech",
  "digital",
  "cleantech",
  "energy",
  "other",
];

export function ProfileEditor({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      skills: user?.skills?.join(", ") || "",
      assets: user?.assets?.join(", ") || "",
      preferredRegion: user?.preferredRegion || "",
      businessType: user?.assets?.find(asset => BUSINESS_TYPES.includes(asset.toLowerCase())) || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Convert comma-separated strings to arrays before sending to API
      const formattedData = {
        skills: data.skills.split(",").map(item => item.trim()).filter(item => item.length > 0),
        assets: [...data.assets.split(",").map(item => item.trim()).filter(item => item.length > 0), data.businessType],
        preferredRegion: data.preferredRegion,
      };

      const res = await apiRequest("PATCH", "/api/user", formattedData);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Business Profile</DrawerTitle>
        </DrawerHeader>
        <div className="px-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="preferredRegion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="preferredRegion">Region</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger id="preferredRegion" name="preferredRegion">
                          <SelectValue placeholder="Select your region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="businessType">Business Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger id="businessType" name="businessType">
                          <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="skills">Skills & Expertise (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="skills"
                        name="skills"
                        placeholder="e.g. web development, graphic design, marketing"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="assets">Business Assets (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="assets"
                        name="assets"
                        placeholder="e.g. office space, equipment, intellectual property"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update Profile"
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}