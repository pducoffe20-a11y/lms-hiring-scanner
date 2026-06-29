export type Account = {
  id: number;
  name: string;
  state: string;
  category: string;
  fitScore: number;
  website: string;
  note: string;
};

export const ACCOUNTS: Account[] = [
  { id: 1, name: 'Ohio Hospital Association', state: 'OH', category: 'Healthcare association', fitScore: 94, website: 'ohiohospitals.org', note: 'Healthcare workforce education, compliance learning, member training.' },
  { id: 2, name: 'Michigan Bankers Association', state: 'MI', category: 'Banking association', fitScore: 92, website: 'mibankers.com', note: 'Compliance-heavy member training and continuing education.' },
  { id: 3, name: 'Minnesota Medical Association', state: 'MN', category: 'Medical association', fitScore: 91, website: 'mnmed.org', note: 'Professional development, CME, physician education.' },
  { id: 4, name: 'Michigan Manufacturers Association', state: 'MI', category: 'Manufacturing association', fitScore: 89, website: 'mimfg.org', note: 'Workforce development and employer training needs.' },
  { id: 5, name: 'Ohio Society of CPAs', state: 'OH', category: 'Accounting association', fitScore: 88, website: 'ohiocpa.com', note: 'Credentialing, CPE, certification learning.' },
  { id: 6, name: 'Minnesota Credit Union Network', state: 'MN', category: 'Banking association', fitScore: 86, website: 'mncun.org', note: 'Member education and compliance training.' },
  { id: 7, name: 'State Bar of Michigan', state: 'MI', category: 'Legal association', fitScore: 84, website: 'michbar.org', note: 'CLE and member professional development.' },
  { id: 8, name: 'Ohio Nurses Association', state: 'OH', category: 'Healthcare association', fitScore: 83, website: 'ohnurses.org', note: 'Continuing education, certification, workforce training.' },
  { id: 9, name: 'Minnesota Dental Association', state: 'MN', category: 'Dental association', fitScore: 82, website: 'mndental.org', note: 'CE learning and member engagement.' },
  { id: 10, name: 'Association for Manufacturing Technology', state: 'MI', category: 'Manufacturing', fitScore: 80, website: 'amtonline.org', note: 'Technical training and workforce skill development.' },
  { id: 11, name: 'Ohio Veterinary Medical Association', state: 'OH', category: 'Veterinary association', fitScore: 79, website: 'ohiovma.org', note: 'CE courses, events, and member education.' },
  { id: 12, name: 'Minnesota Society of Professional Engineers', state: 'MN', category: 'Engineering association', fitScore: 76, website: 'mnspe.org', note: 'Professional development and certification-adjacent learning.' }
];
