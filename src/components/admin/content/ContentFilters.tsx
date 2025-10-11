import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface ContentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  shareFilter: string;
  onShareFilterChange: (value: string) => void;
  groupFilter: string;
  onGroupFilterChange: (value: string) => void;
  groups: Array<{ id: string; name: string }>;
}

export function ContentFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  shareFilter,
  onShareFilterChange,
  groupFilter,
  onGroupFilterChange,
  groups
}: ContentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Content Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="form">Forms</SelectItem>
          <SelectItem value="map">Maps</SelectItem>
          <SelectItem value="dashboard">Dashboards</SelectItem>
        </SelectContent>
      </Select>

      <Select value={shareFilter} onValueChange={onShareFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Share Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sharing</SelectItem>
          <SelectItem value="private">Private</SelectItem>
          <SelectItem value="org">Organization</SelectItem>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="group">Group</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>

      <Select value={groupFilter} onValueChange={onGroupFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by Group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Groups</SelectItem>
          <SelectItem value="my-groups">My Groups Only</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
