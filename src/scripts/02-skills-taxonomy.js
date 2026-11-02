/* ===================== Skills taxonomy ===================== */
// Each line: Display name|alias|alias… (matching is case- and AU/US-spelling-insensitive)
const HARD_SKILLS = `
SolidWorks|solid works
AutoCAD|auto cad
CATIA
Creo|ptc creo|pro/engineer
Siemens NX|unigraphics
Autodesk Inventor
Fusion 360
Revit
Civil 3D
MicroStation
3D modelling|3d models|3d model|3d cad
CAD|computer-aided design|computer aided design
GD&T|geometric dimensioning and tolerancing
Engineering drawings|technical drawings|drafting|detailed drawings|shop drawings
FEA|finite element analysis|finite element
CFD|computational fluid dynamics
ANSYS
Abaqus
COMSOL
MATLAB
Simulink
LabVIEW
Thermodynamics
Fluid mechanics|fluid dynamics
Heat transfer
Stress analysis
Structural analysis
Vibration analysis
Engineering calculations|hand calculations|design calculations
Mechanical design
Structural design
Thermal design|thermal management
Product design
Root cause analysis|rca
FMEA|failure mode and effects analysis
HAZOP
Risk assessment
Feasibility studies|feasibility study|pre-feasibility|prefeasibility
Design for manufacture|dfm|dfma
~Prototyping|prototypes
3D printing|additive manufacturing
CNC machining|cnc|machining
~Welding
HVAC|air conditioning
Piping design|piping|pipework
~Pumps|pump selection|pump systems
Pressure vessels
P&ID|p&ids|piping and instrumentation diagrams
Process engineering
Maintenance planning|maintenance engineering|preventive maintenance|preventative maintenance
Reliability engineering
~Design reviews|design review
~Site inspections|site inspection|site visits
~Commissioning
~Renewable energy|renewables
~Solar PV|photovoltaic|solar energy|solar
~Wind energy|wind turbines|wind farm
~Hydrogen|green hydrogen
Electrolysers|electrolysis|electrolyser
Battery storage|bess|battery energy storage
Energy modelling|energy model
~Energy efficiency
~Decarbonisation|net zero
Power systems
~Oil and gas|oil & gas
~LNG
~Mining|mining industry|mine site
PLC|plcs|programmable logic controllers
SCADA
Control systems
~Instrumentation
Electrical design
Circuit design
PCB design
Embedded systems
~Robotics
~Automation|industrial automation|process automation
Mechatronics
Geotechnical engineering|geotechnical
~Surveying
~Site setout|setout|setting out
12d Model|12d
Inspection and test plans|inspection and test plan|itps|itp
Temporary works
Quantity take-offs|quantity take-off|take-offs|takeoffs|quantity takeoffs|bills of quantities|bill of quantities|boq
~Cost planning|cost plans|cost reports|cost reporting
Construction management
Australian Standards|as/nzs|australian standard
ISO 9001
ISO 14001
ISO 45001
~Environmental management|environmental compliance|environmental approvals|environmental management plans|environmental management plan
~Sustainability reporting|esg reporting
~Incident investigation|incident investigations|investigating incidents
WHS|work health and safety|ohs|oh&s|hse|health and safety|occupational health and safety
~Quality assurance|qa
~Quality control|qc
Six Sigma|lean six sigma
Lean manufacturing|lean methodology|lean principles
~Continuous improvement
Project management
~Project planning
~Scheduling|project scheduling|maintenance scheduling
Microsoft Project|ms project
Primavera P6|primavera|p6
~Budgeting|budget management|managing budgets
~Cost estimation|cost estimating|cost estimates
~Procurement
Contract management|contract administration
~Tendering|tenders|tender submissions
Agile|scrum
Jira
~Risk management
~Change management
Requirements analysis|requirements gathering
Technical reports|technical writing|technical report|report writing
~Documentation|technical documentation|engineering documentation
Python
Java
JavaScript
TypeScript
C++
C#
SQL
Microsoft Excel|excel|ms excel
VBA
Power BI|powerbi
Tableau
Data analysis|data analytics|analysing data
Data visualisation|data visualisations
Data cleaning|data cleansing|data wrangling
~Statistics|statistical analysis
Machine learning
~Artificial intelligence|generative ai|ai tools|ai models
pandas
NumPy
Git|github|version control
AWS|amazon web services
Microsoft Azure|azure
Google Cloud|gcp
Docker
Kubernetes
Linux
React.js|reactjs|react native
Node.js|nodejs
HTML
CSS
APIs|api|rest api
SAP
Salesforce
~CRM|customer relationship management
~ERP
GIS|geographic information systems|arcgis
QGIS
Google Earth Pro|google earth
Microsoft Office|ms office|office suite|microsoft 365|office 365
Microsoft Word|ms word
PowerPoint
Financial modelling|financial models
Financial analysis
~Forecasting
~Accounting
Xero
MYOB
~Reconciliations|reconciliation
~Auditing|internal audit|audits
~Valuation|valuations
~Market research
Business analysis
~Process improvement
~Customer service
~Sales
~Marketing
~Digital marketing
SEO|search engine optimisation
~Social media
~Inventory management|stock management|stock control|stock deliveries
~Point of sale
~Cash handling|handling cash|cash management
RSA|responsible service of alcohol
Food safety|food handling|food safety supervisor|haccp
~Data entry
~Recruitment|recruiting|talent acquisition
Employee relations|industrial relations|workplace relations
HRIS|human resources information system
~Onboarding
~Patient care|clinical care|patient-centred care
Medication administration|administering medication|medication management
Lesson planning|curriculum planning|curriculum development
Classroom management
Forklift licence|forklift|forklift license|lf licence
Working at heights|work at heights|heights ticket
Driver's licence|drivers licence|driver licence|driver's license|drivers license|driving licence
White Card|construction induction card
~First aid
Working with Children Check|wwcc
Police check|national police check|criminal history check|police clearance
NDIS Worker Screening|ndis worker screening check|ndis screening
Security clearance|baseline clearance|baseline security clearance|nv1|nv2|negative vetting|agsva
`;

