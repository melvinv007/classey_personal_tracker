"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calculator, CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Percent, Target, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useData } from "@/hooks/use-data";
import { ThemedSelect } from "@/components/ui/ThemedSelect";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Calculate attendance projections
 */
function calculateProjections(
  attended: number,
  total: number,
  remaining: number,
  required: number
) {
  // If attend ALL remaining
  const ifAttendAll = ((attended + remaining) / (total + remaining)) * 100;
  
  // If miss ALL remaining
  const ifMissAll = (attended / (total + remaining)) * 100;
  
  // Classes can safely bunk
  const maxTotal = Math.floor((attended * 100) / required);
  const canBunk = Math.max(0, maxTotal - total);
  
  // Classes needed to reach requirement
  let classesNeeded = 0;
  if ((attended / total) * 100 < required && total > 0) {
    classesNeeded = Math.ceil(
      (required * total - 100 * attended) / (100 - required)
    );
  }
  
  return {
    ifAttendAll: Math.round(ifAttendAll * 10) / 10,
    ifMissAll: Math.round(ifMissAll * 10) / 10,
    canBunk: Math.max(0, canBunk),
    classesNeeded: Math.max(0, classesNeeded),
  };
}

/**
 * Get status color and label
 */
function getStatus(percentage: number, required: number): { label: string; color: string; icon: typeof CheckCircle2 } {
  if (percentage >= required) {
    return { label: "SAFE", color: "#10B981", icon: CheckCircle2 };
  }
  if (percentage >= required - 5) {
    return { label: "AT RISK", color: "#F59E0B", icon: AlertTriangle };
  }
  return { label: "DANGER", color: "#EF4444", icon: XCircle };
}

