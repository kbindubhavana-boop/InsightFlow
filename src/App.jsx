// 
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Activity, AlertTriangle, BarChart3, BrainCircuit, CheckCircle2,
  ChevronRight, Download, FileSpreadsheet, FileText, Filter,
  LayoutDashboard, Lightbulb, Menu, MessageSquare, Plus, Search,
  Settings2, ShieldAlert, Sparkles, Upload, X
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import "./App.css";

const COLORS = ["#16a34a", "#64748b", "#e11d48"];
const initialIssues = [];

function analyzeReview(review, originalCategory = "") {
  const text = String(review || "").toLowerCase();
  const category = String(originalCategory || "").toLowerCase();

  const positiveWords = [
    "excellent", "great", "good", "love", "amazing", "helpful",
    "efficient", "satisfied", "fast", "easy", "perfect", "wonderful"
  ];
  const negativeWords = [
    "bad", "poor", "late", "delay", "delayed", "fraud", "scam",
    "broken", "defect", "unresponsive", "terrible", "issue",
    "problem", "failed", "failure", "complaint", "wrong", "slow",
    "not working", "never", "damaged", "missing", "unhappy"
  ];

  const positive = positiveWords.filter(w => text.includes(w)).length;
  const negative = negativeWords.filter(w => text.includes(w)).length;

  const sentiment =
    positive > negative ? "Positive" :
    negative > positive ? "Negative" : "Neutral";

  let group = "General Feedback";
  if (/fraud|scam|unauthori[sz]ed|stolen|fake|phishing/.test(text + " " + category)) {
    group = "Fraud & Scam";
  } else if (/delivery|deliver|shipping|shipment|late|delay|order/.test(text)) {
    group = "Delivery & Operations";
  } else if (/support|service|agent|response|respond|staff|help desk/.test(text)) {
    group = "Customer Service";
  } else if (/product|quality|broken|defect|damaged|feature|performance/.test(text)) {
    group = "Product Feedback";
  } else if (/payment|refund|billing|charge|transaction/.test(text)) {
    group = "Payments & Billing";
  } else if (category) {
    group = originalCategory;
  }

  return { sentiment, group };
}

//function normalizeRow(row, index) {
  // const review = row.review ?? row.Review ?? row.feedback ??
  //   row.Feedback ?? row.comment ?? row.text ?? "";
  // const category = row.category ?? row.Category ?? "Uncategorized";
  // const result = analyzeReview(review, category);

  // return {
  //   id: index + 1,
  //   review: String(review),
  //   category: String(category),
  //   sentiment: result.sentiment,
  //   group: result.group,
  //   date: row.date ?? row.Date ?? "",
  //   source: row.source ?? row.Source ?? "Imported dataset",
  //   tracked: false
  // };

// function normalizeRow(row, index) {
//   const review = row.review ?? row.Review ?? row.feedback ??
//     row.Feedback ?? row.comment ?? row.text ?? "";

//   const category =
//     row.category ?? row.Category ?? "Uncategorized";

//   const completion = String(
//     row.enhanced_completion ??
//     row.Enhanced_completion ??
//     row["enhanced completion"] ??
//     ""
//   );

//   // Prefer Adaption's sentiment when it is present.
//   const sentimentMatch = completion.match(
//     /\b(positive|neutral|negative)\b/i
//   );

//   const ruleBasedResult = analyzeReview(review, category);

//   const sentiment = sentimentMatch
//     ? sentimentMatch[1].charAt(0).toUpperCase() +
//       sentimentMatch[1].slice(1).toLowerCase()
//     : ruleBasedResult.sentiment;

//   // Use the adapted issue/topic if it can be identified.
//   const issueMatch = completion.match(
//     /(?:issue category|main issue|main topic|topic|category)\s*[:\-]\s*([^\r\n,;]+)/i
//   );

//   const group =
//     issueMatch?.[1]?.trim() ||
//     ruleBasedResult.group;

//   return {
//     id: index + 1,
//     review: String(review),
//     category: String(category),
//     sentiment,
//     group,
//     date: row.date ?? row.Date ?? "",
//     source: row.source ?? row.Source ?? "Imported dataset",
//     tracked: false,
//     enhancedCompletion: completion
//   };

// }

