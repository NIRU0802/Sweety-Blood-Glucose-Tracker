import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import api from '../api';
import ReadingForm from './ReadingForm';

// Replace the real HTTP client so tests never call the server
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { post: vi.fn(), put: vi.fn() } };
});
// Silence the toast pop-ups
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const setup = (props = {}) =>
  render(<ReadingForm date="2026-11-16" onSaved={vi.fn()} onCancel={vi.fn()} {...props} />);

beforeEach(() => vi.clearAllMocks());

test('shows the server error when the value is empty', async () => {
  api.post.mockRejectedValue({ response: { data: { error: 'Please enter a glucose value.' } } });
  setup();
  await userEvent.click(screen.getByRole('button', { name: /save reading/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a glucose value.');
});

test('sends the slot, date and numeric value, then calls onSaved', async () => {
  api.post.mockResolvedValue({ data: {} });
  const onSaved = vi.fn();
  setup({ onSaved });
  await userEvent.type(screen.getByPlaceholderText(/e\.g\. 120/i), '120');
  await userEvent.click(screen.getByRole('button', { name: /save reading/i }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith('/readings', {
      date: '2026-11-16', slot: 'MORNING_FASTING', value: 120,
    })
  );
  expect(onSaved).toHaveBeenCalled();
});

test('displays the duplicate-slot error from the API', async () => {
  api.post.mockRejectedValue({
    response: { data: { error: 'You already have an After lunch reading for this date.' } },
  });
  setup();
  await userEvent.type(screen.getByPlaceholderText(/e\.g\. 120/i), '130');
  await userEvent.click(screen.getByRole('button', { name: /save reading/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('After lunch reading');
});

test('edit mode pre-fills the form and calls PUT', async () => {
  api.put.mockResolvedValue({ data: {} });
  setup({ editing: { id: 7, slot: 'AFTER_DINNER', value: 150 } });
  expect(screen.getByPlaceholderText(/e\.g\. 120/i)).toHaveValue(150);
  await userEvent.click(screen.getByRole('button', { name: /update/i }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/readings/7', expect.objectContaining({ value: 150 })));
});