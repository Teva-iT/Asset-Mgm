import ModelDetailContent from "./ModelDetailContent";

export default async function ModelDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ModelDetailContent modelId={id} />;
}
