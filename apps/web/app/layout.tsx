import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCReactProvider } from "@/trpc/client"
import { Instrument_Sans, Inter } from "next/font/google";
import { cn } from "@workspace/ui/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans antialiased", "font-sans", inter.variable)}>
      <body>
        <TRPCReactProvider>
          <ThemeProvider>{children}</ThemeProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  )
}
