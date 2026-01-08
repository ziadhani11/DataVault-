import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDashboards } from '@/hooks/useDashboards';
import { useFileUpload, type UploadedFile } from '@/hooks/useFileUpload';

interface CreateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateDashboardModal({ isOpen, onClose, onCreated }: CreateDashboardModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { loading, createDashboard } = useDashboards();
  const { fetchFiles } = useFileUpload();

  useEffect(() => {
    if (isOpen) {
      fetchFiles().then(setFiles);
    }
  }, [isOpen, fetchFiles]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const result = await createDashboard(
      name.trim(), 
      description.trim() || undefined,
      selectedFileId || undefined
    );
    if (result) {
      setName('');
      setDescription('');
      setSelectedFileId('');
      onClose();
      onCreated?.();
      // Navigate to the new dashboard for editing
      navigate(`/dashboard/${result.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md shadow-elevated animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-2">Create New Dashboard</h2>
        <p className="text-muted-foreground mb-6">
          Create a dashboard and optionally attach an uploaded file for charts.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dashboard Name</Label>
            <Input
              id="name"
              placeholder="Q4 Sales Report"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Monthly sales analysis for Q4 2024"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Data Source (optional)</Label>
            {files.length > 0 ? (
              <select
                id="file"
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">No file attached</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.file_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Upload an Excel file first to attach it</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Dashboard'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
