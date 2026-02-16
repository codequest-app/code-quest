import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageBox } from '../MessageBox';

describe('MessageBox', () => {
  it('renders message text', () => {
    render(<MessageBox message="戦闘開始！" />);
    expect(screen.getByTestId('message-box')).toHaveTextContent('戦闘開始！');
  });
});