function normalizeRow(row, index) {
  const review =
    row.review ?? row.Review ?? row.feedback ??
    row.Feedback ?? row.comment ?? row.text ?? "";

  const category =
    row.category ?? row.Category ?? "Uncategorized";

  const completion = String(
    row.enhanced_completion ??
    row.Enhanced_completion ??
    row["enhanced completion"] ??
    ""
  );

  const sentimentMatch = completion.match(
    /\b(positive|neutral|negative)\b/i
  );

  const ruleBasedResult = analyzeReview(review, category);

  const sentiment = sentimentMatch
    ? sentimentMatch[1].charAt(0).toUpperCase() +
      sentimentMatch[1].slice(1).toLowerCase()
    : ruleBasedResult.sentiment;

  const issueMatch = completion.match(
    /(?:main issue|issue category|main topic|topic|category)\s*[:\-*]+\s*([^\r\n,;]+)/i
  );

  const group =
    issueMatch?.[1]?.trim() || ruleBasedResult.group;

  return {
    id: index + 1,
    review: String(review),
    category: String(category),
    sentiment,
    group,
    date: row.date ?? row.Date ?? "",
    source: row.source ?? row.Source ?? "Imported dataset",
    tracked: false,
    enhancedCompletion: completion,
    aiRecommendation: completion
  };
}


const sampleReviews = [
  { review: "The product quality is excellent and delivery was fast.", category: "Product Feedback" },
  { review: "My delivery was delayed by five days and no one informed me.", category: "Operational Issues" },
  { review: "Customer support was unresponsive to my inquiry.", category: "Customer Service" },
  { review: "I suspect this seller is a scam and the payment seems unauthorized.", category: "Fraud and Scam" },
  { review: "The product performance is efficient and effective.", category: "Product Feedback" },
  { review: "My order arrived late again. Please improve delivery timelines.", category: "Operational Issues" },
  { review: "The support agent resolved my problem quickly and was very helpful.", category: "Customer Service" },
  { review: "The item arrived broken and the refund process was slow.", category: "Product Feedback" },
  { review: "The checkout process was easy and the service was great.", category: "Customer Service" },
  { review: "I was charged twice for the same order.", category: "Operational Issues" }
].map(normalizeRow);

const navItems = [
  ["Dashboard", LayoutDashboard],
  ["Feedback Explorer", MessageSquare],
  ["AI Insights", BrainCircuit],
  ["Recommendations", Lightbulb],
  ["Issue Tracker", ShieldAlert],
  ["Reports", FileText],
  ["Adaption Workflow", Settings2]
];

