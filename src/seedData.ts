import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Modality, Student, Product, Supplier, Partner, Transaction, Category, Teacher, Sale } from './types';

export const seedDatabase = async () => {
  const batch = writeBatch(db);

  // 1. Seed Suppliers
  const suppliers: Supplier[] = [
    { id: 'sup_1', name: 'Kimono Pro', cnpj: '12.345.678/0001-90', contact: 'contato@kimonopro.com' },
    { id: 'sup_2', name: 'Fight Supply', cnpj: '98.765.432/0001-10', contact: 'vendas@fightsupply.br' }
  ];

  suppliers.forEach(s => {
    const ref = doc(db, 'suppliers', s.id);
    batch.set(ref, s);
  });

  // 2. Seed Categories
  const categories: Category[] = [
    { id: 'cat_1', name: 'Mensalidades', type: 'income' },
    { id: 'cat_2', name: 'Venda de Produtos', type: 'income' },
    { id: 'cat_3', name: 'Aluguel', type: 'expense' },
    { id: 'cat_4', name: 'Equipamentos', type: 'expense' }
  ];

  categories.forEach(c => {
    const ref = doc(db, 'categories', c.id);
    batch.set(ref, c);
  });

  // 3. Seed Students
  const students: Omit<Student, 'id'>[] = [
    {
      name: 'João Silva',
      phone: '(11) 98888-7777',
      entryDate: '2024-01-10',
      paymentDay: 10,
      modalities: [Modality.JIU_JITSU],
      status: 'Ativo',
      bjjRank: 'Branca',
      bjjDegrees: 2,
      muayThaiRank: '',
      mmaRank: '',
      graduationHistory: [],
      payments: [],
      birthDate: '1995-05-15',
      monthlyFees: { [Modality.JIU_JITSU]: 150 },
      category: 'Adult',
      balance: 0
    },
    {
      name: 'Maria Oliveira',
      phone: '(11) 97777-6666',
      entryDate: '2023-11-20',
      paymentDay: 5,
      modalities: [Modality.MUAY_THAI, Modality.JIU_JITSU],
      status: 'Ativo',
      bjjRank: 'Azul',
      bjjDegrees: 1,
      muayThaiRank: 'Ponta Branca',
      mmaRank: '',
      graduationHistory: [],
      payments: [],
      birthDate: '1990-08-25',
      monthlyFees: { [Modality.JIU_JITSU]: 120, [Modality.MUAY_THAI]: 100 },
      category: 'Adult',
      balance: -50
    }
  ];

  students.forEach((s, i) => {
    const id = `std_${i + 1}`;
    const ref = doc(db, 'students', id);
    batch.set(ref, { ...s, id });
  });

  // 4. Seed Products
  const products: Omit<Product, 'id'>[] = [
    {
      name: 'Kimono Premium A2',
      supplierId: 'sup_1',
      costPrice: 200,
      salePrice: 350,
      stock: 10,
      minStock: 2,
      size: 'A2',
      category: 'Vestuário',
      active: true,
      variations: []
    },
    {
      name: 'Luva Muay Thai 12oz',
      supplierId: 'sup_2',
      costPrice: 80,
      salePrice: 150,
      stock: 5,
      minStock: 1,
      size: '12oz',
      category: 'Equipamento',
      active: true,
      variations: []
    }
  ];

  products.forEach((p, i) => {
    const id = `prd_${i + 1}`;
    const ref = doc(db, 'products', id);
    batch.set(ref, { ...p, id });
  });

  // 5. Seed Teachers
  const teachers: Omit<Teacher, 'id'>[] = [
    {
      name: 'Mestre Carlos',
      phone: '(11) 99999-0000',
      modalities: [Modality.JIU_JITSU],
      paymentType: 'monthly',
      paymentAmount: 2000,
      active: true
    }
  ];

  teachers.forEach((t, i) => {
    const id = `tch_${i + 1}`;
    const ref = doc(db, 'teachers', id);
    batch.set(ref, { ...t, id });
  });

  // 6. Seed Sales
  const sales: Omit<Sale, 'id'>[] = [
    {
      saleNumber: 'VEN-TEST-1',
      type: 'simple',
      items: [
        {
          id: 'item_1',
          productId: 'prd_1',
          buyerId: 'std_1',
          buyerType: 'student',
          buyerName: 'João Silva',
          quantity: 1,
          unitPrice: 350,
          discount: 0,
          totalPrice: 350,
          status: 'paid'
        }
      ],
      totalAmount: 350,
      totalDiscount: 0,
      finalAmount: 350,
      createdAt: new Date().toISOString(),
      status: 'completed',
      stockAction: 'deduct'
    }
  ];

  sales.forEach((s, i) => {
    const id = `sale_${i + 1}`;
    const ref = doc(db, 'sales', id);
    batch.set(ref, { ...s, id });
  });

  await batch.commit();
  console.log('Database seeded successfully!');
};
