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

type SectionId = 'preamble' | 'introductory' | 'fundamental-rights' | 'federation' | 
  'provinces' | 'federation-provinces' | 'finance' | 'judiciary' | 'elections' | 
  'islamic-provisions' | 'emergency' | 'amendments' | 'miscellaneous';

export default async function ConstitutionPage() {
  const tableOfContents = [
    { title: 'Preamble', id: 'preamble', description: 'Foundational principles and objectives', icon: Book },
    { title: 'Part I: Introductory', id: 'introductory', description: 'Basic definitions and identity', icon: BookOpen },
    { title: 'Part II: Fundamental Rights', id: 'fundamental-rights', description: 'Rights and freedoms of citizens', icon: Scale },
    { title: 'Part III: Federation of Pakistan', id: 'federation', description: 'Structure of federal government', icon: Landmark },
    { title: 'Part IV: Provinces', id: 'provinces', description: 'Provincial governance and autonomy', icon: Building2 },
    { title: 'Part V: Relations Between Federation & Provinces', id: 'federation-provinces', description: 'Division of powers and coordination', icon: Hand },
    { title: 'Part VI: Finance & Property', id: 'finance', description: 'Financial management and resources', icon: Wallet },
    { title: 'Part VII: The Judicature', id: 'judiciary', description: 'Court system and judicial powers', icon: Gavel },
    { title: 'Part VIII: Elections', id: 'elections', description: 'Electoral process and administration', icon: Check },
    { title: 'Part IX: Islamic Provisions', id: 'islamic-provisions', description: 'Islamic laws and principles', icon: BookOpen },
    { title: 'Part X: Emergency Provisions', id: 'emergency', description: 'Emergency powers and situations', icon: AlertTriangle },
    { title: 'Part XI: Amendment of Constitution', id: 'amendments', description: 'How the Constitution is modified', icon: FileSignature },
    { title: 'Part XII: Miscellaneous', id: 'miscellaneous', description: 'Additional legal provisions', icon: Files }
  ]

  return (
    <div className="container py-8 space-y-8">
      <ConstitutionViewTracker />
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Pakistan&apos;s Constitution
        </h1>
        <p className="text-xl text-muted-foreground">
          An accessible guide to Pakistan&apos;s legal framework
        </p>
      </div>

      {/* Table of Contents with Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Table of Contents</CardTitle>
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
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
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
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-muted-foreground">
                {getSectionSummary(section.id as SectionId)}
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