function Metric({ label, value, note, icon: Icon, tone = "" }) {
  return (
    <div className="metric card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}><Icon size={19} /></span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [reviews, setReviews] = useState(sampleReviews);
  const [issues, setIssues] = useState(initialIssues);
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newCategory, setNewCategory] = useState("Customer Service");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adaptionStatus, setAdaptionStatus] = useState("Not started");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/BuildBattle_2026_Customer_Feedback_Dataset.csv")
      .then(response => {
        if (!response.ok) throw new Error("Dataset not found");
        return response.text();
      })
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: result => {
            if (cancelled || !result.data.length) return;
            const rows = result.data.map(normalizeRow)
              .filter(row => row.review.trim());
            if (rows.length) {
              setReviews(rows);
              setNotice(`Loaded ${rows.length.toLocaleString()} supplied reviews.`);
            }
          }
        });
      })
      .catch(() => {
        if (!cancelled) setNotice("Showing sample data. Place the challenge CSV in public/ to load the supplied dataset.");
      });
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => ({
    total: reviews.length,
    positive: reviews.filter(r => r.sentiment === "Positive").length,
    neutral: reviews.filter(r => r.sentiment === "Neutral").length,
    negative: reviews.filter(r => r.sentiment === "Negative").length
  }), [reviews]);

  const groups = useMemo(() => {
    const map = {};
    reviews.forEach(r => {
      if (!map[r.group]) map[r.group] = { name: r.group, count: 0, negative: 0 };
      map[r.group].count++;
      if (r.sentiment === "Negative") map[r.group].negative++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [reviews]);

  const sentimentData = [
    { name: "Positive", value: counts.positive },
    { name: "Neutral", value: counts.neutral },
    { name: "Negative", value: counts.negative }
  ];

  const filteredReviews = useMemo(() => reviews.filter(r => {
    const matchesSearch =
      (r.review + " " + r.category + " " + r.group)
        .toLowerCase().includes(search.toLowerCase());
    const matchesSentiment = sentimentFilter === "All" || r.sentiment === sentimentFilter;
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesSentiment && matchesCategory;
  }), [reviews, search, sentimentFilter, categoryFilter]);

  const categories = [...new Set(reviews.map(r => r.category))].sort();

  const priorities = useMemo(() => groups.map(g => ({
    ...g,
    priority: g.negative * 2 + g.count * 0.25,
    reason: `${g.negative} negative reviews among ${g.count} related reviews`
  })).sort((a, b) => b.priority - a.priority), [groups]);

  const topPriority = priorities[0];

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  }

  // function importCSV(file) {
  //   if (!file) return;
  //   setLoading(true);
  //   Papa.parse(file, {
  //     header: true,
  //     skipEmptyLines: true,
  //     complete: result => {
  //       const rows = result.data.map(normalizeRow).filter(r => r.review.trim());
  //       if (!rows.length) flash("No usable review column found. Check the CSV headers.");
  //       else {
  //         setReviews(rows);
  //         setSearch("");
  //         setSentimentFilter("All");
  //         setCategoryFilter("All");
  //         flash(`Imported ${rows.length.toLocaleString()} reviews successfully.`);
  //       }
  //       setLoading(false);
  //     },
  //     error: () => {
  //       flash("Could not read this CSV file.");
  //       setLoading(false);
  //     }
  //   });
  // }

function importCSV(file) {
  if (!file) return;

  setLoading(true);

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,

    complete: result => {
      const rows = result.data
        .map((row, index) => normalizeRow(row, index))
        .filter(r => r.review.trim());

      if (!rows.length) {
        flash("No usable review column found. Check the CSV headers.");
      } else {
        setReviews(previousReviews => {
          const hasAdaptionResults = rows.some(
            row => row.enhancedCompletion.trim()
          );

          // Keep original reviews when importing Adaption results.
          if (hasAdaptionResults) {
            const adaptionByReview = new Map(
              rows.map(row => [
                row.review.trim().toLowerCase(),
                row
              ])
            );

            return previousReviews.map(original => {
              const match = adaptionByReview.get(
                original.review.trim().toLowerCase()
              );

              return match
                ? {
                    ...original,
                    sentiment: match.sentiment,
                    group: match.group,
                    enhancedCompletion: match.enhancedCompletion,
                    aiRecommendation: match.aiRecommendation
                  }
                : original;
            });
          }

          // Normal CSV uploads replace the current dataset.
          return rows;
        });

        setSearch("");
        setSentimentFilter("All");
        setCategoryFilter("All");

        flash(`Imported ${rows.length.toLocaleString()} reviews successfully.`);
      }

      setLoading(false);
    },

    error: () => {
      flash("Could not read this CSV file.");
      setLoading(false);
    }
  });
}

  function addReview(e) {
    e.preventDefault();
    if (!newReview.trim()) return;
    setReviews(old => [
      normalizeRow({ review: newReview.trim(), category: newCategory, source: "Manual entry" }, Date.now()),
      ...old
    ]);
    setNewReview("");
    setShowForm(false);
    flash("New feedback added and analyzed.");
  }

  function saveIssue(group) {
    if (issues.some(i => i.title === group.name)) {
      flash("This issue is already being tracked.");
      return;
    }
    setIssues(old => [{
      id: Date.now(), title: group.name, reason: group.reason,
      status: "Open", count: group.count
    }, ...old]);
    flash(`Tracking issue: ${group.name}`);
  }

  function updateIssue(id, status) {
    setIssues(old => old.map(i => i.id === id ? { ...i, status } : i));
  }

  function downloadCSV() {
    const csv = Papa.unparse(filteredReviews.map(r => ({
      review: r.review, original_category: r.category,
      analyzed_group: r.group, sentiment: r.sentiment, date: r.date
    })));
    downloadFile(csv, "insightflow-analysis.csv", "text/csv;charset=utf-8;");
  }

  function downloadReport() {
    const report = [
      "INSIGHTFLOW — CUSTOMER FEEDBACK REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total reviews: ${counts.total}`,
      `Positive: ${counts.positive}`,
      `Neutral: ${counts.neutral}`,
      `Negative: ${counts.negative}`,
      "",
      "ISSUE GROUPS",
      ...priorities.map(g => `${g.name}: ${g.count} reviews; ${g.negative} negative; ${g.reason}`),
      "",
      "RECOMMENDATIONS",
      ...recommendations.map((r, i) => `${i + 1}. ${r.title}: ${r.action} Reason: ${r.reason}`),
      "",
      "Note: sentiment is estimated by the application's rule-based analyzer."
    ].join("\n");
    downloadFile(report, "insightflow-report.txt", "text/plain;charset=utf-8;");
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    flash(`${filename} downloaded.`);
  }

  // const recommendations = priorities.slice(0, 4).map(g => ({
  //   title: g.name,
  //   reason: g.reason,
  //   action: /delivery|operation/i.test(g.name)
  //     ? "Review delivery timelines, courier performance, and delay notifications."
  //     : /fraud|scam/i.test(g.name)
  //     ? "Review suspicious transactions, strengthen verification, and investigate reports."
  //     : /service/i.test(g.name)
  //     ? "Improve support response time and monitor unresolved customer tickets."
  //     : /product/i.test(g.name)
//   //     ? "Investigate recurring defects and review product quality controls."
//   //     : "Review representative feedback and identify the root cause before prioritizing fixes."
//   // }));

//const recommendations = priorities.slice(0, 4).map(g => {
  // const matchingReview = reviews.find(
  //   r =>
  //     r.group === g.name &&
  //     r.enhancedCompletion?.trim()
  // );

