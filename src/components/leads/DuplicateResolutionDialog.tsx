// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Building, 
  Calendar,
  Merge,
  Save,
  X,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead } from '@/types';
import { toast } from 'sonner';

interface DuplicateResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newLead: Partial<Lead>;
  duplicateLeads: Lead[];
  confidence: number;
  duplicateField: string;
  onSaveAnyway: () => void;
  onMergeLeads: (primaryLead: Lead, secondaryLeads: Lead[]) => void;
  onViewSimilar: (lead: Lead) => void;
}

export const DuplicateResolutionDialog: React.FC<DuplicateResolutionDialogProps> = ({
  isOpen,
  onClose,
  newLead,
  duplicateLeads,
  confidence,
  duplicateField,
  onSaveAnyway,
  onMergeLeads,
  onViewSimilar
}) => {
  const [selectedPrimaryLead, setSelectedPrimaryLead] = useState<Lead | null>(null);
  const [mergeConfirmation, setMergeConfirmation] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'bg-red-100 text-red-800 border-red-200';
    if (confidence >= 80) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 95) return 'Very High';
    if (confidence >= 80) return 'High';
    return 'Moderate';
  };

  const handleMergeLeads = () => {
    if (!selectedPrimaryLead) {
      toast.error('Please select a primary lead to merge into');
      return;
    }

    const secondaryLeads = duplicateLeads.filter(lead => lead.id !== selectedPrimaryLead.id);
    onMergeLeads(selectedPrimaryLead, secondaryLeads);
    onClose();
  };

  const handleSaveAnyway = () => {
    onSaveAnyway();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Potential Duplicate Lead Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicateLeads.length} existing lead{duplicateLeads.length > 1 ? 's' : ''} with similar {duplicateField} information.
            Please review and choose how to proceed.
          </DialogDescription>
        </DialogHeader>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className={cn('gap-1', getConfidenceColor(confidence))}>
            <AlertTriangle className="h-3 w-3" />
            {getConfidenceText(confidence)} Confidence ({confidence}%)
          </Badge>
          <span className="text-sm text-muted-foreground">
            Duplicate detected based on {duplicateField}
          </span>
        </div>

        {/* New Lead Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              New Lead (To Be Created)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <strong>Name:</strong> {newLead.first_name} {newLead.last_name}
                </div>
                {newLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {newLead.email}
                  </div>
                )}
                {newLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {newLead.phone}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {newLead.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {newLead.company}
                  </div>
                )}
                {newLead.position && (
                  <div><strong>Position:</strong> {newLead.position}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Existing Duplicate Leads */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Existing Similar Leads ({duplicateLeads.length})
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {duplicateLeads.map((lead) => (
              <Card 
                key={lead.id} 
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  selectedPrimaryLead?.id === lead.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedPrimaryLead(lead)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={selectedPrimaryLead?.id === lead.id}
                          onChange={() => setSelectedPrimaryLead(lead)}
                          className="mt-0.5"
                        />
                        <strong className="text-lg">{lead.first_name} {lead.last_name}</strong>
                        <Badge variant="outline">ID: {lead.id.slice(0, 8)}...</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {lead.company}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Created: {formatDate(lead.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewSimilar(lead);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Lead Status and Details */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      Status: {lead.state || 'unknown'}
                    </Badge>
                    <Badge variant="outline">
                      Heat: {lead.heat || 'cold'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <Button
              variant="destructive"
              onClick={handleSaveAnyway}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as New Lead Anyway
            </Button>
            
            <Button
              variant="default"
              onClick={handleMergeLeads}
              disabled={!selectedPrimaryLead}
              className="flex-1"
            >
              <Merge className="h-4 w-4 mr-2" />
              Merge into Selected Lead
            </Button>
          </div>
          
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Merge Confirmation */}
        {selectedPrimaryLead && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Merge Action:</strong> The new lead information will be merged into{' '}
              <strong>{selectedPrimaryLead.first_name} {selectedPrimaryLead.last_name}</strong>.
              Missing information will be added, and conflicting information will be noted.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 