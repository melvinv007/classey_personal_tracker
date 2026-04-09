"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Target, Award, Check, AlertTriangle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useData } from "@/hooks/use-data";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import {
  DEFAULT_GRADE_SCALE,
  marksNeededForGrade,
  calculateSubjectGrade,
  getGradeColor,
} from "@/utils/grades";
import { cn } from "@/lib/utils";

interface GradeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSubjectId?: string;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function GradeCalculatorModal({
  isOpen,
  onClose,
  preselectedSubjectId,
}: GradeCalculatorModalProps): React.ReactNode {
  const { subjects, exams, ongoingSemester } = useData();
  const filteredSubjects = subjects.filter((sub) => !sub.deleted_at);

  const semesterSubjects = filteredSubjects.filter(
    (s) => ongoingSemester && s.semester_id === ongoingSemester.$id
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    preselectedSubjectId || semesterSubjects[0]?.$id || ""
  );
  const [targetGrade, setTargetGrade] = useState<string>("A");

  // Get exams for selected subject
  const subjectExams = useMemo(() => {
    return exams.filter(
      (e) => e.subject_id === selectedSubjectId && !e.deleted_at
    );
  }, [exams, selectedSubjectId]);

  const completedExams = subjectExams.filter((e) => e.marks_obtained !== null);
  const remainingExams = subjectExams.filter((e) => e.marks_obtained === null);

  // Current grade calculation
  const currentGrade = useMemo(() => {
    return calculateSubjectGrade(subjectExams);
  }, [subjectExams]);

  // Calculate what's needed for each grade
  const gradeRequirements = useMemo(() => {
    return DEFAULT_GRADE_SCALE.map((grade) => {
      const result = marksNeededForGrade(completedExams, remainingExams, grade.grade);
      return {
        grade: grade.grade,
        points: grade.points,
        minPercent: grade.min_percent,
        ...result,
      };
    });
  }, [completedExams, remainingExams]);

  // Selected grade requirement
  const selectedRequirement = gradeRequirements.find((g) => g.grade === targetGrade);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent),0.15)] flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-[rgb(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Grade Calculator</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Subject
              </label>
              <ThemedSelect
                value={selectedSubjectId}
                onChange={setSelectedSubjectId}
                options={semesterSubjects.map((subject) => ({
                  value: subject.$id,
                  label: subject.name,
                }))}
              />
            </div>

            {/* Current Status */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Current Status</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold" style={{ color: getGradeColor(currentGrade.percentage) }}>
                    {currentGrade.grade}
                  </p>
                  <p className="text-xs text-muted-foreground">Grade</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {currentGrade.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Percentage</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {currentGrade.earnedMarks}/{currentGrade.totalMarks}
                  </p>
                  <p className="text-xs text-muted-foreground">Marks</p>
                </div>
              </div>
              {completedExams.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Based on {completedExams.length} exam{completedExams.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Target Grade Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Target Grade
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_GRADE_SCALE.slice(0, -1).map((grade) => (
                  <button
                    key={grade.grade}
                    onClick={() => setTargetGrade(grade.grade)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-bold transition-all",
                      targetGrade === grade.grade
                        ? "ring-2 ring-offset-2 ring-offset-background"
                        : "hover:bg-white/10"
                    )}
                    style={{
                      backgroundColor: targetGrade === grade.grade 
                        ? `${getGradeColor(grade.min_percent)}30` 
                        : "rgba(255,255,255,0.05)",
                      color: targetGrade === grade.grade 
                        ? getGradeColor(grade.min_percent) 
                        : "inherit",
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": getGradeColor(grade.min_percent),
                    }}
                  >
                    {grade.grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            {selectedRequirement && (
              <div 
                className="rounded-2xl p-6 text-center"
                style={{ 
                  backgroundColor: selectedRequirement.achievable 
                    ? "rgba(16,185,129,0.1)" 
                    : "rgba(239,68,68,0.1)",
                  border: `1px solid ${selectedRequirement.achievable ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                {remainingExams.length === 0 ? (
                  <div>
                    <p className="text-muted-foreground mb-2">No remaining exams</p>
                    <p className="text-sm text-muted-foreground">
                      Your final grade is <span className="font-bold text-foreground">{currentGrade.grade}</span>
                    </p>
                  </div>
                ) : selectedRequirement.achievable ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Achievable</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      To get <span className="font-bold text-foreground">{targetGrade}</span>, you need
                    </p>
                    <p 
                      className="text-4xl font-bold mb-2"
                      style={{ color: getGradeColor(selectedRequirement.neededPercent) }}
                    >
                      {selectedRequirement.neededPercent}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      in remaining {remainingExams.length} exam{remainingExams.length !== 1 ? "s" : ""} 
                      ({selectedRequirement.remainingWeight}% weightage)
                    </p>
                  </>
                ) : selectedRequirement.neededPercent < 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Already Achieved!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve already secured grade <span className="font-bold text-foreground">{targetGrade}</span> or better
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-medium text-red-400">Not Possible</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Would require {selectedRequirement.neededPercent}% in remaining exams
                    </p>
                    <p className="text-xs text-red-400">
                      That&apos;s more than 100% — mathematically impossible
                    </p>
                  </>
                )}
              </div>
            )}

            {/* All Grades Overview */}
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">All Grades Overview</p>
              <div className="space-y-2">
                {gradeRequirements.slice(0, -1).map((req) => (
                  <div
                    key={req.grade}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl transition-all",
                      req.achievable ? "bg-white/5" : "bg-white/3 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                        style={{ 
                          backgroundColor: `${getGradeColor(req.minPercent)}20`,
                          color: getGradeColor(req.minPercent),
                        }}
                      >
                        {req.grade}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ≥ {req.minPercent}%
                      </span>
                    </div>
                    <div className="text-right">
                      {req.achievable ? (
                        req.neededPercent <= 0 ? (
                          <span className="text-xs text-emerald-400 font-medium">✓ Secured</span>
                        ) : (
                          <span className="text-sm font-medium text-foreground">
                            Need {req.neededPercent}%
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-red-400">Not possible</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close button */}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
