import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  TrendingUp,
  Calendar,
  MapPin,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface SecurityEvent {
  date: string;
  event_type: string;
  risk_level: string;
  event_count: number;
  unique_ips: number;
  unique_users: number;
}

interface AuditLog {
  id: string;
  event_type: string;
  risk_level: string;
  ip_address: string | null;
  user_agent: string | null;
  event_details: any;
  created_at: string;
}

interface SessionAnomaly {
  id: string;
  session_token: string;
  anomaly_type: string;
  previous_value: string;
  current_value: string;
  confidence_score: number;
  created_at: string;
  investigated: boolean;
}

const SecurityDashboard = () => {
  const [dashboardData, setDashboardData] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [anomalies, setAnomalies] = useState<SessionAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data
      const { data: dashboard, error: dashboardError } = await supabase.rpc('get_security_dashboard');
      if (dashboardError) throw dashboardError;

      // Fetch recent audit logs
      const { data: logs, error: logsError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (logsError) throw logsError;

      // Fetch recent anomalies
      const { data: anomaliesData, error: anomaliesError } = await supabase
        .from('session_anomalies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (anomaliesError) throw anomaliesError;

      setDashboardData(dashboard || []);
      setAuditLogs((logs as AuditLog[]) || []);
      setAnomalies((anomaliesData as SessionAnomaly[]) || []);
    } catch (err: any) {
      console.error('Failed to fetch security data:', err);
      setError(err.message || 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getTotalEvents = () => {
    return dashboardData.reduce((sum, event) => sum + event.event_count, 0);
  };

  const getHighRiskEvents = () => {
    return dashboardData
      .filter(event => ['high', 'critical'].includes(event.risk_level))
      .reduce((sum, event) => sum + event.event_count, 0);
  };

  const getUniqueThreats = () => {
    const threatTypes = new Set(dashboardData.map(event => event.event_type));
    return threatTypes.size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Security Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor security events, anomalies, and system access patterns
            </p>
          </div>
          <Button onClick={fetchSecurityData} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalEvents()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{getHighRiskEvents()}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threat Types</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getUniqueThreats()}</div>
              <p className="text-xs text-muted-foreground">Different attack patterns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anomalies.length}</div>
              <p className="text-xs text-muted-foreground">Session anomalies</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  Aggregated security events from the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No security events recorded</p>
                  ) : (
                    dashboardData.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge variant={getRiskBadgeVariant(event.risk_level)}>
                            {event.risk_level.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{event.event_count} events</p>
                          <p className="text-muted-foreground">{event.unique_ips} unique IPs</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Detailed security audit trail (last 50 events)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No audit logs available</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant={getRiskBadgeVariant(log.risk_level)}>
                              {log.risk_level}
                            </Badge>
                            <span className="font-medium">{log.event_type.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                          </div>
                        </div>
                        {log.ip_address && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>IP: {log.ip_address}</span>
                          </div>
                        )}
                        {log.event_details && Object.keys(log.event_details).length > 0 && (
                          <div className="text-sm">
                            <details className="cursor-pointer">
                              <summary className="text-muted-foreground hover:text-foreground">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(log.event_details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Anomalies</CardTitle>
                <CardDescription>
                  Detected behavioral anomalies in user sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anomalies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No anomalies detected</p>
                  ) : (
                    anomalies.map((anomaly) => (
                      <div key={anomaly.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary">{anomaly.anomaly_type.replace(/_/g, ' ')}</Badge>
                            <span className="text-sm">
                              Confidence: {Math.round(anomaly.confidence_score * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(anomaly.created_at), 'MMM dd, HH:mm:ss')}
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">From:</span> {anomaly.previous_value}</p>
                          <p><span className="font-medium">To:</span> {anomaly.current_value}</p>
                        </div>
                        {!anomaly.investigated && (
                          <Badge variant="outline" className="text-xs">Needs Investigation</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecurityDashboard;