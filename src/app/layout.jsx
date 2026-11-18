import { AppProviders } from '@/components/layout/app-providers';
import localFont from 'next/font/local';
import './globals.css';

const shopFont = localFont({
  src: './fonts/Manrope-Variable.ttf',
  variable: '--font-shop',
  weight: '200 800',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Shop — Product catalog', template: '%s | Shop' },
  description: 'Product catalog with automatic categorization',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={shopFont.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
