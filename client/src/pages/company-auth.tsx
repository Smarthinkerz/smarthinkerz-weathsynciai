import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema } from "@shared/schema";
import { Loader2, Building2, ArrowLeft, User } from "lucide-react";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Redirect, Link } from "wouter";

export default function CompanyAuthPage() {
  const { companyAuth, isLoading, company } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registrationForm = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      description: "",
      primaryContact: "",
      primaryContactEmail: "",
      industries: [],
      businessLicense: "",
      taxId: "",
      website: "",
      password: "", // Add password field
    },
  });

  const handleLogin = async (data: any) => {
    try {
      await companyAuth.loginMutation.mutateAsync(data);
      toast({
        title: "Welcome back!",
        description: "Successfully logged into your company account.",
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegister = async (data: any) => {
    try {
      await companyAuth.registerMutation.mutateAsync(data);
      toast({
        title: "Registration successful",
        description: "Your company account has been created. Please wait for verification.",
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  // Redirect to company dashboard if already logged in
  if (company) {
    console.log("Company already authenticated, redirecting to dashboard", company);
    return <Redirect to="/company/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
        {/* Left side - Auth forms */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Company Portal</CardTitle>
            <CardDescription>
              Access your company dashboard or register as a service provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="company@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={companyAuth.loginMutation.isPending}>
                      {companyAuth.loginMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Log In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registrationForm}>
                  <form onSubmit={registrationForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registrationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Company Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Description</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Brief description of your company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="primaryContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Contact Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Full Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="primaryContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="contact@company.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="industries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industries (comma-separated)</FormLabel>
                          <FormControl>
                            <Input
                              value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                              placeholder="Finance, Consulting, etc."
                              onChange={(e) => field.onChange(e.target.value.split(',').map(i => i.trim()))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business License Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="License Number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tax ID" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://company.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registrationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Create a secure password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={companyAuth.registerMutation.isPending}>
                      {companyAuth.registerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Register Company"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center items-center">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login Options
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Right side - Info */}
        <div className="hidden md:flex flex-col justify-center">
          <div className="space-y-4">
            <Building2 className="h-12 w-12 text-primary" />
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src={wealthSyncLogo} alt="WealthSync AI" className="h-12 w-12 object-contain" />
              <h2 className="text-2xl font-bold">Join WealthSync AI as a Service Provider</h2>
            </div>
            <p className="text-muted-foreground">
              List your services, connect with clients, and grow your business with our AI-powered platform.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                ✓ AI-powered client matching
              </li>
              <li className="flex items-center gap-2">
                ✓ Secure payment processing
              </li>
              <li className="flex items-center gap-2">
                ✓ Team collaboration tools
              </li>
              <li className="flex items-center gap-2">
                ✓ Analytics and insights
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
