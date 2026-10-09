import './globals.css';

export const metadata = {
  title: 'New Victorian Homes | Work Follow-Up Tracker',
  description: 'New Victorian Homes shared task and follow-up tracker.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}