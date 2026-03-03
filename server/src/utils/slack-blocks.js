/**
 * slack-blocks.js
 *
 * Converts a markdown report string into a Slack Block Kit `blocks` array
 * plus a plain-text fallback `text` string (used by Slack for notifications).
 *
 * Slack mrkdwn differences from GitHub markdown:
 *   ## Heading   → *Heading* (bold, preceded by a divider block)
 *   **text**     → *text*
 *   __text__     → _text_
 *   [label](url) → <url|label>
 *   - item       → • item
 *   ---          → divider block
 *   ```code```   → ```code``` (same in mrkdwn)
 *   `inline`     → `inline`  (same in mrkdwn)
 */

const SLACK_BLOCK_TEXT_LIMIT = 3000; // Slack section text max chars

/**
 * Convert inline markdown to Slack mrkdwn.
 * Handles: bold, italic, links, inline code.
 */
function inlineToMrkdwn(line) {
    return line
        // Links [label](url) → <url|label>
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
        // Bold **text** or __text__ → *text*
        .replace(/\*\*([^*]+)\*\*/g, '*$1*')
        .replace(/__([^_]+)__/g, '*$1*')
        // Italic *text* or _text_ → _text_ (already valid; avoid double-converting bold)
        .replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '_$1_')
        // Unordered list bullets
        .replace(/^\s*[-*+]\s+/, '• ')
        // Ordered list items: keep as-is (Slack doesn't render them specially)
        .replace(/^\s*\d+\.\s+/, (m) => m); // no-op, keep number
}

/**
 * Push accumulated paragraph text into blocks, respecting the 3000-char limit.
 */
function flushBuffer(buffer, blocks) {
    const trimmed = buffer.trim();
    if (!trimmed) return;

    // Chunk if too long
    for (let i = 0; i < trimmed.length; i += SLACK_BLOCK_TEXT_LIMIT) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: trimmed.slice(i, i + SLACK_BLOCK_TEXT_LIMIT),
            },
        });
    }
}

/**
 * Main converter.
 *
 * @param {string} title  - Report title (used for the header block)
 * @param {string} markdown - Full markdown content string
 * @returns {{ blocks: object[], text: string }}
 */
export function markdownToSlackBlocks(title, markdown) {
    const blocks = [];

    // ── Header block ────────────────────────────────────────────────────────────
    blocks.push({
        type: 'header',
        text: {
            type: 'plain_text',
            text: `📋 ${title}`.slice(0, 150), // Slack header limit is 150 chars
            emoji: true,
        },
    });

    const lines = markdown.split('\n');
    let buffer = '';
    let inCodeBlock = false;
    let codeBuffer = '';

    for (const rawLine of lines) {
        const line = rawLine;

        // ── Code fences ─────────────────────────────────────────────────────────
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                // Start of code block — flush any pending paragraph first
                flushBuffer(buffer, blocks);
                buffer = '';
                inCodeBlock = true;
                codeBuffer = line + '\n';
            } else {
                // End of code block
                inCodeBlock = false;
                codeBuffer += line;
                // Wrap in a section with mrkdwn code fence
                const codeText = codeBuffer.length > SLACK_BLOCK_TEXT_LIMIT
                    ? codeBuffer.slice(0, SLACK_BLOCK_TEXT_LIMIT - 3) + '...'
                    : codeBuffer;
                blocks.push({
                    type: 'section',
                    text: { type: 'mrkdwn', text: codeText },
                });
                codeBuffer = '';
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer += line + '\n';
            continue;
        }

        // ── Horizontal rule → divider block ─────────────────────────────────────
        if (/^-{3,}$/.test(line.trim()) || /^={3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
            flushBuffer(buffer, blocks);
            buffer = '';
            blocks.push({ type: 'divider' });
            continue;
        }

        // ── H1 heading (#) ──────────────────────────────────────────────────────
        const h1Match = line.match(/^#\s+(.+)/);
        if (h1Match) {
            flushBuffer(buffer, blocks);
            buffer = '';
            // Add a divider before each major section (except right after header)
            if (blocks.length > 1) {
                blocks.push({ type: 'divider' });
            }
            blocks.push({
                type: 'section',
                text: { type: 'mrkdwn', text: `*${inlineToMrkdwn(h1Match[1]).trim()}*` },
            });
            continue;
        }

        // ── H2 heading (##) ─────────────────────────────────────────────────────
        const h2Match = line.match(/^##\s+(.+)/);
        if (h2Match) {
            flushBuffer(buffer, blocks);
            buffer = '';
            blocks.push({ type: 'divider' });
            blocks.push({
                type: 'section',
                text: { type: 'mrkdwn', text: `*${inlineToMrkdwn(h2Match[1]).trim()}*` },
            });
            continue;
        }

        // ── H3+ heading (###, ####…) ─────────────────────────────────────────────
        const hNMatch = line.match(/^#{3,}\s+(.+)/);
        if (hNMatch) {
            flushBuffer(buffer, blocks);
            buffer = '';
            blocks.push({
                type: 'section',
                text: { type: 'mrkdwn', text: `*${inlineToMrkdwn(hNMatch[1]).trim()}*` },
            });
            continue;
        }

        // ── Blank line → paragraph break ────────────────────────────────────────
        if (line.trim() === '') {
            if (buffer.trim()) {
                buffer += '\n';
            }
            continue;
        }

        // ── Normal line ─────────────────────────────────────────────────────────
        buffer += inlineToMrkdwn(line) + '\n';
    }

    // Flush any remaining content
    flushBuffer(buffer, blocks);

    // ── Context footer ───────────────────────────────────────────────────────
    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: '_Shared via BizCopilot_ • <!date^' + Math.floor(Date.now() / 1000) + '^{date_short} at {time}|just now>',
            },
        ],
    });

    // Plain-text fallback (for Slack notifications, search, etc.)
    const text = `📋 *${title}*\n\n${markdown
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .slice(0, 500)}…`;

    return { blocks, text };
}
