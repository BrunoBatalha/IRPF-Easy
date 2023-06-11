import './globals.css'
import { Metadata } from 'next'
import { Roboto_Flex } from 'next/font/google'

const font = Roboto_Flex({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'IRPF Easy',
  description: 'Facilidade na declaração',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={font.className}>{children}</body>
    </html>
  )
}
