"use client";

import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Target, Calculator, Award, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useData } from "@/hooks/use-data";
import {
  calculateCGPA,
  whatIfCGPA,
  requiredSPI,
  getSPIColor,
  resolveSemesterGradeData,
  type ResolvedSemesterGradeData,
} from "@/utils/grades";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme-store";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Animated counter component for CGPA display
 */
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {value.toFixed(decimals)}
    </motion.span>
  );
}

export default function CGPATrackerPage(): React.ReactNode {
  const { semesters: allSemesters, subjects, ongoingSemester, isLoading } = useData();
  const themeMode = useThemeStore((state) => state.mode);
  
  const semesters = allSemesters.filter((sem) => !sem.deleted_at);
  
  // What-if calculator state
  const [whatIfSPI, setWhatIfSPI] = useState<string>("8.0");
  const [targetCGPA, setTargetCGPA] = useState<string>("8.5");

  // Calculate semester data for CGPA
  const semesterData = useMemo((): ResolvedSemesterGradeData[] => {
    const now = new Date();
    return semesters
      .filter((sem) => {
        if (sem.status === "completed") return true;
        if (sem.status === "ongoing") return true;
        const start = new Date(sem.start_date);
        return start <= now;
      })
      .map((sem) =>
        resolveSemesterGradeData(
          sem,
          subjects.filter((sub) => sub.semester_id === sem.$id)
        )
      )
      .sort((a, b) => {
        const aSem = semesters.find((sem) => sem.$id === a.id);
        const bSem = semesters.find((sem) => sem.$id === b.id);
        const aTime = aSem ? new Date(aSem.start_date).getTime() : 0;
        const bTime = bSem ? new Date(bSem.start_date).getTime() : 0;
        return aTime - bTime;
      });
  }, [semesters, subjects]);

  // Calculate current CGPA (excluding ongoing semester for accuracy)
  const completedSemesters = useMemo(
    () => semesterData.filter((s) => s.status === "completed" && s.includedInCGPA && s.spi > 0 && s.credits > 0),
    [semesterData]
  );
  const currentCGPA = useMemo(
    () => calculateCGPA(completedSemesters),
    [completedSemesters]
  );

  // Calculate including ongoing semester
  const allSemestersCGPA = useMemo(
    () => calculateCGPA(semesterData),
    [semesterData]
  );

  const spiChartData = useMemo(() => {
    const chartSemesters = semesterData.filter(
      (sem) => sem.status === "completed" && sem.includedInCGPA && sem.spi > 0 && sem.credits > 0
    );
    return chartSemesters.reduce<Array<{ semester: string; spi: number; cgpa: number; _weighted: number; _credits: number }>>((acc, sem) => {
      const prev = acc[acc.length - 1];
      const weighted = (prev?._weighted ?? 0) + sem.spi * sem.credits;
      const credits = (prev?._credits ?? 0) + sem.credits;
      const runningCgpa = credits > 0 ? weighted / credits : 0;
      acc.push({
        semester: sem.name,
        spi: Number(sem.spi.toFixed(2)),
        cgpa: Number(runningCgpa.toFixed(2)),
        _weighted: weighted,
        _credits: credits,
      });
      return acc;
    }, []).map(({ semester, spi, cgpa }) => ({ semester, spi, cgpa }));
  }, [semesterData]);

  // What-if calculation
  const whatIfResult = useMemo(() => {
    const spi = parseFloat(whatIfSPI) || 0;
    const ongoingCredits = ongoingSemester
      ? subjects
          .filter((s) => s.semester_id === ongoingSemester.$id && !s.deleted_at)
          .reduce((sum, s) => sum + s.credits, 0)
      : 20; // default
    return whatIfCGPA(completedSemesters, spi, ongoingCredits);
  }, [completedSemesters, whatIfSPI, ongoingSemester, subjects]);

  // Required SPI calculation
  const requiredResult = useMemo(() => {
    const target = parseFloat(targetCGPA) || 0;
    const ongoingCredits = ongoingSemester
      ? subjects
          .filter((s) => s.semester_id === ongoingSemester.$id && !s.deleted_at)
          .reduce((sum, s) => sum + s.credits, 0)
      : 20;
    return requiredSPI(completedSemesters, target, ongoingCredits);
  }, [completedSemesters, targetCGPA, ongoingSemester, subjects]);

  // Total credits
  const totalCredits = useMemo(
    () => completedSemesters.reduce((sum, s) => sum + s.credits, 0),
    [completedSemesters]
  );

  // Loading state - AFTER all hooks
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
            className="p-2 rounded-xl btn-muted-themed interactive-focus"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">CGPA Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Track your academic performance
            </p>
          </div>
        </motion.header>

        {/* Current CGPA Card */}
        <motion.div
          className="glass-card rounded-3xl p-8 mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="w-6 h-6 text-[rgb(var(--accent))]" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Current CGPA
            </span>
          </div>
          <div
            className="text-7xl font-bold mb-4"
            style={{ color: getSPIColor(currentCGPA) }}
          >
            <AnimatedNumber value={currentCGPA} />
          </div>
          <p className="text-sm text-muted-foreground">
            {completedSemesters.length > 0
              ? `Based on ${completedSemesters.length} completed semester${completedSemesters.length !== 1 ? "s" : ""} • ${totalCredits} credits`
              : "This is your first semester. CGPA will appear after your first completed semester."}
          </p>
          {semesterData.some((s) => s.status === "ongoing") && (
            <p className="text-xs text-muted-foreground mt-2">
              Including ongoing: <span className="text-foreground font-medium">{allSemestersCGPA.toFixed(2)}</span>
            </p>
          )}
        </motion.div>

        {/* SPI Trend */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">SPI Trend (Semester-wise)</h2>
          </div>
          {spiChartData.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Add semesters with grades to view the SPI trend.
            </div>
          ) : (
            <div className="h-72 w-full min-w-0 min-h-[288px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spiChartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(var(--foreground),0.08)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="semester"
                    tick={{ fill: themeMode === "dark" ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.78)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(var(--foreground),0.12)" }}
                    tickLine={{ stroke: "rgba(var(--foreground),0.12)" }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: themeMode === "dark" ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.78)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(var(--foreground),0.12)" }}
                    tickLine={{ stroke: "rgba(var(--foreground),0.12)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--glass-bg-elevated)",
                      border: "1px solid var(--glass-border-elevated)",
                      borderRadius: "12px",
                      color: "rgb(var(--foreground))",
                    }}
                    labelStyle={{ color: "rgba(var(--foreground),0.8)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spi"
                    name="SPI"
                    stroke="rgb(var(--accent))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "rgb(var(--accent))", stroke: "rgba(255,255,255,0.9)", strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cgpa"
                    name="Running CGPA"
                    stroke="rgba(var(--foreground),0.75)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "rgba(var(--foreground),0.75)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Semester Breakdown */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Semester Breakdown</h2>
          </div>

          {semesterData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No semesters with grades yet. Add subjects with grades to see your CGPA.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {semesterData.map((sem, index) => (
                <motion.div
                  key={sem.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    sem.status === "ongoing"
                      ? "bg-[rgba(var(--accent),0.05)] border-[rgba(var(--accent),0.2)]"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ 
                        backgroundColor: `${getSPIColor(sem.spi)}20`,
                        color: getSPIColor(sem.spi),
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sem.credits} credits
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] uppercase tracking-wide">
                          {sem.source === "subjects" ? "Subjects" : "Manual"}
                        </span>
                        {sem.status === "ongoing" && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))]">
                            Ongoing
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {sem.includedInCGPA ? (
                      <>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: getSPIColor(sem.spi) }}
                        >
                          {sem.spi.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">SPI</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Incomplete</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* What-If Calculator */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* If I score X SPI */}
          <motion.div
            className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">What If?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              If I score this SPI this semester...
            </p>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={whatIfSPI}
                onChange={(e) => setWhatIfSPI(e.target.value)}
                min="0"
                max="10"
                step="0.1"
                className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground text-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
              />
              <span className="text-muted-foreground">SPI</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your CGPA will be</p>
              <p
                className="text-3xl font-bold"
                style={{ color: getSPIColor(whatIfResult) }}
              >
                {whatIfResult.toFixed(2)}
              </p>
            </div>
          </motion.div>

          {/* To reach X CGPA */}
          <motion.div
            className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Target CGPA</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              To reach this CGPA, I need...
            </p>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(e.target.value)}
                min="0"
                max="10"
                step="0.1"
                className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground text-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
              />
              <span className="text-muted-foreground">CGPA</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">You need SPI of</p>
              {requiredResult.achievable ? (
                <p
                  className="text-3xl font-bold"
                  style={{ color: getSPIColor(requiredResult.required) }}
                >
                  {requiredResult.required.toFixed(2)}
                </p>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {requiredResult.required > 10 ? "Not Possible" : requiredResult.required.toFixed(2)}
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    {requiredResult.required > 10
                      ? "Requires SPI > 10"
                      : "Already achieved!"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Info */}
        <motion.div
          className="glass-card mt-8 p-4 rounded-xl flex items-start gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-1">
              <strong>SPI</strong> (Semester Performance Index) is calculated as the weighted average of grade points for a semester.
            </p>
            <p>
              <strong>CGPA</strong> (Cumulative GPA) is the weighted average of all SPIs across semesters, weighted by credits.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
