export enum Modality {
  JIU_JITSU = 'Jiu-Jitsu',
  MUAY_THAI = 'Muay Thai',
  MMA = 'MMA'
}

export interface PaymentMethod {
  id: string;
  name: string;
  key: string; // Pix key
  type: 'Pix' | 'Cartão' | 'Dinheiro' | 'Outros';
}

export interface Graduation {
  date: string;
  rank: string;
  degree?: number;
  notes?: string;
}

export interface MonthlyPayment {
  id: string;
  month: string;
  year: number;
  amount: number;
  status: 'paid' | 'pending';
  dueDate: string;
  paymentDate?: string;
  modality: Modality;
}

export type StudentStatus = 'Ativo' | 'Inativo' | 'Lesionado';

export interface Student {
  id: string;
  name: string;
  phone: string;
  entryDate: string;
  paymentDay: number;
  modalities: Modality[];
  status: StudentStatus;
  bjjRank: string;
  bjjDegrees: number;
  muayThaiRank: string;
  mmaRank: string;
  graduationHistory: Graduation[];
  payments: MonthlyPayment[];
  birthDate: string;
  monthlyFees: { [key in Modality]?: number };
  category: 'Kids' | 'Adult';
  photoUrl?: string;
  gallery?: string[];
  balance?: number; // Positive for credit, negative for debt
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
}

export interface Partner {
  id: string;
  name: string;
  type: 'Patrocinador' | 'Colaborador' | 'Cliente' | 'Outros';
  contact: string;
  active: boolean;
}

export interface ProductVariation {
  id: string;
  size: string;
  color: string;
  stock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  isValidated?: boolean;
}

export interface Product {
  id: string;
  name: string;
  supplierId: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  size: string;
  category: 'Vestuário' | 'Equipamento' | 'Suplemento' | 'Acessório' | 'Educação' | 'Outros';
  active: boolean;
  variations?: ProductVariation[];
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSalePrice?: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  variationId?: string;
  buyerId: string;
  buyerType: 'student' | 'partner' | 'teacher' | 'client';
  buyerName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  payerId?: string;
  payerName?: string;
  status: 'pending' | 'paid' | 'delivered';
}

export interface Sale {
  id: string;
  saleNumber: string;
  type: 'simple' | 'group';
  items: SaleItem[];
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  createdAt: string;
  status: 'pending' | 'completed' | 'cancelled';
  stockAction: 'deduct' | 'purchase_list' | 'none';
  payerName?: string;
}

export interface Order {
  id: string;
  studentId: string;
  productId: string;
  quantity: number;
  status: 'pending' | 'paid' | 'delivered';
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  productId: string;
  variationId?: string;
  quantity: number;
  status: 'pending' | 'ordered' | 'received';
  createdAt: string;
  totalValue?: number;
  dueDate?: string;
  amountPaid?: number;
}

export interface Teacher {
  id: string;
  name: string;
  phone?: string;
  modalities: Modality[];
  paymentType: 'per-class' | 'weekly' | 'bi-weekly' | 'monthly';
  paymentAmount: number;
  modalityRates?: { [key in Modality]?: number };
  active: boolean;
}

export interface TeacherPayment {
  id: string;
  teacherId: string;
  amount: number;
  date: string;
  periodStart: string;
  periodEnd: string;
  status: 'paid' | 'pending';
  notes?: string;
  classCount?: number;
}

export interface TeacherClassLog {
  id: string;
  teacherId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  modality: Modality;
  classCount: number;
  rate: number; // Rate at the time of the class
  notes?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  studentId?: string;
  productId?: string;
  partnerId?: string;
}

export interface Rank {
  id: string;
  modality: string;
  name: string;
  order: number;
  maxDegrees?: number;
}

export interface AcademyImage {
  id: string;
  url: string;
  description?: string;
  createdAt: string;
  folderId?: string;
}

export interface GalleryFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface Settings {
  id: string;
  logoUrl?: string;
  academyName?: string;
}

export type Screen = 'home' | 'students' | 'store' | 'finance' | 'student-detail' | 'product-detail' | 'supplier-detail' | 'ranks' | 'registration-center' | 'academy-gallery' | 'backups' | 'categories' | 'partners' | 'settings' | 'relationships-center' | 'teachers' | 'teacher-payments' | 'teacher-class-control' | 'injured-students' | 'product-management' | 'supplier-management' | 'payment-methods' | 'inventory';
