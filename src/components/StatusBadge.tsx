import React from "react";
import { FrontendEmploymentStatus, FrontendPhoneStatus } from "@/types";

interface StatusBadgeProps {
  status: FrontendEmploymentStatus | FrontendPhoneStatus | "active" | "inactive" | "pending" | "cancelled" | "risk";
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
}) => {
  const getStatusClass = () => {
    switch (status) {
      case "active":
      case "in_use":
        return "status-active";
      case "inactive":
      case "idle":
      case "departed":
        return "status-inactive";
      case "pending":
      case "pending_deactivation":
      case "risk_pending":
      case "user_reported":
        return "status-pending";
      case "cancelled":
      case "deactivated":
        return "status-inactive";
      case "suspended":
        return "status-suspended";
      case "card_replacing":
        return "status-replacing";
      case "risk":
        return "status-risk";
      default:
        return "status-inactive";
    }
  };

  const getStatusText = () => {
    if (text) return text;
    
    switch (status) {
      case "active":
        return "使用中";
      case "in_use":
        return "使用中";
      case "inactive":
        return "闲置";
      case "idle":
        return "闲置";
      case "departed":
        return "已离职";
      case "pending":
        return "待处理";
      case "pending_deactivation":
        return "待注销";
      case "risk_pending":
        return "待核实-办卡人离职";
      case "user_reported":
        return "待核实-用户报告";
      case "cancelled":
        return "已注销";
      case "deactivated":
        return "已注销";
      case "suspended":
        return "停机保号";
      case "card_replacing":
        return "补卡中";
      case "risk":
        return "风险";
      default:
        return status;
    }
  };

  return (
    <span className={getStatusClass()}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;
