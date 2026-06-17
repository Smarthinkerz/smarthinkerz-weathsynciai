import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { SmarthinkerzAttribution } from "@/components/smarthinkerz-attribution";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import AIOpportunityDashboard from "@/components/ai-opportunity-dashboard";
import SmartContracts from "@/pages/smart-contracts";
import ManageContracts from "@/pages/manage-contracts";
import SubmitOpportunityPage from "@/pages/submit-opportunity";
import VirtualAssistantPage from "@/pages/virtual-assistant";
import BookmarksPage from "@/pages/bookmarks-page";
import FundingApplicationPage from "@/pages/funding-application";
import PaymentVerification from "@/pages/payment-verification";
import CompanyPaymentVerification from "@/pages/company-payment-verification";
import CompanySubscription from "@/pages/company-subscription";
import CompanyDashboardPage from "@/pages/company-dashboard";
const BusinessMapPage = lazy(() => import("@/pages/business-map"));
import BusinessMapManagementPage from "@/pages/company/business-map-management";
import LeadGenerationPage from "@/pages/lead-generation";
import PersonalFinancePage from "@/pages/personal-finance";
import TeamFinancialHealthPage from "@/pages/team-financial-health-fixed";
import ResearchDashboard from "@/pages/research-dashboard";
import InvestmentStrategistPage from "@/pages/investment-strategist-simple";
import BasicTierDashboard from "@/pages/basic-tier-dashboard";
const PremiumDashboard = lazy(() => import("@/pages/premium-dashboard"));
import CompanyPremiumDashboard from "@/pages/company-premium-dashboard";
import EnhancedMarketAnalytics from "@/pages/enhanced-market-analytics";
const DeepResearchPage = lazy(() => import("@/pages/deep-research-page"));
import { ExperienceVerification } from "@/components/experience-verification/experience-verification";
import { AuthProvider } from "@/hooks/use-auth";
import IndexPage from "@/pages/index";

