type ChangeHistoryContentsProps = {
  contents: string;
};

function parseAuditTrailContents(contents: string) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':');

      if (separatorIndex === -1) {
        return { type: 'title' as const, label: line, value: '' };
      }

      return {
        type: 'item' as const,
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    });
}

export function ChangeHistoryContents({ contents }: ChangeHistoryContentsProps) {
  const lines = parseAuditTrailContents(contents);

  return (
    <div className="change-history-contents">
      {lines.map((line, index) =>
        line.type === 'title' ? (
          <p key={`${line.label}-${index}`} className="change-history-contents__title">
            {line.label}
          </p>
        ) : (
          <p key={`${line.label}-${line.value}-${index}`} className="change-history-contents__item">
            <span className="change-history-contents__label">{line.label}</span>
            <span className="change-history-contents__value">{line.value}</span>
          </p>
        ),
      )}
    </div>
  );
}
