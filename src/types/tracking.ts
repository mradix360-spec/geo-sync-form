export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type InspectionPriority = 'low' | 'medium' | 'high' | 'critical';
export type InspectionMode = 'form' | 'camera' | 'vr';
export type ImportType = 'csv' | 'geojson' | 'manual';

export interface Asset {
  id: string;
  organisation_id: string;
  name: string;
  asset_id: string;
  type: string;
  status: AssetStatus;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  geojson?: any;
  model_url?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionTask {
  id: string;
  organisation_id: string;
  asset_id?: string;
  asset_group_ids?: string[];
  form_id?: string;
  title: string;
  description?: string;
  status: InspectionStatus;
  priority: InspectionPriority;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  asset?: Asset;
  form?: any;
  assignments?: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id?: string;
  group_id?: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface InspectionResponse {
  id: string;
  task_id: string;
  asset_id?: string;
  form_response_id?: string;
  user_id: string;
  inspection_mode: InspectionMode;
  photos?: string[];
  gps_location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  gps_accuracy?: number;
  notes?: string;
  completed_at?: string;
  created_at: string;
}

export interface AssetImport {
  id: string;
  organisation_id: string;
  file_name: string;
  file_url?: string;
  import_type: ImportType;
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  errors?: any[];
  imported_by?: string;
  imported_at: string;
}

export interface ParsedAssetData {
  name: string;
  asset_id: string;
  type: string;
  status?: AssetStatus;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

export interface AssetGroup {
  id: string;
  organisation_id: string;
  name: string;
  description?: string;
  asset_ids: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}
