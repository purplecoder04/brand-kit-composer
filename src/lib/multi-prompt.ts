export type MultiPromptItem = {
  prompt: string;
  lines: number;
};

export function parseMultiPrompts(value?: string): MultiPromptItem[] {
  const text = value?.trim() ?? "";
  if (!text) return [{ prompt: "", lines: 4 }];

  const items: MultiPromptItem[] = [];
  let current: MultiPromptItem | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const prompt = line.match(/^prompt\s*\d*\s*:\s*(.*)$/i);
    if (prompt) {
      current = { prompt: prompt[1]?.trim() ?? "", lines: 4 };
      items.push(current);
      continue;
    }

    const writingLines = line.match(
      /^(writing\s*lines?|lines|writing\s*line\s*count)\s*:\s*(\d{1,2})$/i,
    );
    if (writingLines && current) {
      current.lines = Math.max(1, Math.min(8, Number(writingLines[2]) || 4));
      continue;
    }

    if (!current) {
      current = { prompt: line, lines: 4 };
      items.push(current);
    } else {
      current.prompt = [current.prompt, line].filter(Boolean).join(" ");
    }
  }

  return items.slice(0, 4);
}
