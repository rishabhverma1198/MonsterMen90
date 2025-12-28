import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield } from 'lucide-react';

interface AdminConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  operation: string;
  resource: string;
  resourceName?: string;
  onConfirm: (confirmationText?: string) => void | Promise<void>;
  destructive?: boolean;
  requiresTextConfirmation?: boolean;
  confirmationText?: string;
  children?: React.ReactNode;
}

export function AdminConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  operation,
  resource,
  resourceName,
  onConfirm,
  destructive = false,
  requiresTextConfirmation = false,
  confirmationText = "DELETE",
  children
}: AdminConfirmationDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (requiresTextConfirmation && confirmationInput !== confirmationText) {
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm(confirmationInput);
      onOpenChange(false);
      setConfirmationInput('');
    } catch (error) {
      console.error('Admin confirmation failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setConfirmationInput('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              destructive 
                ? 'bg-red-100 text-red-600' 
                : 'bg-orange-100 text-orange-600'
            }`}>
              {destructive ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                {title}
              </AlertDialogTitle>
              <div className="text-xs text-gray-500 mt-1">
                Operation: {operation} • Resource: {resource}
                {resourceName && ` • ${resourceName}`}
              </div>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4">
          <AlertDialogDescription className="text-left mb-4">
            {description}
          </AlertDialogDescription>

          {requiresTextConfirmation && (
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-bold">{confirmationText}</span> to confirm:
              </Label>
              <Input
                id="confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${confirmationText}"`}
                className={`${
                  confirmationInput !== confirmationText && confirmationInput.length > 0
                    ? 'border-red-300 focus:border-red-500'
                    : ''
                }`}
              />
              {confirmationInput !== confirmationText && confirmationInput.length > 0 && (
                <p className="text-sm text-red-600">
                  Text must match exactly: {confirmationText}
                </p>
              )}
            </div>
          )}

          {children}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isConfirming}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={
              isConfirming || 
              (requiresTextConfirmation && confirmationInput !== confirmationText)
            }
            className={destructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isConfirming ? 'Confirming...' : destructive ? 'Delete' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AdminConfirmationDialog;