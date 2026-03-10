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
