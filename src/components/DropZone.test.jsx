import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropZone from './DropZone';

// MIN-3 / MIN-5: DropZone no longer uses aria-label (descendant text supplies
// the accessible name) and ⬆ is replaced with inline SVG.

function makeFile(name = 'a.png', type = 'image/png', bytes = 'x') {
  return new File([bytes], name, {type});
}

describe('<DropZone />', () => {
  it('renders label and hint', () => {
    render(
      <DropZone
        onFiles={() => {}}
        label="Drop images here"
        hint="JPEG / PNG / WebP, up to 25 MB"
      />
    );
    expect(screen.getByText('Drop images here')).toBeInTheDocument();
    expect(
      screen.getByText('JPEG / PNG / WebP, up to 25 MB')
    ).toBeInTheDocument();
  });

  it('opens the file picker when clicked', async () => {
    const onFiles = vi.fn();
    const user = userEvent.setup();
    render(<DropZone onFiles={onFiles} label="Pick" />);

    const zone = screen.getByRole('button', {name: 'Pick'});
    const input = zone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');

    await user.click(zone);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('opens the picker on Enter and Space keypresses', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} label="Pick" />);

    const zone = screen.getByRole('button', {name: 'Pick'});
    const input = zone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.keyDown(zone, {key: 'Enter'});
    fireEvent.keyDown(zone, {key: ' '});
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('calls onFiles when files are dropped', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} label="Drop" />);
    const zone = screen.getByRole('button', {name: 'Drop'});
    const file = makeFile();
    fireEvent.drop(zone, {dataTransfer: {files: [file]}});
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0][0]).toBe(file);
  });

  it('toggles drag-over class on dragover/dragleave', () => {
    render(<DropZone onFiles={() => {}} label="Drop" />);
    const zone = screen.getByRole('button', {name: 'Drop'});
    fireEvent.dragOver(zone);
    expect(zone.className).toContain('tool-dropzone--over');
    fireEvent.dragLeave(zone);
    expect(zone.className).not.toContain('tool-dropzone--over');
  });

  it('calls onFiles via the input element when files are selected', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} label="Pick" />);
    const zone = screen.getByRole('button', {name: 'Pick'});
    const input = zone.querySelector('input[type="file"]');
    const file = makeFile();
    fireEvent.change(input, {target: {files: [file]}});
    expect(onFiles).toHaveBeenCalled();
  });

  it('ignores keypresses other than Enter and Space', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} label="Pick" />);
    const zone = screen.getByRole('button', {name: 'Pick'});
    const input = zone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.keyDown(zone, {key: 'a'});
    fireEvent.keyDown(zone, {key: 'Tab'});
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('does not open the picker or accept drops when disabled', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} label="Pick" disabled />);
    const zone = screen.getByRole('button', {name: 'Pick'});
    const input = zone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.click(zone);
    fireEvent.keyDown(zone, {key: 'Enter'});
    expect(clickSpy).not.toHaveBeenCalled();

    fireEvent.drop(zone, {dataTransfer: {files: [makeFile()]}});
    expect(onFiles).not.toHaveBeenCalled();

    expect(zone).toHaveAttribute('aria-disabled', 'true');
    expect(zone).toHaveAttribute('tabindex', '-1');
  });

  it('passes accept and multiple props to the underlying input', () => {
    render(
      <DropZone
        onFiles={() => {}}
        label="Pick"
        accept="image/png,image/jpeg"
        multiple={false}
      />
    );
    const zone = screen.getByRole('button', {name: 'Pick'});
    const input = zone.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg');
    expect(input).not.toHaveAttribute('multiple');
  });

  // MIN-3: accessible name comes from descendant text, not aria-label.
  it('derives accessible name from descendant text, not aria-label', () => {
    render(
      <DropZone
        onFiles={() => {}}
        label="Drop images here"
        hint="JPEG, PNG, or WebP — up to 25 MB"
      />
    );
    // Without aria-label the name is computed from all descendant text
    // (label + hint concatenated). We use a partial match here.
    const zone = screen.getByRole('button', {name: /Drop images here/i});
    expect(zone).not.toHaveAttribute('aria-label');
    // hint paragraph is referenced via aria-describedby.
    const hintEl = screen.getByText('JPEG, PNG, or WebP — up to 25 MB');
    expect(hintEl).toHaveAttribute('id', 'dropzone-hint');
    expect(zone).toHaveAttribute('aria-describedby', 'dropzone-hint');
  });

  // MIN-3: role="status" live region announces drag-over state.
  it('announces drag-over via a role=status live region', () => {
    render(<DropZone onFiles={() => {}} label="Drop" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    const zone = screen.getByRole('button', {name: 'Drop'});
    fireEvent.dragOver(zone);
    expect(status).toHaveTextContent('Ready to drop');
    fireEvent.dragLeave(zone);
    expect(status).toHaveTextContent('');
  });

  // MIN-5: ⬆ emoji replaced with inline SVG.
  it('renders an SVG upload icon instead of a text arrow', () => {
    render(<DropZone onFiles={() => {}} label="Drop" />);
    const icon = document.querySelector('.tool-dropzone-icon');
    expect(icon.querySelector('svg')).toBeInTheDocument();
    expect(icon.textContent).not.toContain('⬆');
  });
});
