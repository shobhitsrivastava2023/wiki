import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../packages/components/SearchBar';

describe('SearchBar', () => {
  it('renders the search input', () => {
    render(<SearchBar />);
    
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
  });

  it('has the correct placeholder text', () => {
    render(<SearchBar />);
    
   
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
  });
});
