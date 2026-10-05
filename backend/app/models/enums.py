from enum import Enum

class UserRole(str, Enum):
    ADMIN = "Administrator"
    TECHNICIAN = "Technician"
    AUDITOR = "Auditor"

class Region(str, Enum):
    SOUTH = 'us-south'
    WEST = 'us-west'
    NORTHEAST = 'us-northeast'
    MIDWEST = 'us-midwest'

class EquipStatus(str, Enum):
    OFFLINE = "Offline"
    MAINTENANCE = "Maintenance"
    IN_USE = "In-Use"
    AVAILABLE = "Available"

class OrderPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    CRITICAL = "Critical"

class OrderStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    FAILED = "Failed"
    IN_PROGRESS = "In-Progress"