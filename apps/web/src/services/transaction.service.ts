import type {
  ApiResponse,
  CreateTransactionData,
  PaginationParams,
  Transaction,
} from './api.types';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    invoiceId: 'INV-20240115-001',
    productId: '1',
    productName: '86 Diamonds Mobile Legends',
    customerData: { userId: '123456789', serverId: '8901' },
    amount: 19000,
    paymentMethod: 'QRIS',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:31:00Z',
  },
  {
    id: '2',
    invoiceId: 'INV-20240115-002',
    productId: '10',
    productName: 'Pulsa Telkomsel 25.000',
    customerData: { phone: '08123456789' },
    amount: 26500,
    paymentMethod: 'GoPay',
    status: 'completed',
    createdAt: '2024-01-15T11:15:00Z',
    updatedAt: '2024-01-15T11:16:00Z',
  },
  {
    id: '3',
    invoiceId: 'INV-20240115-003',
    productId: '3',
    productName: '344 Diamonds Mobile Legends',
    customerData: { userId: '987654321', serverId: '2345' },
    amount: 75000,
    paymentMethod: 'DANA',
    status: 'processing',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:30Z',
  },
  {
    id: '4',
    invoiceId: 'INV-20240115-004',
    productId: '15',
    productName: 'Token Listrik PLN 50.000',
    customerData: { userId: '12345678901' },
    amount: 51500,
    paymentMethod: 'BCA Virtual Account',
    status: 'pending',
    createdAt: '2024-01-15T13:45:00Z',
    updatedAt: '2024-01-15T13:45:00Z',
  },
  {
    id: '5',
    invoiceId: 'INV-20240115-005',
    productId: '20',
    productName: 'Netflix Premium 1 Bulan',
    customerData: { userId: 'user@email.com' },
    amount: 65000,
    paymentMethod: 'OVO',
    status: 'failed',
    createdAt: '2024-01-15T14:20:00Z',
    updatedAt: '2024-01-15T14:25:00Z',
  },
];

const simulateDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const transactionService = {
  async createTransaction(
    data: CreateTransactionData
  ): Promise<ApiResponse<Transaction>> {
    await simulateDelay(500);

    const newTransaction: Transaction = {
      id: String(mockTransactions.length + 1),
      invoiceId: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mockTransactions.length + 1).padStart(3, '0')}`,
      productId: data.productId,
      productName: 'Product Name',
      customerData: data.customerData,
      amount: 0,
      paymentMethod: data.paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Transaction created successfully',
      data: newTransaction,
    };
  },

  async getTransactions(
    params?: PaginationParams
  ): Promise<ApiResponse<Transaction[]>> {
    await simulateDelay();

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = mockTransactions.slice(start, end);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: paginated,
      meta: {
        page,
        limit,
        total: mockTransactions.length,
        totalPages: Math.ceil(mockTransactions.length / limit),
      },
    };
  },

  async getTransactionById(id: string): Promise<ApiResponse<Transaction | null>> {
    await simulateDelay();

    const transaction = mockTransactions.find((t) => t.id === id) || null;

    return {
      success: !!transaction,
      message: transaction ? 'Transaction found' : 'Transaction not found',
      data: transaction,
    };
  },

  async checkTransaction(
    invoiceId: string
  ): Promise<ApiResponse<Transaction | null>> {
    await simulateDelay(500);

    const transaction =
      mockTransactions.find((t) => t.invoiceId === invoiceId) || null;

    return {
      success: !!transaction,
      message: transaction
        ? 'Transaction found'
        : 'Transaksi tidak ditemukan. Periksa kembali nomor invoice Anda.',
      data: transaction,
    };
  },
};
