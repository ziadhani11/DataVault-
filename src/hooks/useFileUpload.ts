import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  sheetName: string;
}

export interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export function useFileUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const parseExcelFile = useCallback(async (file: File): Promise<ParsedData | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | boolean | null)[][];
          
          if (jsonData.length < 2) {
            reject(new Error('File must have headers and at least one row of data'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map((row) => {
            const rowObj: Record<string, string | number | boolean | null> = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index] ?? null;
            });
            return rowObj;
          });

          resolve({ headers, rows, sheetName });
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to upload files.',
        variant: 'destructive',
      });
      return null;
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file.',
        variant: 'destructive',
      });
      return null;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 20MB.',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);

    try {
      // Parse the file first
      const parsed = await parseExcelFile(file);
      if (parsed) {
        setParsedData(parsed);
      }

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('excel-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: 'File uploaded!',
        description: `${file.name} has been uploaded and parsed successfully.`,
      });

      return fileRecord as UploadedFile;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast, parseExcelFile]);

  const fetchFiles = useCallback(async (): Promise<UploadedFile[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch files:', error);
      return [];
    }

    return data as UploadedFile[];
  }, [user]);

  const deleteFile = useCallback(async (file: UploadedFile): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('excel-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: 'File deleted',
        description: `${file.file_name} has been removed.`,
      });

      return true;
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete the file.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    uploading,
    parsedData,
    setParsedData,
    uploadFile,
    fetchFiles,
    deleteFile,
    parseExcelFile,
  };
}
