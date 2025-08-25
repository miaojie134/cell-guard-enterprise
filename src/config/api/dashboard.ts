// 仪表盘相关API类型定义

// 仪表盘最近号码数据
export interface DashboardRecentNumber {
  phoneNumber: string;
  applicantName: string;
  currentUserName: string;
  status: string;
  applicationDate: string;
}

// 仪表盘风险号码数据
export interface DashboardRiskNumber {
  phoneNumber: string;
  applicantName: string;
  applicantStatus: string;
  currentUserName: string;
  status: string;
}

// 仪表盘统计数据
export interface DashboardStatsData {
  totalNumbers: number;      // 手机号码总数
  inUseNumbers: number;      // 在用号码数量  
  riskNumbers: number;       // 风险号码数量
  recentNumbers: DashboardRecentNumber[];    // 最近登记的号码（最多5条）
  riskNumberList: DashboardRiskNumber[];     // 风险号码列表（最多10条）
}

// 仪表盘统计响应类型
export interface DashboardStatsResponse {
  status: string;
  message: string;
  data: DashboardStatsData;
}
