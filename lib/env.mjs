import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    // Email service configuration
    RESEND_API_KEY: z.string().optional(),
    BEEHIVE_API_URL: z.string().optional(),
    BEEHIVE_API_TOKEN: z.string().optional(),
    QSTASH_TOKEN: z.string().optional(), // For Upstash QStash
    ADMIN_PASSWORD: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
    NEXT_PUBLIC_PEHCHAN_URL: z.string().optional(),
    NEXT_PUBLIC_CLIENT_ID: z.string().optional(),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  // runtimeEnv: {
  //   DATABASE_URL: process.env.DATABASE_URL,
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PEHCHAN_URL: process.env.NEXT_PUBLIC_PEHCHAN_URL,
    NEXT_PUBLIC_CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID,
  },
});
