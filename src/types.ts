export interface ProductBase {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface Logo {
  id: string;
  name: string;
  imageUrl: string;
  ownerId: string;
  createdAt: string;
}

export interface Mockup {
  id: string;
  ownerId: string;
  logoId: string;
  productId: string;
  resultUrl: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