export default function AttendanceCalculatorPage(): React.ReactNode {
  const { subjects: allSubjects, ongoingSemester, getOccurrencesBySubject, isLoading } = useData();
  
  const subjects = allSubjects.filter((sub) => !sub.deleted_at);
  
  // Filter to current semester subjects
  const semesterSubjects = subjects.filter(
    (s) => ongoingSemester && s.semester_id === ongoingSemester.$id
  );
  
  // State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [remainingOverride, setRemainingOverride] = useState<string>("");
  const [customAttend, setCustomAttend] = useState<number>(0);

  // Calculate stats
  const stats = useMemo(() => {
    if (selectedSubjectId === "all") {
      // Aggregate all subjects
      let totalAttended = 0;
      let totalClasses = 0;
      let avgRequired = 75;
      
      semesterSubjects.forEach((subject) => {
        const occurrences = getOccurrencesBySubject(subject.$id);
        const nonCancelled = occurrences.filter(o => o.status !== "cancelled");
        const attended = occurrences.filter(o => o.attendance === "present").length;
        totalAttended += attended;
        totalClasses += nonCancelled.length;
        avgRequired = subject.attendance_requirement_percent ?? 75;
      });
      
      return {
        attended: totalAttended,
        total: totalClasses,
        percentage: totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0,
        required: avgRequired,
      };
    } else {
      // Single subject
      const subject = semesterSubjects.find((s) => s.$id === selectedSubjectId);
      const occurrences = getOccurrencesBySubject(selectedSubjectId);
      const nonCancelled = occurrences.filter(o => o.status !== "cancelled");
      const attended = occurrences.filter(o => o.attendance === "present").length;
      return {
        attended,
        total: nonCancelled.length,
        percentage: nonCancelled.length > 0 ? (attended / nonCancelled.length) * 100 : 0,
        required: subject?.attendance_requirement_percent ?? 75,
      };
    }
  }, [selectedSubjectId, semesterSubjects, getOccurrencesBySubject]);

  // Estimate remaining classes (simple: assume 10 remaining if not overridden)
  const remaining = remainingOverride ? parseInt(remainingOverride) || 0 : 10;
  
  // Calculate projections
  const projections = calculateProjections(
    stats.attended,
    stats.total,
    remaining,
    stats.required
  );
  
  // Custom scenario
  const customPercentage = stats.total + remaining > 0
    ? ((stats.attended + customAttend) / (stats.total + remaining)) * 100
    : 0;
  const customStatus = getStatus(customPercentage, stats.required);
  
  // Current status
  const status = getStatus(stats.percentage, stats.required);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  return (
    <motion.main
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-6 pb-32 px-4 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bunk Planner</h1>
            <p className="text-sm text-muted-foreground">
              Calculate how many classes you can safely skip
            </p>
          </div>
        </motion.header>

        {/* Subject Selector */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Subject
          </label>
          <ThemedSelect
            value={selectedSubjectId}
            onChange={setSelectedSubjectId}
            options={[
              { value: "all", label: "All Subjects (Combined)" },
              ...semesterSubjects.map((subject) => ({ value: subject.$id, label: subject.name })),
            ]}
            className="py-3"
          />
        </motion.div>

        {/* Current Status Card */}
        <motion.div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Current Status</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Attended</p>
              <p className="text-2xl font-bold text-foreground">{stats.attended}</p>
              <p className="text-xs text-muted-foreground">/ {stats.total} classes</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: status.color }}
              >
                {stats.percentage.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Required</p>
              <p className="text-2xl font-bold text-foreground">{stats.required}%</p>
            </div>
            
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: `${status.color}15` }}
            >
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center justify-center gap-2">
                <status.icon className="w-5 h-5" style={{ color: status.color }} />
                <p className="text-lg font-bold" style={{ color: status.color }}>
                  {status.label}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Remaining Classes Input */}
        <motion.div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Remaining Classes</h2>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={remainingOverride}
              onChange={(e) => setRemainingOverride(e.target.value)}
              placeholder="10"
              min="0"
              className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
            />
            <span className="text-muted-foreground">classes left in semester</span>
          </div>
        </motion.div>

        {/* Projections */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* If attend all */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground">If You Attend All</h3>
            </div>
            <p className="text-4xl font-bold text-emerald-400 mb-2">
              {projections.ifAttendAll}%
            </p>
            <p className="text-sm text-muted-foreground">
              Attending all {remaining} remaining classes
            </p>
          </div>

          {/* If miss all */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-foreground">If You Miss All</h3>
            </div>
            <p className="text-4xl font-bold text-red-400 mb-2">
              {projections.ifMissAll}%
            </p>
            <p className="text-sm text-muted-foreground">
              Missing all {remaining} remaining classes
            </p>
          </div>
        </motion.div>

        {/* Bunk Planner Result */}
        <motion.div
          className="bg-[rgba(var(--accent),0.05)] backdrop-blur-xl border border-[rgba(var(--accent),0.2)] rounded-2xl p-8 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            You Can Safely Bunk
          </h3>
          <div 
            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ 
              backgroundColor: projections.canBunk > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
              border: `3px solid ${projections.canBunk > 0 ? "#10B981" : "#EF4444"}`,
            }}
          >
            <span 
              className="text-5xl font-bold"
              style={{ color: projections.canBunk > 0 ? "#10B981" : "#EF4444" }}
            >
              {projections.canBunk}
            </span>
          </div>
          <p className="text-lg text-foreground font-medium">
            {projections.canBunk > 0 ? "classes" : "No bunk margin!"}
          </p>
          {projections.canBunk === 0 && (
            <p className="text-sm text-red-400 mt-2">
              Every class is critical. Attend all to stay safe.
            </p>
          )}
          {projections.canBunk > 0 && projections.canBunk <= 2 && (
            <p className="text-sm text-amber-400 mt-2">
              ⚠️ Very low margin. Be careful.
            </p>
          )}
          {projections.classesNeeded > 0 && (
            <p className="text-sm text-amber-400 mt-2">
              You need {projections.classesNeeded} more consecutive classes to reach {stats.required}%
            </p>
          )}
        </motion.div>

        {/* Custom Scenario */}
        <motion.div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Custom Scenario</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            I will attend this many of the {remaining} remaining classes:
          </p>
          
          <input
            type="range"
            min="0"
            max={remaining}
            value={customAttend}
            onChange={(e) => setCustomAttend(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[rgb(var(--accent))]"
          />
          
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>0</span>
            <span className="text-lg font-bold text-foreground">{customAttend}</span>
            <span>{remaining}</span>
          </div>

          <div 
            className="mt-6 p-4 rounded-xl text-center"
            style={{ backgroundColor: `${customStatus.color}15` }}
          >
            <p className="text-xs text-muted-foreground mb-1">Result</p>
            <div className="flex items-center justify-center gap-3">
              <span 
                className="text-3xl font-bold"
                style={{ color: customStatus.color }}
              >
                {customPercentage.toFixed(1)}%
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `${customStatus.color}20`,
                  color: customStatus.color,
                }}
              >
                {customStatus.label}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
