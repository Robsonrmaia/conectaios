import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PropertyImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  onConfirm: () => Promise<void>;
}

export default function PropertyImportPreviewModal({
  isOpen,
  onClose,
  properties,
  onConfirm
}: PropertyImportPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prévia da Importação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {properties.length} propriedades serão importadas
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onConfirm}>
              Confirmar Importação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}