import {
  JetBrains_Mono as FontMono,
  Inter as FontSans,
  Noto_Nastaliq_Urdu as FontUrdu,
} from "next/font/google"

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const fontUrdu = FontUrdu({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urdu",
  display: "swap",
})