const SOFT_SKILLS = `
Communication|communication skills|communicate|communicating|written and verbal|verbal and written|written communication|verbal communication|communicated|communicates
Teamwork|team player|collaboration|collaborate|collaborative|collaboratively|collaborating|cross-functional|work in a team|working in a team|collaborated|collaborates|part of a team|team environment|work well with others|team-oriented|team oriented
Leadership|leadership skills|led a team|team leader|leading teams|supervised|supervising
Problem solving|problem-solving|solve problems|solving problems|problem solver|solved problems|resolved issues|resolving issues|troubleshooting|troubleshot|propose solutions|find solutions|solution-focused|solutions-focused|solution focused|creative solutions|practical solutions
Critical thinking
Attention to detail|detail-oriented|detail oriented|eye for detail|high quality|high-quality|quality outcomes|accuracy|meticulous|high standards|thorough
Time management|manage time|meet deadlines|meeting deadlines|deadlines|multitask|multi-task|multitasking|multi-tasking
Organisational skills|well organised|highly organised|organised
~Adaptability|adaptable|adaptability|adapting|adapted|flexible|flexibility|adapt to change|comfortable with change|adapt quickly
~Initiative|proactive|self-starter|self-motivated|self motivated|proactively|took the initiative|taking the initiative|outcome driven|outcome-driven|results-focused|results focused|results-oriented|results oriented|take ownership|takes ownership|self-directed
~Analytical skills|analytical|analytical thinking
Interpersonal skills|interpersonal|building relationships|built relationships|rapport|positive relationships|strong relationships|working relationships|relationship building|build relationships|relationships with
~Customer focus|customer-focused|customer focused|client-focused|client focused
~Working independently|work independently|working independently|work autonomously
~Mentoring|coaching
Negotiation|negotiating
Presentation skills|presenting|presentations
Decision making|decision-making
~Creativity|creative|innovative|innovation|innovate|new ideas|think creatively|creative thinking
~Resilience|resilient
Prioritisation|prioritise|prioritising|prioritised|competing priorities
~Willingness to learn|eager to learn|keen to learn|learn quickly|willingness to learn|learning quickly|learnt quickly|learned quickly|learn new skills|desire to learn|growth mindset|open to feedback|coachable|curious|curiosity
~Stakeholder management|stakeholder engagement|managing stakeholders|stakeholders|stakeholder relationships|liaise with|liaising with
~Safety mindset|commitment to safety|safety-focused|safety focused|safety first|safety-first|safe work practices|work safely|safety culture|safety conscious|safety-conscious|safety awareness
~Accountability|accountable|dependable
~Empathy|empathetic|emotional intelligence|compassion|compassionate
Conflict resolution|resolve conflict|resolving conflict|resolve conflicts|conflict management|de-escalation|de-escalate
`;

const STOP = new Set(`a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours yourself within across via per etc e.g ie i.e eg
role roles position positions opportunity opportunities candidate candidates applicant applicants apply applying application applications team teams work working works worked experience experienced skills skill ability abilities able strong excellent good great knowledge understanding including include includes included ensure ensuring provide providing provided support supporting supported required requirements requirement requires essential desirable preferred plus ideal ideally successful join joining company companies business businesses client clients year years new high highly level levels key responsibilities responsibility responsible duties day days week weeks based related relevant environment culture benefits benefit salary package offer offers offering people person help helping well across must may might need needs looking seeking want wants like make making made use using used get getting take part full time part-time full-time permanent contract casual hours graduate graduates program programs programme junior senior lead about you we're you'll you're we'll what who across range wide variety various other others within multiple one two three four five first last next current currently opportunity growth grow develop development developing career careers success successful passion passionate deliver delivering delivered project projects office site sites approach approaches committed commitment value values diverse diversity inclusive inclusion equal employer australia australian melbourne sydney brisbane perth adelaide hobart canberra darwin victoria queensland nsw vic qld wa sa tas act nt clear clearly closely close following follow follows
prepare prepares preparing prepared carry carrying assist assisting attend attending contribute contributing produce producing apply travel willingness completed complete within including exposure remote sites site-based good`.split(/\s+/));

