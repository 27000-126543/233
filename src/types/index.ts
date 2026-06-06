export type UserRole = 'national' | 'provincial' | 'segment'

export interface User {
  id: string
  name: string
  role: UserRole
  province?: string
  segmentId?: string
  avatar?: string
}

export interface Province {
  code: string
  name: string
  flow: number
  toll: number
  congestionIndex: number
}

export interface RoadSegment {
  id: string
  name: string
  province: string
  startPoint: string
  endPoint: string
  length: number
  lanes: number
  flow: number
  avgSpeed: number
  congestionIndex: number
  toll: number
  status: 'normal' | 'warning' | 'congested'
}

export interface TollStation {
  id: string
  name: string
  segmentId: string
  province: string
  lanes: number
  flow: number
  avgWaitTime: number
  efficiency: number
  toll: number
  lat: number
  lng: number
}

export interface VehicleRecord {
  id: string
  plateNumber: string
  vehicleType: number
  entryStation: string
  exitStation: string
  entryTime: string
  exitTime: string
  distance: number
  toll: number
  etcTransaction: boolean
  weight: number
  overloaded: boolean
  evasionRisk: number
}

export interface WarningEvent {
  id: string
  type: 'congestion' | 'efficiency' | 'accident' | 'evasion'
  level: 'primary' | 'secondary' | 'tertiary'
  title: string
  description: string
  location: string
  timestamp: string
  status: 'pending' | 'confirmed' | 'reviewed' | 'approved' | 'resolved'
  approvals: ApprovalRecord[]
  segmentId?: string
  stationId?: string
}

export interface ApprovalRecord {
  id: string
  role: 'monitor' | 'director' | 'center'
  userId: string
  userName: string
  action: 'approve' | 'reject'
  comment: string
  timestamp: string
}

export interface TrafficFlowData {
  time: string
  flow: number
  avgSpeed: number
  congestionIndex: number
}

export interface HolidayPlan {
  id: string
  name: string
  startDate: string
  endDate: string
  vehicleTypes: number[]
  freeToll: boolean
}

export interface PredictionData {
  time: string
  predictedFlow: number
  actualFlow?: number
}

export interface TollLoss {
  hour: number
  estimatedLoss: number
}

export interface DiversionStrategy {
  id: string
  name: string
  description: string
  affectedSegments: string[]
  estimatedFlowReduction: number
  cost: number
}

export interface EvasionCase {
  id: string
  plateNumber: string
  vehicleType: number
  riskScore: number
  suspectedType: string
  firstDetected: string
  lastSeen: string
  totalLoss: number
  status: 'investigating' | 'confirmed' | 'resolved'
}

export interface WeeklyReport {
  id: string
  week: string
  startDate: string
  endDate: string
  totalFlow: number
  totalToll: number
  avgCongestionIndex: number
  congestionEvents: number
  congestionYoY: number
  congestionQoQ: number
  auditEfficiency: number
  accidentBlackSpots: BlackSpot[]
  maintenanceRecommendations: string[]
  auditStrategies: string[]
}

export interface BlackSpot {
  id: string
  location: string
  accidentCount: number
  severity: 'high' | 'medium' | 'low'
  lastAccident: string
}

export interface DataSource {
  id: string
  name: string
  type: 'etc' | 'gantry' | 'weight' | 'video'
  status: 'online' | 'offline' | 'warning'
  recordsPerSecond: number
  lastUpdate: string
}