// const normalizeTopic = value =>
//   String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// // const matchingReview = reviews.find(
// //   r =>
// //     normalizeTopic(r.group) === normalizeTopic(g.name) &&
// //     r.enhancedCompletion?.trim()
// // );

// // const matchingReview = reviews.find(
// //   r => r.enhancedCompletion?.trim()
// // );

// const matchingReview = reviews.find(
//   r =>
//     r.enhancedCompletion?.trim() &&
//     r.review?.toLowerCase().includes(
//       "never received my order despite being charged"
//     )
// );


//   // const aiText = matchingReview?.enhancedCompletion || "";

//   // const actionMatch = aiText.match(
//   //   /Actionable business recommendation\*\*:\s*([\s\S]*?)(?=<br\s*\/?>|\n\s*\d+\.|$)/i
//   // );

//   // const aiAction = actionMatch?.[1]
//   //   ?.replace(/\*\*/g, "")
//   //   .replace(/<br\s*\/?>/gi, " ")
//   //   .trim();
  
// const aiText = matchingReview?.enhancedCompletion || "";
// console.log("MATCHED REVIEW:", matchingReview);
// const plainText = aiText
//   .replace(/<br\s*\/?>/gi, "\n")
//   .replace(/\*\*/g, "");

// const actionMatch = plainText.match(
//   /Actionable business recommendation\s*:\s*([\s\S]*?)(?=\n\s*\d+\.\s*Sentiment|$)/i
// );

// const aiAction = actionMatch?.[1]?.trim();


//   return {
//     title: g.name,
//     reason: g.reason,
//     action: aiAction ||
//       (/delivery|operation/i.test(g.name)
//         ? "Review delivery timelines, courier performance, and delay notifications."
//         : /fraud|scam/i.test(g.name)
//         ? "Review suspicious transactions, strengthen verification, and investigate reports."
//         : /service/i.test(g.name)
//         ? "Improve support response time and monitor unresolved customer tickets."
//         : /product/i.test(g.name)
//         ? "Investigate recurring defects and review product quality controls."
//         : "Review representative feedback and identify the root cause before prioritizing fixes.")
//   };
// });

const normalizeTopic = value =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

const recommendations = priorities.slice(0, 4).map(g => {
  const matchingReview = reviews.find(r =>
    r.enhancedCompletion?.trim() &&
    (
      normalizeTopic(r.group) === normalizeTopic(g.name) ||
      normalizeTopic(r.category) === normalizeTopic(g.name)
    )
  );

  const aiText = matchingReview?.enhancedCompletion || "";

  const plainText = aiText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\*\*/g, "")
    .replace(/\\n/g, "\n");

  const actionMatch = plainText.match(
    /Actionable business recommendation\s*:\s*([\s\S]*?)(?=\n\s*\d+\.\s*(?:Sentiment|Main issue)|$)/i
  );

  const aiAction = actionMatch?.[1]
    ?.replace(/\s+/g, " ")
    .trim();

  return {
    title: g.name,
    reason: g.reason,
    action: aiAction ||
      (/delivery|operation/i.test(g.name)
        ? "Review delivery timelines, courier performance, and delay notifications."
        : /fraud|scam/i.test(g.name)
        ? "Review suspicious transactions, strengthen verification, and investigate reports."
        : /service/i.test(g.name)
        ? "Improve support response time and monitor unresolved customer tickets."
        : /product/i.test(g.name)
        ? "Investigate recurring defects and review product quality controls."
        : "Review representative feedback and identify the root cause before prioritizing fixes.")
  };
});

// const recommendations = priorities.slice(0, 4).map(g => {
//   const matchingReview = reviews.find(
//     r =>
//       r.group === g.name &&
//       r.enhancedCompletion?.trim()
//   );

//   const aiText = matchingReview?.enhancedCompletion || "";

//   const actionMatch = aiText.match(
//     /(?:actionable business recommendation|recommended action|recommendation|suggested action)\s*[:\-*]+\s*([\s\S]*?)(?=\n\s*\d+\.|\n\s*\*\*|$)/i
//   );

//   const aiAction = actionMatch?.[1]
//     ?.replace(/\*\*/g, "")
//     .trim();

