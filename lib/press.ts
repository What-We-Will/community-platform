export type PressItem = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  date: string;
  logoSrc: string;
  logoAlt: string;
};

export const PRESS_ITEMS: PressItem[] = [
  {
    id: "time",
    publisher: "TIME",
    title:
      "'Everyone’s a Line On a Spreadsheet:' Inside Oracle’s Mass Layoffs and the Workers Fighting Back",
    url: "https://time.com/article/2026/04/30/oracle-layoffs-ai-tech-jobs/",
    date: "May 1, 2026",
    logoSrc: "/images/press/time.svg",
    logoAlt: "TIME",
  },
  {
    id: "fast-company",
    publisher: "Fast Company",
    title:
      "Lost your job to AI? These support programs provide cash, support, and more",
    url: "https://www.fastcompany.com/91529471/lost-your-job-to-ai-these-support-programs-provide-cash-support-and-more",
    date: "April 23 2026",
    logoSrc: "/images/press/fast-company.svg",
    logoAlt: "Fast Company",
  },
  {
    id: "gizmodo",
    publisher: "Gizmodo",
    title:
      "A program is now sending basic income payments to AI-impacted workers",
    url: "https://gizmodo.com/a-program-is-now-sending-basic-income-payments-to-ai-impacted-workers-2000737749",
    date: "March 25, 2026",
    logoSrc: "/images/press/gizmodo.svg",
    logoAlt: "Gizmodo",
  },
  {
    id: "blood-in-the-machine",
    publisher: "Blood in the Machine",
    title: "The first basic income for workers impacted by AI has begun sending out $1,000 monthly payments",
    url: "https://www.bloodinthemachine.com/p/the-first-basic-income-for-workers",
    date: "March 24 2026",
    logoSrc: "/images/press/blood-in-the-machine.svg",
    logoAlt: "Blood in the Machine",
  },
];
