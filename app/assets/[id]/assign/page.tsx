import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AssignmentForm from '@/components/AssignmentForm'

export default async function AssignAssetPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { data: asset } = await supabase.from("Asset").select("*").eq("AssetID", params.id).maybeSingle();

    if (!asset) notFound()
    if (asset.Status !== 'Available') {
        return (
            <div className="container">
                <h1>Asset Unavailable</h1>
                <p>This asset is currently {asset.Status} and cannot be assigned.</p>
                <Link href={`/assets/${params.id}`} className="btn btn-primary">Back to Asset</Link>
            </div>
        )
    }

    const { data: employeesRaw } = await supabase.from("Employee").select("*").order("LastName", { ascending: true });
    const employees = employeesRaw || [];

    return (
        <div className="container">
            <div className="header">
                <h1>Assign Asset</h1>
            </div>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>Selected Asset</h3>
                    <p><strong>{asset.AssetName}</strong> ({asset.AssetType})</p>
                    <p style={{ color: '#666' }}>SN: {asset.SerialNumber}</p>
                </div>

                <AssignmentForm asset={asset} employees={employees} />
            </div>
        </div>
    )
}
