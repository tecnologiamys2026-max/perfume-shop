import './globals.css'

export const metadata = {
  title: 'Mayra Shop - Perfumes y Cuidado Corporal',
  description: 'Descubre nuestra exclusiva colección de perfumes y cremas corporales. Compra en línea y contáctanos por WhatsApp.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
