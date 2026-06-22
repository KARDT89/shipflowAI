import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCReactProvider } from "@/trpc/client"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <TRPCReactProvider>
          <ThemeProvider>{children}</ThemeProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  )
}
