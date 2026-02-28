"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getRequests, type Request } from "@/services/api-service"
import { Search, CheckCircle, XCircle, Wrench, FileText } from "lucide-react"

export default function MaintenanceHistoryPage() {
    const [requests, setRequests] = useState<Request[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setIsLoading(true)
                // Fetch status-change requests (which include maintenance outcomes)
                const data = await getRequests({ type: 'status-change' })
                // Filter only approved requests (completed outcomes)
                const completedRequests = data.filter(r => r.status === 'approved' && r.newStatus)
                setRequests(completedRequests)
            } catch (error) {
                console.error("Failed to fetch maintenance history", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequests()
    }, [])

    const filteredRequests = requests.filter(request =>
        request.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requestedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.details.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const repairedAssets = filteredRequests.filter(r => r.newStatus === 'available')
    const failedRepairAssets = filteredRequests.filter(r => r.newStatus === 'disposed')

    const MaintenanceTable = ({ data, type }: { data: Request[], type: 'repaired' | 'failed' }) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Technician / Requested By</TableHead>
                        <TableHead>Completion Date</TableHead>
                        <TableHead>Details / Reason</TableHead>
                        <TableHead>Outcome</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No records found
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                    {request.assetName}
                                    {/* We could show serial/Asset ID if available in request */}
                                </TableCell>
                                <TableCell>{request.requestedByName}</TableCell>
                                <TableCell>
                                    {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="max-w-md truncate" title={request.details}>
                                    {request.details.replace('Repair Complete: ', '')}
                                </TableCell>
                                <TableCell>
                                    {type === 'repaired' ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Repaired & Available
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                                            <XCircle className="w-3 h-3 mr-1" /> Repair Failed (Disposed)
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <DashboardLayout allowedRoles={["adminOfficer"]}>
            <PageHeader
                title="Maintenance History"
                description="Track repaired assets and failed repairs (Taariikhda Dayactirka)"
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Maintenance Records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <Tabs defaultValue="repaired" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="repaired">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Repaired (Lasoo Habeeyay)
                        </TabsTrigger>
                        <TabsTrigger value="failed">
                            <XCircle className="w-4 h-4 mr-2" />
                            Failed (La Habeen Waayay)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="repaired" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-700">
                                    <Wrench className="h-5 w-5" />
                                    Successfully Repaired Assets
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MaintenanceTable data={repairedAssets} type="repaired" />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="failed" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                    <XCircle className="h-5 w-5" />
                                    Assets Failed Repair (Disposed)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MaintenanceTable data={failedRepairAssets} type="failed" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
