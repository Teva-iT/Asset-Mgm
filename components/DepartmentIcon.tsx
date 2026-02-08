import {
    Users,
    Briefcase,
    Cpu,
    Building,
    DollarSign,
    Megaphone,
    Truck,
    ClipboardCheck,
    ShoppingCart,
    PenTool,
    Globe,
    Shield
} from 'lucide-react'

// Map of Department Name (lowercase) to Icon Component
const iconMap: Record<string, any> = {
    'it': Cpu,
    'engineering': PenTool,
    'hr': Users,
    'human resources': Users,
    'finance': DollarSign,
    'accounting': DollarSign,
    'marketing': Megaphone,
    'sales': ShoppingCart,
    'operations': Truck,
    'logistics': Truck,
    'facility': Building,
    'facilities': Building,
    'qa': ClipboardCheck,
    'quality assurance': ClipboardCheck,
    'legal': Shield,
    'security': Shield,
    'admin': Briefcase,
    'administration': Briefcase,
    'management': Briefcase,
    'executive': Briefcase,
    'global': Globe
}

export function getIconForDepartment(dept: string) {
    if (!dept) return Building
    const lowerDept = dept.toLowerCase()

    // Direct match
    if (iconMap[lowerDept]) return iconMap[lowerDept]

    // Partial match
    for (const key of Object.keys(iconMap)) {
        if (lowerDept.includes(key)) {
            return iconMap[key]
        }
    }

    return Building // Default
}

export default function DepartmentIcon({ department, className }: { department: string, className?: string }) {
    const Icon = getIconForDepartment(department)
    return <Icon className={className} />
}
