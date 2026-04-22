import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Target,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";

interface UploadStatsPanelProps {
  userType?: "parent" | "teacher" | "admin";
  className?: string;
  showSystemStats?: boolean;
}

type TimeRange = "day" | "week" | "month" | "all";

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function UploadStatsPanel({
  userType = "parent",
  className = "",
  showSystemStats = false,
}: UploadStatsPanelProps) {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const trpc = useTRPC();
  const { authToken } = useAuthStore();

  // Fetch user upload statistics
  const userStatsQuery = useQuery({
    ...trpc.getUserUploadStats.queryOptions({
      authToken: authToken!,
      timeRange,
      includeAnalytics: true,
    }),
    enabled: !!authToken,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch system statistics (admin/teacher only)
  const systemStatsQuery = useQuery({
    ...trpc.getSystemStats.queryOptions({
      authToken: authToken!,
      adminOnly: false,
    }),
    enabled: !!authToken && showSystemStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        userStatsQuery.refetch(),
        showSystemStats ? systemStatsQuery.refetch() : Promise.resolve(),
      ]);
      toast.success("Statistics refreshed!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const getUserStatCards = (): StatCard[] => {
    if (!userStatsQuery.data) return [];

    const { summary, analytics } = userStatsQuery.data as any;

    return [
      {
        title: "Total Uploads",
        value: summary.totalUploads,
        icon: FileText,
        color: "text-blue-600",
      },
      {
        title: "AI Analyzed",
        value: summary.analyzedCount,
        icon: Brain,
        color: "text-purple-600",
      },
      {
        title: "Analysis Rate",
        value: `${summary.analysisRate}%`,
        trend: summary.analysisRate >= 80 ? "up" : summary.analysisRate >= 50 ? "neutral" : "down",
        icon: Target,
        color: "text-green-600",
      },
      ...(analytics?.averageGrade
        ? [
            {
              title: "Average Grade",
              value: analytics.averageGrade,
              icon: CheckCircle,
              color: "text-emerald-600",
            },
          ]
        : []),
    ];
  };

  const getSystemStatCards = (): StatCard[] => {
    if (!systemStatsQuery.data) return [];

    const { summary } = systemStatsQuery.data;

    return [
      {
        title: "Total Assignments",
        value: summary.totalAssignments.toLocaleString(),
        icon: FileText,
        color: "text-blue-600",
      },
      {
        title: "Students",
        value: summary.totalStudents.toLocaleString(),
        icon: Users,
        color: "text-indigo-600",
      },
      {
        title: "Teachers",
        value: summary.totalTeachers.toLocaleString(),
        icon: Users,
        color: "text-purple-600",
      },
      {
        title: "System Analysis Rate",
        value: `${summary.analysisRate}%`,
        trend: summary.analysisRate >= 85 ? "up" : summary.analysisRate >= 70 ? "neutral" : "down",
        icon: Zap,
        color: "text-green-600",
      },
    ];
  };

  const formatTrendData = (data: Record<string, number>) => {
    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      }));
  };

  if (!authToken) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          Please log in to view upload statistics
        </div>
      </div>
    );
  }

  const userStats = getUserStatCards();
  const systemStats = showSystemStats ? getSystemStatCards() : [];

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Statistics</h3>
              <p className="text-sm text-gray-600">
                {showSystemStats ? "System-wide analytics" : "Your upload activity and performance"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || userStatsQuery.isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Loading State */}
        {userStatsQuery.isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading statistics...</span>
          </div>
        )}

        {/* Error State */}
        {userStatsQuery.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">Failed to load statistics</span>
            </div>
          </div>
        )}

        {/* User Statistics */}
        {userStatsQuery.data && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {userStats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      {stat.trend && (
                        <div className="flex items-center mt-2">
                          <TrendingUp
                            className={`w-4 h-4 mr-1 ${
                              stat.trend === "up"
                                ? "text-green-600"
                                : stat.trend === "down"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          />
                          <span className="text-xs text-gray-600">
                            {stat.trend === "up" ? "Good" : stat.trend === "down" ? "Needs attention" : "Stable"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg bg-white ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Uploads */}
            {userStatsQuery.data.recentUploads.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Uploads
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {userStatsQuery.data.recentUploads.slice(0, 5).map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{upload.title}</p>
                          <p className="text-xs text-gray-600">
                            {upload.studentName} • {upload.className}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(upload.createdAt).toLocaleDateString()}
                          </span>
                          {upload.hasAnalysis ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {(userStatsQuery.data as any)?.analytics && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Brain className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-900">Advanced Analytics</span>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Strengths */}
                    {(userStatsQuery.data as any)?.analytics.topStrengths.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          Top Strengths
                        </h5>
                        <div className="space-y-2">
                          {(userStatsQuery.data as any)?.analytics.topStrengths.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span className="text-sm text-green-800">{item.strength}</span>
                              <span className="text-xs font-medium text-green-600">{item.count}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Improvements */}
                    {(userStatsQuery.data as any)?.analytics.topImprovements.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 flex items-center">
                          <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                          Areas for Improvement
                        </h5>
                        <div className="space-y-2">
                          {(userStatsQuery.data as any)?.analytics.topImprovements.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                              <span className="text-sm text-blue-800">{item.improvement}</span>
                              <span className="text-xs font-medium text-blue-600">{item.count}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* System Statistics */}
        {showSystemStats && systemStatsQuery.data && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              System Overview
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStats.map((stat, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-white ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {userStatsQuery.data && userStatsQuery.data.summary.totalUploads === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h4>
            <p className="text-gray-600">
              Start uploading assignments to see your statistics and analytics here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
