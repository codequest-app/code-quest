import type { FileSearchResult } from '@code-quest/shared';
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useInputHistory } from '../hooks/useInputHistory';
import { MentionDropdown } from './MentionDropdown';
import { SparkLegend } from './SparkLegend';

const MENTION_REGEX = /(^|[\s])@([^\s]*)$/;

function getMentionQuery(value: string, cursorPos: number): string | null {
  const before = value.slice(0, cursorPos);
  const match = before.match(MENTION_REGEX);
  if (!match) return null;
  return match[2];
}

function autogrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
}

export function ComposeInput() {
  const { isProcessing, searchFiles } = useChannelMessages();
  const { effort, isFastMode, providerConfig } = useChannelConfig();
  const compose = useChannelCompose();

  const {
    value,
    updateValue,
    cursorPos,
    setCursorPos,
    registerFocus,
    slashOpen,
    closeSlash,
    submit,
    attachedFiles,
    removeAttachment,
  } = compose;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    registerFocus((pos?: number) => {
      const el = textareaRef.current;
      if (!el) return;
      if (pos !== undefined) {
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(pos, pos);
        }, 0);
      } else {
        el.focus();
      }
    });
  }, [registerFocus]);

  const inputHistory = useInputHistory();
  const mentionContainerRef = useRef<HTMLDivElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [fileResults, setFileResults] = useState<FileSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const scrollActiveIntoView = useCallback((el: HTMLDivElement | null) => {
    el?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, []);

  useEffect(() => {
    if (!mentionOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        mentionContainerRef.current &&
        !mentionContainerRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMentionOpen(false);
        setFileResults([]);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [mentionOpen]);

  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const mentionQuery = mentionOpen ? getMentionQuery(value, cursorPos) : null;

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    setSearchStatus('loading');
    const { files } = await searchFiles(query);
    setFileResults(files);
    setSearchStatus('done');
  }, 200);

  const handleChange = (newValue: string) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? newValue.length;
    updateValue(newValue, pos);
    autogrow(textareaRef.current);

    const query = getMentionQuery(newValue, pos);
    if (query !== null) {
      setMentionOpen(true);
      setSelectedIndex(-1);
      debouncedSearch(query);
    } else {
      setMentionOpen(false);
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
      // Navigate into directory — update query and trigger new search
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

    // Select — insert and close
    const newValue = `${value.slice(0, start)}${suggestion} ${value.slice(pos)}`;
    updateValue(newValue);
    setMentionOpen(false);
    setFileResults([]);
    setSearchStatus('idle');
    textareaRef.current?.focus();
  };

  const syncCursorPos = () => {
    const el = textareaRef.current;
    if (el) setCursorPos(el.selectionStart);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSlash();
        return;
      }
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Escape' && mentionOpen) {
      e.preventDefault();
      e.stopPropagation();
      setMentionOpen(false);
      setFileResults([]);
      return;
    }

    if (mentionOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      if (e.key === 'ArrowDown') {
        setSelectedIndex((i) => Math.min(i + 1, fileResults.length - 1));
      } else {
        setSelectedIndex((i) => Math.max(i - 1, -1));
      }
      return;
    }

    if (e.key === 'ArrowUp' && !mentionOpen && !slashOpen) {
      const msg = inputHistory.cycleUp();
      if (msg !== null) {
        e.preventDefault();
        updateValue(msg);
        setTimeout(() => autogrow(textareaRef.current), 0);
      }
      return;
    }
    if (e.key === 'ArrowDown' && !mentionOpen && !slashOpen) {
      const msg = inputHistory.cycleDown();
      e.preventDefault();
      updateValue(msg);
      setTimeout(() => autogrow(textareaRef.current), 0);
      return;
    }

    if (e.key === 'Tab' && mentionOpen && selectedIndex >= 0) {
      e.preventDefault();
      const item = fileResults[selectedIndex];
      if (item) handleSelectMention(`@${item.path}`, item.type === 'directory');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (mentionOpen && selectedIndex >= 0) {
        e.preventDefault();
        const item = fileResults[selectedIndex];
        if (item) handleSelectMention(`@${item.path}`, false);
        return;
      }
      if (mentionOpen) {
        setMentionOpen(false);
        setFileResults([]);
        return;
      }
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        inputHistory.push(trimmed);
        submit();
        inputHistory.reset();
      }
    }
  };

  const hasFileResults = fileResults.length > 0 || searchStatus !== 'idle';
  const showMentionDropdown = mentionOpen && hasFileResults;

  return (
    <>
      <SparkLegend effort={effort ?? undefined} isFastMode={isFastMode} />
      {attachedFiles.length > 0 && (
        <div className="flex overflow-x-auto gap-1 px-2 pb-1 pt-2">
          {attachedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="bg-code-block border border-border rounded-[6px] flex items-center gap-[6px] px-[10px] py-[6px] text-xs shrink-0"
            >
              <span className="max-w-[160px] truncate">📄 {file.name}</span>
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
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={syncCursorPos}
        onClick={syncCursorPos}
        placeholder={
          isProcessing
            ? 'Queue another message…'
            : (providerConfig?.brand.placeholder ?? '⌘ Esc to focus or unfocus Claude')
        }
        className="w-full bg-transparent text-text px-[14px] pt-[10px] pb-[2px] resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted min-h-[1.5em] max-h-[200px] overflow-y-auto"
      />
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
