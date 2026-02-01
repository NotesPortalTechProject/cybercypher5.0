// Root layout for the app
import './globals.css'

export const metadata = {
  title: 'Ticket System',
  description: 'Report errors and issues',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
