import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, Building2, Globe, UserPlus } from "lucide-react";
import { FormsList } from "./FormsList";
import { useFormsByShare } from "@/hooks/use-forms-by-share";

type ShareType = 'all' | 'private' | 'group' | 'organisation' | 'other_organisation' | 'public';

export const ContentShareTabs = () => {
  const [activeTab, setActiveTab] = useState<ShareType>('all');
  
  const { forms: allForms, loading: loadingAll } = useFormsByShare(null);
  const { forms: privateForms, loading: loadingPrivate } = useFormsByShare('private');
  const { forms: groupForms, loading: loadingGroup } = useFormsByShare('group');
  const { forms: orgForms, loading: loadingOrg } = useFormsByShare('organisation');
  const { forms: otherOrgForms, loading: loadingOtherOrg } = useFormsByShare('other_organisation');
  const { forms: publicForms, loading: loadingPublic } = useFormsByShare('public');

  const tabs = [
    { 
      value: 'all', 
      label: 'All Forms', 
      icon: null, 
      count: allForms.length,
      forms: allForms,
      loading: loadingAll
    },
    { 
      value: 'private', 
      label: 'Private', 
      icon: Lock, 
      count: privateForms.length,
      forms: privateForms,
      loading: loadingPrivate
    },
    { 
      value: 'group', 
      label: 'Group', 
      icon: UserPlus, 
      count: groupForms.length,
      forms: groupForms,
      loading: loadingGroup
    },
    { 
      value: 'organisation', 
      label: 'Organisation', 
      icon: Building2, 
      count: orgForms.length,
      forms: orgForms,
      loading: loadingOrg
    },
    { 
      value: 'other_organisation', 
      label: 'Other Organisations', 
      icon: Users, 
      count: otherOrgForms.length,
      forms: otherOrgForms,
      loading: loadingOtherOrg
    },
    { 
      value: 'public', 
      label: 'Public', 
      icon: Globe, 
      count: publicForms.length,
      forms: publicForms,
      loading: loadingPublic
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShareType)} className="w-full">
      <TabsList className="grid w-full grid-cols-6 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{tab.label}</span>
              <Badge variant="secondary" className="ml-1">
                {tab.count}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <FormsList 
            showHeader={false} 
            forms={tab.forms}
            loading={tab.loading}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};
