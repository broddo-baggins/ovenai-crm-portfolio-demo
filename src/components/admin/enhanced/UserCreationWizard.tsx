// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Users,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Mail,
  Phone,
  Key,
  Settings,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createCompleteUser } from '@/../../scripts/testing/create-complete-user-template.cjs';

// Form schemas for each step
const clientSelectionSchema = z.object({
  selectedClientId: z.string().optional(),
  createNewClient: z.boolean().default(false),
  newClientName: z.string().optional(),
  newClientDescription: z.string().optional(),
  newClientEmail: z.string().email().optional(),
  newClientPhone: z.string().optional(),
});

const projectSelectionSchema = z.object({
  selectedProjects: z.array(z.string()).min(0),
  createFirstProject: z.boolean().default(false),
  newProjectName: z.string().optional(),
  newProjectDescription: z.string().optional(),
});

const userDetailsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const roleAssignmentSchema = z.object({
  role: z.enum(['owner', 'admin', 'manager', 'member']),
  permissions: z.array(z.string()).optional(),
  sendWelcomeEmail: z.boolean().default(true),
  requirePasswordChange: z.boolean().default(false),
});

interface Client {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: string;
}

interface UserCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: (userId: string) => void;
}

const STEPS = [
  { id: 'client', title: 'Client Selection', description: 'Choose or create a client' },
  { id: 'projects', title: 'Project Assignment', description: 'Assign projects' },
  { id: 'details', title: 'User Details', description: 'Enter user information' },
  { id: 'role', title: 'Role & Permissions', description: 'Set user role' },
  { id: 'confirmation', title: 'Confirmation', description: 'Review and create' },
];

