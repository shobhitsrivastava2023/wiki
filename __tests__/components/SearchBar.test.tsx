const { render, screen } = require('@testing-library/react');
const SearchBar = require('../../components/SearchBar');

test('renders SearchBar component', () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText(/search/i);
    expect(inputElement).toBeInTheDocument();
});

test('calls onSearch when input value changes', () => {
    const onSearchMock = jest.fn();
    render(<SearchBar onSearch={onSearchMock} />);
    const inputElement = screen.getByPlaceholderText(/search/i);
    inputElement.value = 'test';
    inputElement.dispatchEvent(new Event('input'));
    expect(onSearchMock).toHaveBeenCalledWith('test');
});

{
  "scripts": {
    "test": "jest"
  }
}