
import React from "react";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "cancelled" | "risk";
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
}) => {
  const getStatusClass = () => {
    switch (status) {
      case "active":
        return "status-active";
      case "inactive":
        return "status-inactive";
      case "pending":
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
      case "inactive":
        return "闲置";
      case "pending":
        return "待开通";
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
