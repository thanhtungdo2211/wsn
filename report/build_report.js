// Build the summary report (DOCX) for Paper B:
//   M. Trigka, E. Dritsas, "Wireless Sensor Networks: From Fundamentals and
//   Applications to Innovations and Future Trends", IEEE Access 13 (2025).
// Usage: node build_report.js   ->  WSN_Summary_Report.docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Tab, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, HeadingLevel, LevelFormat,
  TabStopType, PageNumber, PageBreak, Header, Footer, TableOfContents,
  Math: OMath, MathRun, MathSubScript, MathSuperScript, MathSum, MathFraction,
  MathRoundBrackets, MathSubSuperScript, ImageRun, InternalHyperlink, ExternalHyperlink, Bookmark,
} = require("docx");

// ---------------------------------------------------------------- constants
const FONT = "Times New Roman";
const BLACK = "000000";
// A4 with HUST report margins (same as the sample report): top/bottom 2 cm, left 3.5 cm, right 2.5 cm
const PAGE_W = 11907, PAGE_H = 16840;
const MARGIN = { top: 1134, bottom: 1134, left: 1985, right: 1418 };
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right;  // 8504 DXA
const OUT = "WSN_Summary_Report.docx";

// ---------------------------------------------------------------- inline markup
// **bold**, *italic*, _{subscript}, ^{superscript}; citations [n] become links to reference n
function runs(text, base = {}) {
  const parts = text.split(/(\*\*.+?\*\*|\*.+?\*|_\{.+?\}|\^\{.+?\}|\[\d+\]|\{(?:eq|tab|sec):[\d.]+\})/g)
    .filter((x) => x && !/^(eq|tab|sec)$/.test(x));
  return parts.map((s) => {
    const xref = s.match(/^\{(eq|tab|sec):([\d.]+)\}$/);
    if (xref) {
      const [, kind, n] = xref;
      const label = { eq: `(${n})`, tab: `Table ${n}`, sec: `Section ${n}` }[kind];
      return new InternalHyperlink({ anchor: `${kind}_${n.replace(".", "_")}`, children: [new TextRun({ ...base, text: label })] });
    }
    const cite = s.match(/^\[(\d+)\]$/);
    if (cite) return new InternalHyperlink({ anchor: `ref${cite[1]}`, children: [new TextRun({ ...base, text: s })] });
    if (s.startsWith("**")) return new TextRun({ ...base, text: s.slice(2, -2), bold: true });
    if (s.startsWith("_{")) return new TextRun({ ...base, text: s.slice(2, -1), subScript: true });
    if (s.startsWith("^{")) return new TextRun({ ...base, text: s.slice(2, -1), superScript: true });
    if (s.startsWith("*")) return new TextRun({ ...base, text: s.slice(1, -1), italics: true });
    return new TextRun({ ...base, text: s });
  });
}

const P = (text, opts = {}) =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, ...opts, children: runs(text) });
// Headings that start with a number ("7.3 Worked …") get a bookmark "sec_7_3" for {sec:7.3} links.
const headingChildren = (t) => {
  const num = t.match(/^(\d+(?:\.\d+)?)\.? /);
  return num ? [new Bookmark({ id: `sec_${num[1].replace(".", "_")}`, children: [new TextRun(t)] })] : [new TextRun(t)];
};
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: headingChildren(t) });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: headingChildren(t) });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const bullet = (text) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 60 }, children: runs(text) });

// ---------------------------------------------------------------- tables
let tableNo = 0;
const border = { style: BorderStyle.SINGLE, size: 4, color: BLACK };
const cellPara = (t, bold) => new Paragraph({ spacing: { after: 0 }, children: runs(t, { size: 19, bold }) });

function cell(content, width, header) {
  const items = Array.isArray(content) ? content : [content];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    shading: header ? { fill: "E7E6E6", type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: items.map((t) => cellPara(t, header)),
  });
}

// Returns [caption, table, source-note]
// `relWidths` are relative column weights; they are scaled to CONTENT_W.
function table(caption, headers, rows, relWidths, source) {
  tableNo += 1;
  const total = relWidths.reduce((a, b) => a + b, 0);
  const widths = relWidths.map((w) => Math.floor((w * CONTENT_W) / total));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const cap = new Paragraph({
    keepNext: true, spacing: { before: 200, after: 80 }, alignment: AlignmentType.CENTER,
    children: [new Bookmark({ id: `tab_${tableNo}`, children: [new TextRun({ text: `Table ${tableNo}. `, bold: true, size: 20 })] }),
      new TextRun({ text: caption, size: 20 })],
  });
  const t = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false)) })),
    ],
  });
  const note = new Paragraph({
    spacing: { before: 60, after: 200 },
    children: runs(source || "", { italics: true, size: 18 }),
  });
  return [cap, t, note];
}

// ---------------------------------------------------------------- equations
let eqNo = 0;
const m = (t) => new MathRun(t);
const sub = (b, s) => new MathSubScript({ children: [m(b)], subScript: [m(s)] });
const sup = (b, s) => new MathSuperScript({ children: [m(b)], superScript: [m(s)] });
const subsup = (b, lo, hi) => new MathSubSuperScript({ children: [m(b)], subScript: [m(lo)], superScript: [m(hi)] });
const sum = (lo, hi, children) => new MathSum({ children, subScript: typeof lo === "string" ? [m(lo)] : lo, ...(hi ? { superScript: [m(hi)] } : {}) });
const frac = (n, d) => new MathFraction({ numerator: n, denominator: d });
const br = (children) => new MathRoundBrackets({ children });

function eq(children) {
  eqNo += 1;
  return new Paragraph({
    tabStops: [{ type: TabStopType.CENTER, position: CONTENT_W / 2 }, { type: TabStopType.RIGHT, position: CONTENT_W }],
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ children: [new Tab()] }), new OMath({ children }), new TextRun({ children: [new Tab()] }),
      new Bookmark({ id: `eq_${eqNo}`, children: [new TextRun(`(${eqNo})`)] })],
  });
}

