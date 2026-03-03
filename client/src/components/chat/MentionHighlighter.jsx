import { useEffect, useRef, useState } from 'react';

const MENTION_REGEX = /@\[([^\]]+)\]/g;

/**
 * Transparent overlay that renders styled pills on top of @[tool_name] mentions
 * in the textarea. Uses pointer-events: none so clicks pass through.
 */
export function MentionHighlighter({ value, textareaRef }) {
    const overlayRef = useRef(null);

    // Sync scroll position with textarea
    useEffect(() => {
        const textarea = textareaRef?.current;
        const overlay = overlayRef.current;
        if (!textarea || !overlay) return;

        const syncScroll = () => {
            overlay.scrollTop = textarea.scrollTop;
        };
        textarea.addEventListener('scroll', syncScroll);
        return () => textarea.removeEventListener('scroll', syncScroll);
    }, [textareaRef]);

    // Parse value into segments of plain text and mentions
    const segments = [];
    let lastIndex = 0;
    let match;
    const regex = new RegExp(MENTION_REGEX.source, 'g');

    while ((match = regex.exec(value)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: value.slice(lastIndex, match.index) });
        }
        segments.push({ type: 'mention', content: match[0], name: match[1] });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < value.length) {
        segments.push({ type: 'text', content: value.slice(lastIndex) });
    }

    // Don't render overlay if there are no mentions
    if (!segments.some((s) => s.type === 'mention')) return null;

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
                // Match textarea padding — these match the textarea's container padding
                padding: '0',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
            }}
        >
            <div
                className="w-full text-sm leading-relaxed"
                style={{ color: 'transparent' }}
            >
                {segments.map((seg, i) =>
                    seg.type === 'mention' ? (
                        <span
                            key={i}
                            className="bg-primary/20 text-primary rounded px-0.5 py-px"
                            style={{
                                // Make the highlight visible but text stays transparent
                                // The actual text is shown by the textarea beneath
                                color: 'transparent',
                            }}
                        >
                            {seg.content}
                        </span>
                    ) : (
                        <span key={i}>{seg.content}</span>
                    )
                )}
            </div>
        </div>
    );
}
