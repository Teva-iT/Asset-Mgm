import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { AssetID: params.id },
        })
        if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        return NextResponse.json(asset)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
    }
}

// PUT: Update asset and assignments
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()

        await prisma.$transaction(async (tx) => {
            // 1. Update Asset
            await tx.asset.update({
                where: { AssetID: params.id },
                data: {
                    AssetType: body.AssetType,
                    AssetName: body.AssetName,
                    Brand: body.Brand,
                    Model: body.Model,
                    SerialNumber: body.SerialNumber,
                    DeviceTag: body.DeviceTag,
                    Status: body.Status,
                    PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate) : null,
                    Notes: body.Notes,
                },
            })

            // 2. Handle Assignment if provided
            if (body.Status === 'Assigned' && body.assignment) {
                // Check if already assigned to this employee
                const currentAssignment = await tx.assignment.findFirst({
                    where: {
                        AssetID: params.id,
                        Status: 'Active'
                    }
                })

                if (currentAssignment) {
                    // Update existing assignment (Dates, check if employee changed?)
                    if (currentAssignment.EmployeeID !== body.assignment.employeeId) {
                        // Employee changed: Close old, create new
                        await tx.assignment.update({
                            where: { AssignmentID: currentAssignment.AssignmentID },
                            data: {
                                Status: 'Returned',
                                ActualReturnDate: new Date()
                            }
                        })

                        // Create new
                        await tx.assignment.create({
                            data: {
                                AssetID: params.id,
                                EmployeeID: body.assignment.employeeId,
                                AssignedDate: new Date(body.assignment.assignedDate),
                                ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate) : null,
                                Status: 'Active',
                                AssignedByUserID: body.assignment.assignedByUserId,
                            }
                        })
                    } else {
                        // Same employee, just update dates/notes
                        await tx.assignment.update({
                            where: { AssignmentID: currentAssignment.AssignmentID },
                            data: {
                                AssignedDate: new Date(body.assignment.assignedDate),
                                ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate) : null,
                            }
                        })
                    }
                } else {
                    // No active assignment, create one
                    await tx.assignment.create({
                        data: {
                            AssetID: params.id,
                            EmployeeID: body.assignment.employeeId,
                            AssignedDate: new Date(body.assignment.assignedDate),
                            ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate) : null,
                            Status: 'Active',
                            AssignedByUserID: body.assignment.assignedByUserId,
                        }
                    })
                }
            } else if (body.Status !== 'Assigned') {
                // If status changed to something else (e.g. Available), close any active assignment
                const currentAssignment = await tx.assignment.findFirst({
                    where: {
                        AssetID: params.id,
                        Status: 'Active'
                    }
                })
                if (currentAssignment) {
                    await tx.assignment.update({
                        where: { AssignmentID: currentAssignment.AssignmentID },
                        data: {
                            Status: 'Returned',
                            ActualReturnDate: new Date()
                        }
                    })
                }
            }
        })

        // Fetch updated asset to return
        const updatedAsset = await prisma.asset.findUnique({ where: { AssetID: params.id } })
        return NextResponse.json(updatedAsset)

    } catch (error) {
        console.error('Update failed:', error)
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.asset.delete({
            where: { AssetID: params.id },
        })
        return NextResponse.json({ message: 'Asset deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }
}