// Reference entry: "[n]" is the bookmark target of citations; "doi: X" links to https://doi.org/X
function refParagraph(r) {
  const [, num, rest] = r.match(/^\[(\d+)\] (.*)$/);
  const doi = rest.match(/doi: (\S+?)\.?$/);
  const body = doi ? rest.slice(0, doi.index) : rest;
  const children = [new Bookmark({ id: `ref${num}`, children: [new TextRun(`[${num}]`)] }), new TextRun({ children: [new Tab()] }), ...runs(body)];
  if (doi) children.push(new TextRun("doi: "), new ExternalHyperlink({ link: `https://doi.org/${doi[1]}`,
    children: [new TextRun({ text: doi[1], underline: {} })] }), new TextRun("."));
  return new Paragraph({ spacing: { after: 100 }, indent: { left: 540, hanging: 540 }, tabStops: [{ type: TabStopType.LEFT, position: 540 }], children });
}

// =================================================================== CONTENT
// HUST cover page, mirroring docs/[Final project]AC6301_TUNGDT252403M.docx
const LINE_W = 1540; // short rule under the university name (~2.7 cm)
const centered = (text, size, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 240, ...(opts.spacing || {}) },
  children: [new TextRun({ text, size, bold: opts.bold !== false, italics: opts.italics })],
});
const coverInfoRow = (label, value) => new TableRow({ children: [
  new TableCell({ width: { size: 3200, type: WidthType.DXA }, borders: noBorders,
    children: [new Paragraph({ indent: { left: 318 }, spacing: { after: 60 }, children: [new TextRun({ text: label, bold: true })] })] }),
  new TableCell({ width: { size: CONTENT_W - 3200, type: WidthType.DXA }, borders: noBorders,
    children: [new Paragraph({ spacing: { after: 60 }, children: [new TextRun(value)] })] }),
] });
const nb = { style: BorderStyle.NONE, size: 0, color: "auto" };
const noBorders = { top: nb, bottom: nb, left: nb, right: nb };

const titlePage = [
  centered("ĐẠI HỌC BÁCH KHOA HÀ NỘI", 30),
  new Paragraph({ spacing: { before: 60, after: 360 },
    indent: { left: (CONTENT_W - LINE_W) / 2, right: (CONTENT_W - LINE_W) / 2 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 1 } }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 }, children: [
    new ImageRun({ type: "jpg", data: fs.readFileSync(`${__dirname}/assets/hust_logo.jpg`),
      transformation: { width: 92, height: 138 }, altText: { title: "HUST logo", description: "Hanoi University of Science and Technology logo", name: "hust_logo" } }),
  ] }),
  centered("BÁO CÁO MÔN HỌC", 46, { spacing: { after: 240 } }),
  centered("Wireless Sensor Networks", 36, { spacing: { after: 200 } }),
  centered("Paper Summary: Wireless Sensor Networks – From Fundamentals and Applications to Innovations and Future Trends", 36),
  centered("(M. Trigka and E. Dritsas, IEEE Access, vol. 13, 2025)", 26, { bold: false, italics: true, spacing: { before: 120 } }),
  centered("ĐỖ THANH TÙNG", 28, { spacing: { before: 720 } }),
  centered("Tung.DT252432M@sis.hust.edu.vn", 26, { bold: false, spacing: { before: 60 } }),
  new Paragraph({ spacing: { before: 720 }, children: [] }),
  new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [3200, CONTENT_W - 3200],
    borders: { ...noBorders, insideHorizontal: nb, insideVertical: nb },
    rows: [
      coverInfoRow("Giảng viên hướng dẫn:", "[Instructor name]"),
      coverInfoRow("Mã học phần:", "[Course code]"),
      coverInfoRow("Mã số học viên:", "[Student ID]"),
    ],
  }),
  centered("HÀ NỘI, 11/2026", 26, { spacing: { before: 2400 } }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 28 })] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
];

