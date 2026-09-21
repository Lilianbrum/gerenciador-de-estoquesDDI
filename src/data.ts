export type ProductClass = {
  id: number;
  name: string;
  description: string;
  color: string;
};

export type Unit = {
  id: number;
  name: string;
  code: string;
  sectors: Sector[];
};

export type Sector = {
  id: number;
  unitId: number;
  name: string;
};

export type Product = {
  id: number;
  code: string;
  name: string;
  classId: number;
  unit: string;
  minStock: number;
  currentStock: number;
  description: string;
  active: boolean;
  createdAt: string;
};

export type Movement = {
  id: number;
  type: 'entrada' | 'saida' | 'transferencia';
  productId: number;
  quantity: number;
  unitId?: number;
  sectorId?: number;
  fromUnitId?: number;
  toUnitId?: number;
  responsible: string;
  notes: string;
  date: string;
  userId: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'operador';
  unitId?: number;
  active: boolean;
  createdAt: string;
};

export const productClasses: ProductClass[] = [
  { id: 1, name: 'Material de Escritório', description: 'Papéis, canetas, grampos e afins', color: '#2563eb' },
  { id: 2, name: 'Limpeza e Higiene', description: 'Produtos de limpeza e higiene pessoal', color: '#16a34a' },
  { id: 3, name: 'Equipamentos de TI', description: 'Hardware, periféricos e acessórios', color: '#9333ea' },
  { id: 4, name: 'Mobiliário', description: 'Mesas, cadeiras, armários', color: '#d97706' },
  { id: 5, name: 'EPI', description: 'Equipamentos de proteção individual', color: '#dc2626' },
  { id: 6, name: 'Alimentos', description: 'Insumos alimentícios para copa/cozinha', color: '#0891b2' },
];

export const units: Unit[] = [
  {
    id: 1, name: 'Sede Central', code: 'SEDE',
    sectors: [
      { id: 1, unitId: 1, name: 'Almoxarifado Central' },
      { id: 2, unitId: 1, name: 'Recursos Humanos' },
      { id: 3, unitId: 1, name: 'Financeiro' },
      { id: 4, unitId: 1, name: 'TI' },
    ]
  },
  {
    id: 2, name: 'Unidade Norte', code: 'UN-N',
    sectors: [
      { id: 5, unitId: 2, name: 'Almoxarifado' },
      { id: 6, unitId: 2, name: 'Administrativo' },
      { id: 7, unitId: 2, name: 'Operacional' },
    ]
  },
  {
    id: 3, name: 'Unidade Sul', code: 'UN-S',
    sectors: [
      { id: 8, unitId: 3, name: 'Almoxarifado' },
      { id: 9, unitId: 3, name: 'Administrativo' },
    ]
  },
  {
    id: 4, name: 'Unidade Leste', code: 'UN-L',
    sectors: [
      { id: 10, unitId: 4, name: 'Almoxarifado' },
      { id: 11, unitId: 4, name: 'Operacional' },
    ]
  },
];

export const initialProducts: Product[] = [
  { id: 1, code: 'ME-001', name: 'Papel A4 75g/m²', classId: 1, unit: 'Resma', minStock: 50, currentStock: 312, description: 'Papel sulfite A4 branco 500 folhas', active: true, createdAt: '2025-03-10' },
  { id: 2, code: 'ME-002', name: 'Caneta Esferográfica Azul', classId: 1, unit: 'Caixa', minStock: 20, currentStock: 8, description: 'Caneta esferográfica ponta média caixa c/50', active: true, createdAt: '2025-03-10' },
  { id: 3, code: 'ME-003', name: 'Grampeador 26/6', classId: 1, unit: 'Unidade', minStock: 10, currentStock: 15, description: 'Grampeador para 40 folhas', active: true, createdAt: '2025-03-12' },
  { id: 4, code: 'LH-001', name: 'Álcool 70% 1L', classId: 2, unit: 'Frasco', minStock: 100, currentStock: 247, description: 'Álcool etílico 70° INPM frasco 1 litro', active: true, createdAt: '2025-03-15' },
  { id: 5, code: 'LH-002', name: 'Sabonete Líquido 5L', classId: 2, unit: 'Galão', minStock: 30, currentStock: 3, description: 'Sabonete líquido antisséptico galão 5L', active: true, createdAt: '2025-03-15' },
  { id: 6, code: 'LH-003', name: 'Papel Higiênico Rolão', classId: 2, unit: 'Fardo', minStock: 20, currentStock: 34, description: 'Papel higiênico rolão 8 rolos × 300m', active: true, createdAt: '2025-03-20' },
  { id: 7, code: 'TI-001', name: 'Mouse USB Óptico', classId: 3, unit: 'Unidade', minStock: 15, currentStock: 22, description: 'Mouse USB óptico 1200 DPI', active: true, createdAt: '2025-04-01' },
  { id: 8, code: 'TI-002', name: 'Teclado USB ABNT2', classId: 3, unit: 'Unidade', minStock: 15, currentStock: 18, description: 'Teclado USB padrão ABNT2', active: true, createdAt: '2025-04-01' },
  { id: 9, code: 'EPI-001', name: 'Máscara PFF2', classId: 5, unit: 'Caixa', minStock: 50, currentStock: 91, description: 'Máscara de proteção respiratória PFF2 caixa c/20', active: true, createdAt: '2025-04-05' },
  { id: 10, code: 'EPI-002', name: 'Luva Nitrílica M', classId: 5, unit: 'Caixa', minStock: 40, currentStock: 7, description: 'Luva de nitrilo tam. M caixa c/100', active: true, createdAt: '2025-04-05' },
  { id: 11, code: 'AL-001', name: 'Café Torrado e Moído 500g', classId: 6, unit: 'Pacote', minStock: 30, currentStock: 58, description: 'Café torrado e moído embalagem 500g', active: true, createdAt: '2025-04-10' },
  { id: 12, code: 'AL-002', name: 'Açúcar Refinado 5kg', classId: 6, unit: 'Saco', minStock: 20, currentStock: 12, description: 'Açúcar refinado embalagem 5kg', active: true, createdAt: '2025-04-10' },
];

export const initialMovements: Movement[] = [];

export const initialUsers: User[] = [
  { id: 1, name: 'Admin Sistema', email: 'admin@empresa.gov.br', role: 'admin', active: true, createdAt: '2025-01-01' },
  { id: 2, name: 'Carlos Andrade', email: 'carlos.andrade@empresa.gov.br', role: 'gestor', unitId: 1, active: true, createdAt: '2025-02-10' },
  { id: 3, name: 'Fernanda Lima', email: 'fernanda.lima@empresa.gov.br', role: 'gestor', unitId: 2, active: true, createdAt: '2025-02-15' },
  { id: 4, name: 'João Alves', email: 'joao.alves@empresa.gov.br', role: 'operador', unitId: 3, active: true, createdAt: '2025-03-01' },
  { id: 5, name: 'Maria Santos', email: 'maria.santos@empresa.gov.br', role: 'operador', unitId: 1, active: true, createdAt: '2025-03-05' },
  { id: 6, name: 'Pedro Costa', email: 'pedro.costa@empresa.gov.br', role: 'operador', unitId: 4, active: false, createdAt: '2025-04-01' },
];
