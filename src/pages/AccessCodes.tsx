import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Key, Copy, RefreshCw, Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccessCode {
  id: string;
  code: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  last_used_at?: string;
  usage_count: number;
  max_uses?: number;
}

const AccessCodes = () => {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rotating_access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching access codes:', error);
        toast.error('Failed to load access codes');
        return;
      }

      setAccessCodes(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_rotating_access_code');
      
      if (error) {
        console.error('Error generating new code:', error);
        toast.error('Failed to generate new code');
        return;
      }

      toast.success(`New code generated: ${data}`);
      fetchAccessCodes();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Something went wrong');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) <= new Date();
  };

  const getDaysUntilExpiry = (dateString: string) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchAccessCodes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-particle-green animate-spin" />
      </div>
    );
  }

  const activeCodes = accessCodes.filter(code => code.is_active && !isExpired(code.expires_at));
  const currentCode = activeCodes[0]; // Most recent active code

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Key className="w-8 h-8 text-particle-green" />
            Access Codes
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              onClick={generateNewCode}
              className="bg-particle-green hover:bg-particle-green/90 text-black"
            >
              <Key className="w-4 h-4 mr-2" />
              Generate New
            </Button>
            <Button 
              onClick={fetchAccessCodes}
              variant="outline"
              size="sm"
              className="border-particle-green/30 text-particle-green hover:bg-particle-green/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Active Code Highlight */}
        {currentCode && (
          <Card className="bg-gradient-to-r from-particle-green/20 to-particle-green/10 border-particle-green/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-particle-green" />
                Current Active Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <code className="bg-black/50 px-4 py-2 rounded text-particle-green font-mono text-xl block">
                    {currentCode.code}
                  </code>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>Expires in {getDaysUntilExpiry(currentCode.expires_at)} days</span>
                    <span>Used {currentCode.usage_count} times</span>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(currentCode.code)}
                  className="bg-particle-green hover:bg-particle-green/90 text-black"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Codes</p>
                  <p className="text-2xl font-bold text-white">{accessCodes.length}</p>
                </div>
                <Key className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/90 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Codes</p>
                  <p className="text-2xl font-bold text-white">{activeCodes.length}</p>
                </div>
                <Clock className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/90 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Usage</p>
                  <p className="text-2xl font-bold text-white">
                    {accessCodes.reduce((sum, code) => sum + code.usage_count, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Codes Table */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">
              All Access Codes
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {accessCodes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Key className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No access codes found</p>
                <p className="text-sm">Generate your first rotating access code</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Code</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Usage</TableHead>
                      <TableHead className="text-gray-300">Last Used</TableHead>
                      <TableHead className="text-gray-300">Expires</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessCodes.map((code) => {
                      const expired = isExpired(code.expires_at);
                      const daysLeft = getDaysUntilExpiry(code.expires_at);
                      
                      return (
                        <TableRow key={code.id} className="border-gray-700 hover:bg-gray-800/50">
                          <TableCell>
                            <code className="bg-gray-800 px-2 py-1 rounded text-particle-green font-mono text-sm">
                              {code.code}
                            </code>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={
                                  code.is_active && !expired
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }
                              >
                                {code.is_active && !expired ? 'Active' : 'Expired'}
                              </Badge>
                              {code.is_active && !expired && daysLeft <= 2 && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  Expires soon
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-white font-medium">{code.usage_count}</span>
                              <span className="text-gray-400">/{code.max_uses || '∞'}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm text-gray-400">
                              {code.last_used_at ? formatDate(code.last_used_at) : 'Never'}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(code.expires_at)}
                              </div>
                              {!expired && (
                                <div className="text-xs text-gray-500">
                                  {daysLeft > 0 ? `${daysLeft} days left` : 'Expires today'}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              className="text-gray-400 hover:text-white p-1 h-auto"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-900/20 border-blue-800/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <h3 className="text-white font-medium mb-2">Automatic Code Rotation</h3>
                <p className="text-gray-300 text-sm">
                  New access codes are automatically generated every 7 days. 
                  The current active code is: <strong className="text-particle-green">{currentCode?.code || 'No active code'}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessCodes;