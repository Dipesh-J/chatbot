import { useState, useCallback, useRef } from 'react';

/**
 * Hook that manages the @mention lifecycle for MCP tools in the chat input.
 * Detects `@` triggers, manages dropdown state, handles keyboard navigation,
 * and inserts `@[tool_name]` tokens into the textarea value.
 */
export function useMentions(tools = []) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownQuery, setDropdownQuery] = useState('');
    const [triggerIndex, setTriggerIndex] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const filteredTools = tools.filter(
        (t) => t.enabled && t.name.toLowerCase().includes(dropdownQuery.toLowerCase())
    );

    // Calculate caret pixel position using a mirror div
    const getCaretPosition = useCallback((textarea) => {
        if (!textarea) return { top: 0, left: 0 };

        const mirror = document.createElement('div');
        const style = window.getComputedStyle(textarea);

        // Copy styles that affect text layout
        const props = [
            'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
            'letterSpacing', 'textTransform', 'wordSpacing',
            'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom',
            'paddingLeft', 'borderTopWidth', 'borderRightWidth',
            'borderBottomWidth', 'borderLeftWidth', 'boxSizing',
            'whiteSpace', 'wordWrap', 'overflowWrap',
        ];
        props.forEach((p) => { mirror.style[p] = style[p]; });

        mirror.style.position = 'absolute';
        mirror.style.top = '-9999px';
        mirror.style.left = '-9999px';
        mirror.style.width = style.width;
        mirror.style.visibility = 'hidden';
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordWrap = 'break-word';

        const textBefore = textarea.value.substring(0, textarea.selectionStart);
        const textNode = document.createTextNode(textBefore);
        const span = document.createElement('span');
        span.textContent = '\u200b'; // zero-width space as caret marker

        mirror.appendChild(textNode);
        mirror.appendChild(span);
        document.body.appendChild(mirror);

        const spanRect = span.getBoundingClientRect();
        const mirrorRect = mirror.getBoundingClientRect();

        const top = spanRect.top - mirrorRect.top - textarea.scrollTop;
        const left = spanRect.left - mirrorRect.left;

        document.body.removeChild(mirror);

        return { top, left };
    }, []);

    const handleChange = useCallback((value, textarea) => {
        if (!textarea) return;

        const cursor = textarea.selectionStart;
        // Walk backwards from cursor to find an unresolved `@`
        let atIdx = -1;
        for (let i = cursor - 1; i >= 0; i--) {
            const ch = value[i];
            if (ch === '@') {
                // Make sure it's not inside an already-completed @[...] mention
                const before = value.substring(0, i);
                const after = value.substring(i);
                // If the @ is followed by [ and a closing ], it's already resolved
                if (/^@\[[^\]]*\]/.test(after)) break;
                // The @ should be at start or preceded by whitespace
                if (i === 0 || /\s/.test(value[i - 1])) {
                    atIdx = i;
                }
                break;
            }
            // Stop if we hit whitespace or brackets
            if (ch === ' ' || ch === '\n' || ch === '[' || ch === ']') break;
        }

        if (atIdx >= 0) {
            const query = value.substring(atIdx + 1, cursor);
            setTriggerIndex(atIdx);
            setDropdownQuery(query);
            setSelectedIndex(0);
            setShowDropdown(true);

            // Position the dropdown
            const pos = getCaretPosition(textarea);
            setDropdownPosition(pos);
        } else {
            setShowDropdown(false);
        }
    }, [getCaretPosition]);

    const handleKeyDown = useCallback((e) => {
        if (!showDropdown || filteredTools.length === 0) return false;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => (i + 1) % filteredTools.length);
            return true;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => (i - 1 + filteredTools.length) % filteredTools.length);
            return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            // Will be handled externally via selectTool
            return { selectIndex: selectedIndex };
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowDropdown(false);
            return true;
        }
        return false;
    }, [showDropdown, filteredTools.length, selectedIndex]);

    const selectTool = useCallback((tool, currentValue) => {
        const before = currentValue.substring(0, triggerIndex);
        const after = currentValue.substring(triggerIndex + 1 + dropdownQuery.length);
        const newValue = `${before}@[${tool.name}] ${after}`;
        setShowDropdown(false);
        return newValue;
    }, [triggerIndex, dropdownQuery]);

    const close = useCallback(() => {
        setShowDropdown(false);
    }, []);

    return {
        showDropdown,
        dropdownQuery,
        dropdownPosition,
        selectedIndex,
        filteredTools,
        handleChange,
        handleKeyDown,
        selectTool,
        close,
    };
}