const body = [
  // ------------------------------------------------------------ Abstract
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "Abstract", bold: true, size: 26 })] }),
  P("This report summarises and critically reviews the survey *Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends* by M. Trigka and E. Dritsas, published in IEEE Access in 2025 [1]. The paper organises the wireless sensor network (WSN) field along five axes: fundamental components (node and network architectures, energy models, medium access control, routing and parameter estimation), application domains, recent technological innovations, open challenges and future research directions. A distinctive feature of the survey is that every architecture and protocol family is paired with an explicit energy-consumption expression, giving the paper a common analytical thread. The report condenses each part of the paper into comparative tables and then assesses its strengths and weaknesses. To test one of the paper's central claims, that clustering reduces energy compared with direct transmission to the sink, the report adds a small worked example based on the standard first-order radio model. The example shows that the claim holds only when the sink is sufficiently far away, a condition that the paper's distance-free energy model cannot express."),

  // ------------------------------------------------------------ 1
  H1("1. Introduction"),
  H2("1.1 The Paper at a Glance"),
  ...table("Bibliographic information of the summarised paper.", ["Item", "Details"], [
    ["Title", "Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends"],
    ["Authors", "Maria Trigka, Elias Dritsas – Department of Informatics and Computer Engineering, University of West Attica, Athens, Greece"],
    ["Venue", "IEEE Access, vol. 13, pp. 96365–96399 (published 21 May 2025)"],
    ["DOI", "10.1109/ACCESS.2025.3572328"],
    ["Type", "Survey / review article (35 pages, 10 comparative tables, 355 references), open access under CC BY 4.0"],
    ["Scope", "Architectures, energy models, MAC and routing protocols, parameter estimation, 12 application domains, innovations, challenges and future trends"],
  ], [2000, 7026]),

  H2("1.2 Motivation of the Survey"),
  P("WSNs consist of spatially distributed, battery-powered nodes that sense, process and communicate data, usually towards a sink or base station. Advances in microelectronics, communication protocols and data processing have turned them from passive data loggers into systems that support adaptive communication, real-time analytics and collaborative decision-making. The authors argue that three forces now shape the field. First, *energy* remains the dominant constraint: batteries are finite and energy harvesting is subject to environmental variability. Second, deployments in harsh and dynamic environments impose strict requirements on reliability, fault tolerance and security, which must be met with very limited computation. Third, the integration of WSNs with the Internet of Things (IoT) and artificial intelligence (AI) opens new opportunities but also demands more processing power, stronger security and seamless interoperability."),
  P("Against this background, the authors compare their work with earlier surveys and observe that most of them focus on a single topic such as routing or clustering. Their survey instead aims to connect fundamentals with emerging, interdisciplinary topics such as quantum sensing, federated intelligence, blockchain-based trust and digital twins, and to cover topics they consider under-represented: real-time analytics, dynamic topologies and WSNs in extreme environments such as underwater systems and space."),

  H2("1.3 Claimed Contributions"),
  bullet("A well-rounded overview of foundational principles, architectural and energy models, real-world applications and emerging paradigms of WSNs."),
  bullet("A structured overview of innovations: energy harvesting, adaptive communication protocols, edge intelligence and security mechanisms."),
  bullet("A systematic analysis of persistent challenges (energy, scalability, dynamic topology management, security) with design implications."),
  bullet("Identification of research directions such as quantum sensing, bio-inspired architectures, federated intelligence, software-defined WSNs and digital twins."),
  bullet("A reference framework, supported by comparative and case-based tables, for designing adaptive, resilient and intelligent WSN infrastructures."),

  H2("1.4 Organisation"),
  P("The paper is organised as follows: Section II presents key components and technologies, Section III applications, Section IV innovations, Section V challenges, Section VI future trends, and Section VII concludes. This report follows the same order in Sections 2–6, adds a critical discussion with a worked numerical example in {sec:7}, and concludes in {sec:8}."),

  // ------------------------------------------------------------ 2
  H1("2. Fundamentals of WSNs (Paper Section II)"),
  P("Section II is the most technical part of the survey. It describes the architectural models, the data aggregation and reliability mechanisms, an energy-modelling framework, medium access control (MAC) and routing protocols, and parameter estimation techniques."),

  H2("2.1 Architectural Models"),
  P("At node level, a sensor node consists of sensing, processing, communication and power-management subsystems. At network level, the paper classifies architectures along three partially overlapping dimensions: the number of tiers (single-tier versus multi-tier), the location of control (centralized, decentralized or distributed), and the temporal behaviour of nodes (duty cycling)."),
  bullet("**Single-tier (flat)** networks use identical nodes that sense, process and forward data to the sink. They are simple and cheap, but nodes close to the sink relay traffic for the whole network, deplete their batteries first and can partition the network."),
  bullet("**Multi-tier** networks assign lower-tier nodes to local sensing and higher-tier nodes to aggregation and forwarding. This reduces communication overhead and improves scalability and fault tolerance, at the price of clustering, role-assignment and inter-tier synchronisation overhead."),
  bullet("**Centralized** architectures rely on a single sink with a global view, which simplifies complex analytics but creates a bottleneck and a single point of failure; nodes far from the sink need more transmit power and die early. They suit small, static deployments such as greenhouses."),
  bullet("**Decentralized** (cluster-based) architectures group nodes into clusters managed by cluster heads (CHs). LEACH is cited as the pioneering protocol, although its random CH selection lacks energy awareness and multi-hop support. The authors note that decentralized and multi-tier architectures are structurally equivalent (protocol-level versus system-level views), which allows a unified energy model."),
  bullet("**Distributed** architectures are fully peer-to-peer: each node decides locally and global quantities are obtained by consensus, for example with the average-consensus update in Eq. {eq:1}, where *N*_{i} is the neighbour set of node *i* and ε a step size."),
  eq([subsup("x", "i", "(k+1)"), m("="), subsup("x", "i", "(k)"), m("+ε"),
      sum([m("j∈"), sub("N", "i")], null, [br([subsup("x", "j", "(k)"), m("−"), subsup("x", "i", "(k)")])])]),
  bullet("**Duty-cycled** architectures alternate between active and sleep states. The duty cycle is *D* = *T*_{active}/*T*_{cycle} with *T*_{cycle} = *T*_{active} + *T*_{sleep}; advanced schemes raise *D* in regions with high event activity and lower it elsewhere, but require tight synchronisation."),
  ...table("Comparison of WSN architectures.", ["Architecture", "Organisation", "Strengths", "Weaknesses", "Typical use"], [
    ["Single-tier (flat)", "Identical nodes send to the sink", "Simple, low cost", "Poor scalability; hot spots near the sink", "Indoor environmental monitoring"],
    ["Multi-tier / decentralized", "Members → CH / upper tier → sink", "Scalable; less long-range traffic; fault tolerant", "Clustering and synchronisation overhead; CH energy burden", "Smart cities, industry, agriculture"],
    ["Centralized", "Sink aggregates and decides", "Global view; complex analytics", "Bottleneck; single point of failure; uneven depletion", "Greenhouses, small static networks"],
    ["Distributed", "Peer-to-peer, consensus", "Highest scalability and robustness; even energy use", "Coordination and convergence overhead", "Wide-area monitoring, disaster response"],
    ["Duty-cycled", "Periodic active / sleep", "Large lifetime gains", "Needs synchronisation; adds latency", "Long-term climate, wildlife tracking"],
  ], [1500, 1850, 1900, 2000, 1776], "Source: condensed from Section II-A and Table 2 of [1]."),

  H2("2.2 Data Aggregation and Reliability"),
  P("Data aggregation combines correlated readings before transmission. The paper distinguishes hierarchical (CH-based), tree-based and adaptive aggregation, and notes its costs: additional processing delay, integrity risks, and the fact that aggregators become attractive attack targets, which motivates secure aggregation with homomorphic or lightweight cryptography. For reliability, forward error correction (FEC) trades computation for fewer retransmissions, whereas automatic repeat request (ARQ) trades communication energy for reliability; the paper summarises the trade-off as *E*_{error} = *E*_{transmit} + *E*_{process}·(1 + *r*), where *r* is the redundancy factor. Time synchronisation, for example Reference Broadcast Synchronization (RBS), is essential for duty-cycled operation; the synchronisation error is reduced iteratively as *e*_{s}^{(k+1)} = α*e*_{s}^{(k)} + β."),

  H2("2.3 Energy-Modelling Framework"),
  P("A recurring thread of the paper is a family of additive energy models. The baseline model counts sensing, processing, transmission and reception energy for all *N* nodes:"),
  eq([sub("E", "baseline"), m("="), sum("i=1", "N", [br([sub("E", "sense,i"), m("+"), sub("E", "process,i"), m("+"), sub("E", "transmit,i"), m("+"), sub("E", "receive,i")])])]),
  P("In a centralized one-hop network, processing and reception are negligible, so the total reduces to sensing plus direct transmission to the sink:"),
  eq([sub("E", "centralized"), m("="), sum("i=1", "N", [br([sub("E", "sense,i"), m("+"), sub("E", "transmit,i")])])]),
  P("In clustered (hierarchical) networks, member nodes spend energy on sensing and short intra-cluster transmissions, while each of the *C* cluster heads spends energy on aggregation and on the long-range link to the sink:"),
  eq([sub("E", "clustered"), m("="), sum("j=1", "C", [sum([m("i∈"), sub("N", "j")], null, [sub("E", "local,i")])]), m("+"), sum("j=1", "C", [sub("E", "CH,j")])]),
  P("The paper refines the cluster-head term with an aggregation model, *E*_{aggregation} = *E*_{process,CH} + Σ_{i∈P}(*E*_{transmit,i} + *E*_{receive,i}), which separates fusion cost from forwarding cost along a path *P*. Finally, duty-cycled networks are described in terms of average power:"),
  eq([sub("E", "duty-cycle"), m("="), sum("i=1", "N", [br([sub("D", "i"), m("·"), sub("P", "active,i"), m("+"), br([m("1−"), sub("D", "i")]), m("·"), sub("P", "sleep,i")])])]),
  P("The authors state that clustering “significantly reduces long-range transmissions for non-CH nodes … though it also increases the energy burden at the cluster-head level”. {sec:7.3} examines this statement quantitatively."),

  H2("2.4 Medium Access Control Protocols"),
  P("MAC protocols decide when a node may use the shared channel; their main energy sinks are idle listening, collisions and overhearing. The paper groups them into four classes:"),
  bullet("**Contention-free (schedule-based):** TDMA assigns dedicated slots and is the natural choice inside clusters (as in LEACH); FDMA and CDMA separate nodes by frequency or code at the cost of hardware complexity; IEEE 802.15.4e TSCH combines time slots with channel hopping to mitigate interference."),
  bullet("**Contention-based:** dense WSNs often rely on CSMA/CA, whose collision rate grows with node density; RTS/CTS handshaking mitigates hidden-terminal collisions. *Synchronous* variants (S-MAC, T-MAC, DMAC) share a sleep/listen schedule with *T*_{frame} = *T*_{listen} + *T*_{sleep}; *asynchronous* variants (B-MAC with low-power listening, X-MAC with short strobed preambles and early acknowledgement, RI-MAC with receiver-initiated transmission, WiseMAC with learned wake-up schedules) avoid global synchronisation."),
  bullet("**Hybrid:** Z-MAC behaves like CSMA under low load and switches to TDMA under contention; its energy is modelled as a traffic-dependent blend of the two (Eq. {eq:6})."),
  bullet("**Adaptive:** reinforcement-learning MAC protocols learn channel-access policies online instead of following fixed rules."),
  eq([sub("E", "hybrid"), m("="), sum("i=1", "N", [br([m("α"), sub("E", "CSMA,i"), m("+"), br([m("1−α")]), sub("E", "TDMA,i")])])]),
  ...table("Classification of MAC protocols and their dominant energy terms.", ["Class", "Protocols", "Mechanism", "Dominant energy terms"], [
    ["Contention-free", "TDMA, FDMA, CDMA, IEEE 802.15.4e TSCH", "Dedicated time slots, frequency bands or codes; TSCH adds channel hopping", "Tx, Rx and sleep time; synchronisation overhead (no collisions)"],
    ["Contention-based, synchronous", "S-MAC, T-MAC, DMAC", "Common sleep/listen frames; T-MAC ends idle periods early; DMAC adapts to traffic", "Listening time T_{listen}·P_{listen} (idle listening)"],
    ["Contention-based, asynchronous", "CSMA/CA (RTS/CTS), B-MAC, X-MAC, RI-MAC, WiseMAC", "Carrier sensing; preamble sampling / low-power listening; receiver-initiated access", "Collision term T_{collision}·P_{collision}; preamble term T_{preamble}·P_{preamble}"],
    ["Hybrid", "Z-MAC", "CSMA at low load, TDMA at high contention", "α-weighted mix of CSMA and TDMA costs"],
    ["Adaptive", "RL-based MAC", "Learns access strategy from network state", "Learned, time-varying"],
  ], [1650, 2100, 2826, 2450], "Source: condensed from Section II-D1 and Table 3 of [1]."),

  H2("2.5 Routing Protocols"),
  P("Routing protocols are organised by objective into six families. The paper again attaches an energy expression to each family; most of them are special cases of a per-hop sum over a path of *H* hops,"),
  eq([sub("E", "route"), m("="), sum("k=1", "H", [br([sub("E", "transmit,k"), m("+"), sub("E", "receive,k"), m("+"), sub("E", "extra,k")])])]),
  P("where *E*_{extra} is zero for geographic routing, an error-control term for QoS-aware routing and a cryptographic term for security-oriented routing. Multipath routing sums Eq. {eq:7} over *P* parallel paths, data-centric routing adds query dissemination, gradient set-up and aggregation costs, and hierarchical routing uses the clustered model of Eq. {eq:4}."),
  ...table("Routing protocol families in WSNs.", ["Family", "Principle", "Representative protocols", "Energy model in [1]"], [
    ["Data-centric", "Sink issues interests or queries; in-network aggregation removes redundancy", "Directed Diffusion, Rumor Routing, COUGAR, SPIN, GBR, CADR, TTDD (also EAR, ESRT)", "E_{query} + E_{forwarding} + E_{aggregation} + E_{data-tx}"],
    ["Hierarchical", "Clusters or chains; CH / leader aggregates and forwards", "LEACH, PEACH, PEGASIS, TEEN, APTEEN, HEED", "Clustered model, Eq. {eq:4}"],
    ["Location-based", "Greedy forwarding towards the destination using coordinates", "GPSR, GEAR, SPAN, GeRaF, GOAFR, BVGF, TBF", "Sum over H hops of (E_{tx} + E_{rx})"],
    ["Multipath", "Spread traffic over several paths for load balance and resilience", "MPDD, ReInForM, MREC", "Double sum over P paths and H_{p} hops"],
    ["QoS-aware", "Meet delay, bandwidth and reliability targets", "SPEED, SAR, EEQR, MCFA, Energy-Aware QoS", "Per-hop sum + E_{error-control}"],
    ["Security-oriented", "Cryptography and intrusion tolerance", "S-LEACH, INSENS, ITSRP", "Per-hop sum + E_{crypto}"],
  ], [1450, 2550, 2676, 2350], "Source: condensed from Section II-D2 and Tables 4–5 of [1]."),

  H2("2.6 Parameter Estimation"),
  P("The last part of Section II reviews four estimation techniques used to extract reliable information from noisy measurements. They range from statistically optimal but expensive (maximum likelihood, Bayesian) to lightweight and recursive (Kalman filtering, least mean squares). For the LMS algorithm the weight update is *w*(*n*+1) = *w*(*n*) + μ*e*(*n*)*x*(*n*), which converges if 0 < μ < 2/λ_{max}, where λ_{max} is the largest eigenvalue of the input covariance matrix; its distributed forms Adapt-Then-Combine (ATC) and Combine-Then-Adapt (CTA) let neighbouring nodes cooperate."),
  ...table("Parameter estimation techniques in WSNs.", ["Method", "Key idea", "Typical WSN use", "Cost"], [
    ["Maximum Likelihood (MLE)", "θ̂ = arg max P(X|θ); e.g. least-squares fit of measured distances", "Source localisation from TOA / RSS", "Grows with network size and parameter dimension"],
    ["Bayesian estimation", "Posterior ∝ likelihood × prior; recursive updates", "Environmental monitoring, target tracking", "High; may need MCMC"],
    ["Kalman filtering", "Predict / update for a linear state-space model; minimises MSE", "Real-time target tracking, data fusion", "Low; suitable for constrained nodes"],
    ["LMS (ATC / CTA)", "Iterative gradient update with step size μ", "Distributed estimation, fault detection", "Very low; step size trades speed for stability"],
  ], [1700, 2900, 2226, 2200], "Source: condensed from Section II-E of [1]."),

  // ------------------------------------------------------------ 3
  H1("3. Applications (Paper Section III)"),
  P("Section III surveys twelve application domains. A common pattern runs through them: each application couples a sensing modality with a signal-processing or machine-learning technique and with a network mechanism adapted to the environment. Examples include recurrent neural networks for microclimate forecasting, Bayesian correction of gas-sensor drift, distributed Kalman filtering for landslide prediction, CNN/LSTM models for arrhythmia detection in body sensor networks, FFT and wavelet analysis for industrial vibration monitoring with WirelessHART and ISA100.11a, and STFT-based acoustic classification in military surveillance. The paper's Table 7 grounds each domain in a named real-world deployment; {tab:6} below merges both views."),
  ...table("WSN application domains, techniques and real-world deployments.", ["Domain", "Representative sensing and techniques", "Real-world case study cited in [1]"], [
    ["Environmental monitoring", "Microclimate (RNN forecasting); gas sensors with Bayesian drift correction; landslide and flood early warning", "Internet of Forests in the Amazon (illegal-logging detection)"],
    ["Healthcare", "Body sensor networks (ECG, SpO2, glucose); CNN/LSTM anomaly detection; TEG harvesting; AES", "Smart-hospital monitoring of patient vitals"],
    ["Industrial automation", "Vibration analysis (FFT, wavelets); hierarchical edge processing; WirelessHART, ISA100.11a, TSN", "Pipeline monitoring in Nigeria's oil and gas industry"],
    ["Smart cities", "Traffic sensing with SVR / gradient boosting; adaptive street lighting; seismic early warning", "Cary, North Carolina: smart water and flood alerts"],
    ["Precision agriculture", "Soil-moisture networks; CNN pest classification; NDVI-based yield prediction", "Nutrient sensing in tomato fields"],
    ["Military and defence", "Acoustic / seismic surveillance (STFT); RFID logistics; ECC-secured links", "NATO iMUGS project with unmanned ground vehicles"],
    ["Disaster management", "Landslide and flood monitoring; victim localisation with infrared and acoustic sensors", "WSNs for flood emergency coordination"],
    ["Energy systems", "PV and wind-turbine monitoring; smart-grid load balancing and fault detection", "Smart-grid monitoring deployment in India"],
    ["Transportation and logistics", "Railway track vibration; cold-chain containers with GPS tracking", "Port of Angamos, Chile (cargo tracking)"],
    ["Aquatic and underwater", "Water quality, oil spills; acoustic communication", "Battery-free subsea IoT"],
    ["Space exploration", "Radiation and temperature mapping; spacecraft structural health", "ESA PANGAEA training programme"],
    ["UAVs", "Aerial data collection over inaccessible areas; search and rescue", "UAV-assisted WSN coverage extension"],
  ], [1900, 4100, 3026], "Source: condensed from Section III and Tables 6–7 of [1]."),

  // ------------------------------------------------------------ 4
  H1("4. Innovations in WSN Technologies (Paper Section IV)"),
  P("Section IV presents recent advances that address the core constraints of WSNs. They can be grouped into three pillars plus enabling hardware:"),
  bullet("**Energy:** solar harvesting with maximum-power-point tracking, piezoelectric and thermoelectric harvesting, hybrid multi-source systems, predictive energy budgeting and wake-up radios that keep nodes asleep until a relevant signal arrives. The authors acknowledge that harvesting still suffers from environmental variability, low power density and limited storage."),
  bullet("**Communication:** IEEE 802.15.4e TSCH for interference-resilient industrial networks, hybrid acoustic-optical links underwater, and 6LoWPAN / RPL for IPv6 integration into the IoT."),
  bullet("**Intelligence and security:** TinyML models running on microcontrollers, federated learning (FL) that trains models without sharing raw data, fog computing between nodes and cloud, lightweight cryptography such as ECC, blockchain-based authentication and ML-based intrusion detection. Integration with IoT platforms, deep reinforcement learning for resource allocation and digital twins extends these capabilities."),
  bullet("**Software-defined WSNs (SDWSNs):** separating control and data planes enables centralised policy and reconfiguration (e.g. SD-WISE), but in-band control overhead, limited southbound scalability and the lack of lightweight fault-tolerant controllers remain open problems."),
  bullet("**Hardware and smart sensors:** ARM Cortex-M microcontrollers, LoRa and IEEE 802.15.4 radios, multi-modal sensors, nanosensors, flexible electronics, and smart sensors that filter and analyse data locally, including neuromorphic on-sensor processing and smart-building applications."),
  ...table("Innovations in WSN technologies.", ["Area", "Key advances", "Main benefit / remaining limitation"], [
    ["Energy harvesting and power management", "Solar + MPPT, piezoelectric, TEG, hybrid sources, wake-up radios, predictive energy budgets", "Towards autonomy; limited by variable supply, power density and storage"],
    ["Adaptive communication", "TSCH, hybrid acoustic-optical links, 6LoWPAN / RPL", "Reliability and IoT integration in harsh environments"],
    ["Edge intelligence", "TinyML, federated learning, fog computing", "Lower latency and bandwidth; constrained by node compute"],
    ["Security and trust", "ECC, blockchain smart contracts, ML-based IDS", "Stronger protection; adds computational overhead"],
    ["IoT, AI and digital twins", "Cloud IoT hubs, deep RL scheduling, predictive maintenance, virtual replicas", "Autonomous, data-driven operation"],
    ["Software-defined WSNs", "Control/data-plane separation, SD-WISE", "Flexibility; control overhead and controller robustness unresolved"],
    ["Hardware and smart sensors", "Cortex-M MCUs, LoRa, 802.15.4 / Zigbee, multi-modal and nanosensors, neuromorphic processing", "Richer sensing and local processing at low power"],
  ], [2100, 4026, 2900], "Source: condensed from Section IV and Table 8 of [1]."),

  // ------------------------------------------------------------ 5
  H1("5. Challenges (Paper Section V)"),
  P("A key observation of Section V is that most challenges have been recognised since the early days of WSNs and still limit scalability, energy autonomy and long-term reliability. {tab:8} summarises the nine challenges discussed."),
  ...table("Challenges in WSN applications.", ["Challenge", "Root cause", "Directions discussed", "Open issue"], [
    ["Energy limitation", "Finite batteries; harvesting depends on light, heat, vibration", "Stochastic energy prediction; dynamic duty cycling", "Optimisation itself consumes energy"],
    ["Scalability and congestion", "More nodes → more collisions, delay, sink bottleneck", "ML-based adaptive clustering; cross-layer optimisation", "Memory and compute not available on nodes"],
    ["Interference and resilience", "Electromagnetic interference, attenuation, node failures", "Error correction, network coding, self-healing, UAV-assisted deployment", "Real-time integration with existing networks"],
    ["Security of constrained nodes", "Eavesdropping, jamming, sinkholes; public-key crypto too costly", "ChaCha20, SPECK; blockchain with PoS or reputation consensus", "PoW infeasible; PoS needs persistent identities"],
    ["Application-aware privacy", "Sensitive health and household data; cyber-physical attacks", "Anonymisation, selective disclosure, authentication (HIPAA, GDPR)", "Fitting privacy within node budgets"],
    ["Data overload", "Large multi-modal data streams", "Edge pre-processing, federated learning", "Computation and communication overhead"],
    ["Standardisation", "Proprietary protocols and hardware", "6LoWPAN, CoAP, middleware", "Costly retrofitting; abstraction penalty"],
    ["Latency and QoS", "Low power and low bandwidth", "Time-Sensitive Networking, predictive scheduling", "Sub-millisecond latency on constrained nodes"],
    ["Cost and maintenance", "Battery replacement, recalibration in remote sites", "Robotic deployment, predictive maintenance", "Needs data and compute that may be unavailable"],
  ], [1700, 2350, 2776, 2200], "Source: condensed from Section V and Table 9 of [1]."),
  P("Reading the table column by column reveals a recurring tension that the paper describes case by case but does not name: almost every remedy (ML-based clustering, cross-layer optimisation, blockchain, federated learning, predictive maintenance) requires computation, memory or communication that resource-constrained nodes lack. The authors' discussion of blockchain is a good example: proof-of-work is dismissed as impractical, while proof-of-stake conflicts with the ephemeral, intermittently connected nature of sensor nodes, so they call for application-specific consensus protocols."),

  // ------------------------------------------------------------ 6
  H1("6. Future Trends and Research Directions (Paper Section VI)"),
  P("Section VI outlines nine research directions. A useful contribution of the paper's Table 10 is that it classifies the kind of advance each trend requires: hardware, algorithmic, architectural or theoretical. This separates near-term engineering work, such as compressing federated-learning models, from long-term breakthroughs; the authors explicitly note that quantum communication modules are not yet small or energy-efficient enough for sensor nodes."),
  ...table("Future research directions and the type of advance required.", ["Direction", "Example research focus", "Required advance"], [
    ["Ultra-low-power, self-sustaining systems", "Nanoscale multi-source harvesters; RL-based energy schedulers; micro-batteries and supercapacitors", "Hardware, algorithm design"],
    ["Intelligent, context-aware communication", "ML-adjusted power, routes and channels; RL multi-hop routing against the energy-hole problem", "Algorithm design, protocols"],
    ["Collaborative / federated intelligence", "FL with sparsification, quantisation and model compression; edge-cloud collaboration", "Algorithm design, system architecture"],
    ["Quantum sensing and communication", "High-sensitivity quantum sensors; quantum key distribution", "Quantum hardware, theory"],
    ["Bio-inspired, self-adaptive architectures", "Swarm intelligence for routing; neural-inspired fault tolerance", "Algorithm design, bio-inspired architectures"],
    ["WSNs in extreme environments", "Hybrid acoustic-optical-RF links; radiation-hardened, fault-tolerant hardware", "Resilient hardware, protocols"],
    ["Integration with digital twins", "Low-latency, consistent WSN-to-twin data pipelines", "System architecture, data processing"],
    ["Security and privacy", "Homomorphic encryption; blockchain access control; deep-learning anomaly detection", "Security algorithms, protocols"],
    ["Multi-modal sensor fusion", "Lightweight real-time fusion of image, acoustic and environmental data", "Data-fusion algorithms"],
  ], [2400, 4326, 2300], "Source: condensed from Section VI and Table 10 of [1]."),
  P("In its conclusion the paper sets out the priorities explicitly: hybrid energy-harvesting models with adaptive power scheduling, lightweight and context-sensitive security, autonomous reconfiguration in extreme environments (underwater, polar, space), 5G-enabled and fog-assisted architectures for low latency, and cross-domain integration with digital twins, federated learning and self-organising systems."),

  // ------------------------------------------------------------ 7
  H1("7. Critical Discussion"),
  H2("7.1 Strengths"),
  bullet("**Breadth with a clear structure.** The survey moves logically from fundamentals to applications, innovations, challenges and future directions, which makes it an accessible entry point for newcomers to the field."),
  bullet("**A unified energy perspective.** Pairing architectures, MAC classes and routing families with explicit energy expressions (Eqs. {eq:2}–{eq:7}) is uncommon in broad surveys and helps the reader see which terms each design choice adds or removes."),
  bullet("**Bridging theory and practice.** The case-study table (Table 7 of the paper) links every application domain to a named deployment, such as the Internet of Forests or ESA's PANGAEA programme."),
  bullet("**Balanced view of emerging technologies.** The paper does not oversell its headline topics: it states that quantum modules are not yet miniaturised, that proof-of-work is impractical and that SDWSN controllers still lack robustness."),
  bullet("**Actionable future-work classification.** Labelling each trend with the type of advance it requires gives researchers a practical roadmap."),

  H2("7.2 Limitations"),
  bullet("**No quantitative comparison.** The survey contains no simulation, measurement or meta-analysis. Protocols are compared qualitatively, so the reader cannot tell, for example, how much lifetime HEED gains over LEACH or how packet delivery ratio (PDR) degrades with density under CSMA/CA."),
  bullet("**Energy models are bookkeeping identities.** Eqs. {eq:2}–{eq:7} state which terms to add, but not how each term depends on distance, packet size, channel conditions or retransmissions. In particular, the centralized model (Eq. {eq:3}) has no distance term, so it cannot by itself show when clustering pays off (see {sec:7.3})."),
  bullet("**No stated survey methodology.** Unlike PRISMA-based surveys such as [4], the paper does not report search strings, databases or inclusion criteria, which limits reproducibility and makes coverage bias hard to assess."),
  bullet("**Breadth over depth.** Many protocols are described in a single sentence, and the MAC and routing sections are dominated by classical protocols from the 2000s, while recent learning-based protocols are mentioned only briefly."),
  bullet("**Minor inconsistencies.** The MAC section first states that *contention-free* protocols are divided into synchronous and asynchronous types, but the subsequent text and the paper's own Table 3 apply that split to *contention-based* protocols."),

  H2("7.3 Worked Example: Is Clustering Always More Energy-Efficient?"),
  P("To complement the paper's additive models, this section evaluates Eqs. {eq:3} and {eq:4} using the first-order radio model introduced with LEACH [2], [3]. Transmitting a *k*-bit packet over distance *d* costs"),
  eq([sub("E", "Tx"), br([m("k,d")]), m("="), m("k"), sub("E", "elec"), m("+"), m("k"), sub("ε", "amp"), sup("d", "n"), m(",    "), sub("E", "Rx"), br([m("k")]), m("="), m("k"), sub("E", "elec")]),
  P("with *E*_{elec} = 50 nJ/bit, a free-space model (*n* = 2, ε_{fs} = 10 pJ/bit/m^{2}) below the crossover distance *d*_{0} = √(ε_{fs}/ε_{mp}) ≈ 87.7 m and a multipath model (*n* = 4, ε_{mp} = 0.0013 pJ/bit/m^{4}) above it, and an aggregation cost *E*_{DA} = 5 nJ/bit/signal [3]. The scenario is deliberately simple: *N* = 100 nodes, *k* = 4000-bit packets, one round of data collection, and either (a) every node transmits directly to the sink at distance *d*_{BS}, or (b) *C* = 5 clusters of 20 nodes in which 19 members send to their CH at 20 m and the CH aggregates the 20 readings into one packet sent to the sink. Sensing energy, MAC overhead and collisions are ignored."),
  ...table("Energy per round: direct transmission versus clustering (N = 100, C = 5).", ["Sink distance d_{BS}", "Radio regime", "Energy per node, direct", "Total, direct", "Energy per CH", "Total, clustered", "Saving of clustering"], [
    ["30 m", "free space", "0.236 mJ", "23.6 mJ", "4.44 mJ", "42.7 mJ", "−81 %"],
    ["60 m", "free space", "0.344 mJ", "34.4 mJ", "4.54 mJ", "43.2 mJ", "−26 %"],
    ["90 m", "multipath", "0.541 mJ", "54.1 mJ", "4.74 mJ", "44.2 mJ", "+18 %"],
    ["100 m", "multipath", "0.720 mJ", "72.0 mJ", "4.92 mJ", "45.1 mJ", "+37 %"],
    ["150 m", "multipath", "2.833 mJ", "283.3 mJ", "7.03 mJ", "55.7 mJ", "+80 %"],
  ], [1250, 1200, 1350, 1150, 1250, 1350, 1476], "Source: own calculation with the radio parameters of [3]; member energy is 0.216 mJ per round in all cases."),
  P("Two conclusions follow. First, clustering does *not* always save energy. When the sink is close (below roughly 60–90 m in this setting), the receive and aggregation costs at the CHs exceed the savings on the uplink, and direct transmission is cheaper. Clustering wins clearly once long links fall into the *d*^{4} multipath regime, where replacing 100 long-range transmissions with 5 of them dominates. Second, the per-node load becomes highly unbalanced: at *d*_{BS} = 100 m a CH spends 4.92 mJ per round, about 23 times more than a member (0.216 mJ) and about 7 times more than a node in the direct scheme. This confirms the paper's qualitative remark about the CH burden and explains why CH rotation (LEACH) or residual-energy-aware CH selection (HEED [5]) is essential. Neither conclusion can be read from the paper's distance-free equations, which illustrates the limitation noted in {sec:7.2}."),

  H2("7.4 Relevance to the Course Topics"),
  P("The course poses two simulation questions: how contention and PDR behave in dense deployments, and whether a many-to-one model with a hub node reduces energy compared with all nodes reporting directly. The survey addresses both only qualitatively. On density, it notes that dense WSNs rely on CSMA/CA, that collisions grow with density, and that RTS/CTS, TSCH channel hopping, hybrid Z-MAC and clustering (which confines contention to small cells) are the main remedies; the explicit collision term in the CSMA/CA energy model ({tab:3}) is where density enters. On the hub model, Eqs. {eq:3}–{eq:4} frame the comparison, and the worked example in {sec:7.3} shows that the answer depends on the hub-to-sink distance, the aggregation ratio and how the hub role is rotated. These are exactly the parameters a simulation study would need to vary."),

  // ------------------------------------------------------------ 8
  H1("8. Conclusion"),
  P("Trigka and Dritsas provide a broad and well-structured survey of WSNs that connects classical foundations (architectures, MAC, routing, estimation) with current innovations (energy harvesting, TinyML, federated learning, blockchain trust, SDWSNs, digital twins) and with a clear agenda for future research. Its most useful contributions are the energy-modelling thread that runs through the fundamentals, the case-study table that grounds every application domain, and the classification of future trends by the type of advance they require. Its main weaknesses are the absence of quantitative evaluation, a survey methodology that is not reported, and energy models too abstract to settle design questions on their own. As the worked example shows, combining the paper's framework with a concrete radio model quickly yields non-obvious, design-relevant insights. The survey is therefore best used as a map of the field and a starting point for analytical or simulation studies, rather than as a source of quantitative design guidance."),

  // ------------------------------------------------------------ References
  H1("References"),
  ...[
    "[1] M. Trigka and E. Dritsas, “Wireless sensor networks: From fundamentals and applications to innovations and future trends,” *IEEE Access*, vol. 13, pp. 96365–96399, 2025, doi: 10.1109/ACCESS.2025.3572328.",
    "[2] W. R. Heinzelman, A. Chandrakasan, and H. Balakrishnan, “Energy-efficient communication protocol for wireless microsensor networks,” in *Proc. 33rd Hawaii Int. Conf. System Sciences (HICSS)*, 2000.",
    "[3] W. B. Heinzelman, A. P. Chandrakasan, and H. Balakrishnan, “An application-specific protocol architecture for wireless microsensor networks,” *IEEE Trans. Wireless Commun.*, vol. 1, no. 4, pp. 660–670, Oct. 2002.",
    "[4] A. Ojha and B. Gupta, “Evolving landscape of wireless sensor networks: A survey of trends, timelines, and future perspectives,” *Discover Applied Sciences*, vol. 7, art. 825, 2025, doi: 10.1007/s42452-025-07070-6.",
    "[5] O. Younis and S. Fahmy, “HEED: A hybrid, energy-efficient, distributed clustering approach for ad hoc sensor networks,” *IEEE Trans. Mobile Comput.*, vol. 3, no. 4, pp. 366–379, 2004.",
  ].map(refParagraph),
];

