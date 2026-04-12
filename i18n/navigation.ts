import { createSharedPathnamesNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing)
