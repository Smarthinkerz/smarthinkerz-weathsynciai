import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import wealthSyncLogo from "@/assets/wealthsync-logo.png";
import { Loader2, Building2, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { insertCompanySchema } from "@shared/schema";

export default function AuthPage() {
  const { user, company, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Handle redirection for authenticated users
  if (!isLoading) {
    if (user) {
      console.log("User already authenticated, redirecting to dashboard");
      // Use setLocation instead of window.location.href to avoid full page reload
      setLocation('/');
      return <div className="flex justify-center items-center min-h-screen">Redirecting to user dashboard...</div>;
    } else if (company) {
      console.log("Company already authenticated, redirecting to company dashboard");
      // Use setLocation instead of window.location.href to avoid full page reload
      setLocation('/company/dashboard');
      return <div className="flex justify-center items-center min-h-screen">Redirecting to company dashboard...</div>;
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        <CardHeader className="space-y-2">
          <div className="flex justify-center">
            <img src={wealthSyncLogo} alt="WealthSync AI" className="h-16 w-16 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">WealthSync AI</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthTabs />
        </CardContent>
      </Card>
    </div>
  );
}

function AuthTabs() {
  const [activeTab, setActiveTab] = useState("login");
  
  return (
    <Tabs defaultValue="login" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      <TabsContent value="register">
        <RegisterTabs />
      </TabsContent>
    </Tabs>
  );
}

function RegisterTabs() {
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Choose Account Type</h2>
        <RadioGroup
          defaultValue="individual"
          onValueChange={(value) => setAccountType(value as 'individual' | 'company')}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem
              value="individual"
              id="individual"
              className="peer sr-only"
            />
            <label
              htmlFor="individual"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <User className="mb-3 h-6 w-6" />
              <p className="text-sm font-medium">Individual</p>
            </label>
          </div>
          <div>
            <RadioGroupItem
              value="company"
              id="company"
              className="peer sr-only"
            />
            <label
              htmlFor="company"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Building2 className="mb-3 h-6 w-6" />
              <p className="text-sm font-medium">Company</p>
            </label>
          </div>
        </RadioGroup>
      </div>
      {accountType === 'individual' ? <IndividualRegisterForm /> : <CompanyRegisterForm />}
    </div>
  );
}

function LoginForm() {
  const [loginType, setLoginType] = useState<'individual' | 'company'>('individual');
  const { loginMutation, companyAuth } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Individual login form
  const individualForm = useForm({
    resolver: zodResolver(z.object({
      identifier: z.string().min(1, "Username or email is required"),
      password: z.string().min(1, "Password is required"),
    })),
    defaultValues: {
      identifier: "",
      password: "",
    }
  });

  // Handle individual login submit
  const handleIndividualSubmit = individualForm.handleSubmit(async (data) => {
    try {
      console.log("Login attempt with:", data.identifier);
      
      // Check if the identifier is an email
      const isEmail = data.identifier.includes('@');
      
      // For email login, send both username and email fields to be flexible
      // Our updated server endpoint will accept either one
      const loginData = isEmail
        ? { 
            email: data.identifier, // Send as email if it looks like an email
            username: data.identifier, // Include username field for backward compatibility
            password: data.password 
          }
        : { 
            username: data.identifier,
            password: data.password 
          };
      
      console.log("Submitting login data:", loginData);
      
      await loginMutation.mutateAsync(loginData);
      toast({
        title: "Success", 
        description: "Successfully logged in!",
      });
      // Redirect to dashboard after successful login (with a slight delay)
      setTimeout(() => setLocation('/'), 500);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  });

  // For company login, using state directly instead of react-hook-form
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [companyFormError, setCompanyFormError] = useState<{email?: string; password?: string} | null>(null);
  
  // Handle company login submit
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: {email?: string; password?: string} = {};
    
    if (!companyEmail) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      errors.email = "Invalid email address";
    }
    
    if (!companyPassword) {
      errors.password = "Password is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setCompanyFormError(errors);
      return;
    }
    
    setCompanyFormError(null);
    
    try {
      await companyAuth.loginMutation.mutateAsync({
        email: companyEmail,
        password: companyPassword
      });
      toast({
        title: "Success", 
        description: "Successfully logged in!",
      });
      // Redirect to company dashboard after successful login (with a slight delay)
      setTimeout(() => setLocation('/company/dashboard'), 500);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <RadioGroup
          defaultValue="individual"
          onValueChange={(value) => setLoginType(value as 'individual' | 'company')}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem
              value="individual"
              id="login-individual"
              className="peer sr-only"
            />
            <label
              htmlFor="login-individual"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <User className="mb-3 h-6 w-6" />
              <p className="text-sm font-medium">Individual</p>
            </label>
          </div>
          <div>
            <RadioGroupItem
              value="company"
              id="login-company"
              className="peer sr-only"
            />
            <label
              htmlFor="login-company"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Building2 className="mb-3 h-6 w-6" />
              <p className="text-sm font-medium">Company</p>
            </label>
          </div>
        </RadioGroup>
      </div>

      {loginType === 'individual' ? (
        <Form {...individualForm}>
          <form onSubmit={handleIndividualSubmit} className="space-y-4">
            <FormField
              control={individualForm.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username or email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={individualForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : "Login"}
            </Button>
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          </form>
        </Form>
      ) : (
        // Company login using traditional form instead of react-hook-form
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Email</div>
            <Input
              id="company-email"
              type="email"
              placeholder="company@example.com"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
            {companyFormError?.email && (
              <p className="text-sm font-medium text-destructive">{companyFormError.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Password</div>
            <Input
              id="company-password"
              type="password"
              placeholder="Enter your password"
              value={companyPassword}
              onChange={(e) => setCompanyPassword(e.target.value)}
            />
            {companyFormError?.password && (
              <p className="text-sm font-medium text-destructive">{companyFormError.password}</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={companyAuth.loginMutation.isPending}
          >
            {companyAuth.loginMutation.isPending ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : "Company Login"}
          </Button>
        </form>
      )}
    </div>
  );
}

function IndividualRegisterForm() {
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      skills: [],
      assets: [],
      preferredLanguage: "en",
      preferredCurrency: "USD",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: "Success",
        description: "Account created successfully! You can now login.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Choose a username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} placeholder="Create a password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your full name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="Your email address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                  onChange={(e) => {
                    const values = e.target.value.split(",").map((item) => item.trim());
                    field.onChange(values);
                  }}
                  placeholder="e.g. web development, graphic design, marketing"
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
              <FormLabel>Assets (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                  onChange={(e) => {
                    const values = e.target.value.split(",").map((item) => item.trim());
                    field.onChange(values);
                  }}
                  placeholder="e.g. camera equipment, office space, vehicle"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : "Register"}
        </Button>
      </form>
    </Form>
  );
}

function CompanyRegisterForm() {
  const { companyAuth } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      description: "",
      password: "",
      primaryContact: "",
      primaryContactEmail: "",
      industries: [], 
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await companyAuth.registerMutation.mutateAsync(values);
      toast({
        title: "Success",
        description: "Company registered successfully! You can now login.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register company",
        variant: "destructive",
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} placeholder="Create a password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
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
          control={form.control}
          name="primaryContactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="contact@company.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="industries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industries</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Technology, Finance (comma-separated)"
                  value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                  onChange={(e) => {
                    const values = e.target.value.split(",").map(item => item.trim()).filter(Boolean);
                    field.onChange(values);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={companyAuth.registerMutation.isPending}
        >
          {companyAuth.registerMutation.isPending ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : "Register Company"}
        </Button>
      </form>
    </Form>
  );
}