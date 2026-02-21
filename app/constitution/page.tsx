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
              <p className="mt-4 text-sm text-muted-foreground">
                Want to learn more?{' '}
                <a
                  href="https://na.gov.pk/uploads/documents/1333523681_951.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Click here
                </a>
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
    preamble: "The Preamble to the Constitution of Pakistan, historically rooted in the Objectives Resolution, establishes the nation's foundational philosophy by declaring that absolute sovereignty over the universe belongs solely to Allah, with the state's authority exercised as a sacred trust through the chosen representatives of the people. It envisions a democratic, federal state where Islamic principles of freedom, equality, tolerance, and social justice are fully observed, enabling Muslims to live their lives in accordance with the Quran and Sunnah. Concurrently, it explicitly guarantees the independence of the judiciary, ensures fundamental rights for all citizens, and mandates adequate provisions for religious minorities to freely profess their faiths and develop their cultures.",
    introductory: "Part I of the Constitution of Pakistan establishes the nation as a federal republic officially named the \"Islamic Republic of Pakistan,\" defining its territorial boundaries and formally declaring Islam as the state religion. It sets the foundational legal framework by making the Objectives Resolution a substantive part of the Constitution and commits the state to eliminating all forms of exploitation based on socialist principles of fair labor. Crucially, it guarantees the rule of law by ensuring every individual's inalienable right to be treated strictly according to the law to protect their life, liberty, and property. Simultaneously, it establishes that loyalty to the State and obedience to the Constitution are the inviolable duties of every citizen, sternly warning that any attempt to abrogate, suspend, or subvert the Constitution by force or unconstitutional means constitutes high treason.",
    "fundamental-rights": "Part II guarantees essential civil liberties to all citizens, including equality before the law, freedom of speech, religion, association, and movement, while explicitly prohibiting slavery, forced labor, retrospective punishment, and illegal detention. Alongside these legally enforceable rights, it outlines the \"Principles of Policy,\" which serve as guiding socio-economic directives for the state; these principles mandate the government to promote Islamic teachings, ensure social justice, protect minorities, empower women in national life, and eradicate illiteracy and poverty to foster an equitable welfare state.",
    federation: "Part III establishes the core framework of the federal government, defining the role of the President as the ceremonial Head of State and detailing the bicameral Majlis-e-Shoora (Parliament), which consists of the population-based National Assembly and the equal-representation Senate. It vests executive authority in the Prime Minister—acting as the chief executive—and the Cabinet, making them directly accountable to the National Assembly. Furthermore, it comprehensively outlines the qualifications for these high offices, the procedures for legislative law-making, financial protocols, and the democratic mechanisms for electing or removing the Prime Minister and President.",
    provinces: "Part IV of the Constitution establishes the democratic framework and executive authority of Pakistan's four provincial governments, mirroring the federal system at the regional level. It defines the role of the Governor as the ceremonial representative of the Federation appointed by the President, while vesting true executive power in the Chief Minister and their Cabinet, who are directly elected by and accountable to the Provincial Assembly. This section comprehensively outlines the rules for the composition, duration, and legislative procedures of the Provincial Assemblies, ensuring representative governance, managing provincial financial protocols, and establishing the constitutional mechanisms for electing or removing the Chief Minister through votes of confidence or no-confidence.",
    "federation-provinces": "Part V delineates the critical balance of power and administrative relationship between the federal government and the federating provinces, primarily functioning to safeguard provincial autonomy. It defines the distribution of legislative powers by restricting the central Parliament to subjects explicitly enumerated in the Federal Legislative List, while guaranteeing that all residual legislative powers belong exclusively to the Provincial Assemblies. To foster cooperative federalism and resolve jurisdictional disputes, this part formally establishes vital inter-provincial constitutional bodies—most notably the Council of Common Interests (CCI) and the National Economic Council (NEC)—which are mandated to formulate unified policies, manage shared natural and economic resources, and ensure equitable development across the entire nation.",
    finance: "Part VI regulates the financial architecture of the state, focusing on the equitable distribution of resources between the Federal Government and the Provinces. It mandates the formation of a National Finance Commission (NFC) at regular intervals to determine the \"NFC Award,\" which dictates how tax revenues collected by the center are shared with the provinces. Additionally, this section defines the Federal and Provincial Consolidated Funds, outlines the limits of government borrowing and audit procedures, and establishes the legal framework for government contracts and property ownership, ensuring fiscal responsibility and transparency in the use of public funds.",
    judiciary: "Part VII establishes the hierarchy and jurisdiction of the courts, ensuring the independence of the judiciary as a separate pillar of the state. It details the powers of the Supreme Court, the High Courts of each province, and the Federal Shariat Court (which examines laws for conformity with Islam), while also outlining the formation of Constitutional Benches to handle specific constitutional interpretations (following recent amendments). Furthermore, it codifies the procedures for the appointment of judges through a Judicial Commission and their accountability via the Supreme Judicial Council, which investigates misconduct.",
    elections: "Part VIII creates the constitutional machinery for democracy by establishing the Election Commission of Pakistan (ECP) as an independent and autonomous body. It defines the appointment and powers of the Chief Election Commissioner and Commission members, charging them with the duty of organizing and conducting honest, just, and fair elections for the Parliament, Provincial Assemblies, and local governments. This part also governs the preparation of electoral rolls and the delimitation of constituencies, ensuring that the will of the people is accurately reflected in the legislatures.",
    "islamic-provisions": "Part IX creates the mechanism to ensure the state's laws align with the religious identity of the \"Islamic Republic.\" It explicitly declares that all existing laws shall be brought in conformity with the Injunctions of Islam (Quran and Sunnah) and prohibits the enactment of any law that is repugnant to them. To facilitate this, it establishes the Council of Islamic Ideology (CII), a constitutional advisory body composed of scholars and experts, which advises the Parliament and Provincial Assemblies on legal matters to ensure they adhere to Islamic principles.",
    emergency: "Part X grants the President extraordinary powers to declare a Proclamation of Emergency in situations where the security of Pakistan is threatened by war, external aggression, or internal disturbance beyond a province's control. During such emergencies, the federal government may extend its executive authority to the provinces, the Parliament may legislate on provincial matters, and the enforcement of certain Fundamental Rights may be suspended. This section also covers financial emergencies and outlines the strict parliamentary approval required to prolong these emergency measures.",
    amendments: "Part XI lays down the rigid procedure for altering the Constitution, ensuring that the supreme law cannot be changed easily or arbitrarily. It dictates that a bill to amend the Constitution can originate in either house of Parliament but must be passed by a two-thirds majority of the total membership of both the National Assembly and the Senate. It further protects provincial autonomy by requiring that any amendment altering the limits of a province must also be approved by a two-thirds majority of that specific Provincial Assembly before receiving the President's assent.",
    miscellaneous: "Part XII acts as a catch-all section that addresses vital operational aspects of the state not covered elsewhere, including the \"Services of Pakistan\" (Civil Service) and the command structure of the Armed Forces, placing them under the control of the Federal Government. It defines the legal protection and immunity for the President and Governors, prohibits the formation of private armies, and declares Urdu as the National language. Additionally, it contains the \"Definitions\" and \"Interpretation\" clauses (Article 260) that legally define terms used throughout the document, such as \"Muslim\" and \"Non-Muslim.\""
  }
  return summaries[id] || "No summary available."
}