import { ProtectedRoute } from "./lib/protected-route";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { FloatingAssistant } from "@/components/virtual-assistant/floating-assistant";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import CompanyAuthPage from "@/pages/company-auth";
import CompanyPublicProfilePage from "@/pages/company-public-profile";
import CompanyProfilePage from "@/pages/company-profile";
import UserProfilePage from "@/pages/user-profile";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import PremiumDirectoryPage from "@/pages/company/premium-directory";
import CompanyVerification from "@/pages/company-verification";
import CompanyMarketReportsPage from "@/pages/company/market-reports";
import ChatbotSettingsPage from "@/pages/company/chatbot-settings";
import ClientRequestsPage from "@/pages/company/client-requests";
import AnalyticsDashboardPage from "@/pages/company/analytics-dashboard";
import EmployeeVerificationsPage from "@/pages/company/employee-verifications";
import PortfolioPage from "@/pages/portfolio-page";
import CommunityPage from "@/pages/community-page";
import MarketplacePage from "@/pages/marketplace-page";
import LearningPage from "@/pages/learning-page";
import ThreatSimulationPage from "@/pages/threat-simulation-page";
import ApiKeysPage from "@/pages/api-keys-page";
import ComplianceDashboard from "@/pages/company/compliance-dashboard";
import AiAssistantPage from "@/pages/ai-assistant-page";
import PolicyModelingPage from "@/pages/policy-modeling-page";
const MultiAgentCollaborationPage = lazy(() => import("@/pages/multi-agent-collaboration-page"));
const IntegrationDashboardPage = lazy(() => import("@/pages/integration-dashboard-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const BillingPage = lazy(() => import("@/pages/billing-page"));
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { PlusCircle, Settings, BarChart3, Crown, Video, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "./lib/queryClient";

// Company Dashboard page has been moved to client/src/pages/company-dashboard.tsx

function Router() {
  console.log("Router component rendered");

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>}>
    <Switch>
      {/* Public routes first */}
      <Route path="/payment-verification" component={PaymentVerification} />
      <Route path="/company-payment-verification" component={CompanyPaymentVerification} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/company/auth" component={CompanyAuthPage} />
      <Route path="/submit" component={SubmitOpportunityPage} />

      {/* Company routes */}
      <Route path="/company/dashboard">
        <CompanyDashboardPage />
      </Route>
      <Route path="/company/subscription">
        <CompanySubscription />
      </Route>
      <ProtectedRoute path="/company/profile" component={CompanyProfilePage} />
      <Route path="/company/premium-directory">
        <PremiumDirectoryPage />
      </Route>
      <Route path="/company/verification">
        <CompanyVerification />
      </Route>
      <Route path="/company/premium-dashboard">
        <CompanyPremiumDashboard />
      </Route>
      <Route path="/company/market-reports">
        <CompanyMarketReportsPage />
      </Route>
      <Route path="/company/enhanced-analytics" component={EnhancedMarketAnalytics} />
      <Route path="/company/chatbot-settings" component={ChatbotSettingsPage} />
      <Route path="/company/client-requests" component={ClientRequestsPage} />
      <Route path="/company/analytics" component={AnalyticsDashboardPage} />
      <Route path="/company/employee-verifications" component={EmployeeVerificationsPage} />
      <Route path="/company/deep-research" component={DeepResearchPage} />
      <ProtectedRoute path="/company/business-map-management" component={BusinessMapManagementPage} />
      <ProtectedRoute path="/company/business-map" component={BusinessMapManagementPage} />
      <ProtectedRoute path="/lead-generation" component={LeadGenerationPage} />

      {/* Public company profiles */}
      <Route path="/companies/:id" component={CompanyPublicProfilePage} />

      {/* Auth flows - public */}
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* User profile */}
      <ProtectedRoute path="/profile" component={UserProfilePage} />

      {/* Protected routes */}
      <Route path="/business-map" component={BusinessMapPage} />
      <ProtectedRoute path="/personal-finance" component={PersonalFinancePage} />
      <ProtectedRoute path="/team-financial-health" component={TeamFinancialHealthPage} />
      <ProtectedRoute path="/basic-tier" component={BasicTierDashboard} />
      <ProtectedRoute path="/premium-agents" component={PremiumDashboard} />
      <ProtectedRoute path="/premium-dashboard" component={PremiumDashboard} />
      <ProtectedRoute path="/deep-research" component={DeepResearchPage} />
      <ProtectedRoute path="/research" component={ResearchDashboard} />
      <ProtectedRoute path="/investment-strategist" component={InvestmentStrategistPage} />
      <ProtectedRoute path="/smart-contracts" component={SmartContracts} />
      <ProtectedRoute path="/manage-contracts" component={ManageContracts} />
      <ProtectedRoute path="/virtual-assistant" component={VirtualAssistantPage} />
      <ProtectedRoute path="/bookmarks" component={BookmarksPage} />
      <ProtectedRoute path="/opportunities/:id/apply" component={FundingApplicationPage} />
      <ProtectedRoute path="/experience-verification" component={ExperienceVerification} />
      <ProtectedRoute path="/ai-opportunities" component={AIOpportunityDashboard} />
      <ProtectedRoute path="/portfolio" component={PortfolioPage} />
      <ProtectedRoute path="/community" component={CommunityPage} />
      <ProtectedRoute path="/marketplace" component={MarketplacePage} />
      <ProtectedRoute path="/learning" component={LearningPage} />
      <ProtectedRoute path="/threat-simulation" component={ThreatSimulationPage} />
      <ProtectedRoute path="/developer" component={ApiKeysPage} />
      <ProtectedRoute path="/ai-assistant" component={AiAssistantPage} />
      <ProtectedRoute path="/policy-modeling" component={PolicyModelingPage} />
      <ProtectedRoute path="/multi-agent" component={MultiAgentCollaborationPage} />
      <ProtectedRoute path="/integrations" component={IntegrationDashboardPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <ProtectedRoute path="/company/compliance" component={ComplianceDashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <Route path="/" component={IndexPage} />

      {/* 404 catch-all */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          <Toaster />
          <FloatingAssistant />
          <WelcomeModal />
          <Router />
          <SmarthinkerzAttribution />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;