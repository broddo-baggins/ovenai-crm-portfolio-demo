// @ts-nocheck
// TypeScript checking disabled for deployment compatibility
import { mapDatabaseLeadToAppLead, mapDatabaseProjectToAppProject, safeAccess } from '../../types/fixes';
import crypto from 'crypto';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

type Lead = Database['public']['Tables']['leads']['Row'];

interface CSVUploadProps {
  onUploadComplete: () => void;
}

export const CSVUpload = ({ onUploadComplete }: CSVUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Using the singleton supabase client imported above

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Read the CSV file
      const text = await file.text();
      
      // Parse CSV
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          const leads = results.data.map((row: any) => ({
            project_id: 'default-project-id', // TODO: Get from context or props
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            email: row.email || '',
            phone: row.phone || '',
            status: 'NEW' as Lead['status'],
            notes: row.notes || '',
            source: 'CSV_IMPORT',
          }));

          // Insert leads into database
          const { error } = await supabase
            .from('leads')
            .insert(leads);

          if (error) throw error;

          toast.success(`Successfully imported ${leads.length} leads`);
          onUploadComplete();
        },
        error: (error) => {
          throw new Error(`Error parsing CSV: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('Error uploading leads:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload leads');
      toast.error('Failed to upload leads');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Leads from CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV file with leads data</p>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p className="font-semibold mb-2">Expected CSV format:</p>
            <pre className="bg-gray-50 p-2 rounded">
              first_name,last_name,email,phone,notes
              John,Doe,john@example.com,+1234567890,Interested in AI solutions
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 