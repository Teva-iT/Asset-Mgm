
import { prisma } from './lib/db'

async function testAssetAssignment() {
    try {
        // 1. Get an existing employee or create a dummy one
        let employee = await prisma.employee.findFirst()
        if (!employee) {
            console.log('Creating dummy employee for test...')
            employee = await prisma.employee.create({
                data: {
                    FirstName: 'Test',
                    LastName: 'Assignee',
                    Email: 'test.assignee@example.com',
                    Department: 'IT',
                    StartDate: new Date(),
                    Slug: 'test-assignee'
                }
            })
        }
        console.log('Using Employee:', employee.EmployeeID)

        // 2. Mock API Payload
        const payload = {
            AssetType: 'Laptop',
            AssetName: 'TEST-ASSET-001',
            Brand: 'TestBrand',
            Model: 'TestModel',
            SerialNumber: `SN-${Date.now()}`,
            deviceTag: 'TAG-001',
            Status: 'Available', // Frontend sends Available initially if not assigned, or Assigned if assigned. 
            // But let's test the logic where assignment overrides it.
            PurchaseDate: new Date().toISOString(),
            assignment: {
                employeeId: employee.EmployeeID,
                assignedDate: new Date().toISOString(),
                expectedReturnDate: null
            }
        }

        console.log('Simulating API call with payload:', JSON.stringify(payload, null, 2))

        // 3. Execute Logic (Mirroring route.ts)
        const result = await prisma.$transaction(async (tx) => {
            const newAsset = await tx.asset.create({
                data: {
                    AssetType: payload.AssetType,
                    AssetName: payload.AssetName,
                    Brand: payload.Brand,
                    Model: payload.Model,
                    SerialNumber: payload.SerialNumber,
                    DeviceTag: payload.deviceTag,
                    Status: payload.assignment ? 'Assigned' : (payload.Status || 'Available'),
                    PurchaseDate: new Date(payload.PurchaseDate),
                    Notes: null,
                },
            })

            if (payload.assignment) {
                await tx.assignment.create({
                    data: {
                        AssetID: newAsset.AssetID,
                        EmployeeID: payload.assignment.employeeId,
                        AssignedDate: new Date(payload.assignment.assignedDate),
                        Status: 'Active',
                    }
                })
            }
            return newAsset
        })

        console.log('Asset Created:', result)

        // 4. Verify in DB
        const savedAsset = await prisma.asset.findUnique({
            where: { AssetID: result.AssetID },
            include: { assignments: true }
        })

        console.log('Saved Asset with Assignments:', JSON.stringify(savedAsset, null, 2))

        if (savedAsset?.Status === 'Assigned' && savedAsset.assignments.length > 0) {
            console.log('SUCCESS: Asset status is Assigned and Assignment record created.')
        } else {
            console.error('FAILURE: Asset status or assignment record missing.')
        }

    } catch (error) {
        console.error('Test Failed:', error)
    } finally {
        await prisma.$disconnect()
        process.exit(0)
    }
}

// Timeout
setTimeout(() => {
    console.error('Timeout reached, exiting...')
    process.exit(1)
}, 10000)

testAssetAssignment()

