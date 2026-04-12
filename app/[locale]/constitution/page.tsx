import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Book,
  Scale,
  Landmark,
  Building2,
  Hand,
  Wallet,
  Gavel,
  Check,
  BookOpen,
  AlertTriangle,
  FileSignature,
  Files
} from "lucide-react"
import { ConstitutionViewTracker } from "@/components/constitution-view-tracker"
import { getTranslations } from 'next-intl/server'

type SectionId = 'preamble' | 'introductory' | 'fundamental-rights' | 'federation' |
  'provinces' | 'federation-provinces' | 'finance' | 'judiciary' | 'elections' |
  'islamic-provisions' | 'emergency' | 'amendments' | 'miscellaneous';

type TranslationKey = 'preamble' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' |
  'part6' | 'part7' | 'part8' | 'part9' | 'part10' | 'part11' | 'part12';

type TranslationDescKey = 'preambleDesc' | 'part1Desc' | 'part2Desc' | 'part3Desc' | 'part4Desc' | 'part5Desc' |
  'part6Desc' | 'part7Desc' | 'part8Desc' | 'part9Desc' | 'part10Desc' | 'part11Desc' | 'part12Desc';

export default async function ConstitutionPage() {
  const t = await getTranslations('Constitution')

  const tableOfContents: Array<{
    titleKey: TranslationKey;
    descKey: TranslationDescKey;
    id: SectionId;
    icon: typeof Book;
  }> = [
    { titleKey: 'preamble', descKey: 'preambleDesc', id: 'preamble', icon: Book },
    { titleKey: 'part1', descKey: 'part1Desc', id: 'introductory', icon: BookOpen },
    { titleKey: 'part2', descKey: 'part2Desc', id: 'fundamental-rights', icon: Scale },
    { titleKey: 'part3', descKey: 'part3Desc', id: 'federation', icon: Landmark },
    { titleKey: 'part4', descKey: 'part4Desc', id: 'provinces', icon: Building2 },
    { titleKey: 'part5', descKey: 'part5Desc', id: 'federation-provinces', icon: Hand },
    { titleKey: 'part6', descKey: 'part6Desc', id: 'finance', icon: Wallet },
    { titleKey: 'part7', descKey: 'part7Desc', id: 'judiciary', icon: Gavel },
    { titleKey: 'part8', descKey: 'part8Desc', id: 'elections', icon: Check },
    { titleKey: 'part9', descKey: 'part9Desc', id: 'islamic-provisions', icon: BookOpen },
    { titleKey: 'part10', descKey: 'part10Desc', id: 'emergency', icon: AlertTriangle },
    { titleKey: 'part11', descKey: 'part11Desc', id: 'amendments', icon: FileSignature },
    { titleKey: 'part12', descKey: 'part12Desc', id: 'miscellaneous', icon: Files }
  ]

  return (
    <div className="container py-8 space-y-8">
      <ConstitutionViewTracker />
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {t('title')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Table of Contents with Icons */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tableOfContents')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableOfContents.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-start p-4 rounded-lg hover:bg-muted transition-colors group"
              >
                <section.icon className="h-5 w-5 mr-3 mt-1 text-muted-foreground group-hover:text-primary" />
                <div>
                  <h3 className="font-semibold">{t(section.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(section.descKey)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Sections with Icons */}
      <div className="space-y-6">
        {tableOfContents.map(section => (
          <Card key={section.id} id={section.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <section.icon className="h-6 w-6 text-primary" />
                <CardTitle>{t(section.titleKey)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-muted-foreground">
                {getSectionSummary(section.id)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function getSectionSummary(id: SectionId): string {
  const summaries: Record<SectionId, string> = {
    preamble: "The Preamble states that Pakistan's sovereignty belongs to Allah, democracy will be based on Islamic principles, minorities are protected, and justice, equality, and rights are guaranteed.",
    introductory: "Defines Pakistan as the Islamic Republic, lays out its territories, and establishes basic principles such as equality and rule of law.",
    "fundamental-rights": "Lists citizens' rights including freedom of speech, religion, and protection from discrimination. These rights are enforceable in courts.",
    federation: "Describes the structure of the federal government, the roles of the President, Prime Minister, and Parliament, and the separation of powers.",
    provinces: "Each province has its own assembly, governor, and Chief Minister, with significant autonomy over local affairs.",
    "federation-provinces": "Defines the division of legislative and executive powers between the federal and provincial governments, ensuring cooperative federalism.",
    finance: "Covers financial management, including the National Finance Commission, division of resources, taxation, and government borrowing.",
    judiciary: "Establishes the Supreme Court, High Courts, and lower courts to ensure justice and interpretation of laws, ensuring an independent judiciary.",
    elections: "Outlines how elections are conducted, the role of the Election Commission, and ensures transparency and fairness in democratic processes.",
    "islamic-provisions": "States that all laws must conform to Islam, defines the role of the Council of Islamic Ideology, and outlines religious freedoms.",
    emergency: "Allows the government to take temporary extraordinary measures during war or internal unrest, but with checks to prevent abuse.",
    amendments: "Explains how the Constitution can be changed through a two-thirds majority in Parliament, ensuring a structured evolution of laws.",
    miscellaneous: "Contains provisions on governance, languages, services, and other legal matters that do not fit into other categories."
  }
  return summaries[id] || "No summary available."
}
