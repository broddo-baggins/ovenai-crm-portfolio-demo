import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Plus, Edit, Eye, Phone, Mail, Calendar, Users, MessageSquare, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  description?: string;
  contact_info?: any;
  subscription_plan?: string;
  status: 'active' | 'inactive' | 'trial';
  created_at: string;
  user_count?: number;
  message_count?: number;
  leads_count?: number;
}

interface CompanyDialogProps {
  trigger?: React.ReactNode;
  company?: Company;
  mode: 'create' | 'edit' | 'view';
  onSuccess?: (company: Company) => void;
}

export function CompanyManagementDialog({ trigger, company, mode, onSuccess }: CompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    subscription_plan: company?.subscription_plan || 'free',
    status: company?.status || 'active',
    contact_email: company?.contact_info?.email || '',
    contact_phone: company?.contact_info?.phone || '',
    contact_address: company?.contact_info?.address || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    setLoading(true);
    try {
      const companyData = {
        name: formData.name,
        description: formData.description,
        subscription_plan: formData.subscription_plan,
        status: formData.status,
        contact_info: {
          email: formData.contact_email,
          phone: formData.contact_phone,
          address: formData.contact_address
        }
      };

      let result;
      if (mode === 'create') {
        const { data, error } = await supabase
          .from('clients')
          .insert([companyData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Company created successfully');
      } else if (mode === 'edit' && company) {
        const { data, error } = await supabase
          .from('clients')
          .update(companyData)
          .eq('id', company.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Company updated successfully');
      }

      onSuccess?.(result);
      setOpen(false);
      
      // Reset form for create mode
      if (mode === 'create') {
        setFormData({
          name: '', description: '', subscription_plan: 'free', status: 'active',
          contact_email: '', contact_phone: '', contact_address: ''
        });
      }
    } catch (error) {
      toast.error(`Failed to ${mode} company`);
      console.error('Company operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitleAndDescription = () => {
    switch (mode) {
      case 'create':
        return { title: 'Create New Company', description: 'Add a new client company to the system' };
      case 'edit':
        return { title: 'Edit Company', description: 'Update company information and settings' };
      case 'view':
        return { title: 'Company Details', description: 'View company information and statistics' };
    }
  };

  const { title, description } = getTitleAndDescription();

  const defaultTrigger = (
    <Button variant={mode === 'create' ? 'default' : 'outline'} size="sm">
      {mode === 'create' && <Plus className="w-4 h-4 mr-2" />}
      {mode === 'edit' && <Edit className="w-4 h-4" />}
      {mode === 'view' && <Eye className="w-4 h-4" />}
      {mode === 'create' ? 'New Company' : ''}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === 'view' && company ? (
          <div className="space-y-6">
            {/* Company Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Company Name</Label>
                    <p className="text-lg font-semibold">{company.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                      {company.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Subscription Plan</Label>
                    <Badge variant={company.subscription_plan === 'pro' ? 'default' : 'outline'}>
                      {company.subscription_plan}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p>{new Date(company.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {company.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{company.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{company.user_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Users</p>
                  </div>
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{company.message_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Messages</p>
                  </div>
                  <div className="text-center">
                    <Target className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{company.leads_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            {company.contact_info && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {company.contact_info.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{company.contact_info.email}</span>
                    </div>
                  )}
                  {company.contact_info.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{company.contact_info.phone}</span>
                    </div>
                  )}
                  {company.contact_info.address && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{company.contact_info.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the company..."
                />
              </div>
              <div>
                <Label htmlFor="subscription_plan">Subscription Plan</Label>
                <Select value={formData.subscription_plan} onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_address">Address</Label>
                <Textarea
                  id="contact_address"
                  value={formData.contact_address}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                  placeholder="Company address..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (mode === 'create' ? 'Create Company' : 'Save Changes')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Create Company Dialog specifically
export function CreateCompanyDialog({ trigger, onSuccess }: { trigger?: React.ReactNode; onSuccess?: (company: Company) => void }) {
  return <CompanyManagementDialog mode="create" trigger={trigger} onSuccess={onSuccess} />;
}

// Edit Company Dialog specifically  
export function EditCompanyDialog({ company, trigger, onSuccess }: { company: Company; trigger?: React.ReactNode; onSuccess?: (company: Company) => void }) {
  return <CompanyManagementDialog mode="edit" company={company} trigger={trigger} onSuccess={onSuccess} />;
}

// View Company Dialog specifically
export function ViewCompanyDialog({ company, trigger }: { company: Company; trigger?: React.ReactNode }) {
  return <CompanyManagementDialog mode="view" company={company} trigger={trigger} />;
} 