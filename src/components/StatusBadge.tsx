
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
      case "pending_cancellation":
      case "pending_verification_employee_left":
      case "pending_verification_user_report":
        return "status-pending";
      case "cancelled":
        return "status-inactive";
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
        return "在用";
      case "in_use":
        return "在用";
      case "inactive":
        return "闲置";
      case "idle":
        return "闲置";
      case "departed":
        return "已离职";
      case "pending":
        return "待开通";
      case "pending_cancellation":
        return "待注销";
      case "pending_verification_employee_left":
        return "待核实-办卡人离职";
      case "pending_verification_user_report":
        return "待核实-用户报告";
      case "cancelled":
        return "已注销";
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
