import './globals.css';

export const metadata = {
  title: 'Agora Vada Portal',
  description: 'Content & Visual Automation Generator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-900 text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}