//   return {
//     title: g.name,
//     reason: g.reason,
//     action: aiAction ||
//       (/delivery|operation/i.test(g.name)
//         ? "Review delivery timelines, courier performance, and delay notifications."
//         : /fraud|scam/i.test(g.name)
//         ? "Review suspicious transactions, strengthen verification, and investigate reports."
//         : /service/i.test(g.name)
//         ? "Improve support response time and monitor unresolved customer tickets."
//         : /product/i.test(g.name)
//         ? "Investigate recurring defects and review product quality controls."
//         : "Review representative feedback and identify the root cause before prioritizing fixes.")
//   };
// });

  function startAdaption() {
    // window.open("https://adaptionlabs.ai/app", "_blank", "noopener,noreferrer");
    // setAdaptionStatus("Opened Adaption — import and process your CSV");
    // flash("Follow the Adaption workflow instructions on this page.");
     window.open(
    "https://insightflow-ai.adaptionlabs.app",
    "_blank",
    "noopener,noreferrer"
  );

  setAdaptionStatus("Opened published InsightFlow review analyzer");
  flash("Your published review analyzer has been opened.");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={23}/></div>
          <div><strong>InsightFlow</strong><small>Customer Intelligence</small></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)}><X size={18}/></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(([label, Icon]) => (
            <button key={label} className={`nav-item ${page === label ? "active" : ""}`}
              onClick={() => { setPage(label); setMenuOpen(false); }}>
              <Icon size={18}/><span>{label}</span>
              {page === label && <ChevronRight size={16} className="nav-chevron"/>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot"></div>
          <div><strong>InsightFlow workspace</strong><small>Local analysis mode</small></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMenuOpen(true)}><Menu size={21}/></button>
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{page}</strong></div>
          <div className="topbar-right">
            <span className="live-indicator"><span/> Analysis ready</span>
            <div className="avatar">IF</div>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="notice"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}

          {page === "Dashboard" && <>
            <SectionTitle eyebrow="OVERVIEW" title="Customer intelligence"
              subtitle="Understand customer sentiment, identify recurring issues, and decide what to improve."
              action={<button className="btn btn-primary" onClick={() => setPage("Feedback Explorer")}><Upload size={16}/> Import feedback</button>}/>
            <div className="hero-banner">
              <div className="hero-content">
                <div className="hero-kicker"><Sparkles size={15}/> FEEDBACK, TRANSFORMED INTO ACTION</div>
                <h2>Listen better.<br/>Decide smarter.</h2>
                <p>Explore feedback patterns and uncover opportunities to improve the customer experience.</p>
                <button className="btn btn-light" onClick={() => setPage("AI Insights")}>Explore AI insights <ChevronRight size={16}/></button>
              </div>
              <div className="hero-graphic"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-graphic-icon"><BrainCircuit size={44}/></div><span className="float-chip chip-one">Sentiment</span><span className="float-chip chip-two">Patterns</span><span className="float-chip chip-three">Actions</span></div>
            </div>
            <div className="metrics-grid">
              <Metric label="Total feedback" value={counts.total.toLocaleString()} note="Reviews analyzed" icon={MessageSquare} tone="purple"/>
              <Metric label="Positive feedback" value={counts.positive.toLocaleString()} note={`${counts.total ? Math.round(counts.positive/counts.total*100) : 0}% of reviews`} icon={CheckCircle2} tone="green"/>
              <Metric label="Negative feedback" value={counts.negative.toLocaleString()} note={`${counts.total ? Math.round(counts.negative/counts.total*100) : 0}% of reviews`} icon={AlertTriangle} tone="red"/>
              <Metric label="Tracked issues" value={issues.length} note={`${issues.filter(i => i.status !== "Resolved").length} unresolved`} icon={ShieldAlert} tone="amber"/>
            </div>
            <div className="dashboard-grid">
              <div className="card chart-card">
                <div className="card-heading"><div><h3>Sentiment distribution</h3><p>Estimated sentiment across your reviews</p></div><span className="subtle-tag">All reviews</span></div>
                <div className="sentiment-chart">
                  <ResponsiveContainer width="100%" height={245}>
                    <PieChart><Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={91} paddingAngle={4}>{sentimentData.map((d,i)=><Cell key={d.name} fill={COLORS[i]}/>)}</Pie><Tooltip/></PieChart>
                  </ResponsiveContainer>
                  <div className="sentiment-legend">{sentimentData.map((d,i)=><div key={d.name}><span className="legend-dot" style={{background:COLORS[i]}}/><span>{d.name}</span><strong>{d.value.toLocaleString()}</strong></div>)}</div>
                </div>
              </div>
              <div className="card chart-card">
                <div className="card-heading"><div><h3>Top feedback topics</h3><p>Groups detected from review text</p></div></div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={groups.slice(0,5)} layout="vertical" margin={{left:8,right:14,top:8,bottom:8}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf0f5"/>
                    <XAxis type="number" tickLine={false} axisLine={false}/>
                    <YAxis dataKey="name" type="category" width={132} tickLine={false} axisLine={false} tick={{fontSize:11}}/>
                    <Tooltip/><Bar dataKey="count" name="Reviews" fill="#6757e8" radius={[0,5,5,0]} barSize={19}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card table-card">
              <div className="card-heading"><div><h3>Recent feedback</h3><p>Latest records in the loaded dataset</p></div><button className="text-button" onClick={() => setPage("Feedback Explorer")}>View all <ChevronRight size={15}/></button></div>
              <ReviewTable rows={reviews.slice(0,5)}/>
            </div>
          </>}

          {page === "Feedback Explorer" && <>
            <SectionTitle eyebrow="DATA MANAGEMENT" title="Feedback explorer" subtitle="Import, search, filter, and inspect customer feedback." action={<label className="btn btn-primary upload-label"><Upload size={16}/> {loading ? "Importing..." : "Upload CSV"}<input type="file" accept=".csv,text/csv" onChange={e => importCSV(e.target.files?.[0])}/></label>}/>
            <div className="metrics-grid compact"><Metric label="Total records" value={counts.total.toLocaleString()} note="Loaded feedback" icon={FileSpreadsheet}/><Metric label="Positive" value={counts.positive.toLocaleString()} note="Estimated sentiment" icon={CheckCircle2}/><Metric label="Neutral" value={counts.neutral.toLocaleString()} note="Estimated sentiment" icon={Activity}/><Metric label="Negative" value={counts.negative.toLocaleString()} note="Estimated sentiment" icon={AlertTriangle}/></div>
            <div className="card filters-card">
              <div className="search-box"><Search size={17}/><input placeholder="Search reviews, topics, categories..." value={search} onChange={e=>setSearch(e.target.value)}/>{search && <button onClick={()=>setSearch("")}><X size={15}/></button>}</div>
              <div className="filter-control"><Filter size={16}/><select value={sentimentFilter} onChange={e=>setSentimentFilter(e.target.value)}><option>All</option><option>Positive</option><option>Neutral</option><option>Negative</option></select></div>
              <div className="filter-control"><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="All">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
              <button className="btn btn-secondary" onClick={downloadCSV}><Download size={16}/> Export CSV</button>
            </div>
            <div className="card table-card"><div className="card-heading"><div><h3>Customer reviews</h3><p>Showing {filteredReviews.length.toLocaleString()} of {reviews.length.toLocaleString()} records</p></div><button className="btn btn-secondary" onClick={()=>setShowForm(v=>!v)}><Plus size={16}/> Add feedback</button></div>{showForm && <form className="new-review-form" onSubmit={addReview}><textarea required value={newReview} onChange={e=>setNewReview(e.target.value)} placeholder="Enter customer feedback..."/><select value={newCategory} onChange={e=>setNewCategory(e.target.value)}>{["Customer Service","Product Feedback","Operational Issues","Fraud and Scam"].map(c=><option key={c}>{c}</option>)}</select><button className="btn btn-primary" type="submit">Add and analyze</button></form>}<ReviewTable rows={filteredReviews.slice(0,250)}/>{filteredReviews.length>250&&<p className="table-footnote">Showing first 250 matching rows. Export CSV to get all filtered results.</p>}</div>
          </>}

          {page === "AI Insights" && <>
            <SectionTitle eyebrow="ANALYSIS" title="AI insights" subtitle="Review sentiment, recurring themes, and complaint patterns."/>
            <div className="info-banner"><BrainCircuit size={20}/><div><strong>Transparent analysis mode</strong><p>The current browser analyzer uses keyword-based rules. It is a functional baseline, not a trained AI model. Adaption integration is handled separately below.</p></div></div>
            <div className="metrics-grid"><Metric label="Analyzed reviews" value={counts.total.toLocaleString()} note="Current dataset" icon={MessageSquare}/><Metric label="Detected topics" value={groups.length} note="Review text groups" icon={BrainCircuit}/><Metric label="Negative reviews" value={counts.negative.toLocaleString()} note="Rule-based estimate" icon={AlertTriangle}/><Metric label="Tracked issues" value={issues.length} note="Saved by user" icon={ShieldAlert}/></div>
            <div className="card table-card"><div className="card-heading"><div><h3>Recurring feedback themes</h3><p>Review volume and negative feedback by detected group</p></div></div><div className="topic-list">{groups.map(g=><div className="topic-row" key={g.name}><div className="topic-icon"><MessageSquare size={18}/></div><div className="topic-main"><strong>{g.name}</strong><span>{g.count} reviews · {g.negative} negative</span><div className="progress"><div style={{width:`${counts.total ? g.count/counts.total*100 : 0}%`}}/></div></div><strong>{counts.total ? Math.round(g.count/counts.total*100) : 0}%</strong></div>)}</div></div>
            <div className="card table-card"><div className="card-heading"><div><h3>Representative negative feedback</h3><p>Sample of reviews flagged for further inspection</p></div></div><ReviewTable rows={reviews.filter(r=>r.sentiment==="Negative").slice(0,8)}/></div>
          </>}

          {page === "Recommendations" && <>
            <SectionTitle eyebrow="DECISION SUPPORT" title="Recommended actions" subtitle="Prioritize recurring issues using review volume and negative feedback."/>
            <div className="info-banner"><Lightbulb size={20}/><div><strong>How priority is estimated</strong><p>Issues are ordered using review volume and negative review counts. These are heuristic priorities, not verified business impact or financial risk.</p></div></div>
            {recommendations.length ? <div className="recommendation-list">{recommendations.map((r,i)=><div className="card recommendation-card" key={r.title}><div className="recommendation-number">{String(i+1).padStart(2,"0")}</div><div className="recommendation-content"><div className="priority-pill">{i===0?"Review first":i===1?"High attention":"Investigate"}</div><h3>{r.title}</h3><p>{r.reason}</p><div className="action-box"><Lightbulb size={17}/><div><strong>Suggested action</strong><p>{r.action}</p></div></div></div><button className="btn btn-secondary" onClick={()=>saveIssue(priorities.find(g=>g.name===r.title))}><Plus size={15}/> Track issue</button></div>)}</div> : <Empty title="No recommendations yet" text="Load feedback to generate recommendations."/>}
          </>}

          {page === "Issue Tracker" && <>
            <SectionTitle eyebrow="FOLLOW-UP" title="Issue tracker" subtitle="Save important issues and track progress toward resolution." action={<button className="btn btn-secondary" onClick={()=>setPage("Recommendations")}><Plus size={16}/> Find issues</button>}/>
            <div className="metrics-grid compact"><Metric label="Tracked issues" value={issues.length} note="Saved for follow-up" icon={ShieldAlert}/><Metric label="Open" value={issues.filter(i=>i.status==="Open").length} note="Awaiting action" icon={AlertTriangle}/><Metric label="In progress" value={issues.filter(i=>i.status==="In progress").length} note="Being addressed" icon={Activity}/><Metric label="Resolved" value={issues.filter(i=>i.status==="Resolved").length} note="Marked resolved" icon={CheckCircle2}/></div>
            <div className="card table-card"><div className="card-heading"><div><h3>Tracked issues</h3><p>Update each issue's current status</p></div></div>{issues.length===0?<Empty title="No issues tracked yet" text="Open Recommendations and choose Track issue to save a problem."/>:<div className="issue-list">{issues.map(issue=><div className="issue-row" key={issue.id}><div className="issue-icon"><AlertTriangle size={19}/></div><div className="issue-details"><strong>{issue.title}</strong><span>{issue.reason}</span><small>{issue.count} related reviews</small></div><select value={issue.status} onChange={e=>updateIssue(issue.id,e.target.value)}><option>Open</option><option>In progress</option><option>Resolved</option></select><button className="icon-button danger-icon" title="Remove issue" onClick={()=>setIssues(old=>old.filter(i=>i.id!==issue.id))}><X size={17}/></button></div>)}</div>}</div>
          </>}

          {page === "Reports" && <>
            <SectionTitle eyebrow="EXPORT & SHARE" title="Insight reports" subtitle="Export analyzed feedback and business-friendly findings."/>
            <div className="metrics-grid compact"><Metric label="Reviews included" value={counts.total.toLocaleString()} note="Current analysis" icon={MessageSquare}/><Metric label="Issue groups" value={groups.length} note="Detected themes" icon={BarChart3}/><Metric label="Recommendations" value={recommendations.length} note="Suggested actions" icon={Lightbulb}/><Metric label="Tracked issues" value={issues.length} note="Saved items" icon={ShieldAlert}/></div>
            <div className="report-grid"><div className="card report-card"><div className="report-file-icon"><FileText size={26}/></div><h3>Executive insight report</h3><p>Summary metrics, sentiment counts, feedback groups, priority reasons, and suggested actions in a downloadable text report.</p><button className="btn btn-primary" onClick={downloadReport}><Download size={16}/> Download report</button></div><div className="card report-card"><div className="report-file-icon green"><FileSpreadsheet size={26}/></div><h3>Analyzed feedback data</h3><p>Export review text alongside detected topic groups, original categories, and estimated sentiment as a CSV file.</p><button className="btn btn-secondary" onClick={downloadCSV}><Download size={16}/> Export CSV</button></div></div>
          </>}

          {page === "Adaption Workflow" && <>
            <SectionTitle eyebrow="DATA ADAPTATION" title="Adaption workflow" subtitle="Prepare a customer-feedback dataset for an adaptation run and inspect the adapted output."/>
            <div className="info-banner"><Settings2 size={20}/><div><strong>External Adaption workspace</strong><p>This workflow uses the Adaption web app. Your InsightFlow browser does not automatically send data to Adaption; upload the CSV there and bring the completed output back when available.</p></div></div>
            <div className="card adaption-card">
              <div className="adaption-heading"><div className="adaption-logo"><Sparkles size={26}/></div><div><h3>Adaption Adaptive Data</h3><p>Customer feedback preparation and adaptation</p></div></div>
              <div className="workflow-steps">{[
                ["01","Export or locate the dataset","Use the challenge CSV, or export feedback from this app."],
                ["02","Import into Adaption","Create a dataset at adaptionlabs.ai/app and upload the CSV."],
                ["03","Map columns","Map review as Context and category as additional context. Select “I don’t have prompt” and use “Write universal prompt”."],
                ["04","Configure adaptation","Use a prompt asking for a concise, evidence-grounded review analysis with sentiment, issue category, and recommended action. Generate a completion if needed."],
                ["05","Review and run","Check the estimated credits and row limit. Start a small run first, if available."],
                ["06","Review the output","Compare source and adapted examples, then export the adapted dataset if the interface offers it."]
              ].map(([n,title,desc])=><div className="workflow-step" key={n}><div className="step-number">{n}</div><div><strong>{title}</strong><p>{desc}</p></div></div>)}</div>
              <div className="prompt-panel"><div className="card-heading"><div><h3>Suggested universal prompt</h3><p>Adapt this instruction to the available column-mapping controls.</p></div></div><pre>Analyze the customer review provided in the context. Return a concise, evidence-grounded response containing: sentiment (positive, neutral, or negative), the main issue or topic, a brief explanation based only on the review, and one actionable business recommendation. Do not invent facts. If the review is ambiguous, label sentiment as neutral and state the uncertainty.</pre><button className="btn btn-secondary" onClick={()=>{navigator.clipboard?.writeText("Analyze the customer review provided in the context. Return a concise, evidence-grounded response containing: sentiment (positive, neutral, or negative), the main issue or topic, a brief explanation based only on the review, and one actionable business recommendation. Do not invent facts. If the review is ambiguous, label sentiment as neutral and state the uncertainty.");flash("Universal prompt copied if clipboard permission is available.")}}><FileText size={16}/> Copy prompt</button></div>
              <div className="adaption-footer"><div><span className="eyebrow">WORKFLOW STATUS</span><strong>{adaptionStatus}</strong></div><button className="btn btn-primary" onClick={startAdaption}><Settings2 size={16}/> Open Adaption <ChevronRight size={16}/></button></div>
              <p className="table-footnote">Important: adaptation can take time and may use credits. Do not claim a run succeeded until the Adaption app confirms completion. This external workflow is not a direct API connection.</p>
            </div>
            <div className="card table-card"><div className="card-heading"><div><h3>Use adapted results</h3><p>Import an exported result to compare it with your original reviews.</p></div><label className="btn btn-secondary upload-label"><Upload size={16}/> Import adapted CSV<input type="file" accept=".csv,text/csv" onChange={e=>{const file=e.target.files?.[0];if(file)importCSV(file);}}/></label></div><p className="table-footnote">The importer reads a review-like column. Preserve the original review column in any exported file so it can be matched and reviewed.</p></div>
          </>}
          <footer className="app-footer"><span>InsightFlow · Build Battle 2026</span><span>Customer insights for better decisions</span></footer>
        </div>
      </main>
      {menuOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}/>}
    </div>
  );
}

