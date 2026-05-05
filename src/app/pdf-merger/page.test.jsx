import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock pdf-lib so the page test never loads real PDFs in jsdom.
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn(),
    load: vi.fn(),
  },
}));

import {PDFDocument} from 'pdf-lib';

vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

import PdfMerger from './page';
import {MAX_FILE_BYTES, MAX_FILES} from './constants';

function makePdf(name = 'doc.pdf', size = 1024) {
  const buf = new Uint8Array(size);
  const file = new File([buf], name, {type: 'application/pdf'});
  if (typeof file.arrayBuffer !== 'function') {
    file.arrayBuffer = () => Promise.resolve(buf.buffer);
  }
  return file;
}

beforeEach(() => {
  if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:test';
  if (!URL.revokeObjectURL) URL.revokeObjectURL = () => undefined;
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

  // (Re-)install pdf-lib mocks for each test. vi.restoreAllMocks() in
  // afterEach clears the implementations on the module-level vi.fn()s.
  PDFDocument.create.mockReset();
  PDFDocument.load.mockReset();
  PDFDocument.create.mockResolvedValue({
    copyPages: vi.fn().mockResolvedValue([{}, {}]),
    addPage: vi.fn(),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  });
  PDFDocument.load.mockResolvedValue({getPageCount: () => 5});
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function dropFiles(container, files) {
  // The DropZone exposes a hidden <input type="file"> we can drive directly.
  const input = container.querySelector('input[type="file"]');
  await act(async () => {
    await userEvent.upload(input, files);
  });
}

describe('<PdfMerger /> — render', () => {
  it('renders the heading, drop zone, and privacy copy', () => {
    render(<PdfMerger />);
    expect(
      screen.getByRole('heading', {name: /pdf merger/i})
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Files never leave your browser/i).length
    ).toBeGreaterThan(0);
    // DropZone label is part of the document.
    expect(screen.getByText(/drop pdfs here/i)).toBeInTheDocument();
  });

  it('shows empty-state copy when no files', () => {
    render(<PdfMerger />);
    expect(
      screen.getByText(/no files yet/i)
    ).toBeInTheDocument();
  });
});

describe('<PdfMerger /> — file flow', () => {
  it('adds files via the drop-zone input and shows them as ready', async () => {
    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf'), makePdf('b.pdf')]);

    await waitFor(() => {
      expect(screen.getByText('a.pdf')).toBeInTheDocument();
      expect(screen.getByText('b.pdf')).toBeInTheDocument();
    });
    // Each ready row shows page count.
    await waitFor(() => {
      const pages = screen.getAllByText(/^5 pages$/);
      expect(pages.length).toBe(2);
    });
  });

  it('disables the Merge button when fewer than 2 ready files', async () => {
    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf')]);

    await waitFor(() => expect(screen.getByText('a.pdf')).toBeInTheDocument());
    const mergeBtn = screen.getByRole('button', {name: /merge pdfs/i});
    expect(mergeBtn).toBeDisabled();
  });

  it('enables Merge when 2+ files are ready', async () => {
    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf'), makePdf('b.pdf')]);

    await waitFor(() => {
      const pages = screen.getAllByText(/^5 pages$/);
      expect(pages.length).toBe(2);
    });
    const mergeBtn = screen.getByRole('button', {name: /merge pdfs/i});
    expect(mergeBtn).not.toBeDisabled();
  });

  it('Remove button removes a row', async () => {
    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf'), makePdf('b.pdf')]);

    await waitFor(() => expect(screen.getByText('a.pdf')).toBeInTheDocument());

    const user = userEvent.setup();
    // Click the first Remove button.
    const removes = screen.getAllByRole('button', {name: /^remove$/i});
    await user.click(removes[0]);

    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
  });

  it('up/down nudge buttons reorder rows', async () => {
    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf'), makePdf('b.pdf'), makePdf('c.pdf')]);

    await waitFor(() => {
      expect(screen.getAllByText(/^5 pages$/)).toHaveLength(3);
    });

    const user = userEvent.setup();
    // Move 'a.pdf' down twice (it becomes last).
    const downA = screen.getByRole('button', {name: /move a\.pdf down/i});
    await user.click(downA);
    await user.click(screen.getByRole('button', {name: /move a\.pdf down/i}));

    const rows = document.querySelectorAll('.pm-row');
    const names = Array.from(rows).map((r) => r.querySelector('.pm-row-name').textContent);
    expect(names).toEqual(['b.pdf', 'c.pdf', 'a.pdf']);
  });
});

describe('<PdfMerger /> — caps and errors', () => {
  it('shows a rejection alert when too many files are dropped', async () => {
    const {container} = render(<PdfMerger />);
    const tooMany = Array.from({length: MAX_FILES + 2}, (_, i) =>
      makePdf(`f${i}.pdf`)
    );
    await dropFiles(container, tooMany);

    await waitFor(() => {
      expect(
        screen.getByText(/could not be added/i)
      ).toBeInTheDocument();
    });
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('rejects oversized files inline', async () => {
    const {container} = render(<PdfMerger />);
    const big = makePdf('big.pdf', MAX_FILE_BYTES + 1);
    await dropFiles(container, [big]);

    await waitFor(() => {
      expect(screen.getByText(/larger than 50 MB/i)).toBeInTheDocument();
    });
  });
});

describe('<PdfMerger /> — merge action', () => {
  it('clicking Merge triggers a download and announces success in the live region', async () => {
    // Spy on anchor click — JSDOM creates the anchor and calls .click().
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf'), makePdf('b.pdf')]);

    await waitFor(() => expect(screen.getAllByText(/^5 pages$/)).toHaveLength(2));

    const user = userEvent.setup();
    const mergeBtn = screen.getByRole('button', {name: /merge pdfs/i});
    await user.click(mergeBtn);

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
    expect(clickSpy).toHaveBeenCalled();

    // Live region announces success (it's hidden but in the DOM).
    await waitFor(() => {
      const live = document.querySelector('.pm-live-region');
      expect(live.textContent).toMatch(/merged 2 files/i);
    });
  });

  it('invalid page-range disables Merge and shows inline error', async () => {
    const {container} = render(<PdfMerger />);
    await dropFiles(container, [makePdf('a.pdf'), makePdf('b.pdf')]);

    await waitFor(() => expect(screen.getAllByText(/^5 pages$/)).toHaveLength(2));

    const user = userEvent.setup();
    const inputs = screen.getAllByPlaceholderText('all');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '99');

    const mergeBtn = screen.getByRole('button', {name: /merge pdfs/i});
    expect(mergeBtn).toBeDisabled();
    // Inline range error appears on the row.
    expect(screen.getByText(/exceeds the document/i)).toBeInTheDocument();
  });
});
