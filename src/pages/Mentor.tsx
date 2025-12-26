import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Activity, 
  Target, 
  TrendingUp,
  Copy,
  Check,
  Settings,
  X,
  UserPlus
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getMentorDashboardData } from "@/services/mockData.service";
import type { StudentCard, MentorStats } from "@/types/trading";

const Mentor = () => {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Get mentor data from mock service
  const mentorData = getMentorDashboardData();
  
  const mentorStats: MentorStats = {
    total_students: mentorData.totalStudents,
    active_students: mentorData.activeStudents,
    avg_student_win_rate: mentorData.avgStudentWinRate,
    avg_student_rr: mentorData.avgStudentR,
  };

  const students: StudentCard[] = mentorData.students
    .filter(s => s.status === 'APPROVED')
    .map(s => ({
      id: s.studentId,
      name: s.studentName,
      last_activity: '2 days ago',
      win_rate: s.winRate,
      avg_r: s.avgR,
      status: s.activityStatus === 'active' ? 'active' as const : 'inactive' as const,
    }));

  const pendingRequests = mentorData.students
    .filter(s => s.status === 'PENDING')
    .map(s => ({
      id: s.studentId,
      name: s.studentName,
      email: s.studentEmail,
    }));

  const MENTOR_ID = mentorData.mentorShareId;

  const copyMentorId = () => {
    navigator.clipboard.writeText(MENTOR_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    delay = 0 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-border/50 bg-card p-6 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  const StudentCardComponent = ({ student, index }: { student: StudentCard; index: number }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all hover:shadow-glow hover:border-primary/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{student.name}</h3>
            <p className="text-sm text-muted-foreground">
              Last: {student.last_activity}
            </p>
          </div>
        </div>
        <span className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          student.status === 'active' 
            ? "bg-profit/10 text-profit"
            : "bg-muted text-muted-foreground"
        )}>
          {student.status}
        </span>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{student.win_rate.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className={cn(
            "text-2xl font-bold",
            student.avg_r >= 0 ? "text-profit" : "text-loss"
          )}>
            {student.avg_r >= 0 ? '+' : ''}{student.avg_r.toFixed(2)}R
          </p>
          <p className="text-xs text-muted-foreground">Avg R</p>
        </div>
      </div>
    </motion.div>
  );

  const ManageStudentsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={() => setShowManageModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">{t.mentor.manageStudents}</h2>
          <button 
            onClick={() => setShowManageModal(false)}
            className="rounded-lg p-2 hover:bg-secondary text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mentor ID */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground">{t.mentor.mentorId}</label>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-secondary/50 px-4 py-3 font-mono text-foreground">
              {MENTOR_ID}
            </div>
            <button
              onClick={copyMentorId}
              className="rounded-lg bg-primary/10 p-3 text-primary hover:bg-primary/20 transition-colors"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t.mentor.shareId}</p>
        </div>

        {/* Pending Requests */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">{t.mentor.pendingRequests}</h3>
          {pendingRequests.length > 0 ? (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="font-medium text-foreground">{req.name}</p>
                    <p className="text-sm text-muted-foreground">{req.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-profit/10 px-3 py-1 text-sm text-profit hover:bg-profit/20">
                      Accept
                    </button>
                    <button className="rounded-lg bg-loss/10 px-3 py-1 text-sm text-loss hover:bg-loss/20">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending requests
            </p>
          )}
        </div>

        {/* Connected Students */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Connected Students</h3>
          {students.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-foreground">{student.name}</span>
                  </div>
                  <span className={cn(
                    "text-xs",
                    student.status === 'active' ? "text-profit" : "text-muted-foreground"
                  )}>
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No students connected
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.mentor.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.mentor.subtitle}</p>
          </div>
          
          <button
            onClick={() => setShowManageModal(true)}
            className="btn-primary"
          >
            <Settings className="h-4 w-4" />
            {t.mentor.manageStudents}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t.mentor.totalStudents}
            value={mentorStats.total_students}
            icon={Users}
            delay={0}
          />
          <StatCard
            title={t.mentor.activeStudents}
            value={mentorStats.active_students}
            icon={Activity}
            delay={0.1}
          />
          <StatCard
            title={t.mentor.avgWinRate}
            value={`${mentorStats.avg_student_win_rate.toFixed(0)}%`}
            icon={Target}
            delay={0.2}
          />
          <StatCard
            title={t.mentor.avgR}
            value={`${mentorStats.avg_student_rr >= 0 ? '+' : ''}${mentorStats.avg_student_rr.toFixed(2)}R`}
            icon={TrendingUp}
            delay={0.3}
          />
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-yellow-500/10 p-3">
                <UserPlus className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.mentor.pendingRequests}</h3>
                <p className="text-sm text-muted-foreground">{pendingRequests.length} student(s) waiting for approval</p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm font-medium text-yellow-500">
                      {req.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{req.name}</p>
                      <p className="text-sm text-muted-foreground">{req.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-profit px-4 py-2 text-sm font-medium text-white hover:bg-profit/90 transition-colors">
                      Approve
                    </button>
                    <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Students Grid */}
        {students.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student, index) => (
              <StudentCardComponent key={student.id} student={student} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/50 py-16"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{t.mentor.noStudents}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md text-center">
              {t.mentor.shareId}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="rounded-lg bg-secondary/50 px-4 py-2 font-mono text-foreground">
                {MENTOR_ID}
              </div>
              <button
                onClick={copyMentorId}
                className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Manage Modal */}
      {showManageModal && <ManageStudentsModal />}
    </DashboardLayout>
  );
};

export default Mentor;