// function ReviewTable({ rows }) {
//   if (!rows.length) return <Empty title="No matching feedback" text="Try changing your search or filters."/>;

//   return (
//     <div className="table-wrap"><table><thead><tr><th>Customer feedback</th><th>Original category</th><th>Detected topic</th><th>Sentiment</th></tr></thead><tbody>
//       {rows.map((r,i)=><tr key={`${r.id}-${i}`}><td className="review-cell">{r.review}</td><td><span className="category-tag">{r.category}</span></td><td>{r.group}</td><td><span className={`sentiment-badge ${r.sentiment.toLowerCase()}`}><span/>{r.sentiment}</span></td></tr>)}
//     </tbody></table></div>
//   );
// }

function ReviewTable({ rows }) {
  if (!rows.length) {
    return (
      <Empty
        title="No matching feedback"
        text="Try changing your search or filters."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer feedback</th>
            <th>Original category</th>
            <th>Detected topic</th>
            <th>Sentiment</th>
            <th>Adaption AI analysis</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.id}-${i}`}>
              <td className="review-cell">{r.review}</td>

              <td>
                <span className="category-tag">
                  {r.category}
                </span>
              </td>

              <td>{r.group}</td>

              <td>
                <span
                  className={`sentiment-badge ${r.sentiment.toLowerCase()}`}
                >
                  <span />
                  {r.sentiment}
                </span>
              </td>

              <td className="review-cell">
                {r.enhancedCompletion?.trim()
                  ? r.enhancedCompletion
                  : "No Adaption AI result available for this review."}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function Empty({ title, text }) {
  return <div className="empty-state"><div><Search size={23}/></div><strong>{title}</strong><p>{text}</p></div>;
}
