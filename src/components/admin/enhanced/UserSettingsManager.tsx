// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Key, Save, Trash2, Plus, Settings, Shield, Database } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface UserApiKey {
  id: string;
  user_id: string;
  service_name: string;
  key_name: string;
  encrypted_key: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

interface UserSetting {
  id: string;
  user_id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  updated_at: string;
}

export function UserSettingsManager() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [settings, setSettings] = useState<UserSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState({
    service_name: '',
    key_name: '',
    key_value: ''
  });
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'string' as const
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserData();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('full_name');
    
    if (error) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    
    setUsers(data || []);
  };

  const loadUserData = async () => {
    setLoading(true);
    
    // Load API keys and settings in parallel
    const [keysResult, settingsResult] = await Promise.all([
      supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('setting_key')
    ]);

    if (keysResult.error) {
      toast({
        title: "Error loading API keys",
        description: keysResult.error.message,
        variant: "destructive"
      });
    } else {
      setApiKeys(keysResult.data || []);
    }

    if (settingsResult.error) {
      toast({
        title: "Error loading settings",
        description: settingsResult.error.message,
        variant: "destructive"
      });
    } else {
      setSettings(settingsResult.data || []);
    }

    setLoading(false);
  };

  const addApiKey = async () => {
    if (!selectedUserId || !newApiKey.service_name || !newApiKey.key_name || !newApiKey.key_value) {
      toast({
        title: "Missing fields",
        description: "Please fill in all API key fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: selectedUserId,
        service_name: newApiKey.service_name,
        key_name: newApiKey.key_name,
        encrypted_key: btoa(newApiKey.key_value), // Simple encoding - in production use proper encryption
        is_active: true
      });

    if (error) {
      toast({
        title: "Error adding API key",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "API key added",
      description: `${newApiKey.service_name} key added successfully`
    });

    setNewApiKey({ service_name: '', key_name: '', key_value: '' });
    loadUserData();
  };

  const deleteApiKey = async (keyId: string) => {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId);

    if (error) {
      toast({
        title: "Error deleting API key",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "API key deleted",
      description: "API key removed successfully"
    });

    loadUserData();
  };

  const toggleApiKey = async (keyId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('user_api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId);

    if (error) {
      toast({
        title: "Error updating API key",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    loadUserData();
  };

  const addSetting = async () => {
    if (!selectedUserId || !newSetting.setting_key || !newSetting.setting_value) {
      toast({
        title: "Missing fields",
        description: "Please fill in setting key and value",
        variant: "destructive"
      });
      return;
    }

    let processedValue = newSetting.setting_value;
    if (newSetting.setting_type === 'number') {
      processedValue = parseFloat(newSetting.setting_value);
    } else if (newSetting.setting_type === 'boolean') {
      processedValue = newSetting.setting_value.toLowerCase() === 'true';
    } else if (newSetting.setting_type === 'json') {
      try {
        processedValue = JSON.parse(newSetting.setting_value);
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please provide valid JSON format",
          variant: "destructive"
        });
        return;
      }
    }

    const { error } = await supabase
      .from('user_settings')
      .insert({
        user_id: selectedUserId,
        setting_key: newSetting.setting_key,
        setting_value: processedValue,
        setting_type: newSetting.setting_type
      });

    if (error) {
      toast({
        title: "Error adding setting",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Setting added",
      description: `${newSetting.setting_key} setting added successfully`
    });

    setNewSetting({ setting_key: '', setting_value: '', setting_type: 'string' });
    loadUserData();
  };

  const updateSetting = async (settingId: string, newValue: any) => {
    const { error } = await supabase
      .from('user_settings')
      .update({ setting_value: newValue })
      .eq('id', settingId);

    if (error) {
      toast({
        title: "Error updating setting",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    loadUserData();
  };

  const deleteSetting = async (settingId: string) => {
    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('id', settingId);

    if (error) {
      toast({
        title: "Error deleting setting",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Setting deleted",
      description: "Setting removed successfully"
    });

    loadUserData();
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatKeyValue = (encryptedKey: string, keyId: string) => {
    if (showKeys[keyId]) {
      try {
        return atob(encryptedKey);
      } catch {
        return encryptedKey;
      }
    }
    return '••••••••••••••••';
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">User Settings & API Keys</h2>
          <p className="text-muted-foreground">Manage user configurations and integrations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Select User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a user to manage..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <span>{user.full_name || user.email}</span>
                    <Badge variant={user.role === 'ceo' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUserId && (
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys for {selectedUser?.full_name || selectedUser?.email}</CardTitle>
                <CardDescription>
                  Manage integration keys for Meta, Calendly, and other services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new API key form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New API Key
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="service-name">Service Name</Label>
                      <Select value={newApiKey.service_name} onValueChange={(value) => setNewApiKey(prev => ({ ...prev, service_name: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meta">Meta (WhatsApp)</SelectItem>
                          <SelectItem value="calendly">Calendly</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="supabase">Supabase</SelectItem>
                          <SelectItem value="n8n">N8N</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Production API Key"
                        value={newApiKey.key_name}
                        onChange={(e) => setNewApiKey(prev => ({ ...prev, key_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="key-value">Key Value</Label>
                      <Input
                        id="key-value"
                        type="password"
                        placeholder="Enter API key..."
                        value={newApiKey.key_value}
                        onChange={(e) => setNewApiKey(prev => ({ ...prev, key_value: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={addApiKey} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add API Key
                  </Button>
                </div>

                <Separator />

                {/* Existing API keys */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-4">Loading API keys...</div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No API keys found for this user
                    </div>
                  ) : (
                    apiKeys.map(apiKey => (
                      <Card key={apiKey.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                                {apiKey.service_name}
                              </Badge>
                              <span className="font-medium">{apiKey.key_name}</span>
                              <Switch
                                checked={apiKey.is_active}
                                onCheckedChange={(checked) => toggleApiKey(apiKey.id, checked)}
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {formatKeyValue(apiKey.encrypted_key, apiKey.id)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                              >
                                {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created: {new Date(apiKey.created_at).toLocaleDateString()}
                              {apiKey.last_used_at && ` • Last used: ${new Date(apiKey.last_used_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Settings for {selectedUser?.full_name || selectedUser?.email}</CardTitle>
                <CardDescription>
                  Configure user preferences and application settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new setting form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Setting
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="setting-key">Setting Key</Label>
                      <Input
                        id="setting-key"
                        placeholder="e.g., theme_preference"
                        value={newSetting.setting_key}
                        onChange={(e) => setNewSetting(prev => ({ ...prev, setting_key: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="setting-type">Type</Label>
                      <Select value={newSetting.setting_type} onValueChange={(value: any) => setNewSetting(prev => ({ ...prev, setting_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="setting-value">Value</Label>
                      {newSetting.setting_type === 'json' ? (
                        <Textarea
                          id="setting-value"
                          placeholder='{"key": "value"}'
                          value={newSetting.setting_value}
                          onChange={(e) => setNewSetting(prev => ({ ...prev, setting_value: e.target.value }))}
                        />
                      ) : (
                        <Input
                          id="setting-value"
                          placeholder={newSetting.setting_type === 'boolean' ? 'true/false' : 'Enter value...'}
                          value={newSetting.setting_value}
                          onChange={(e) => setNewSetting(prev => ({ ...prev, setting_value: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>
                  <Button onClick={addSetting} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Setting
                  </Button>
                </div>

                <Separator />

                {/* Existing settings */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-4">Loading settings...</div>
                  ) : settings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No settings found for this user
                    </div>
                  ) : (
                    settings.map(setting => (
                      <Card key={setting.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{setting.setting_type}</Badge>
                              <span className="font-medium">{setting.setting_key}</span>
                            </div>
                            <div className="mt-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm block">
                                {typeof setting.setting_value === 'object' 
                                  ? JSON.stringify(setting.setting_value, null, 2)
                                  : String(setting.setting_value)
                                }
                              </code>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Updated: {new Date(setting.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSetting(setting.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 