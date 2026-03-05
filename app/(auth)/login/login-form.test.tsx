import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './login-form';

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

const signInWithPasswordMock = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    signInWithPasswordMock.mockReset();
  });

  it('submits credentials and redirects on success', async () => {
    const user = userEvent.setup();
    const redirectTo = '/dashboard';

    signInWithPasswordMock.mockResolvedValueOnce({ error: null });

    render(<LoginForm redirectTo={redirectTo} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 's3cret');

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 's3cret',
      });
    });

    expect(pushMock).toHaveBeenCalledWith(redirectTo);
    expect(refreshMock).toHaveBeenCalled();
    expect(
      screen.queryByText(/an unexpected error occurred/i)
    ).not.toBeInTheDocument();
  });

  it('shows Supabase error and does not redirect on failure', async () => {
    const user = userEvent.setup();
    const redirectTo = '/dashboard';

    signInWithPasswordMock.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    });

    render(<LoginForm redirectTo={redirectTo} />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid login credentials/i)
      ).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

