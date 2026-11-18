import ProductEditor from '@/features/products/product-editor';

export default async function Page({ params }) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}
