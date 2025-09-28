import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PropertyImportPreviewModalProps {
  submission: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
  brokerUserId: any;
}

export default function PropertyImportPreviewModal({
  submission,
  open,
  onOpenChange,
  onImport,
  brokerUserId
}: PropertyImportPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prévia da Importação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Propriedade será importada
          </p>
          
          <div className="flex gap-2">
            <Button onClick={onImport}>Importar</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}