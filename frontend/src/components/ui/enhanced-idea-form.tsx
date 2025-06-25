import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaceholdersAndVanishInput } from './placeholders-and-vanish-input';
import { cn } from '@/lib/utils';
import { Save, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface DraftData {
  content: string;
  timestamp: number;
  characterCount: number;
}

interface EnhancedIdeaFormProps {
  placeholders: string[];
  onSubmit: (value: string) => void;
  minLength?: number;
  maxLength?: number;
  autoSaveInterval?: number;
  className?: string;
}

const DRAFT_STORAGE_KEY = 'saas-idea-draft';
const MIN_CHARS = 50;
const MAX_CHARS = 2000;
const AUTO_SAVE_DELAY = 2000; // 2 seconds

export function EnhancedIdeaForm({
  placeholders,
  onSubmit,
  minLength = MIN_CHARS,
  maxLength = MAX_CHARS,
  autoSaveInterval = AUTO_SAVE_DELAY,
  className,
}: EnhancedIdeaFormProps) {
  const [value, setValue] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    message: '',
    type: 'info',
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const autoSaveTimeoutRef = useRef<number | null>(null);
  const initialLoadRef = useRef(false);

  // Load draft from localStorage on component mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

      if (savedDraft) {
        try {
          const draftData: DraftData = JSON.parse(savedDraft);
          const hoursSinceLastSave =
            (Date.now() - draftData.timestamp) / (1000 * 60 * 60);

          // Only prompt for drafts saved within the last 24 hours
          if (hoursSinceLastSave < 24 && draftData.content.trim().length > 0) {
            setShowDraftPrompt(true);
          }
        } catch (error) {
          // Failed to parse saved draft, remove it
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    }
  }, []);

  // Auto-save functionality
  const saveDraft = useCallback((content: string) => {
    if (content.trim().length === 0) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastSaved(null);
      return;
    }

    const draftData: DraftData = {
      content,
      timestamp: Date.now(),
      characterCount: content.length,
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    setLastSaved(new Date());
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (isDraftLoaded && value.length > 0) {
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        saveDraft(value);
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [value, autoSaveInterval, saveDraft, isDraftLoaded]);

  // Real-time validation
  useEffect(() => {
    const count = value.length;
    setCharacterCount(count);

    if (count === 0) {
      setValidation({
        isValid: false,
        message: 'Start typing your SaaS idea...',
        type: 'info',
      });
    } else if (count < minLength) {
      setValidation({
        isValid: false,
        message: `Need ${minLength - count} more characters (minimum ${minLength})`,
        type: 'warning',
      });
    } else if (count > maxLength) {
      setValidation({
        isValid: false,
        message: `${count - maxLength} characters over limit (maximum ${maxLength})`,
        type: 'error',
      });
    } else {
      setValidation({
        isValid: true,
        message: 'Looking good! Ready to generate your blueprint.',
        type: 'success',
      });
    }
  }, [value, minLength, maxLength]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      // Reset debounced save timer
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = window.setTimeout(() => {
        saveDraft(newValue);
      }, autoSaveInterval);
    },
    [saveDraft, autoSaveInterval]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (validation.isValid && value.trim()) {
        onSubmit(value);

        // Clear draft after successful submission
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setLastSaved(null);
      }
    },
    [validation.isValid, value, onSubmit]
  );

  const loadDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draftData: DraftData = JSON.parse(savedDraft);
        setValue(draftData.content);
        setLastSaved(new Date(draftData.timestamp));
        setIsDraftLoaded(true);
      } catch (error) {
        // Failed to load draft, ignore
      }
    }
    setShowDraftPrompt(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setShowDraftPrompt(false);
    setIsDraftLoaded(true);
  };

  const getValidationIcon = () => {
    switch (validation.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCharacterCountColor = () => {
    if (characterCount === 0) return 'text-gray-500';
    if (characterCount < minLength) return 'text-yellow-400';
    if (characterCount > maxLength) return 'text-red-400';
    return 'text-green-400';
  };

  const getProgressBarColor = () => {
    if (characterCount < minLength) return 'bg-yellow-400';
    if (characterCount > maxLength) return 'bg-red-400';
    return 'bg-green-400';
  };

  const progressPercentage = Math.min((characterCount / maxLength) * 100, 100);

  return (
    <div className={cn('w-full max-w-2xl mx-auto space-y-4', className)}>
      {/* Draft Prompt Modal */}
      <AnimatePresence>
        {showDraftPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Save className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Draft Found
                  </h3>
                  <p className="text-sm text-gray-400">
                    You have an unsaved idea draft
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Would you like to continue working on your previous idea or
                start fresh?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={loadDraft}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Continue Draft
                </button>
                <button
                  onClick={discardDraft}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                >
                  Start Fresh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Form Input */}
      <div className="space-y-4">
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          value={value}
        />

        {/* Character Count and Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getValidationIcon()}
              <span
                className={cn(
                  'transition-colors truncate',
                  validation.type === 'success' && 'text-green-400',
                  validation.type === 'warning' && 'text-yellow-400',
                  validation.type === 'error' && 'text-red-400',
                  validation.type === 'info' && 'text-blue-400'
                )}
                title={validation.message}
              >
                {validation.message}
              </span>
            </div>

            <div
              className={cn(
                'font-mono transition-colors text-sm ml-2',
                getCharacterCountColor()
              )}
            >
              {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className={cn(
                'h-full transition-all duration-300',
                getProgressBarColor()
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Auto-save Status */}
        <AnimatePresence>
          {lastSaved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs text-gray-400 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/30"
            >
              <Clock className="w-3 h-3 text-blue-400" />
              <span>
                Draft saved at{' '}
                {lastSaved.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
