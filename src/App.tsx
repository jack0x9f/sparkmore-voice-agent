import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import DemoLogin from "./pages/DemoLogin";
import AIAgentDemo from "./pages/AIAgentDemo";
import AccessCodes from "./pages/AccessCodes";
import AIAgentTest from "./pages/AIAgentTest";
import VoiceAgentDemo from "./pages/VoiceAgentDemo";
import SecurityDashboard from "./pages/SecurityDashboard";
import ProtectedDemoRoute from "./components/ProtectedDemoRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

