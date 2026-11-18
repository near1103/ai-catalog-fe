'use client';

import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/lib/api/publicApi';

export const useProducts = () =>
  useQuery({ queryKey: ['public-products'], queryFn: publicApi.products });
