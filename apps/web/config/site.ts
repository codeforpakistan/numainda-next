export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Numainda",
  description:
    "A chatbot that answers questions about Pakistan's constitution, elections act, and parliamentary proceedings.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Chat",
      href: "/chat",
    },
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Proceedings",
      href: "/proceedings",
    },
    {
      title: "Acts",
      href: "/bills",
    },
    {
      title: "Constitution",
      href: "/constitution",
    },
  ],
  links: {
    twitter: "https://twitter.com/codeforpakistan",
    github: "https://github.com/codeforpakistan/numainda-next",
  },
}
