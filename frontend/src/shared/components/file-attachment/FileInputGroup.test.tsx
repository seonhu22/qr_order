import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileInputGroup } from './FileInputGroup';
import type { ServerFile } from './types';

function createServerFile(overrides: Partial<ServerFile> = {}): ServerFile {
  return {
    sysId: 'file-1',
    linkSysId: 'link-1',
    originalFileNm: 'helloworld',
    convertFileNm: 'converted-1',
    fileExt: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: '1024',
    filePath: '/2026/05',
    ordNo: 1,
    pdfYn: 'N',
    ...overrides,
  };
}

describe('FileInputGroup', () => {
  it('uses allowedExtensions for accept attribute and validation', async () => {
    const handleChange = vi.fn();

    render(<FileInputGroup allowedExtensions={['PDF']} onChange={handleChange} />);

    const input = screen.getByLabelText('파일 선택');
    expect(input).toHaveAttribute('accept', '.pdf');
    const hints = screen.getAllByText(/파일당 최대 10MB · 전체 최대 50MB · 최대 5개 · PDF/);
    expect(hints.length).toBe(2);
    expect(hints[0].className).toBe('file-attachment__dropzone-hint');
    expect(hints[1].className).toBe('file-hint--simple');

    fireEvent.change(input, {
      target: {
        files: [new File(['hello'], 'hello.txt', { type: 'text/plain' })],
      },
    });

    expect(screen.getByText('허용되지 않는 형식입니다. (.txt)')).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('blocks a new file with the same name as an active server file', () => {
    const handleChange = vi.fn();

    render(<FileInputGroup files={[createServerFile()]} onChange={handleChange} />);

    fireEvent.change(screen.getByLabelText('파일 선택'), {
      target: {
        files: [new File(['hello'], 'helloworld.docx')],
      },
    });

    expect(
      screen.getByText('같은 이름의 파일이 이미 첨부되어 있습니다. (helloworld.docx)'),
    ).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('blocks a file name already selected as a new file', () => {
    const handleChange = vi.fn();

    render(<FileInputGroup onChange={handleChange} />);
    const input = screen.getByLabelText('파일 선택');

    fireEvent.change(input, {
      target: {
        files: [new File(['hello'], 'report.pdf', { type: 'application/pdf' })],
      },
    });
    fireEvent.change(input, {
      target: {
        files: [new File(['hello'], 'REPORT.PDF', { type: 'application/pdf' })],
      },
    });

    expect(
      screen.getByText('같은 이름의 파일이 이미 첨부되어 있습니다. (REPORT.PDF)'),
    ).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('blocks duplicate names within a single file selection', () => {
    const handleChange = vi.fn();

    render(<FileInputGroup onChange={handleChange} />);

    fireEvent.change(screen.getByLabelText('파일 선택'), {
      target: {
        files: [
          new File(['hello'], 'report.pdf', { type: 'application/pdf' }),
          new File(['hello'], 'REPORT.PDF', { type: 'application/pdf' }),
        ],
      },
    });

    expect(
      screen.getByText('같은 이름의 파일이 이미 첨부되어 있습니다. (REPORT.PDF)'),
    ).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('allows a new file with the same name as a deleted server file', () => {
    const handleChange = vi.fn();
    const serverFile = createServerFile();

    render(<FileInputGroup files={[serverFile]} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('helloworld 삭제'));
    fireEvent.change(screen.getByLabelText('파일 선택'), {
      target: {
        files: [new File(['hello'], 'helloworld.docx')],
      },
    });

    expect(screen.queryByText(/같은 이름의 파일/)).not.toBeInTheDocument();
    expect(handleChange).toHaveBeenLastCalledWith({
      newFiles: [expect.objectContaining({ name: 'helloworld.docx' })],
      deletedFiles: [serverFile],
    });
  });
});
