import { randomUUID } from 'node:crypto'
import {
    DataTypes,
    Model,
    type CreationOptional,
    type InferAttributes,
    type InferCreationAttributes,
    type NonAttribute,
} from 'sequelize'
import { sequelize } from '../config/db'

export const ROLES = ['super_admin', 'owner', 'reception', 'trainer', 'maintenance'] as const
export type Role = typeof ROLES[number]
export const STAFF_ROLES = ['owner', 'reception', 'trainer', 'maintenance'] as const
// Personal que solo figura en la lista (limpieza, mantenimiento): no entra al sistema
export const NO_ACCESS_ROLES: readonly Role[] = ['maintenance']

export const PAYMENT_METHODS = ['cash', 'transfer', 'card'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const MEMBERSHIP_STATUSES = ['active', 'cancelled'] as const
export type MembershipStatus = typeof MEMBERSHIP_STATUSES[number]

// Postgres devuelve DECIMAL como string; lo normalizamos a number
function money(field: string) {
    return {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get(this: Model) {
            const value = this.getDataValue(field as never)
            return value === null || value === undefined ? value : Number(value)
        },
    }
}

const gymIdColumn = { type: DataTypes.INTEGER, allowNull: false }

// ---------- Gym ----------
export class Gym extends Model<InferAttributes<Gym>, InferCreationAttributes<Gym>> {
    declare id: CreationOptional<number>
    declare name: string
    declare slug: string
    declare phone: CreationOptional<string | null>
    declare address: CreationOptional<string | null>
    declare active: CreationOptional<boolean>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

Gym.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(30) },
    address: { type: DataTypes.STRING(255) },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'gyms' })

// ---------- User (super admin y staff) ----------
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>
    declare gymId: number | null
    declare name: string
    // null para el personal sin acceso al sistema
    declare email: CreationOptional<string | null>
    declare passwordHash: CreationOptional<string | null>
    declare role: Role
    declare active: CreationOptional<boolean>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>

    declare gym?: NonAttribute<Gym | null>

    // Nunca exponer el hash de la contraseña
    toJSON() {
        const values: Partial<InferAttributes<User>> = { ...this.get() }
        delete values.passwordHash
        return values
    }
}

User.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: true, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'users' })

// ---------- Plan de membresía ----------
export class Plan extends Model<InferAttributes<Plan>, InferCreationAttributes<Plan>> {
    declare id: CreationOptional<number>
    declare gymId: number
    declare name: string
    declare description: CreationOptional<string | null>
    declare price: number
    declare durationDays: number
    declare active: CreationOptional<boolean>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

Plan.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymId: gymIdColumn,
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(255) },
    price: money('price'),
    durationDays: { type: DataTypes.INTEGER, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'plans', indexes: [{ fields: ['gymId'] }] })

// ---------- Cliente del gimnasio ----------
export class Client extends Model<InferAttributes<Client>, InferCreationAttributes<Client>> {
    declare id: CreationOptional<number>
    declare gymId: number
    declare firstName: string
    declare lastName: string
    declare phone: CreationOptional<string | null>
    declare email: CreationOptional<string | null>
    declare documentId: CreationOptional<string | null>
    declare birthDate: CreationOptional<string | null>
    declare notes: CreationOptional<string | null>
    declare qrCode: CreationOptional<string>
    declare active: CreationOptional<boolean>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>

    declare memberships?: NonAttribute<Membership[]>
}

Client.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymId: gymIdColumn,
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    phone: { type: DataTypes.STRING(30) },
    email: { type: DataTypes.STRING(160) },
    documentId: { type: DataTypes.STRING(30) },
    birthDate: { type: DataTypes.DATEONLY },
    notes: { type: DataTypes.TEXT },
    qrCode: { type: DataTypes.STRING(64), allowNull: false, unique: true, defaultValue: () => randomUUID() },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'clients', indexes: [{ fields: ['gymId'] }] })

// ---------- Membresía vendida a un cliente ----------
export class Membership extends Model<InferAttributes<Membership>, InferCreationAttributes<Membership>> {
    declare id: CreationOptional<number>
    declare gymId: number
    declare clientId: number
    declare planId: number
    declare startDate: string
    declare endDate: string
    declare price: number // precio al momento de la venta
    declare status: CreationOptional<MembershipStatus>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>

    declare plan?: NonAttribute<Plan>
}

Membership.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymId: gymIdColumn,
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    planId: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    price: money('price'),
    status: { type: DataTypes.ENUM(...MEMBERSHIP_STATUSES), allowNull: false, defaultValue: 'active' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'memberships', indexes: [{ fields: ['gymId'] }, { fields: ['clientId'] }] })

// ---------- Pago (manual: efectivo, transferencia, tarjeta en POS) ----------
export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
    declare id: CreationOptional<number>
    declare gymId: number
    declare clientId: number
    declare membershipId: CreationOptional<number | null>
    declare amount: number
    declare method: PaymentMethod
    declare reference: CreationOptional<string | null>
    declare notes: CreationOptional<string | null>
    declare paidAt: CreationOptional<Date>
    declare receivedById: CreationOptional<number | null>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

Payment.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymId: gymIdColumn,
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    membershipId: { type: DataTypes.INTEGER },
    amount: money('amount'),
    method: { type: DataTypes.ENUM(...PAYMENT_METHODS), allowNull: false },
    reference: { type: DataTypes.STRING(100) },
    notes: { type: DataTypes.STRING(255) },
    paidAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    receivedById: { type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'payments', indexes: [{ fields: ['gymId', 'paidAt'] }] })

// ---------- Entrada al gimnasio ----------
export class CheckIn extends Model<InferAttributes<CheckIn>, InferCreationAttributes<CheckIn>> {
    declare id: CreationOptional<number>
    declare gymId: number
    declare clientId: number
    declare membershipId: CreationOptional<number | null>
    declare allowed: boolean
    declare reason: CreationOptional<string | null>
    declare registeredById: CreationOptional<number | null>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

CheckIn.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gymId: gymIdColumn,
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    membershipId: { type: DataTypes.INTEGER },
    allowed: { type: DataTypes.BOOLEAN, allowNull: false },
    reason: { type: DataTypes.STRING(120) },
    registeredById: { type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'check_ins', indexes: [{ fields: ['gymId', 'createdAt'] }] })

// ---------- Relaciones ----------
Gym.hasMany(User, { foreignKey: 'gymId', as: 'users' })
User.belongsTo(Gym, { foreignKey: 'gymId', as: 'gym' })

Gym.hasMany(Plan, { foreignKey: 'gymId', as: 'plans' })
Gym.hasMany(Client, { foreignKey: 'gymId', as: 'clients' })

Client.hasMany(Membership, { foreignKey: 'clientId', as: 'memberships' })
Membership.belongsTo(Client, { foreignKey: 'clientId', as: 'client' })
Membership.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' })

Client.hasMany(Payment, { foreignKey: 'clientId', as: 'payments' })
Payment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' })
Payment.belongsTo(Membership, { foreignKey: 'membershipId', as: 'membership' })
Payment.belongsTo(User, { foreignKey: 'receivedById', as: 'receivedBy' })

Client.hasMany(CheckIn, { foreignKey: 'clientId', as: 'checkIns' })
CheckIn.belongsTo(Client, { foreignKey: 'clientId', as: 'client' })