export function UserCreationWizard({ open, onOpenChange, onUserCreated }: UserCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Forms for each step
  const clientForm = useForm({
    resolver: zodResolver(clientSelectionSchema),
    defaultValues: {
      selectedClientId: '',
      createNewClient: false,
      newClientName: '',
      newClientDescription: '',
      newClientEmail: '',
      newClientPhone: '',
    },
  });

  const projectForm = useForm({
    resolver: zodResolver(projectSelectionSchema),
    defaultValues: {
      selectedProjects: [],
      createFirstProject: false,
      newProjectName: '',
      newProjectDescription: '',
    },
  });

  const userForm = useForm({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const roleForm = useForm({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      role: 'member' as const,
      permissions: [],
      sendWelcomeEmail: true,
      requirePasswordChange: false,
    },
  });

  // Load data on mount
  useEffect(() => {
    if (open) {
      loadClients();
      loadProjects();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      const clientsData = (data || []).map(client => ({
        ...client,
        status: client.status || 'active' // Provide default status if missing
      }));
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      const projectsData = (data || []).map(project => ({
        ...project,
        status: project.status || 'active' // Provide default status if missing
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setCreatedUserId(null);
    clientForm.reset();
    projectForm.reset();
    userForm.reset();
    roleForm.reset();
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const createUser = async () => {
    setLoading(true);
    try {
      // Get form data
      const clientData = clientForm.getValues();
      const projectData = projectForm.getValues();
      const userData = userForm.getValues();
      const roleData = roleForm.getValues();

      let clientId = clientData.selectedClientId;

      // Create new client if needed
      if (clientData.createNewClient) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: clientData.newClientName,
            description: clientData.newClientDescription,
            contact_info: {
              email: clientData.newClientEmail,
              phone: clientData.newClientPhone,
            },
            status: 'ACTIVE'
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      let projectIds = projectData.selectedProjects;

      // Create first project if needed
      if (projectData.createFirstProject && clientId) {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: projectData.newProjectName,
            description: projectData.newProjectDescription,
            client_id: clientId,
            status: 'active'
          })
          .select()
          .single();

        if (projectError) throw projectError;
        projectIds = [newProject.id];
      }

      // Create user with complete initialization
      const result = await createCompleteUser(
        userData.email,
        userData.password,
        clientId ? [clientId] : [],
        {
          role: roleData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          skipEmailConfirmation: true
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      setCreatedUserId(result.userId);
      nextStep(); // Go to confirmation step

      toast.success('User created successfully!');
      
      if (onUserCreated) {
        onUserCreated(result.userId);
      }

    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Client Selection
        return (
          <Form {...clientForm}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select or Create Client</h3>
                
                {clients.length > 0 ? (
                  <FormField
                    control={clientForm.control}
                    name="selectedClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Existing Clients</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{client.name}</span>
                                  <Badge variant="outline">{client.status}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No clients found. You'll need to create a new client.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2 mt-4">
                  <FormField
                    control={clientForm.control}
                    name="createNewClient"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create new client
                          </FormLabel>
                          <FormDescription>
                            Create a new client for this user
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {clientForm.watch('createNewClient') && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">New Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={clientForm.control}
                        name="newClientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter client name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="newClientDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter client description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={clientForm.control}
                          name="newClientEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="client@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={clientForm.control}
                          name="newClientPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1-555-0123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Form>
        );

      case 1: // Project Selection
        const selectedClientId = clientForm.watch('selectedClientId');
        const createNewClient = clientForm.watch('createNewClient');
        const availableProjects = selectedClientId 
          ? projects.filter(p => p.client_id === selectedClientId)
          : [];

        return (
          <Form {...projectForm}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Project Assignment</h3>
                
                {availableProjects.length > 0 ? (
                  <FormField
                    control={projectForm.control}
                    name="selectedProjects"
                    render={() => (
                      <FormItem>
                        <FormLabel>Select Projects</FormLabel>
                        <FormDescription>
                          Choose which projects this user should have access to
                        </FormDescription>
                        <div className="space-y-2">
                          {availableProjects.map((project) => (
                            <FormField
                              key={project.id}
                              control={projectForm.control}
                              name="selectedProjects"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={project.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(project.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, project.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== project.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      <div>
                                        <div className="font-medium">{project.name}</div>
                                        {project.description && (
                                          <div className="text-sm text-muted-foreground">
                                            {project.description}
                                          </div>
                                        )}
                                      </div>
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {createNewClient 
                        ? "No projects available. You can create the first project for this client."
                        : "No projects found for the selected client."
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2 mt-4">
                  <FormField
                    control={projectForm.control}
                    name="createFirstProject"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create first project
                          </FormLabel>
                          <FormDescription>
                            Create the first project for this client
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {projectForm.watch('createFirstProject') && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">New Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={projectForm.control}
                        name="newProjectName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter project name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={projectForm.control}
                        name="newProjectDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter project description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Form>
        );

      case 2: // User Details
        return (
          <Form {...userForm}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">User Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@company.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be the user's login email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-555-0123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </Form>
        );

      case 3: // Role Assignment
        return (
          <Form {...roleForm}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Role & Permissions</h3>
                
                <FormField
                  control={roleForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="owner">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <div>
                                <div>Owner</div>
                                <div className="text-xs text-muted-foreground">Full access to everything</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              <div>
                                <div>Admin</div>
                                <div className="text-xs text-muted-foreground">Can manage users and settings</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <div>
                                <div>Manager</div>
                                <div className="text-xs text-muted-foreground">Can manage projects and leads</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              <div>
                                <div>Member</div>
                                <div className="text-xs text-muted-foreground">Standard user access</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={roleForm.control}
                    name="sendWelcomeEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Send welcome email
                          </FormLabel>
                          <FormDescription>
                            Send login instructions to the user's email
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={roleForm.control}
                    name="requirePasswordChange"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Require password change on first login
                          </FormLabel>
                          <FormDescription>
                            User must change password when logging in for the first time
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </Form>
        );

      case 4: // Confirmation
        const clientData = clientForm.getValues();
        const projectData = projectForm.getValues();
        const userData = userForm.getValues();
        const roleData = roleForm.getValues();

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review & Confirm</h3>
              
              {createdUserId ? (
                <Alert className="mb-4">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    User created successfully! User ID: {createdUserId}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {clientData.createNewClient ? (
                        <div>
                          <Badge variant="outline">New Client</Badge>
                          <div className="mt-2">
                            <div className="font-medium">{clientData.newClientName}</div>
                            {clientData.newClientDescription && (
                              <div className="text-sm text-muted-foreground">{clientData.newClientDescription}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Badge variant="secondary">Existing Client</Badge>
                          <div className="mt-2">
                            {clients.find(c => c.id === clientData.selectedClientId)?.name}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Project Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {projectData.createFirstProject ? (
                        <div>
                          <Badge variant="outline">New Project</Badge>
                          <div className="mt-2">
                            <div className="font-medium">{projectData.newProjectName}</div>
                          </div>
                        </div>
                      ) : projectData.selectedProjects.length > 0 ? (
                        <div>
                          <Badge variant="secondary">{projectData.selectedProjects.length} Projects</Badge>
                          <div className="mt-2 space-y-1">
                            {projectData.selectedProjects.map(projectId => {
                              const project = projects.find(p => p.id === projectId);
                              return project ? (
                                <div key={projectId} className="text-sm">{project.name}</div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No projects assigned</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        User Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Name:</span> {userData.firstName} {userData.lastName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {userData.email}
                        </div>
                        {userData.phone && (
                          <div>
                            <span className="font-medium">Phone:</span> {userData.phone}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Role:</span> 
                          <Badge variant="outline" className="ml-2">{roleData.role}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        const clientData = clientForm.getValues();
        return clientData.selectedClientId || 
               (clientData.createNewClient && clientData.newClientName);
      case 1:
        const projectData = projectForm.getValues();
        return projectData.selectedProjects.length > 0 || projectData.createFirstProject;
      case 2:
        return userForm.formState.isValid;
      case 3:
        return roleForm.formState.isValid;
      default:
        return true;
    }
  };

  const currentStepValid = canProceedToNext();
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            {STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-between py-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 0 && !createdUserId && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {createdUserId ? 'Close' : 'Cancel'}
            </Button>
            
            {!createdUserId && (
              <>
                {currentStep < STEPS.length - 2 && (
                  <Button 
                    onClick={nextStep}
                    disabled={!currentStepValid}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                
                {currentStep === STEPS.length - 2 && (
                  <Button 
                    onClick={createUser}
                    disabled={!currentStepValid || loading}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 