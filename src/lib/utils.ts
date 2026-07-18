import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusColor(
  status: string
): "green" | "yellow" | "red" | "gray" {
  switch (status.toLowerCase()) {
    case "good":
      return "green";
    case "moderate":
      return "yellow";
    case "poor":
      return "red";
    default:
      return "gray";
  }
}

export function evidenceTypeBadge(type: string): {
  label: string;
  color: string;
} {
  switch (type) {
    case "confirmed_fact":
      return { label: "Confirmed", color: "bg-green-100 text-green-800" };
    case "client_report":
      return { label: "Client Report", color: "bg-yellow-100 text-yellow-800" };
    case "ai_inference":
      return { label: "AI Inference", color: "bg-orange-100 text-orange-800" };
    case "unavailable":
      return { label: "Unavailable", color: "bg-gray-100 text-gray-800" };
    default:
      return { label: type, color: "bg-gray-100 text-gray-800" };
  }
}