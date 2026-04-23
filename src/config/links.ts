export interface LinkDocument {
  id: number;
  title: string;
  url: string;
  description: string;
  icon: string;
}

export const DASHBOARD_LINKS: LinkDocument[] = [
  {
    id: 1,
    title: "GitHub",
    url: "https://github.com/enVid-tech",
    description: "Source code repositories",
    icon: "🌐",
  },
  {
    id: 2,
    title: "Portfolio",
    url: "https://etran.dev",
    description: "My work and projects",
    icon: "📄",
  },
  {
    id: 3,
    title: "AP Calculus BC Textbook",
    url: "https://calcbc.etran.dev/",
    description: "AP Calculus BC online textbook",
    icon: "📚", 
  },
  {
    id: 4,
    title: "Discord",
    url: "https://discord.etran.dev/",
    description: "My discord profile",
    icon: "💬",
  },
  {
    id: 5,
    title: "Youtube",
    url: "https://www.youtube.com/@enVidGaming",
    description: "My gaming channel",
    icon: "📺",
  },
  {
    id: 6,
    title: "Minecraft SMP Map",
    url: "https://smp.etran.dev/",
    description: "An active rendering of the main SMP server",
    icon: "🗺️",
  },
  {
    id: 7,
    title: "WebDav UI",
    url: "https://webdavui.etran.dev/",
    description: "My online file system service",
    icon: "📁",
  },
];