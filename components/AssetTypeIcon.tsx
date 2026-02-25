import {
    Cpu,
    Monitor,
    Smartphone,
    Tablet,
    Printer,
    Headphones,
    Speaker,
    Keyboard,
    Mouse,
    Cable,
    HardDrive,
    Server,
    Wifi,
    Battery,
    Camera,
    Watch,
    Tv,
    Box
} from 'lucide-react'

// Map of Type Name (lowercase) to Icon Component
const iconMap: Record<string, any> = {
    'desktop': Monitor, // Use Monitor for Desktop too as it's similar form factor icon
    'laptop': Cpu, // Or Laptop if available, but Cpu is a good generic "Computer"
    'monitor': Monitor,
    'iphone': Smartphone,
    'smartphone': Smartphone,
    'android': Smartphone,
    'tablet': Tablet,
    'ipad': Tablet,
    'printer': Printer,
    'scanner': Printer, // Reuse printer or generic
    'headset': Headphones,
    'headphones': Headphones,
    'speaker': Speaker,
    'sound': Speaker,
    'keyboard': Keyboard,
    'mouse': Mouse,
    'cable': Cable,
    'adapter': Cable,
    'charger': Battery,
    'power bank': Battery,
    'hard drive': HardDrive,
    'storage': HardDrive,
    'server': Server,
    'router': Wifi,
    'wifi': Wifi,
    'camera': Camera,
    'webcam': Camera,
    'watch': Watch,
    'wearable': Watch,
    'tv': Tv,
    'display': Monitor,
    'docking station': Server, // or Box
    'furniture': Box,
    'other': Box
}

export function getIconForType(type: string) {
    if (!type) return Box
    const lowerType = type.toLowerCase()

    // Direct match
    if (iconMap[lowerType]) return iconMap[lowerType]

    // Partial match (e.g. "iPhone 13" -> "iphone")
    for (const key of Object.keys(iconMap)) {
        if (lowerType.includes(key)) {
            return iconMap[key]
        }
    }

    return Box // Default
}

export default function AssetTypeIcon({ type, className }: { type: string, className?: string }) {
    const Icon = getIconForType(type)
    return <Icon className={className} />
}
