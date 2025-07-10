/* eslint-disable indent */
import { IsEmail } from "class-validator"; // https://www.npmjs.com/package/class-validator
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

export enum UserStatus {
    active = "active",
    deleted = "deleted",
    suspended = "suspended",
    invited = "invited",
    pending = "pending"
}

export enum UserRole {
    uberAdmin = "uber-admin",
    admin = "admin",
    user = "user"
}

export type UserPreferences = {
    placeholder1?: string,
    placeholder2?: string
}


@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Account, (account) => account.users)
    account: Account;

    @Column({nullable: true})
    accountId: string;

    @Column({nullable: true})
    name: string;

    @Column({nullable: true})
    @IsEmail()
    email: string;

    @Column({ type: "text", nullable: true })
    avatar: string;

    // Non-array json type
    //@Column({type: 'jsonb', array: false, default: () => "'[]'", nullable: false})
    //public users!: Array<{ id: string }>;

    // Non-array json type
    @Column({ type: "jsonb", array: false, nullable: true })
    preferences: UserPreferences;

    @Column({ type: "varchar", length: 10, default: "user"})
    role: UserRole;

    @Column({ type: "varchar", length: 10, default: "pending"})
    status: UserStatus;
}
