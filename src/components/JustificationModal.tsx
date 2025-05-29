'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Action } from '@/types';

interface JustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  action: Partial<Action> | null;
}

export default function JustificationModal({ isOpen, onClose, onConfirm, action }: JustificationModalProps) {
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (isOpen) {
      setJustification('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !action) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (justification.trim()) {
      onConfirm(justification.trim());
    }
  };

  const getActionDescription = () => {
    switch (action.type) {
      case 'delete':
        return `Why are you removing "${action.originalText}"?`;
      case 'edit':
        return `Why are you changing this criterion?`;
      case 'add':
        return `Why are you adding this new criterion?`;
      default:
        return 'Please provide a justification for this change:';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg card card-elevated animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Justify Your Change</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ 
              color: 'var(--color-muted-foreground)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
              {getActionDescription()}
            </p>
            
            {action.type === 'edit' && action.originalText && action.newText && (
              <div className="space-y-2 mb-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#EF4444' }}>Original</p>
                  <p className="text-sm">{action.originalText}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#22C55E' }}>New</p>
                  <p className="text-sm">{action.newText}</p>
                </div>
              </div>
            )}
            
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain your reasoning..."
              className="textarea"
              rows={4}
              autoFocus
              required
            />
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
              Good justifications explain why this change improves the rubric
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!justification.trim()}
              className="btn-primary"
            >
              Confirm Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 