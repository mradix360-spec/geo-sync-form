import { createContext, useContext, useState, ReactNode } from 'react';

interface SpatialFilter {
  type: 'bbox' | 'point' | 'polygon';
  geometry: any;
  formId?: string;
}

interface AttributeFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  formId?: string;
}

interface DashboardFilters {
  spatialFilters: SpatialFilter[];
  attributeFilters: AttributeFilter[];
  selectedFeatures: string[];
  activeFormId?: string;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  addSpatialFilter: (filter: SpatialFilter) => void;
  removeSpatialFilter: (index: number) => void;
  addAttributeFilter: (filter: AttributeFilter) => void;
  removeAttributeFilter: (index: number) => void;
  setSelectedFeatures: (features: string[]) => void;
  setActiveFormId: (formId: string | undefined) => void;
  clearFilters: () => void;
  clearSpatialFilters: () => void;
  clearAttributeFilters: () => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export const DashboardFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<DashboardFilters>({
    spatialFilters: [],
    attributeFilters: [],
    selectedFeatures: [],
    activeFormId: undefined,
  });

  const addSpatialFilter = (filter: SpatialFilter) => {
    setFilters(prev => ({
      ...prev,
      spatialFilters: [...prev.spatialFilters, filter],
    }));
  };

  const removeSpatialFilter = (index: number) => {
    setFilters(prev => ({
      ...prev,
      spatialFilters: prev.spatialFilters.filter((_, i) => i !== index),
    }));
  };

  const addAttributeFilter = (filter: AttributeFilter) => {
    setFilters(prev => ({
      ...prev,
      attributeFilters: [...prev.attributeFilters, filter],
    }));
  };

  const removeAttributeFilter = (index: number) => {
    setFilters(prev => ({
      ...prev,
      attributeFilters: prev.attributeFilters.filter((_, i) => i !== index),
    }));
  };

  const setSelectedFeatures = (features: string[]) => {
    setFilters(prev => ({
      ...prev,
      selectedFeatures: features,
    }));
  };

  const setActiveFormId = (formId: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      activeFormId: formId,
    }));
  };

  const clearFilters = () => {
    setFilters({
      spatialFilters: [],
      attributeFilters: [],
      selectedFeatures: [],
      activeFormId: undefined,
    });
  };

  const clearSpatialFilters = () => {
    setFilters(prev => ({
      ...prev,
      spatialFilters: [],
    }));
  };

  const clearAttributeFilters = () => {
    setFilters(prev => ({
      ...prev,
      attributeFilters: [],
    }));
  };

  return (
    <DashboardFilterContext.Provider
      value={{
        filters,
        addSpatialFilter,
        removeSpatialFilter,
        addAttributeFilter,
        removeAttributeFilter,
        setSelectedFeatures,
        setActiveFormId,
        clearFilters,
        clearSpatialFilters,
        clearAttributeFilters,
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
};

export const useDashboardFilters = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within DashboardFilterProvider');
  }
  return context;
};
