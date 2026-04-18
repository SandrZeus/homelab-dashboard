export interface PodSummary {
  name: string;
  namespace: string;
  phase: string;
  node: string;
  restarts: number;
  ready: boolean;
  age: string;
  cpuCores: number;
  memoryBytes: number;
}

export interface SystemMetrics {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  diskUsagePercent: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  uptimeSeconds: number;
  cpuTempCelsius: number;
}

export interface DashboardUpdate {
  type: string;
  pods: PodSummary[];
  metrics: SystemMetrics;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

// ServicePatrol types
export interface Target {
  id: number;
  name: string;
  url: string;
  method: string;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Check {
  id: number;
  target_id: number;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message: string | null;
  checked_at: string;
}

export interface CheckCompleteEvent {
  type: "check_complete";
  target_id: number;
  at: string;
  success: boolean;
  status_code: number;
  response_time_ms: number;
  error_message?: string | null;
}

export interface StateChangeEvent {
  type: "state_change";
  target_id: number;
  at: string;
  from: "up" | "down";
  to: "up" | "down";
}

export type ServicePatrolEvent = CheckCompleteEvent | StateChangeEvent;

export interface Capabilities {
  servicepatrol: boolean;
}
