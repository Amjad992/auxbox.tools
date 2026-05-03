import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropZone from './DropZone';

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
});
