const { render, screen } = require('@testing-library/react');
const Navbar = require('../../components/Navbar');

test('renders Navbar component', () => {
    render(<Navbar />);
    const linkElement = screen.getByText(/navbar/i);
    expect(linkElement).toBeInTheDocument();
});

test('has a logo', () => {
    render(<Navbar />);
    const logoElement = screen.getByAltText(/logo/i);
    expect(logoElement).toBeInTheDocument();
});

test('navigates to home on click', () => {
    render(<Navbar />);
    const homeLink = screen.getByText(/home/i);
    homeLink.click();
    expect(window.location.pathname).toBe('/home');
});

{
  "scripts": {
    "test": "jest"
  }
}