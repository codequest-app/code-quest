import type { FileSearchResult } from '@code-quest/shared';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { useClickOutside } from '../hooks/useClickOutside';
import { useInputHistory } from '../hooks/useInputHistory';
import { getMentionQuery, MENTION_REGEX } from '../utils/slash-query';
import { MentionDropdown } from './MentionDropdown';
import { SparkLegend } from './SparkLegend';

const TEXTAREA_CLASS =
  'w-full bg-transparent text-text px-[14px] py-[10px] resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted overflow-hidden [grid-area:1/1]';

export function ComposeInput() {
  const { isProcessing, searchFiles } = useChannelMessages();
  const { effort, isFastMode, providerConfig, permissionMode, setPermissionMode } =
    useChannelConfig();
  const compose = useChannelCompose();

  const {
    value,
    updateValue,
    cursorPos,
    setCursorPos,
    registerFocus,
    registerMentionTrigger,
    slashOpen,
    dismissSlash,
    submit,
    attachedFiles,
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
  const [mentionOpen, setMentionOpen] = useState(false);
  const [fileResults, setFileResults] = useState<FileSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const scrollActiveIntoView = (el: HTMLDivElement | null) => {
    el?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  };

  useClickOutside(
    [mentionContainerRef, textareaRef],
    () => {
      setMentionOpen(false);
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
        setMentionOpen(true);
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
    setMentionOpen(false);
    setFileResults([]);
    setSearchStatus('idle');
    textareaRef.current?.focus();
  };

  const syncCursorPos = () => {
    const el = textareaRef.current;
    if (el) setCursorPos(el.selectionStart);
  };

  function closeMention() {
    setMentionOpen(false);
    setFileResults([]);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && e.shiftKey && !slashOpen && !mentionOpen) {
      e.preventDefault();
      const configModes = providerConfig?.permissionModes;
      const modeIds = configModes?.length
        ? configModes.map((m) => m.id)
        : ['normal', 'acceptEdits', 'plan', 'bypassPermissions'];
      const currentIndex = modeIds.indexOf(permissionMode ?? 'normal');
      const nextMode = modeIds[(currentIndex + 1) % modeIds.length];
      setPermissionMode(nextMode);
      return;
    }

    if (slashOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissSlash();
        // textarea already has focus — no focusTextarea() needed
        return;
      }
      if (['Tab', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        e.preventDefault();
        // CommandMenu document listener handles the actual navigation
        return;
      }
    }

    if (mentionOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMention();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) =>
          e.key === 'ArrowDown' ? Math.min(i + 1, fileResults.length - 1) : Math.max(i - 1, -1),
        );
        return;
      }
      if (e.key === 'Tab' && selectedIndex >= 0) {
        e.preventDefault();
        const item = fileResults[selectedIndex];
        if (item) handleSelectMention(`@${item.path}`, item.type === 'directory');
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        if (selectedIndex >= 0) {
          e.preventDefault();
          const item = fileResults[selectedIndex];
          if (item) handleSelectMention(`@${item.path}`, false);
        } else {
          closeMention();
        }
        return;
      }
    }

    // Input history (only when no dropdown is open)
    if (e.key === 'ArrowUp') {
      const msg = inputHistory.cycleUp();
      if (msg !== null) {
        e.preventDefault();
        updateValue(msg);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateValue(inputHistory.cycleDown());
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
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
      <div className="grid max-h-[200px] overflow-y-auto">
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
          className={TEXTAREA_CLASS}
        />
        <div className={`${TEXTAREA_CLASS} invisible whitespace-pre-wrap`} aria-hidden="true">
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
