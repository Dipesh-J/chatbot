import { useState, useRef } from 'react';
import {
  PromptInput,
  PromptInputHeader,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit,
  usePromptInputAttachments,
} from '../ai/prompt-input';
import { DropdownMenuItem } from '../ui/dropdown-menu';
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from '../ai/attachments';
import { FileSpreadsheet } from 'lucide-react';

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

export default function ChatInput({ onSend, onUploadRequest, disabled }) {
  const [text, setText] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (message) => {
    const hasText = Boolean(message.text);
    if (!hasText || disabled) return;

    onSend(message.text);
    setText('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadRequest) {
      onUploadRequest(file);
    }
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="w-full px-4 pb-4 max-w-4xl mx-auto">
      <PromptInput
        onSubmit={handleSubmit}
        className="w-full relative z-10"
      >
        <PromptInputHeader>
          <PromptInputAttachmentsDisplay />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea
            disabled={disabled}
            placeholder="Ask BizCopilot..."
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                  className="gap-2 focus:bg-white/10"
                >
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                  Upload CSV
                </DropdownMenuItem>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!text.trim() || disabled}
            status={disabled ? "streaming" : "ready"}
          />
        </PromptInputFooter>
      </PromptInput>

      {/* Hidden file input specifically for CSV uploads to support the onUploadRequest flow */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
