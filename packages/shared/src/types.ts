// Shared types across all packages
export type SiteConfig = {
  name: string;
  description: string;
  mainNav: Array<{
    title: string;
    href: string;
  }>;
  links: {
    twitter: string;
    github: string;
  };
};
