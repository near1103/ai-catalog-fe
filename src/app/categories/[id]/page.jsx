import { Catalog } from '@/components/catalog/catalog';

export default async function Page({ params }) {
  const { id } = await params;
  return <Catalog categoryId={id} />;
}
