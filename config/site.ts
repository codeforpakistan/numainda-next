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
      title: "About",
      href: "/about",
    },
    {
      title: "MNAs & MPAs",
      href: "/representatives",
    },
    {
      title: "Acts",
      href: "/bills",
    },
    {
      title: "Constitution",
      href: "/constitution",
    },
    {
      title: "Proceedings",
      href: "/proceedings",
    },
  ],
  links: {
    twitter: "https://twitter.com/codeforpakistan",
    github: "https://github.com/codeforpakistan/numainda-next",
  },
}
