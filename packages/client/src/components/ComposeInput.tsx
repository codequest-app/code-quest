import type { FileSearchResult } from '@code-quest/shared';
import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useClickOutside } from '../hooks/useClickOutside';
import { useInputHistory } from '../hooks/useInputHistory';
import { cn } from '../utils/cn';
import { findModel, getEffortLevels } from '../utils/model-utils';
import { getMentionQuery, MENTION_REGEX } from '../utils/slash-query';
import { MentionDropdown } from './MentionDropdown';
import { SparkLegend } from './SparkLegend';

const TEXTAREA_CLASS =
  'w-full bg-transparent text-text px-3.5 py-2.5 resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted overflow-hidden [grid-area:1/1]';

export function ComposeInput() {
  const { isProcessing, searchFiles } = useChannelMessages();
  const {
    model,
    availableModels,
    effort,
    isFastMode,
    providerConfig,
    permissionMode,
    setPermissionMode,
  } = useChannelConfig();
  const compose = useChannelCompose();

  const modelEntry = (model ? findModel(model, availableModels) : undefined) ?? availableModels[0];
  const effortLevels = getEffortLevels(modelEntry);

  const {
    value,
    updateValue,
    cursorPos,
    setCursorPos,
    registerFocus,
    registerMentionTrigger,
    slashOpen,
    mentionOpen,
    openMention,
    closeMention,
    dismissSlash,
    submit,
    attachedFiles,
    addAttachments,
    removeAttachment,
  } = compose;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    registerFocus((pos?: number) => {
      const el = textareaRef.current;
      if (!el) return;
      setTimeout(() => {
        el.focus();
        if (pos !== undefined) el.setSelectionRange(pos, pos);
      }, 0);
    });
  }, [registerFocus]);

  const inputHistory = useInputHistory();
  const mentionContainerRef = useRef<HTMLDivElement>(null);
  const [fileResults, setFileResults] = useState<FileSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const scrollActiveIntoView = (el: HTMLDivElement | null) => {
    el?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  };

  useClickOutside(
    [mentionContainerRef, textareaRef],
    () => {
      handleCloseMention();
      setFileResults([]);
    },
    mentionOpen,
  );

  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const mentionQuery = mentionOpen ? getMentionQuery(value, cursorPos) : null;

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    setSearchStatus('loading');
    const result = await searchFiles(query);
    setFileResults(result.ok ? result.data.files : []);
    setSearchStatus('done');
  }, 200);

  // biome-ignore lint/correctness/useExhaustiveDependencies: debouncedSearch is stable (useDebouncedCallback)
  useEffect(() => {
    registerMentionTrigger((value: string, pos: number) => {
      const query = getMentionQuery(value, pos);
      if (query !== null) {
        setSelectedIndex(-1);
        setSearchStatus('loading');
        debouncedSearch(query);
      }
    });
  }, [registerMentionTrigger]);

  const handleChange = (newValue: string) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? newValue.length;
    updateValue(newValue, pos);

    const query = getMentionQuery(newValue, pos);
    if (query !== null) {
      openMention();
      setSelectedIndex(-1);
      debouncedSearch(query);
    } else {
      handleCloseMention();
      setFileResults([]);
    }
  };

  const handleSelectMention = (suggestion: string, navigateInto: boolean) => {
    const pos = cursorPos;
    const before = value.slice(0, pos);
    const match = before.match(MENTION_REGEX);
    if (!match) return;

    const start = before.length - match[0].length + (match[1] ? 1 : 0);

    if (navigateInto) {
      const newValue = `${value.slice(0, start)}${suggestion}${value.slice(pos)}`;
      const newCursorPos = start + suggestion.length;
      updateValue(newValue, newCursorPos);
      setSelectedIndex(0);
      const newQuery = getMentionQuery(newValue, newCursorPos);
      if (newQuery !== null) {
        debouncedSearch(newQuery);
      }
      textareaRef.current?.focus();
      return;
    }

    const newValue = `${value.slice(0, start)}${suggestion} ${value.slice(pos)}`;
    updateValue(newValue);
    handleCloseMention();
    setFileResults([]);
    setSearchStatus('idle');
    textareaRef.current?.focus();
  };

  const syncCursorPos = () => {
    const el = textareaRef.current;
    if (el) setCursorPos(el.selectionStart);
  };

  function handleCloseMention() {
    closeMention();
    setFileResults([]);
  }

  function handlePermissionCycleShortcut(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (e.key !== 'Tab' || !e.shiftKey || slashOpen || mentionOpen) return false;
    e.preventDefault();
    const configModes = providerConfig?.permissionModes;
    const modeIds = configModes?.length
      ? configModes.map((m) => m.id)
      : ['normal', 'acceptEdits', 'plan', 'bypassPermissions'];
    const currentIndex = modeIds.indexOf(permissionMode ?? 'normal');
    setPermissionMode(modeIds[(currentIndex + 1) % modeIds.length]);
    return true;
  }

  function handleSlashKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissSlash();
      return true;
    }
    if (['Tab', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      e.preventDefault();
      // CommandMenu document listener handles the actual navigation
      return true;
    }
    return false;
  }

  function handleMentionKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseMention();
      return true;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) =>
        e.key === 'ArrowDown' ? Math.min(i + 1, fileResults.length - 1) : Math.max(i - 1, -1),
      );
      return true;
    }
    if (e.key === 'Tab' && selectedIndex >= 0) {
      e.preventDefault();
      const item = fileResults[selectedIndex];
      if (item) handleSelectMention(`@${item.path}`, item.type === 'directory');
      return true;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      if (selectedIndex >= 0) {
        e.preventDefault();
        const item = fileResults[selectedIndex];
        if (item) handleSelectMention(`@${item.path}`, false);
      } else {
        handleCloseMention();
      }
      return true;
    }
    return false;
  }

  function handleHistoryKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (e.key === 'ArrowUp') {
      const msg = inputHistory.cycleUp();
      if (msg !== null) {
        e.preventDefault();
        updateValue(msg);
      }
      return true;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateValue(inputHistory.cycleDown());
      return true;
    }
    return false;
  }

  function handleSubmitKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    inputHistory.push(trimmed);
    submit();
    inputHistory.reset();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (handlePermissionCycleShortcut(e)) return;
    if (slashOpen && handleSlashKeyDown(e)) return;
    if (mentionOpen && handleMentionKeyDown(e)) return;
    if (handleHistoryKeyDown(e)) return;
    handleSubmitKeyDown(e);
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>): void {
    const images: File[] = [];
    for (const item of e.clipboardData.items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) images.push(file);
      }
    }
    if (images.length === 0) return;
    e.preventDefault();
    addAttachments(images);
  }

  const hasFileResults = fileResults.length > 0 || searchStatus !== 'idle';
  const showMentionDropdown = mentionOpen && hasFileResults;

  return (
    <>
      <SparkLegend
        effort={effort ?? undefined}
        effortLevels={effortLevels}
        isFastMode={isFastMode}
      />
      {attachedFiles.length > 0 && (
        <div className="flex overflow-x-auto gap-1 px-2 pb-1 pt-2">
          {attachedFiles.map((file, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: duplicate filenames allowed; index disambiguates
              key={`${file.name}-${index}`}
              className="bg-code-block border border-border rounded-md flex items-center gap-1.5 px-2.5 py-1.5 text-xs shrink-0"
            >
              <span className="max-w-40 truncate">📄 {file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-text-muted hover:text-text leading-none"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid max-h-50 overflow-y-auto">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onSelect={syncCursorPos}
          onClick={syncCursorPos}
          placeholder={
            isProcessing
              ? 'Queue another message…'
              : (providerConfig?.brand.placeholder ?? '⌘ Esc to focus or unfocus Claude')
          }
          className={TEXTAREA_CLASS}
        />
        <div className={cn(TEXTAREA_CLASS, 'invisible whitespace-pre-wrap')} aria-hidden="true">
          {`${value}\n`}
        </div>
      </div>
      {showMentionDropdown && (
        <div ref={mentionContainerRef}>
          <MentionDropdown
            mentionQuery={mentionQuery ?? ''}
            filteredSuggestions={[]}
            fileResults={fileResults}
            searchStatus={searchStatus}
            selectedIndex={selectedIndex}
            hasFileSearch={true}
            onSelectMention={handleSelectMention}
            onHover={setSelectedIndex}
            activeItemRef={scrollActiveIntoView}
          />
        </div>
      )}
    </>
  );
}
