import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import './academic.css';
import './public.css';
import './studies.css';
import './accounts.css';
import './visual-refresh.css';
const beVietnamPro = localFont({
  src: [
    { path: './fonts/BeVietnamPro-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/BeVietnamPro-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/BeVietnamPro-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/BeVietnamPro-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/BeVietnamPro-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-ui',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});
export const metadata: Metadata = {title: 'Tuyển sinh Sau Đại học', description: 'Tiếp nhận hồ sơ, thẩm định, thi tuyển, xét tuyển và nhập học sau đại học'};
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="vi" className={beVietnamPro.variable}><body><Providers>{children}</Providers></body></html>;
}
