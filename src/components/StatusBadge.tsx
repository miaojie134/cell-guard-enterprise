
import React from "react";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "cancelled" | "risk" | 
          "idle" | "assigned" | "departed" | "terminated" | "in_use" | "suspended";
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
      case "assigned":
        return "status-active";
      case "inactive":
      case "idle":
      case "departed":
      case "terminated":
      case "cancelled":
        return "status-inactive";
      case "pending":
        return "status-pending";
      case "risk":
      case "suspended":
        return "status-risk";
      default:
        return "status-inactive";
    }
  };

  const getStatusText = () => {
    if (text) return text;
    
    switch (status) {
      case "active":
      case "in_use":
        return "在用";
      case "inactive":
      case "idle":
        return "闲置";
      case "pending":
        return "待开通";
      case "cancelled":
        return "已注销";
      case "risk":
        return "风险";
      case "assigned":
        return "已分配";
      case "departed":
      case "terminated":
        return "已离职";
      case "suspended":
        return "已暂停";
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
