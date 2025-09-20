import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TestCreator from '../components/TestCreator';

// mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
  // mock window.alert used in component
  global.alert = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('shows warnings when API returns warnings after creating test', async () => {
  // mock initial questions fetch
  fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([{ question_id: 1, question_text: 'Q1' }]) }));

  // mock POST /tests response with warnings
  const postResponse = { success: true, data: { test: { test_id: 1 } }, warnings: [{ type: 'duplicate_question_id', question_ids: [1] }] };
  fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(postResponse) }));

  render(<TestCreator />);

  // wait for questions to load
  await waitFor(() => expect(fetch).toHaveBeenCalled());

  // fill form
  fireEvent.change(screen.getByPlaceholderText('Test Name'), { target: { value: 'T1' } });
  fireEvent.click(screen.getByRole('checkbox'));

  // Click the submit button explicitly by role to avoid matching the heading with same text
  fireEvent.click(screen.getByRole('button', { name: /Create Test/i }));

  // wait for POST to be called
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

  // expect warnings shown
  expect(await screen.findByText(/Warnings:/)).toBeInTheDocument();
  expect(screen.getByText(/duplicate_question_id/)).toBeInTheDocument();
});
