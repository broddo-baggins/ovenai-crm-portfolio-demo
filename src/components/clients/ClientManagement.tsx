import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { simpleProjectService } from '@/services/simpleProjectService';
import { Client } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const ClientManagement: React.FC = () => {
  const { t } = useTranslation(['common', 'clients']);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // New client form state
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    contactName: ''
  });

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      
      // Use simple service for direct Site DB access
      const clientsData = await simpleProjectService.getClients();
      setClients(clientsData || []);
      
      
    } catch (error) {
      console.error('ERROR Error loading clients:', error);
      setError('Failed to load clients. Please try again.');
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      toast.error('Client name is required');
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('Creating new client:', newClient);
      
      // Create client using simple service (to be implemented)
      // For now, show success - we'll implement client creation if needed
      toast.success('Client creation will be implemented');
      
      // Reset form
      setNewClient({
        name: '',
        email: '',
        phone: '',
        contactName: ''
      });

      // Reload clients
      await loadClients();
      
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setIsCreating(false);
    }
  };

  const _getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    if (!client) return false; // Safety check for null clients
    
    const matchesSearch = (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.contact_info?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.contact_info?.primary_contact_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary-600" />
            Client Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your clients and their information
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Client Name *</Label>
                <Input
                  id="client-name"
                  placeholder="Enter client name"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Person</Label>
                <Input
                  id="contact-name"
                  placeholder="Enter contact person name"
                  value={newClient.contactName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, contactName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="Enter client email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  placeholder="Enter client phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleCreateClient} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
                            <option value="active">{t('common:status.active', 'Active')}</option>
                <option value="inactive">{t('common:status.inactive', 'Inactive')}</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Clients Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary-600" />
                    {client.name}
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  {client.contact_info?.primary_contact_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{client.contact_info.primary_contact_name}</span>
                    </div>
                  )}
                  {client.contact_info?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{client.contact_info.email}</span>
                    </div>
                  )}
                  {client.contact_info?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{client.contact_info.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Created {new Date(client.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first client to get started'
            }
          </p>
        </div>
      )}

      {/* Stats Summary */}
      {!isLoading && clients.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-primary-600">{clients.length}</div>
              <div className="text-gray-600">Total Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {clients.filter(c => c && c.contact_info?.email).length}
              </div>
              <div className="text-gray-600">With Email</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {clients.filter(c => c && c.contact_info?.phone).length}
              </div>
              <div className="text-gray-600">With Phone</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">0</div>
              <div className="text-gray-600">Total Projects</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement; 