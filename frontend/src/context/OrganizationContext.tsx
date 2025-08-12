import { createContext, useContext, useState } from 'react';
import { Organization } from '../types/organization';


const OrganizationContext = createContext<{
  orgInfo: Organization | null;
  setOrgInfo: React.Dispatch<React.SetStateAction<Organization | null>>;
} | null>(null);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgInfo, setOrgInfo] = useState<Organization | null>(null);

  return (
    <OrganizationContext.Provider value={{ orgInfo, setOrgInfo }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