// =================================================================== DOCUMENT
const heading = (size, before, after) => ({
  run: { font: FONT, size, bold: true, color: BLACK },
  paragraph: { spacing: { before, after }, keepNext: true, keepLines: true },
});

const doc = new Document({
  creator: "Do Thanh Tung",
  title: "Summary Report – WSNs: From Fundamentals and Applications to Innovations and Future Trends",
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: FONT, size: 26, color: BLACK }, paragraph: { spacing: { line: 264 } } },
      title: { run: { font: FONT, size: 36, bold: true, color: BLACK }, paragraph: { spacing: { before: 0, after: 120 }, keepNext: true } },
      heading1: heading(30, 360, 160),
      heading2: heading(26, 240, 120),
      heading3: heading(24, 200, 100),
      heading4: heading(26, 120, 60),
      heading5: heading(26, 120, 60),
      heading6: heading(26, 120, 60),
      hyperlink: { run: { color: BLACK, underline: {} } },
    },
    paragraphStyles: [
      { id: "Caption", name: "caption", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 20, italics: true, color: BLACK }, paragraph: { spacing: { after: 120 } } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [
    {
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARGIN } },
      children: titlePage,
    },
    {
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARGIN,
          pageNumbers: { start: 1 } },
      },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK, space: 1 } },
        children: [new TextRun({ text: "Summary Report – Trigka & Dritsas, IEEE Access 2025", italics: true, size: 18 })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ size: 20, children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES_IN_SECTION] })] })] }) },
      children: body,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`Wrote ${OUT} (${tableNo} tables, ${eqNo} equations)`);
});
