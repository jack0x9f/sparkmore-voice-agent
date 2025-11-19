import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedDemoRoute from "./components/ProtectedDemoRoute";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoLogin = lazy(() => import("./pages/DemoLogin"));
const AIAgentDemo = lazy(() => import("./pages/AIAgentDemo"));
const AccessCodes = lazy(() => import("./pages/AccessCodes"));
const AIAgentTest = lazy(() => import("./pages/AIAgentTest"));
const VoiceAgentDemo = lazy(() => import("./pages/VoiceAgentDemo"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/demo-login" element={<DemoLogin />} />
            <Route path="/demo" element={
              <ProtectedDemoRoute>
                <Demo />
              </ProtectedDemoRoute>
            } />
            <Route path="/ai-demo-X9K2M4P7L5Q8N3W6" element={<AIAgentDemo />} />
            <Route path="/voice-agent" element={
              <ProtectedDemoRoute>
                <VoiceAgentDemo />
              </ProtectedDemoRoute>
            } />
            <Route path="/admin/codes" element={<AccessCodes />} />
            <Route path="/admin/security" element={<SecurityDashboard />} />
            <Route path="/ai-agent-test" element={<AIAgentTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

