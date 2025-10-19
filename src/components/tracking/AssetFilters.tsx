import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AssetFiltersProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
}

const ASSET_TYPES = ['infrastructure', 'equipment', 'facility', 'vehicle', 'sensor'];
const ASSET_STATUSES = ['active', 'inactive', 'maintenance', 'decommissioned'];

export const AssetFilters = ({
  selectedTypes,
  onTypesChange,
  selectedStatuses,
  onStatusesChange,
}: AssetFiltersProps) => {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Asset Type</Label>
          {ASSET_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <label
                htmlFor={`type-${type}`}
                className="text-sm font-medium leading-none capitalize cursor-pointer"
              >
                {type}
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Status</Label>
          {ASSET_STATUSES.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
              />
              <label
                htmlFor={`status-${status}`}
                className="text-sm font-medium leading-none capitalize cursor-pointer"
              >
                {status}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
